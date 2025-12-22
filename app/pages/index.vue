<template>
  <div class="container">
    <header class="header">
      <h1>欢迎来到 Math Study</h1>
      <p>这是一个基于 Nuxt 的数学学习网站</p>
    </header>

    <main class="main">
      <div class="card">
        <h2>PDF 生成器</h2>
        <p>自定义生成并下载 PDF 文件</p>
        <NuxtLink to="/mentalArithmetic" class="card-link"
          >前往自定义口算生成器</NuxtLink
        >
      </div>
      <div class="card">
        <h2>快速口算生成器</h2>
        <p>快速生成并下载口算 PDF 文件</p>
        <NuxtLink to="/quickArithmetic" class="card-link"
          >前往快速口算生成器</NuxtLink
        >
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "Math Study - 首页",
  meta: [{ name: "description", content: "基于 Nuxt 的数学学习网站" }],
});
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
}

.header p {
  font-size: 1.2rem;
  color: #666;
}

.main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.card h2 {
  margin-top: 0;
  color: #333;
}

.card p {
  color: #666;
}

.card-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.card-link:hover {
  background-color: #0056b3;
}
</style>
