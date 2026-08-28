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
          <h2 class="card-title">排版设置</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group half-width">
              <label for="q_per_page_count" class="form-label">每页题数</label>
              <select
                id="q_per_page_count"
                v-model.number="quick.per_page_count"
                class="form-input"
              >
                <option :value="20">20 题</option>
                <option :value="50">50 题</option>
                <option :value="100">100 题</option>
                <option :value="200">200 题</option>
              </select>
            </div>
            <div class="form-group half-width">
              <label for="q_columns" class="form-label">每页列数</label>
              <select id="q_columns" v-model="quick.columns" class="form-input">
                <option value="auto">自动</option>
                <option :value="3">3 列</option>
                <option :value="4">4 列</option>
                <option :value="5">5 列</option>
                <option :value="6">6 列</option>
              </select>
            </div>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-container">
              <input
                type="checkbox"
                class="form-checkbox"
                id="q_include_answers"
                v-model="quick.include_answers"
              />
              <span class="checkmark"></span>
              附带答案页
            </label>
          </div>

          <div class="form-group">
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

  .math-generator-container {
    padding: 15px;
  }

  .level-category {
    margin-bottom: 20px;
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
