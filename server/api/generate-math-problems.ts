/**
 * 口算题 PDF 生成 API
 *
 * 支持两种模式：
 * - 快速模式：传入 level（如 "1-1"），使用预设配置
 * - 自定义模式：传入完整配置参数
 */
import { createDoc, responsePDF } from "../utils/PdfConfig";
import { parseRequestBody } from "../utils/RequestConvert";
import { getPresetConfig } from "../Math/LevelPresets";
import { parseCustomConfig } from "../Math/RequestParser";
import { renderPage } from "../renderer/PdfRenderer";
import type { Config } from "../Math/Config";

// ==================== 请求体类型定义 ====================
export interface RequestBody {
  level?: string;
  total_count?: number;
  count?: number;
  start?: number;
  columns?: number;
  include_answers?: string;
  addition_ratio?: string;
  addition_range_min?: string;
  addition_range_max?: string;
  addition_carry?: string;
  subtraction_ratio?: string;
  subtraction_range_min?: string;
  subtraction_range_max?: string;
  subtraction_borrow?: string;
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
    const config: Config = body.level
      ? getPresetConfig(body.level)
      : parseCustomConfig(body);

    // 3. 生成 PDF：逐页渲染
    const doc = await createDoc();
    for (let i = 0; i < config.count; i++) {
      renderPage(doc, i, config);
    }

    // 4. 返回 PDF
    return responsePDF(doc, event);
  } catch (error) {
    console.error("PDF生成错误:", error);
    event.node.res.statusCode = 500;
    return { error: "PDF生成失败" };
  }
});
