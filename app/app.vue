<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useHead({
  meta: [
    { name: "google-adsense-account", content: "ca-pub-7935584531479999" },
  ],
  script: [
    {
      src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7935584531479999",
      crossorigin: "anonymous",
      async: true,
    },
  ],
});
</script>