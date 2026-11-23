<template>
  <header class="page-intro">
    <div class="page-intro-copy">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p class="page-description">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="page-intro-actions"><slot /></div>
  </header>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; description: string; eyebrow?: string }>(), { eyebrow: "数学练习 / MATH PRACTICE" });
</script>
