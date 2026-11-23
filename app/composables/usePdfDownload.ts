import { computed, onScopeDispose, ref, watch } from "vue";
import { getPdfErrorMessage, getPdfFilename, getPdfPageInfo } from "../utils/pdfDownload";
import type { WorksheetPdfPageInfo } from "../../shared/types/worksheetPdf";

interface PreparedPdf {
  signature: string;
  blob: Blob;
  url: string;
  filename: string;
  pageInfo: WorksheetPdfPageInfo | null;
}

/** 预览与下载复用同一份真实 PDF；参数变化后旧预览不可继续打印。 */
export function usePdfDownload(getPayload?: () => Record<string, unknown>) {
  const loading = ref(false);
  const downloadSuccess = ref(false);
  const error = ref("");
  const previewUrl = ref("");
  const previewStale = ref(false);
  const pageInfo = ref<WorksheetPdfPageInfo | null>(null);
  const currentSignature = computed(() => getPayload ? JSON.stringify(getPayload()) : null);
  let cached: PreparedPdf | undefined;
  let controller: AbortController | undefined;
  let disposed = false;

  const isCurrent = (pdf: PreparedPdf) => currentSignature.value === null || currentSignature.value === pdf.signature;
  if (getPayload) watch(currentSignature, () => {
    downloadSuccess.value = false;
    error.value = "";
    if (cached) previewStale.value = !isCurrent(cached);
  });

  onScopeDispose(() => {
    disposed = true;
    controller?.abort();
    if (cached) URL.revokeObjectURL(cached.url);
    cached = undefined;
  });

  async function preparePdf(payload: Record<string, unknown>, fallbackFilename: string, refresh: boolean): Promise<PreparedPdf> {
    const signature = JSON.stringify(payload);
    if (!refresh && cached?.signature === signature && isCurrent(cached)) return cached;
    controller = new AbortController();
    const response = await fetch("/api/generate-math-problems", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: signature, signal: controller.signal,
    });
    if (!response.ok) {
      const fallback = response.status === 429 ? "请求较频繁，请稍后再试。" : "生成失败，请检查配置后重试。";
      throw new Error(getPdfErrorMessage(await response.json().catch(() => undefined), fallback));
    }
    if (!response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error("服务器没有返回 PDF，请稍后重试。");
    const blob = await response.blob();
    if (disposed) throw new Error("页面已关闭");
    const prepared: PreparedPdf = {
      signature, blob, url: URL.createObjectURL(blob),
      filename: getPdfFilename(response.headers.get("Content-Disposition"), fallbackFilename),
      pageInfo: getPdfPageInfo(response.headers),
    };
    const previousUrl = cached?.url;
    cached = prepared;
    previewUrl.value = prepared.url;
    previewStale.value = !isCurrent(prepared);
    pageInfo.value = prepared.pageInfo;
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    return prepared;
  }

  async function previewPdf(payload: Record<string, unknown>, fallbackFilename: string) {
    if (loading.value) return;
    loading.value = true;
    downloadSuccess.value = false;
    error.value = "";
    try { await preparePdf(payload, fallbackFilename, true); }
    catch (cause) { if (!disposed) error.value = cause instanceof Error ? cause.message : "预览生成失败，请稍后重试。"; }
    finally { loading.value = false; controller = undefined; }
  }

  async function downloadPdf(payload: Record<string, unknown>, fallbackFilename: string) {
    if (loading.value) return;
    loading.value = true;
    downloadSuccess.value = false;
    error.value = "";
    try {
      const pdf = await preparePdf(payload, fallbackFilename, false);
      if (!isCurrent(pdf)) throw new Error("生成期间配置已修改，请重新生成打印预览。");
      // 下载 URL 与预览 URL 分开，页面离开时不打断已启动的下载。
      const url = URL.createObjectURL(pdf.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = pdf.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      downloadSuccess.value = true;
    } catch (cause) { if (!disposed) error.value = cause instanceof Error ? cause.message : "生成失败，请稍后重试。"; }
    finally { loading.value = false; controller = undefined; }
  }

  return { loading, downloadSuccess, error, previewUrl, previewStale, pageInfo, previewPdf, downloadPdf };
}
