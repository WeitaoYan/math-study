<template>
  <div class="generator-actions">
    <div class="generator-actions-copy"><span class="download-mark"><AppIcon name="download" /></span><div><strong>{{ summary }}</strong><p>{{ description || '生成可直接打印的 A4 PDF，按设置附带答案页。' }}</p></div></div>
    <div class="generator-actions-buttons">
    <button v-if="previewEnabled" type="button" class="button button-secondary" :disabled="loading || disabled" @click="$emit('preview')">生成打印预览</button>
    <button type="submit" class="button button-primary" :disabled="loading || disabled">
      <span v-if="loading" class="spinner" aria-hidden="true"></span>
      <AppIcon v-else :name="success ? 'check' : 'download'" />
      {{ loading ? '正在生成…' : success ? '已下载，再次下载' : label }}
    </button>
    </div>
  </div>
  <p v-if="error" class="notice notice-error" role="alert">{{ error }}</p>
  <p v-else-if="success" class="download-status" role="status">PDF 已开始下载。<template v-if="pageInfo?.questionCount !== undefined">共 {{ pageInfo.totalPages }} 页、{{ pageInfo.questionCount }} 题。</template><template v-else-if="pageInfo">实际题目 {{ pageInfo.questionPages }} 页 + 答案 {{ pageInfo.answerPages }} 页，共 {{ pageInfo.totalPages }} 页。</template><template v-else>可以继续调整设置并重新生成。</template></p>
</template>

<script setup lang="ts">
import type { WorksheetPdfPageInfo } from "../../shared/types/worksheetPdf";
defineProps<{ summary: string; label: string; description?: string; loading: boolean; success: boolean; disabled?: boolean; error?: string; previewEnabled?: boolean; pageInfo?: WorksheetPdfPageInfo | null }>();
defineEmits<{ preview: [] }>();
</script>
