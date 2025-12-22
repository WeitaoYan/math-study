<template>
  <div class="layout">
    <header class="layout-header">
      <h1>Math Study</h1>
      <nav>
        <ul>
          <li><NuxtLink to="/">首页</NuxtLink></li>
        </ul>
      </nav>
    </header>
    
    <main class="layout-main">
      <slot />
    </main>
    
    <footer class="layout-footer">
      <p>&copy; {{ new Date().getFullYear() }} Math Study. All rights reserved.</p>
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

.layout-header a:hover {
  text-decoration: underline;
}

.layout-main {
  flex: 1;
  padding: 2rem;
}

.layout-footer {
  background-color: #f5f5f5;
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #ddd;
}
</style>