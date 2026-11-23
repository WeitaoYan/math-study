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
import { renderPage, renderAnswerPage, renderWorksheetPlan } from "../renderer/PdfRenderer";
import type { Config } from "../Math/Config";
import { applyWorksheetRequest } from "../utils/WorksheetRequest";
import { generateWorksheetByPages, resolvePageWorksheetRequest } from "../Math/PageWorksheetGenerator";

// ==================== 请求体类型定义 ====================
export interface RequestBody {
  level?: string;
  count?: number;
  start?: number;
  columns?: string;
  per_page_count?: string;
  include_answers?: string;
  fill_mode?: string;
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
  multi_step_ratio?: string;
  multi_step_range_min?: string;
  multi_step_range_max?: string;
  multi_step_terms?: string;
  multi_step_use_mul_div?: string;
  multi_step_use_parentheses?: string;
  multi_step_factor_min?: string;
  multi_step_factor_max?: string;
  worksheet_type?: string;
  problem_count?: number;
  workspace_height_mm?: number;
  workspace_guide?: string;
  font_size_pt?: number;
  row_gap_mm?: number;
  vertical_mode?: string;
  question_type?: string;
  page_count?: number;
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

    // 简化界面只传题型和页数；布局与每页题数完全由题型及实际内容推断。
    if (body.question_type !== undefined || body.page_count !== undefined) {
      const { type, pages } = resolvePageWorksheetRequest(body.question_type, body.page_count, body as unknown as Record<string, unknown>);
      const doc = await createDoc();
      const plan = generateWorksheetByPages(doc, type, pages);
      renderWorksheetPlan(doc, plan, { title: type.title });
      event.node.res.setHeader("X-Worksheet-Question-Pages", String(plan.pages.length));
      event.node.res.setHeader("X-Worksheet-Answer-Pages", "0");
      event.node.res.setHeader("X-Worksheet-Total-Pages", String(doc.getNumberOfPages()));
      event.node.res.setHeader("X-Worksheet-Question-Count", String(plan.problems.length));
      event.node.res.setHeader("X-Worksheet-Columns", String(plan.columns));
      event.node.res.setHeader("X-Worksheet-Questions-Per-Page", plan.pages.map((page) => page.questions.length).join(","));
      const names = { oral: "口算练习题.pdf", steps: "脱式计算题.pdf", vertical: "竖式计算题.pdf" };
      return responsePDF(doc, event, names[type.kind]);
    }

    // 2. 构建配置（快速预设 or 自定义参数）
    let config: Config = body.level
      ? getPresetConfig(body.level)
      : parseCustomConfig(body);

    // 快速预设与自定义模式共用组数和起始编号，不改变题目生成规则。
    if (body.count !== undefined) {
      const count = Number(body.count);
      if (!Number.isSafeInteger(count) || count < 1) throw new Error("配置无法生成：生成组数须为正整数");
      config.count = count;
    }
    if (body.start !== undefined) {
      const start = Number(body.start);
      if (!Number.isSafeInteger(start) || start < 1) throw new Error("配置无法生成：起始编号须为正整数");
      config.start = start;
    }

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
    if (body.fill_mode) {
      config.fill_mode = body.fill_mode;
    }

    applyWorksheetRequest(config, body);

    // 3. 生成 PDF：每组先生成一次题目，再渲染题目页与（可选的）答案页
    const doc = await createDoc();
    let questionPages = 0;
    let answerPages = 0;
    for (let i = 0; i < config.count; i++) {
      const problems = generateProblems(config);
      questionPages += renderPage(doc, i, config, problems).pages.length;
      if (config.include_answers) {
        answerPages += renderAnswerPage(doc, i, config, problems).pages.length;
      }
    }

    // 页数来自真实渲染结果，不用“组数”猜测纸张数量。
    event.node.res.setHeader("X-Worksheet-Question-Pages", String(questionPages));
    event.node.res.setHeader("X-Worksheet-Answer-Pages", String(answerPages));
    event.node.res.setHeader("X-Worksheet-Total-Pages", String(doc.getNumberOfPages()));

    // 4. 返回 PDF
    const filenames = { oral: "口算练习题.pdf", steps: "脱式计算题.pdf", vertical: "竖式计算题.pdf" };
    return responsePDF(doc, event, filenames[config.worksheet!.type]);
  } catch (error) {
    console.error("PDF生成错误:", error);
    const msg = (error as Error)?.message ?? "";
    // 配置无解（生成器已带重试上限与回退，仅极少数完全冲突的配置才走到这里）
    if (msg.startsWith("配置无法生成")) {
      event.node.res.statusCode = 400;
      return { error: msg };
    }
    event.node.res.statusCode = 500;
    return { error: "PDF生成失败" };
  }
});
