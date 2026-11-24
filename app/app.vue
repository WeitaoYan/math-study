<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { ADSENSE_CLIENT } from "./utils/siteAds";

useHead({ titleTemplate: "%s · 爱学习" });

// Google 脚本由 AdUnit 靠近视野时加载一次。
useHead({
  link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  meta: [
    { name: "google-adsense-account", content: ADSENSE_CLIENT },
  ],
});
</script>
