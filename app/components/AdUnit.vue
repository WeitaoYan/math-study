<template>
  <div class="ad-unit">
    <ins
      class="adsbygoogle"
      style="display: block"
      :data-ad-client="client"
      :data-ad-slot="slot"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    slot: string;
    client?: string;
  }>(),
  {
    client: "ca-pub-7935584531479999",
  },
);

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

onMounted(() => {
  try {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  } catch (error) {
    console.error("AdSense push failed:", error);
  }
});
</script>

<style scoped>
.ad-unit {
  margin: 1.5rem auto;
  max-width: 1200px;
  width: 100%;
  overflow: hidden;
}
</style>
