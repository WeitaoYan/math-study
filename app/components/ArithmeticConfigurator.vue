<template>
  <div class="generator-page">
    <PageIntro title="自定义口算" description="自定义题型比例、数值范围、进位借位和填空方式；只需选择打印页数，系统自动按每页20行排版。" eyebrow="针对性训练 / CUSTOM PRACTICE"><NuxtLink to="/quickArithmetic" class="button button-secondary">使用快速预设<AppIcon name="sliders" /></NuxtLink></PageIntro>
    <form ref="generatorForm" @submit.prevent="generateMathProblems">
      <div class="generator-grid">
        <div class="config-stack">
          <ConfigSection title="题目配置" description="比例设为 0 即不生成该题型，各题型比例总和需要为 100%。" step="01">
            <div class="mix-shortcuts"><span>常用组合</span><button type="button" @click="setMix([100, 0, 0, 0, 0])">纯加法</button><button type="button" @click="setMix([50, 50, 0, 0, 0])">加减混合</button><button type="button" @click="setMix([15, 15, 35, 35, 0])">四则混合</button></div>
            <div class="operation-grid">
              <section v-for="operation in operations" :key="operation.ratioKey" class="operation-card" :class="{ 'is-inactive': !Number(form[operation.ratioKey]) }">
                <div class="operation-heading"><span class="operation-symbol">{{ operation.symbol }}</span><div><h3>{{ operation.title }}</h3><p>{{ operation.description }}</p></div></div>
                <div class="ratio-field"><label :for="operation.ratioKey">题型比例</label><span><input :id="operation.ratioKey" v-model.number="form[operation.ratioKey]" type="number" min="0" max="100" step="1" required /><small>%</small></span></div>
                <div class="field-grid">
                  <div v-for="field in operation.fields" :key="field.key" class="field"><label :for="field.key">{{ field.label }}</label><input :id="field.key" v-model.number="form[field.key]" type="number" :min="field.min" step="1" :disabled="!Number(form[operation.ratioKey])" :required="Number(form[operation.ratioKey]) > 0" /></div>
                </div>
                <label v-if="operation.toggle" class="checkbox-row compact"><input :id="operation.toggle.key" v-model="form[operation.toggle.key]" type="checkbox" :disabled="!Number(form[operation.ratioKey])" /><span>{{ operation.toggle.label }}</span></label>
                <div v-if="operation.roundKey" class="field"><label :for="operation.roundKey">整十整百约束</label><select :id="operation.roundKey" v-model.number="form[operation.roundKey]" :disabled="!Number(form[operation.ratioKey])"><option :value="0">无约束</option><option :value="10">整十（10、20、30…）</option><option :value="100">整百（100、200、300…）</option></select></div>
                <p v-if="operation.ratioKey === 'division_with_remainder_ratio'" class="field-help">格式：被除数 ÷ 除数 = 商 ··· 余数。</p>
              </section>
            </div>
            <div class="ratio-summary" :class="{ invalid: configError }" role="status"><div><strong>比例总和 {{ ratioTotal }}%</strong><span>{{ configError || '配置完整，可以生成练习。' }}</span></div><div class="ratio-progress"><span :style="{ width: `${Math.max(0, Math.min(100, ratioTotal))}%` }"></span></div></div>
          </ConfigSection>

          <ConfigSection title="打印与填空" description="选择几页就生成几张题目纸，不再输入组数或每页题数。" step="02">
            <div class="field"><label for="page_count">打印页数</label><input id="page_count" v-model.number="form.page_count" type="number" min="1" max="20" step="1" required /><p class="field-help">每页固定20行，列数由实际算式宽度自动决定，不额外附加答案页。</p></div>
            <div class="field"><label for="fill_mode">填空模式</label><select id="fill_mode" v-model="form.fill_mode"><option value="random">随机填空（默认）</option><option value="result">隐藏结果（a ○ b = ___）</option><option value="left">隐藏左操作数（___ ○ b = c）</option><option value="right">隐藏右操作数（a ○ ___ = c）</option><option value="none">不填空，输出完整算式</option></select><p class="field-help">可用于结果计算或逆向填空训练。</p></div>
          </ConfigSection>
        </div>

        <aside class="config-stack" aria-label="排版与配置摘要">
          <section class="practice-overview"><p class="eyebrow">本次练习</p><h2>我的口算组合</h2><p>出题参数由你选择；排版自动安排，每页20行，不压缩字号。</p><dl><div><dt>已启用题型</dt><dd>{{ activeOperations }} 类</dd></div><div><dt>打印页数</dt><dd>{{ form.page_count }} 页</dd></div><div><dt>每页行数</dt><dd>20 行</dd></div><div><dt>字号</dt><dd>12 pt</dd></div><div><dt>列数</dt><dd>{{ currentPageInfo?.columns ? `${currentPageInfo.columns} 列` : '按算式宽度自动选择' }}</dd></div></dl></section>
          <div v-if="currentPageInfo?.questionsPerPage" class="notice notice-soft"><AppIcon name="check" /><p>实际共 {{ currentPageInfo.totalPages }} 页、{{ currentPageInfo.questionCount }} 题。<span v-for="(count, index) in currentPageInfo.questionsPerPage" :key="index" class="actual-page-size">第 {{ index + 1 }} 页：{{ count }} 题</span></p></div>
          <div class="notice notice-soft"><AppIcon name="info" /><p>刚开始训练时可以先选较少的题数，让孩子更容易保持清晰、稳定的书写。</p></div>
          <AdUnit :slot="SITE_AD_SLOTS.customOral" placement="sidebar" />
        </aside>
      </div>
      <GeneratorActions :summary="`${form.page_count} 页自定义口算 · ${activeOperations} 类题型`" label="下载自定义口算 PDF" description="自定义数学参数，每页20行自动排版，预览与下载使用相同题目。" :loading="loading" :success="downloadSuccess" :disabled="!!configError" :error="error" :page-info="currentPageInfo" preview-enabled @preview="generatePrintPreview" />
      <PrintPreview :pdf-url="previewUrl" :stale="previewStale" :loading="loading" :disabled="!!configError" :page-info="pageInfo" @refresh="generatePrintPreview" @download="generateMathProblems" />
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { usePdfDownload } from "../composables/usePdfDownload";
import { createOralForm, getOralConfigError, getOralRatioTotal, ORAL_OPERATIONS, type OralForm } from "#shared/utils/oralConfig";
import { SITE_AD_SLOTS } from "../utils/siteAds";

useHead({ title: "自定义口算", meta: [{ name: "description", content: "按比例组合加减乘除和有余数除法，保留原有出题范围，口算每页20行自动排版。" }] });
const form = reactive<OralForm>({ ...createOralForm(), page_count: 2 });
const operations = ORAL_OPERATIONS;
const ratioTotal = computed(() => getOralRatioTotal(form));
const configError = computed(() => getOralConfigError(form));
const activeOperations = computed(() => operations.filter((operation) => Number(form[operation.ratioKey]) > 0).length);
const generatorForm = ref<HTMLFormElement>();
const parameterKeys = ORAL_OPERATIONS.flatMap((operation) => [operation.ratioKey, ...operation.fields.map((field) => field.key), ...(operation.toggle ? [operation.toggle.key] : []), ...(operation.roundKey ? [operation.roundKey] : [])]);
const payload = () => ({ ...Object.fromEntries(parameterKeys.map((key) => [key, form[key]])), question_type: "oral:custom", page_count: form.page_count, fill_mode: form.fill_mode });
const { loading, downloadSuccess, error, previewUrl, previewStale, pageInfo, previewPdf, downloadPdf } = usePdfDownload(payload);
const currentPageInfo = computed(() => previewStale.value ? null : pageInfo.value);

function setMix(ratios: number[]) {
  operations.forEach((operation, index) => { form[operation.ratioKey] = ratios[index] ?? 0; });
}

async function generateMathProblems() {
  if (generatorForm.value && !generatorForm.value.reportValidity()) return;
  if (configError.value) { error.value = configError.value; return; }
  await downloadPdf(payload(), "口算题目.pdf");
}

async function generatePrintPreview() {
  if (generatorForm.value && !generatorForm.value.reportValidity()) return;
  if (configError.value) { error.value = configError.value; return; }
  await previewPdf(payload(), "口算题目.pdf");
}
</script>
