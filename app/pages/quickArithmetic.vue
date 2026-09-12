<template>
  <div class="math-generator-container">
    <div class="header-section">
      <h1 class="main-title">快捷口算题生成器</h1>
      <p class="subtitle">选择预设类别快速生成口算练习题</p>
      <div class="links-box">
        <NuxtLink to="/MentalArithmetic" class="link"
          >→ 自定义生成模式</NuxtLink
        >
      </div>
    </div>

    <form @submit.prevent="generateMathProblems" class="config-form">
      <div class="levels-grid">
        <!-- 20以内加减法 -->
        <div class="level-category">
          <h3 class="category-title">20以内加减法</h3>
          <div class="level-options">
            <div
              v-for="item in levels['20以内加减法']"
              :key="item.level"
              class="level-option"
              :class="{ selected: selectedLevel === item.level }"
              @click="selectLevel(item.level)"
            >
              <div class="option-content">
                <h4 class="option-title">{{ item.title }}</h4>
                <p class="option-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 综合加减法 -->
        <div class="level-category">
          <h3 class="category-title">综合加减法</h3>
          <div class="level-options">
            <div
              v-for="item in levels['综合加减法']"
              :key="item.level"
              class="level-option"
              :class="{ selected: selectedLevel === item.level }"
              @click="selectLevel(item.level)"
            >
              <div class="option-content">
                <h4 class="option-title">{{ item.title }}</h4>
                <p class="option-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 100以内加减法 -->
        <div class="level-category">
          <h3 class="category-title">100以内加减法</h3>
          <div class="level-options">
            <div
              v-for="item in levels['100以内加减法']"
              :key="item.level"
              class="level-option"
              :class="{ selected: selectedLevel === item.level }"
              @click="selectLevel(item.level)"
            >
              <div class="option-content">
                <h4 class="option-title">{{ item.title }}</h4>
                <p class="option-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 乘除法 -->
        <div class="level-category">
          <h3 class="category-title">乘除法</h3>
          <div class="level-options">
            <div
              v-for="item in levels['乘除法']"
              :key="item.level"
              class="level-option"
              :class="{ selected: selectedLevel === item.level }"
              @click="selectLevel(item.level)"
            >
              <div class="option-content">
                <h4 class="option-title">{{ item.title }}</h4>
                <p class="option-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 有余数除法 -->
        <div class="level-category">
          <h3 class="category-title">有余数除法</h3>
          <div class="level-options">
            <div
              v-for="item in levels['有余数除法']"
              :key="item.level"
              class="level-option"
              :class="{ selected: selectedLevel === item.level }"
              @click="selectLevel(item.level)"
            >
              <div class="option-content">
                <h4 class="option-title">{{ item.title }}</h4>
                <p class="option-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 整十整百口算 -->
        <div class="level-category">
          <h3 class="category-title">整十整百口算</h3>
          <div class="level-options">
            <div
              v-for="item in levels['整十整百口算']"
              :key="item.level"
              class="level-option"
              :class="{ selected: selectedLevel === item.level }"
              @click="selectLevel(item.level)"
            >
              <div class="option-content">
                <h4 class="option-title">{{ item.title }}</h4>
                <p class="option-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="config-card basic-settings">
        <div class="card-header">
          <svg
            class="header-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
          </svg>
          <h2 class="card-title">排版设置</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group half-width">
              <label class="form-label">每页题数</label>
              <div class="segmented" role="group" aria-label="每页题数">
                <button
                  v-for="opt in perPageOptions"
                  :key="opt.value"
                  type="button"
                  class="seg-btn"
                  :class="{ active: quick.per_page_count === opt.value }"
                  @click="quick.per_page_count = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
              <span class="help-text">字号随题数自动适配</span>
            </div>

            <div class="form-group half-width">
              <label class="form-label">每页列数</label>
              <div class="segmented" role="group" aria-label="每页列数">
                <button
                  v-for="opt in columnsOptions"
                  :key="opt.value"
                  type="button"
                  class="seg-btn"
                  :class="{ active: quick.columns === opt.value }"
                  @click="quick.columns = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
              <span class="help-text">自动时按数值范围推算</span>
            </div>
          </div>

          <div class="form-group no-margin">
            <label class="switch-group">
              <span>
                <span class="switch-title">附带答案页</span>
                <span class="switch-desc">每组题后附对应的标准答案</span>
              </span>
              <span class="switch">
                <input
                  type="checkbox"
                  class="switch-input"
                  v-model="quick.include_answers"
                />
                <span class="switch-track">
                  <span class="switch-thumb"></span>
                </span>
              </span>
            </label>
          </div>

          <div class="divider"></div>

          <div class="form-group no-margin">
            <label for="q_fill_mode" class="form-label">填空模式</label>
            <select
              id="q_fill_mode"
              v-model="quick.fill_mode"
              class="form-input"
            >
              <option value="random">随机填空（默认）</option>
              <option value="result">隐藏结果</option>
              <option value="left">隐藏左操作数</option>
              <option value="right">隐藏右操作数</option>
              <option value="none">不填空</option>
            </select>
            <span class="help-text">专项训练逆向思维，可配合答案页使用</span>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          :disabled="loading || !selectedLevel"
          :class="['btn-submit', downloadSuccess ? 'success' : '']"
        >
          <span v-if="loading" class="spinner"></span>
          <span v-if="downloadSuccess" class="download-icon">✓</span>
          <span class="btn-text">
            {{
              loading
                ? "生成中..."
                : downloadSuccess
                  ? "已下载"
                  : "生成口算题PDF"
            }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "快捷口算题生成器",
  meta: [{ name: "description", content: "选择预设类别快速生成口算练习题" }],
});

// 定义题目级别数据
const levels = {
  "20以内加减法": [
    { level: "1-1", title: "5以内加法", desc: "基础加法练习" },
    { level: "1-2", title: "10以内加法", desc: "简单加法运算" },
    { level: "1-3", title: "20以内不进位加法", desc: "无进位加法练习" },
    { level: "1-4", title: "20以内进位加法", desc: "包含进位的加法" },
    { level: "1-5", title: "5以内减法", desc: "基础减法练习" },
    { level: "1-6", title: "10以内减法", desc: "简单减法运算" },
    { level: "1-7", title: "20以内不借位减法", desc: "无借位减法练习" },
    { level: "1-8", title: "20以内借位减法", desc: "包含借位的减法" },
  ],
  综合加减法: [
    { level: "1-9", title: "5以内加减法", desc: "混合加减法练习" },
    { level: "1-10", title: "10以内加减法", desc: "简单混合运算" },
    { level: "1-11", title: "20以内加减法", desc: "标准混合运算" },
    { level: "1-12", title: "20以内进位/借位加减法", desc: "复杂混合运算" },
  ],
  "100以内加减法": [
    { level: "1-13", title: "100以内加法", desc: "两位数加法练习" },
    { level: "1-14", title: "100以内进位加法", desc: "包含进位的加法" },
    { level: "1-15", title: "100以内减法", desc: "两位数减法练习" },
    { level: "1-16", title: "100以内借位减法", desc: "包含借位的减法" },
    { level: "1-17", title: "100以内加减法", desc: "标准混合运算" },
    { level: "1-18", title: "100以内进位/借位加减法", desc: "复杂混合运算" },
  ],
  乘除法: [
    { level: "2-1", title: "5以内乘法", desc: "基础乘法练习" },
    { level: "2-2", title: "7以内乘法", desc: "简单乘法运算" },
    { level: "2-3", title: "9以内乘法", desc: "标准乘法练习" },
    { level: "2-4", title: "5以内除法", desc: "基础除法练习" },
    { level: "2-5", title: "7以内除法", desc: "简单除法运算" },
    { level: "2-6", title: "9以内除法", desc: "标准除法练习" },
    { level: "2-7", title: "5以内乘除法", desc: "混合乘除法练习" },
    { level: "2-8", title: "7以内乘除法", desc: "简单混合运算" },
    { level: "2-9", title: "9以内乘除法", desc: "标准混合运算" },
  ],
  有余数除法: [
    { level: "3-1", title: "10以内有余数除法", desc: "被除数≤10，除数2-5" },
    { level: "3-2", title: "20以内有余数除法", desc: "被除数≤20，除数2-6" },
    { level: "3-3", title: "50以内有余数除法", desc: "被除数≤50，除数2-8" },
    { level: "3-4", title: "100以内有余数除法", desc: "被除数≤100，除数2-9" },
  ],
  整十整百口算: [
    { level: "4-1", title: "整十加法", desc: "1000以内，如 380+540=920" },
    { level: "4-2", title: "整十减法", desc: "1000以内，如 810-370=440" },
    { level: "4-3", title: "整十加减混合", desc: "1000以内整十数混合运算" },
    { level: "4-4", title: "整百加法", desc: "10000以内，如 3500+5900=9400" },
    { level: "4-5", title: "整百减法", desc: "10000以内，如 8400-3800=4600" },
    { level: "4-6", title: "整百加减混合", desc: "10000以内整百数混合运算" },
  ],
};

const selectedLevel = ref<string | null>(null);
const loading = ref(false);
const downloadSuccess = ref(false);

// 排版设置（每页题数 / 列数），快速模式可覆盖预设
const quick = reactive({
  per_page_count: 100,
  columns: "auto",
  include_answers: false,
  fill_mode: "random",
});

// 分段选择器选项
const perPageOptions = [
  { label: "20题", value: 20 },
  { label: "50题", value: 50 },
  { label: "100题", value: 100 },
  { label: "200题", value: 200 },
];
const columnsOptions = [
  { label: "自动", value: "auto" },
  { label: "3列", value: "3" },
  { label: "4列", value: "4" },
  { label: "5列", value: "5" },
  { label: "6列", value: "6" },
];

// 选择级别
const selectLevel = (level: string) => {
  selectedLevel.value = level;
};

// 生成口算题
const generateMathProblems = async () => {
  if (!selectedLevel.value) {
    alert("请选择一个练习级别");
    return;
  }

  try {
    loading.value = true;
    downloadSuccess.value = false;

    // 发起请求并触发下载
    const response = await fetch("/api/generate-math-problems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        level: selectedLevel.value,
        per_page_count: quick.per_page_count,
        columns: quick.columns,
        include_answers: quick.include_answers,
        fill_mode: quick.fill_mode,
      }),
    });

    if (!response.ok) {
      throw new Error("网络响应错误");
    }

    const blob = await response.blob();

    // 从响应头中提取文件名，不存在时使用默认文件名
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "口算题目.pdf"; // 默认文件名

    if (contentDisposition) {
      // 处理 filename* 参数（RFC 5987 标准）
      const rfc5987FilenameMatch = contentDisposition.match(
        /filename\*=(?:UTF-8'')?([^;]+)/i,
      );
      if (rfc5987FilenameMatch && rfc5987FilenameMatch[1]) {
        try {
          filename = decodeURIComponent(rfc5987FilenameMatch[1]);
        } catch (e) {
          console.warn("解析RFC 5987文件名失败:", e);
        }
      } else {
        // 处理普通的 filename 参数
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          try {
            // 尝试解码ISO-8859-1编码的文件名
            filename = decodeURIComponent(escape(filenameMatch[1]));
          } catch (e) {
            try {
              // 尝试普通URL解码
              filename = decodeURIComponent(filenameMatch[1]);
            } catch (e2) {
              // 如果都失败了，使用原始值
              filename = filenameMatch[1];
            }
          }
        }
      }
    }

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // 设置成功状态
    downloadSuccess.value = true;

    // 3秒后恢复原始状态
    setTimeout(() => {
      downloadSuccess.value = false;
    }, 3000);
  } catch (error) {
    console.error("生成口算题失败:", error);
    alert("生成口算题失败，请重试");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.math-generator-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
}

.main-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.links-box {
  margin-top: 20px;
}

.links-box a {
  display: inline-block;
  margin-right: 10px;
  color: #4299e1;
  text-decoration: none;
}

.links-box a:hover {
  text-decoration: underline;
}

.levels-grid {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.level-category {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.category-title {
  background-color: #4299e1;
  color: white;
  padding: 16px 20px;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.level-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  padding: 20px;
}

.level-option {
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8fafc;
}

.level-option:hover {
  border-color: #4299e1;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.level-option.selected {
  border-color: #4299e1;
  background: #ebf8ff;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.option-content {
  padding: 15px;
}

.option-title {
  font-size: 1rem;
  font-weight: 500;
  color: #2d3748;
  margin: 0 0 5px 0;
}

.option-desc {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
}

.btn-submit {
  background-color: #4299e1;
  color: white;
  border: none;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-submit:hover:not(:disabled) {
  background-color: #3182ce;
}

.btn-submit:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.btn-submit.success {
  background-color: #48bb78;
}

.btn-submit.success:hover {
  background-color: #38a169;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

.download-icon {
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .level-options {
    grid-template-columns: 1fr;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .half-width {
    width: 100%;
  }

  .math-generator-container {
    padding: 15px;
  }

  .level-category {
    margin-bottom: 20px;
  }

.config-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.basic-settings {
  margin-top: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #4299e1 0%, #667eea 100%);
  padding: 16px 20px;
}

.header-icon {
  color: #fff;
  flex-shrink: 0;
}

.card-title {
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}

.card-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group.no-margin {
  margin-bottom: 0;
}

.form-row {
  display: flex;
  gap: 15px;
}

.half-width {
  flex: 1;
}

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #2d3748;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #2d3748;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.help-text {
  display: block;
  font-size: 0.8rem;
  color: #a0aec0;
  margin-top: 6px;
}

/* 分段选择器 */
.segmented {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(54px, 1fr));
  gap: 4px;
  background: #edf2f7;
  padding: 4px;
  border-radius: 10px;
}

.seg-btn {
  border: none;
  background: transparent;
  padding: 9px 4px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.18s ease;
}

.seg-btn:hover {
  color: #2b6cb0;
}

.seg-btn.active {
  background: #fff;
  color: #3182ce;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

/* 开关切换 */
.switch-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.switch-group:hover {
  border-color: #a0aec0;
}

.switch-title {
  display: block;
  font-weight: 500;
  color: #2d3748;
}

.switch-desc {
  display: block;
  margin-top: 2px;
  font-size: 0.8rem;
  color: #718096;
}

.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 25px;
  flex-shrink: 0;
}

.switch-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-track {
  position: absolute;
  inset: 0;
  background: #cbd5e0;
  border-radius: 999px;
  transition: background 0.2s ease;
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 21px;
  height: 21px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.switch-input:checked + .switch-track {
  background: #4299e1;
}

.switch-input:checked + .switch-track .switch-thumb {
  transform: translateX(21px);
}

.switch-input:focus-visible + .switch-track {
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.35);
}

.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 20px 0;
}

.form-actions {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 40px);
    margin: 0;
    z-index: 1000;
  }

  .btn-submit {
    width: 100%;
    padding: 16px;
    font-size: 1.1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* 为页面底部留出空间，避免按钮遮挡内容 */
  .math-generator-container {
    padding-bottom: 80px;
  }
}
</style>
