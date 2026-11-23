<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="app-icon">
    <path :d="paths[name] || paths.book" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ name?: string }>(), { name: "book" });
const paths: Record<string, string> = {
  book: "M6 3h13v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM6 3v14h13M9 7h6M9 11h4",
  bolt: "m13 2-9 12h7l-1 8 10-13h-7l0-7Z",
  sliders: "M4 7h16M4 17h16M8 4v6M16 14v6",
  steps: "M4 5h16M4 12h16M4 19h16M8 3v4M12 10v4M16 17v4",
  layout: "M3 3h18v18H3V3ZM3 9h18M9 9v12",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  check: "m5 12 4 4L19 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M18 6 6 18",
  info: "M12 11v5M12 7h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z",
};
</script>
