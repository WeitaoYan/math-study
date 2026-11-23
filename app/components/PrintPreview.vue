<template>
  <section ref="previewElement" class="print-preview config-card" aria-label="真实 PDF 打印预览">
    <header class="config-card-header">
      <div class="config-card-heading"><span class="section-icon"><AppIcon name="layout" /></span><div><h2>打印预览</h2><p>真实出题、真实分页，下载和预览使用同一份 PDF。</p></div></div>
      <span v-if="pdfUrl && !stale && pageInfo" class="preview-page-count" aria-live="polite"><template v-if="pageInfo.questionCount !== undefined">共 {{ pageInfo.totalPages }} 页 · {{ pageInfo.questionCount }} 题</template><template v-else>题目 {{ pageInfo.questionPages }} 页 + 答案 {{ pageInfo.answerPages }} 页，共 {{ pageInfo.totalPages }} 页</template></span>
    </header>
    <div v-if="pdfUrl && !stale" class="print-preview-content">
      <div class="print-preview-toolbar">
        <span>{{ loading ? '正在生成新预览…' : '当前预览可直接下载或打印' }}</span>
        <div><button type="button" class="button button-secondary" :disabled="loading" @click="$emit('refresh')">重新生成预览</button><button type="button" class="button button-secondary" :disabled="loading" @click="$emit('download')">下载这份 PDF</button><a class="button button-secondary" :class="{ 'is-disabled': loading }" :href="loading ? undefined : pdfUrl" target="_blank" rel="noopener">新窗口打开 / 打印</a></div>
      </div>
      <PdfPreviewCanvas :pdf-url="pdfUrl" :disabled="loading" />
      <p class="print-preview-help">这里直接显示真实 PDF，可翻页、放大查看。需要打印时选择“新窗口打开 / 打印”，下载与预览是同一份题目。</p>
    </div>
    <div v-else class="print-preview-empty">
      <AppIcon name="layout" />
      <h3>{{ stale ? '配置已修改，请更新打印预览' : '下载之前，先看看最终打印效果' }}</h3>
      <p>{{ stale ? '旧预览已失效，不会继续用于打印；重新生成后再下载。' : '预览会显示所选页数和系统自动安排的每页题量，下载与预览完全一致。' }}</p>
      <button type="button" class="button button-secondary" :disabled="loading || disabled" @click="$emit('refresh')">{{ loading ? '正在生成…' : '生成打印预览' }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { WorksheetPdfPageInfo } from "../../shared/types/worksheetPdf";
const props = defineProps<{ pdfUrl: string; stale: boolean; loading: boolean; disabled?: boolean; pageInfo: WorksheetPdfPageInfo | null }>();
defineEmits<{ refresh: []; download: [] }>();
const previewElement = ref<HTMLElement>();
watch(() => props.pdfUrl, async (url) => {
  if (!url || props.stale) return;
  await nextTick();
  previewElement.value?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
});
</script>
