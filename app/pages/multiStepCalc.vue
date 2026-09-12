<template>
  <div class="math-generator-container">
    <div class="header-section">
      <h1 class="main-title">脱式计算题生成器</h1>
      <p class="subtitle">
        生成多步混合运算题，每道题下方留 5 行空位书写计算过程（答案页展示逐步计算步骤）
      </p>
      <div class="links-box">
        <NuxtLink to="/mentalArithmetic" class="link">→ 自定义口算生成</NuxtLink>
        <NuxtLink to="/quickArithmetic" class="link"
          >→ 快速口算生成</NuxtLink
        >
      </div>
    </div>

    <form @submit.prevent="generateMathProblems" class="config-form">
      <div class="form-grid">
        <!-- 基本设置 -->
        <div class="config-card">
          <div class="card-header">
            <h2 class="card-title">基本设置</h2>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label for="count" class="form-label">生成组数</label>
              <input
                type="number"
                class="form-input"
                id="count"
                v-model.number="form.count"
                min="1"
                required
              />
              <span class="help-text">需要生成多少组不同的练习题</span>
              <label for="start" class="form-label">起始编号</label>
              <input
                type="number"
                class="form-input"
                id="start"
                v-model.number="form.start"
                min="1"
                required
              />
              <span class="help-text">第一组题目的编号</span>
            </div>

            <div class="form-row">
              <div class="form-group half-width">
                <label for="per_page_count" class="form-label">每页题数</label>
                <select
                  id="per_page_count"
                  v-model.number="form.per_page_count"
                  class="form-input"
                >
                  <option :value="3">3 题</option>
                  <option :value="6">6 题</option>
                  <option :value="9">9 题</option>
                  <option :value="12">12 题</option>
                </select>
                <span class="help-text">每题占 1 行算式 + 5 行空白</span>
              </div>

              <div class="form-group half-width">
                <label for="columns" class="form-label">每页列数</label>
                <select id="columns" v-model="form.columns" class="form-input">
                  <option value="auto">自动</option>
                  <option :value="1">1 列</option>
                  <option :value="2">2 列</option>
                  <option :value="3">3 列</option>
                  <option :value="4">4 列</option>
                </select>
                <span class="help-text">列少时算式更宽、书写空间更大</span>
              </div>
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-container">
                <input
                  type="checkbox"
                  class="form-checkbox"
                  id="include_answers"
                  v-model="form.include_answers"
                />
                <span class="checkmark"></span>
                附带答案页（完整算式 + 逐步计算过程）
              </label>
            </div>
          </div>
        </div>

        <!-- 算式配置 -->
        <div class="config-card">
          <div class="card-header">
            <h2 class="card-title">算式配置</h2>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group half-width">
                <label for="multi_step_range_min" class="form-label"
                  >数值最小值</label
                >
                <input
                  type="number"
                  class="form-input"
                  id="multi_step_range_min"
                  v-model.number="form.multi_step_range_min"
                  min="0"
                />
              </div>

              <div class="form-group half-width">
                <label for="multi_step_range_max" class="form-label"
                  >数值最大值</label
                >
                <input
                  type="number"
                  class="form-input"
                  id="multi_step_range_max"
                  v-model.number="form.multi_step_range_max"
                  min="1"
                />
              </div>
            </div>
            <span class="help-text">所有数及每步计算结果都保持在该范围内</span>

            <div class="form-group">
              <label for="multi_step_terms" class="form-label">参与数字个数</label>
              <select
                id="multi_step_terms"
                v-model.number="form.multi_step_terms"
                class="form-input"
              >
                <option :value="3">3 个数（两步运算，如 25+36-18）</option>
                <option :value="4">4 个数（三步运算，如 25+36-18+11）</option>
              </select>
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-container">
                <input
                  type="checkbox"
                  class="form-checkbox"
                  id="multi_step_use_mul_div"
                  v-model="form.multi_step_use_mul_div"
                />
                <span class="checkmark"></span>
                允许乘除运算（不勾选则仅加减混合）
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          :disabled="loading"
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
                  : "生成脱式计算PDF"
            }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "脱式计算题生成器",
  meta: [
    {
      name: "description",
      content: "生成多步混合运算题，每题下方留空位书写计算过程",
    },
  ],
});

const form = reactive({
  count: 2,
  start: 1,
  per_page_count: 6,
  columns: "3",
  include_answers: false,
  multi_step_ratio: 100,
  multi_step_range_min: 10,
  multi_step_range_max: 100,
  multi_step_terms: 3,
  multi_step_use_mul_div: false,
});

const loading = ref(false);
const downloadSuccess = ref(false);

const generateMathProblems = async () => {
  try {
    loading.value = true;
    downloadSuccess.value = false;
    // 发起请求并触发下载
    const response = await fetch("/api/generate-math-problems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      throw new Error("网络响应错误");
    }

    const blob = await response.blob();

    // 从响应头中提取文件名，不存在时使用默认文件名
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "脱式计算题.pdf"; // 默认文件名

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
    console.error("生成脱式计算题失败:", error);
    alert("生成脱式计算题失败，请重试");
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.config-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.config-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-header {
  background-color: #4299e1;
  padding: 16px 20px;
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
  margin-bottom: 6px;
  color: #2d3748;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.help-text {
  display: block;
  font-size: 0.875rem;
  color: #718096;
  margin-top: 4px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 1rem;
  user-select: none;
  position: relative;
  padding-left: 30px;
}

.form-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 2px solid #cbd5e0;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.checkbox-container:hover .checkmark {
  border-color: #a0aec0;
}

.form-checkbox:checked ~ .checkmark {
  background-color: #4299e1;
  border-color: #4299e1;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.form-checkbox:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 4px;
  top: 0px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.form-actions {
  text-align: center;
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
  .form-grid {
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
}
</style>