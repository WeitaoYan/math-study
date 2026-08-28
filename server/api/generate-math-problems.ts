/**
 * 口算题 PDF 生成 API
 *
 * 支持两种模式：
 * - 快速模式：传入 level（如 "1-1"），使用预设配置
 * - 自定义模式：传入完整配置参数
 */
import { createDoc, responsePDF } from "../utils/PdfConfig";
import { parseRequestBody, parseBoolean } from "../utils/RequestConvert";
import { getPresetConfig } from "../Math/LevelPresets";
import { parseCustomConfig } from "../Math/RequestParser";
import { generateProblems } from "../Math/ProblemGenerator";
import { renderPage, renderAnswerPage } from "../renderer/PdfRenderer";
import type { Config } from "../Math/Config";

// ==================== 请求体类型定义 ====================
export interface RequestBody {
  level?: string;
  count?: number;
  start?: number;
  columns?: string;
  per_page_count?: string;
  include_answers?: string;
  addition_ratio?: string;
  addition_range_min?: string;
  addition_range_max?: string;
  addition_carry?: string;
  addition_round_to?: string;
  subtraction_ratio?: string;
  subtraction_range_min?: string;
  subtraction_range_max?: string;
  subtraction_borrow?: string;
  subtraction_round_to?: string;
  multiplication_ratio?: string;
  multiplication_factor_min?: string;
  multiplication_factor_max?: string;
  division_ratio?: string;
  division_factor_min?: string;
  division_factor_max?: string;
  division_with_remainder_ratio?: string;
  division_with_remainder_divisor_min?: string;
  division_with_remainder_divisor_max?: string;
}

// ==================== API Handler ====================
export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    event.node.res.statusCode = 405;
    return { error: "Method Not Allowed" };
  }

  try {
    // 1. 解析请求
    const rawBody = await readRawBody(event);
    const body = parseRequestBody(rawBody, event) as RequestBody;

    // 2. 构建配置（快速预设 or 自定义参数）
    let config: Config = body.level
      ? getPresetConfig(body.level)
      : parseCustomConfig(body);

    // 快速模式下也允许覆盖「每页题数 / 列数 / 答案页」
    if (body.per_page_count) {
      const pp = parseInt(body.per_page_count, 10);
      if (Number.isFinite(pp) && pp > 0) config.per_page_count = pp;
    }
    if (body.columns) {
      const c = parseInt(body.columns, 10);
      if (Number.isFinite(c) && c > 0) {
        config.columns = c;
        // 列数变化后，若未显式指定题数，按列数*20 重新推算
        if (!body.per_page_count) config.per_page_count = c * 20;
      }
    }
    if (body.include_answers !== undefined) {
      config.include_answers = parseBoolean(body.include_answers);
    }

    // 3. 生成 PDF：每组先生成一次题目，再渲染题目页与（可选的）答案页
    const doc = await createDoc();
    for (let i = 0; i < config.count; i++) {
      const problems = generateProblems(config);
      renderPage(doc, i, config, problems);
      if (config.include_answers) {
        renderAnswerPage(doc, i, config, problems);
      }
    }

    // 4. 返回 PDF
    return responsePDF(doc, event);
  } catch (error) {
    console.error("PDF生成错误:", error);
    event.node.res.statusCode = 500;
    return { error: "PDF生成失败" };
  }
});
