<template>
  <div class="pdf-canvas-viewer">
    <div class="pdf-page-navigation" role="toolbar" aria-label="PDF预览分页与缩放">
      <button type="button" class="button button-secondary" :disabled="disabled || busy || currentPage <= 1" @click="currentPage--">上一页</button>
      <span aria-live="polite">{{ totalPages ? `第 ${currentPage} / ${totalPages} 页` : '正在读取 PDF…' }}</span>
      <button type="button" class="button button-secondary" :disabled="disabled || busy || currentPage >= totalPages" @click="currentPage++">下一页</button>
      <button type="button" class="button button-secondary" :disabled="disabled || busy || zoom <= 0.75" @click="zoom = Math.max(0.75, zoom - 0.25)">缩小</button>
      <button type="button" class="button button-secondary" :disabled="disabled || busy || zoom >= 2" @click="zoom = Math.min(2, zoom + 0.25)">放大</button>
    </div>
    <div ref="stage" class="pdf-canvas-stage">
      <p v-if="busy" class="pdf-render-status" role="status">正在显示打印页面…</p>
      <p v-if="renderError" class="notice notice-error" role="alert">{{ renderError }}，请使用“新窗口打开 / 打印”。</p>
      <canvas v-show="renderedPage > 0 && !renderError" ref="canvas" class="pdf-preview-canvas" role="img" :aria-label="`真实PDF第${renderedPage}页`"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

const props = defineProps<{ pdfUrl: string; disabled?: boolean }>();
const stage = ref<HTMLElement>();
const canvas = ref<HTMLCanvasElement>();
const currentPage = ref(1);
const totalPages = ref(0);
const renderedPage = ref(0);
const zoom = ref(1);
const busy = ref(true);
const renderError = ref("");
let document: PDFDocumentProxy | undefined;
let loadingTask: PDFDocumentLoadingTask | undefined;
let renderTask: RenderTask | undefined;
let observer: ResizeObserver | undefined;
let loadVersion = 0;
let renderVersion = 0;
let mounted = false;
let resizeFrame = 0;

async function renderPage() {
  if (!document || !canvas.value || !stage.value) return;
  const version = ++renderVersion;
  const localDocument = document;
  const pageNumber = currentPage.value;
  const previous = renderTask;
  previous?.cancel();
  await previous?.promise.catch(() => {});
  if (version !== renderVersion || document !== localDocument) return;
  busy.value = true;
  renderError.value = "";
  try {
    const page = await localDocument.getPage(pageNumber);
    await nextTick();
    if (version !== renderVersion || document !== localDocument || !canvas.value || !stage.value) return;
    const available = Math.max(200, Math.min(794, stage.value.clientWidth - 32));
    const viewport = page.getViewport({ scale: available / page.getViewport({ scale: 1 }).width * zoom.value });
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.value.width = Math.ceil(viewport.width * ratio);
    canvas.value.height = Math.ceil(viewport.height * ratio);
    canvas.value.style.width = `${viewport.width}px`;
    canvas.value.style.height = `${viewport.height}px`;
    renderTask = page.render({ canvas: canvas.value, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] });
    await renderTask.promise;
    if (version === renderVersion && document === localDocument) renderedPage.value = pageNumber;
  } catch (error) {
    if (version === renderVersion && (error as Error).name !== "RenderingCancelledException") renderError.value = "PDF 页面显示失败";
  } finally {
    if (version === renderVersion) busy.value = false;
  }
}

async function loadDocument(url: string) {
  const version = ++loadVersion;
  ++renderVersion;
  renderTask?.cancel();
  renderedPage.value = 0;
  totalPages.value = 0;
  busy.value = true;
  renderError.value = "";
  const previous = loadingTask;
  loadingTask = undefined;
  document = undefined;
  await previous?.destroy().catch(() => {});
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    if (version !== loadVersion) return;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const task = pdfjs.getDocument({ url, useWasm: false, isOffscreenCanvasSupported: false });
    loadingTask = task;
    const pdf = await task.promise;
    if (version !== loadVersion) { await task.destroy(); return; }
    document = pdf;
    currentPage.value = 1;
    totalPages.value = pdf.numPages;
    await renderPage();
  } catch {
    if (version === loadVersion) { renderError.value = "PDF 预览加载失败"; busy.value = false; }
  }
}

onMounted(() => {
  mounted = true;
  void loadDocument(props.pdfUrl);
  observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { void renderPage(); });
  });
  if (stage.value) observer.observe(stage.value);
});
watch(() => props.pdfUrl, (url) => { if (mounted) void loadDocument(url); });
watch([currentPage, zoom], () => { if (document) void renderPage(); });
onBeforeUnmount(() => {
  mounted = false;
  ++loadVersion;
  ++renderVersion;
  cancelAnimationFrame(resizeFrame);
  observer?.disconnect();
  renderTask?.cancel();
  void loadingTask?.destroy().catch(() => {});
});
</script>
