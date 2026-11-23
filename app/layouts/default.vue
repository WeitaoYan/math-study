<template>
  <div class="site-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <header class="site-header">
      <div class="site-header-inner">
        <NuxtLink to="/" class="site-brand" aria-label="爱学习首页">
          <span class="brand-icon"><AppIcon name="book" /></span>
          <span><strong>爱学习</strong><small>让练习更有条理</small></span>
        </NuxtLink>

        <nav id="site-navigation" class="site-navigation" :class="{ 'is-open': menuOpen }" aria-label="主要导航">
          <NuxtLink v-for="link in navigation" :key="link.to" :to="link.to" class="site-nav-link">{{ link.label }}</NuxtLink>
        </nav>

        <div class="site-header-tools">
          <button type="button" class="menu-button" :aria-expanded="menuOpen" aria-controls="site-navigation" :aria-label="menuOpen ? '关闭导航' : '打开导航'" @click="menuOpen = !menuOpen">
            <AppIcon :name="menuOpen ? 'close' : 'menu'" />
          </button>
        </div>
      </div>
    </header>

    <main id="main-content" class="site-main" tabindex="-1"><slot /></main>

    <div class="site-footer-ad"><AdUnit :slot="SITE_AD_SLOTS.footer" /></div>
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="footer-brand"><AppIcon name="book" /><strong>爱学习</strong><span>从一张练习纸开始。</span></div>
        <nav aria-label="页脚导航"><NuxtLink to="/practice">自定义口算</NuxtLink><NuxtLink to="/quickArithmetic">口算练习</NuxtLink><NuxtLink to="/#guide">使用指南</NuxtLink></nav>
        <p>© {{ new Date().getFullYear() }} 爱学习 · A4 数学练习工具</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { SITE_AD_SLOTS } from "../utils/siteAds";

const route = useRoute();
const menuOpen = ref(false);
const navigation = [
  { label: "首页", to: "/" },
  { label: "自定义口算", to: "/practice" },
  { label: "口算练习", to: "/quickArithmetic" },
  { label: "脱式计算", to: "/multiStepCalc" },
  { label: "竖式计算", to: "/verticalArithmetic" },
];
watch(() => route.path, () => { menuOpen.value = false; });
</script>
