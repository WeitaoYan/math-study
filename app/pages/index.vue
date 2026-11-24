<template>
  <div class="home-page">
    <section class="home-hero">
      <div class="hero-copy">
        <p class="eyebrow">一点练习，一点进步 / MATH PRACTICE</p>
        <h1>每天一点练习，<br />让计算更有底气。</h1>
        <p class="hero-description">预设题型一键选择，自定义口算按需组合。<br class="desktop-break" />口算每页20行，竖式和脱式保留过程区，系统按所选页数自动排版。</p>
        <div class="hero-actions"><NuxtLink to="/quickArithmetic" class="button button-primary">选择口算题型<AppIcon name="bolt" /></NuxtLink><NuxtLink to="/practice" class="button button-secondary">自定义口算<AppIcon name="sliders" /></NuxtLink></div>
        <div class="hero-features"><span><AppIcon name="check" />{{ presetCount }} 个口算题型</span><span><AppIcon name="check" />口算每页20行</span><span><AppIcon name="check" />自动安排每页题量</span></div>
      </div>

      <div class="hero-paper-wrap" aria-label="练习纸样式示意">
        <span class="paper-floating-tag"><AppIcon name="download" />选好题目，直接打印</span>
        <div class="hero-paper">
          <div class="hero-paper-header"><span>今日口算练习</span><small>姓名：________　日期：________</small></div>
          <div class="hero-paper-exercises"><span v-for="sample in samples" :key="sample">{{ sample }}</span></div>
          <div class="hero-paper-process"><small>写出计算过程</small><strong>(35 + 28) ÷ 7</strong><i></i><i></i><i></i></div>
          <div class="hero-paper-footer"><span>认真计算，仔细检查。</span><span>排版示意</span></div>
        </div>
        <span class="paper-bottom-tag"><span></span>让题目清晰，让书写从容。</span>
      </div>
    </section>

    <AdUnit :slot="SITE_AD_SLOTS.homeIntro" />

    <section class="home-tools" aria-labelledby="tools-heading">
      <div class="section-heading"><div><p class="eyebrow">选择适合的练习</p><h2 id="tools-heading">想从哪一种开始？</h2></div><p>预设与自定义分开，排版均由系统自动安排。</p></div>
      <div class="tool-grid">
        <NuxtLink v-for="tool in tools" :key="tool.to" :to="tool.to" class="tool-card" :class="tool.tone">
          <div class="tool-card-top"><span class="tool-icon"><AppIcon :name="tool.icon" /></span><span class="tool-tag">{{ tool.tag }}</span></div>
          <h3>{{ tool.title }}</h3><p>{{ tool.description }}</p><span class="tool-card-link">{{ tool.action }}<AppIcon name="arrow" /></span>
        </NuxtLink>
      </div>
    </section>

    <AdUnit :slot="SITE_AD_SLOTS.homeGuide" />

    <section id="guide" class="home-guide" aria-labelledby="guide-heading">
      <div class="section-heading"><div><p class="eyebrow">简单三步</p><h2 id="guide-heading">把练习安排得刚刚好。</h2></div><span class="subtle-tag">无需登录，即时生成</span></div>
      <div class="guide-grid">
        <article><span class="guide-step">01</span><h3>选择题目</h3><p>日常练习选预设题型；针对性训练用自定义口算调整比例、范围和进借位条件。</p></article>
        <article><span class="guide-step">02</span><h3>选择打印页数</h3><p>想打印几张题目纸，就选择几页。系统按真实题目尺寸填满每页，不会额外多出零散页。</p></article>
        <article><span class="guide-step">03</span><h3>预览并打印</h3><p>查看每页实际题数，直接下载相同的 A4 PDF。题干和书写区都由系统自动安排。</p></article>
      </div>
    </section>

    <section class="home-tip"><span class="tip-icon"><AppIcon name="book" /></span><div><h2>学完数学，记记单词。</h2><p>单词簿：按课本单元记单词，螺旋复习，家长可控激励。</p></div><a href="https://english.ikber.cc" target="_blank" rel="noopener" class="button button-secondary">去单词簿<AppIcon name="arrow" /></a></section>

    <section class="home-tip"><span class="tip-icon"><AppIcon name="layout" /></span><div><h2>页数由你决定，排版由系统安排。</h2><p>预设与自定义口算都按每页20行排版；竖式和脱式自动保留合适的过程区。选择2页就得到2张题目纸。</p></div><NuxtLink to="/quickArithmetic" class="button button-secondary">开始选择<AppIcon name="arrow" /></NuxtLink></section>
  </div>
</template>

<script setup lang="ts">
import { ARITHMETIC_PRESETS } from "#shared/utils/arithmeticPresets";
import { SITE_AD_SLOTS } from "../utils/siteAds";

useHead({ title: "首页", meta: [{ name: "description", content: "只选择题目类型和打印页数，自动推断每页题量与书写空间，生成真实 A4 数学练习 PDF。" }] });
const presetCount = ARITHMETIC_PRESETS.length;
const samples = ["37 + 26 = ____", "84 - 39 = ____", "7 × 8 = ____", "63 ÷ 9 = ____", "48 + 35 = ____", "92 - 47 = ____"];
const tools = [
  { title: "口算练习", icon: "bolt", tag: "日常巩固", description: "基础加减、乘除混合与整十整百，自动采用较紧凑的排版。", action: "选择口算类型", to: "/quickArithmetic", tone: "tone-green" },
  { title: "自定义口算", icon: "sliders", tag: "针对性训练", description: "调整题型比例、数值范围、进位借位与填空方式，自动按每页20行打印。", action: "配置我的口算", to: "/practice", tone: "tone-slate" },
  { title: "脱式计算", icon: "steps", tag: "过程训练", description: "两步、三步及括号运算，系统自动保留对应的过程书写区。", action: "选择脱式类型", to: "/multiStepCalc", tone: "tone-amber" },
  { title: "竖式计算", icon: "layout", tag: "书写训练", description: "加减乘除与预列竖式，简单题每页多些，复杂题留白更大。", action: "选择竖式类型", to: "/verticalArithmetic", tone: "tone-teal" },
];
</script>
