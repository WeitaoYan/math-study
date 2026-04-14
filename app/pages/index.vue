<template>
  <div class="container">
    <header class="header">
      <h1>欢迎来到爱学习</h1>
      <p>这是一个数学学习网站，方便家长打印数学题目</p>
    </header>

    <main class="main">
      <div class="card">
        <div class="card-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
            ></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h2>自定义口算生成器</h2>
        <p>
          根据您的具体需求，自定义题目类型、难度、数量等参数，生成个性化口算练习PDF
        </p>
        <NuxtLink to="/mentalArithmetic" class="card-link">
          开始自定义
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="arrow-icon"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </NuxtLink>
      </div>

      <div class="card">
        <div class="card-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h2>快速口算生成器</h2>
        <p>快速生成标准口算练习，一键创建PDF文件，适合日常练习和测试</p>
        <NuxtLink to="/quickArithmetic" class="card-link">
          立即生成
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="arrow-icon"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </NuxtLink>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.card-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e6f7ff;
  border-radius: 50%;
  margin-bottom: 1rem;
  color: #1890ff;
}

.card h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
}

.card p {
  color: #666;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.card-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
  width: 100%;
  max-width: 200px;
}

.card-link:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.arrow-icon {
  margin-left: 8px;
  transition: transform 0.2s;
}

.card-link:hover .arrow-icon {
  transform: translateX(2px);
}
@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem; /* 从 2.5rem 缩小 */
  }

  .header p {
    font-size: 1rem; /* 从 1.2rem 缩小 */
  }

  .container {
    padding: 1rem; /* 减小容器内边距 */
  }
}

/* 更小屏幕的适配 */
@media (max-width: 480px) {
  .header h1 {
    font-size: 1.8rem;
  }

  .header p {
    font-size: 0.9rem;
  }
}
</style>
