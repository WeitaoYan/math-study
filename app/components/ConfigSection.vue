<template>
  <section class="config-card">
    <header class="config-card-header">
      <div class="config-card-heading">
        <span v-if="step" class="section-step">{{ step }}</span>
        <span v-else-if="icon" class="section-icon"><AppIcon :name="icon" /></span>
        <div><h2>{{ title }}</h2><p v-if="description">{{ description }}</p></div>
      </div>
      <slot name="action" />
    </header>
    <div class="config-card-body"><slot /></div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string; description?: string; step?: string; icon?: string }>();
</script>
