<template>
  <div class="layout">
    <header class="layout-header">
      <NuxtLink to="/"><h1>爱学习</h1></NuxtLink>
    </header>

    <main class="layout-main">
      <slot />
    </main>

    <footer class="layout-footer">
      <p>&copy; {{ new Date().getFullYear() }} 爱学习. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 布局组件不需要额外逻辑
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  background-color: #333;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.layout-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.layout-header ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1rem;
}

.layout-header a {
  color: white;
  text-decoration: none;
}

/* 只对导航链接应用悬停下划线 */
.layout-header nav a:hover {
  text-decoration: underline;
}

.layout-main {
  flex: 1;
}

.layout-footer {
  background-color: #f5f5f5;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #ddd;
}
</style>
