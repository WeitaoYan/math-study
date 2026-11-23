<template>
  <div class="generator-page">
    <PageIntro :title="pageTitle" description="只选题目类型和页数。列数、字号、过程区与每页题量由系统自动安排。" eyebrow="选题型，选页数 / PRINT PRACTICE" />
    <form ref="generatorForm" @submit.prevent="download">
      <div class="generator-grid generator-grid--preset">
        <div class="config-stack generator-primary">
          <ConfigSection title="题目类型和页数" description="选择几页，就生成几张题目纸，不再设置组数或每组题数。" step="01">
            <div class="field"><label for="question_type">题目类型</label><select id="question_type" v-model="selection.question_type"><optgroup v-for="group in groups" :key="group.category" :label="group.category"><option v-for="type in group.types" :key="type.id" :value="type.id">{{ type.title }}</option></optgroup></select><p class="field-help">{{ selectedType?.description }}</p></div>
            <div class="field"><label for="page_count">打印页数</label><input id="page_count" v-model.number="selection.page_count" type="number" min="1" max="20" step="1" required /><p class="field-help">例如选择 2 页，下载的题目 PDF 就是 2 页。每一页会按题型自动填入合适数量的题目。</p></div>
            <div class="notice notice-soft"><AppIcon name="info" /><p>口算紧凑排列；竖式和脱式保留书写过程区。较复杂的题型每页放得少一些，不会为了凑题数压缩字号或留白。</p></div>
          </ConfigSection>
          <GeneratorActions :summary="`${selectedType?.title || '请选择题型'} · ${selection.page_count} 页`" label="下载题目 PDF" description="系统自动填满所选页数，预览与下载使用同一份题目。" :loading="loading" :success="downloadSuccess" :disabled="!selectedType" :error="error" :page-info="currentPageInfo" preview-enabled @preview="preview" />
        </div>
        <aside class="config-stack generator-secondary" aria-label="系统自动排版说明">
          <section class="practice-overview"><p class="eyebrow">系统自动安排</p><h2>{{ selectedType?.title }}</h2><dl><div><dt>纸张</dt><dd>A4</dd></div><div><dt>打印页数</dt><dd>{{ selection.page_count }} 页</dd></div><div><dt>列数</dt><dd>{{ currentPageInfo?.columns ? `${currentPageInfo.columns} 列` : selectedType?.autoColumns ? `最多 ${selectedType.columns} 列（自动）` : `${selectedType?.columns} 列` }}</dd></div><div v-if="selectedType?.rowsPerPage"><dt>每页行数</dt><dd>{{ selectedType.rowsPerPage }} 行</dd></div><div><dt>字号</dt><dd>{{ selectedType?.fontSizePt }} pt</dd></div><div v-if="selectedType?.workspaceHeightMm"><dt>最小书写区</dt><dd>{{ selectedType.workspaceHeightMm }} mm</dd></div></dl><p>以上由题型自动决定，不需要手动配置。题目数量以实际页容量为准。</p></section>
          <div v-if="currentPageInfo?.questionsPerPage" class="notice notice-soft"><AppIcon name="check" /><p>实际共 {{ currentPageInfo.totalPages }} 页、{{ currentPageInfo.questionCount }} 题。<span v-for="(count, index) in currentPageInfo.questionsPerPage" :key="index" class="actual-page-size">第 {{ index + 1 }} 页：{{ count }} 题</span></p></div>
          <AdUnit :key="adSlot" :slot="adSlot" placement="sidebar" />
        </aside>
      </div>
      <PrintPreview :pdf-url="previewUrl" :stale="previewStale" :loading="loading" :disabled="!selectedType" :page-info="pageInfo" @refresh="preview" @download="download" />
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { usePdfDownload } from "../composables/usePdfDownload";
import { DEFAULT_WORKSHEET_TYPES, WORKSHEET_TYPES } from "#shared/utils/worksheetTypes";
import type { WorksheetProblemKind } from "#shared/utils/worksheetLayout";
import { SITE_AD_SLOTS } from "../utils/siteAds";

const props = defineProps<{ kind?: WorksheetProblemKind }>();
const adSlot = computed(() => SITE_AD_SLOTS[props.kind ?? "oral"]);
const titles = { oral: "口算练习", steps: "脱式计算", vertical: "竖式计算" };
const pageTitle = props.kind ? titles[props.kind] : "生成数学练习";
useHead({ title: pageTitle, meta: [{ name: "description", content: "只选择题目类型与打印页数，自动推断每页题数、字号、列数与书写区，生成真实 A4 练习 PDF。" }] });
const types = WORKSHEET_TYPES.filter((type) => !props.kind || type.kind === props.kind);
const groups = [...new Set(types.map((type) => type.category))].map((category) => ({ category, types: types.filter((type) => type.category === category) }));
const selection = reactive({ question_type: DEFAULT_WORKSHEET_TYPES[props.kind ?? "oral"], page_count: 2 });
const selectedType = computed(() => types.find((type) => type.id === selection.question_type));
const generatorForm = ref<HTMLFormElement>();
const payload = () => ({ ...selection });
const { loading, downloadSuccess, error, previewUrl, previewStale, pageInfo, previewPdf, downloadPdf } = usePdfDownload(payload);
const currentPageInfo = computed(() => previewStale.value ? null : pageInfo.value);

async function preview() {
  if (generatorForm.value && !generatorForm.value.reportValidity()) return;
  await previewPdf(payload(), `${pageTitle}.pdf`);
}
async function download() {
  if (generatorForm.value && !generatorForm.value.reportValidity()) return;
  await downloadPdf(payload(), `${pageTitle}.pdf`);
}
</script>
