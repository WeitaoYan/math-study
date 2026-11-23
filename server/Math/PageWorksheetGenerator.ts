import type { jsPDF } from "jspdf";
import type { Config } from "./Config";
import type { GeneratedProblemEntry } from "../../shared/types/mathProblem";
import type { RequestBody } from "../api/generate-math-problems";
import type { WorksheetTypeDefinition } from "../../shared/utils/worksheetTypes";
import { findWorksheetType } from "../../shared/utils/worksheetTypes";
import { getPresetConfig } from "./LevelPresets";
import { parseCustomConfig } from "./RequestParser";
import { validateWorksheetConfig } from "./WorksheetConfigGuard";
import { applyWorksheetRequest } from "../utils/WorksheetRequest";
import { generateProblems } from "./ProblemGenerator";
import { createWorksheetPlan, type PreparedWorksheetPlan } from "../renderer/PdfRenderer";
import { customOralWorksheetType, CUSTOM_ORAL_TYPE } from "./CustomOralWorksheet";

export function resolvePageWorksheetRequest(typeId: unknown, rawPages: unknown, customInput: Record<string, unknown> = {}) {
  if (typeof typeId !== "string") throw new Error("配置无法生成：请选择题目类型");
  const type = typeId === CUSTOM_ORAL_TYPE ? customOralWorksheetType(customInput) : findWorksheetType(typeId);
  if (!type) throw new Error("配置无法生成：题目类型无效");
  const pages = Number(rawPages);
  if (!Number.isSafeInteger(pages) || pages < 1 || pages > 20) throw new Error("配置无法生成：页数须为 1～20 的整数");
  return { type, pages };
}

export function configForWorksheetType(type: WorksheetTypeDefinition): Config {
  const batchSize = type.kind === "oral" ? 200 : 24;
  const body = {
    ...type.parameters, count: 1, start: 1, per_page_count: String(batchSize), worksheet_type: type.kind,
    columns: type.autoColumns ? "auto" : String(type.columns), workspace_height_mm: type.workspaceHeightMm, workspace_guide: "blank",
    font_size_pt: type.fontSizePt, row_gap_mm: type.rowGapMm, vertical_mode: type.verticalMode, fill_mode: type.fillMode ?? "result",
  } as unknown as RequestBody;
  const config = type.level ? getPresetConfig(type.level) : parseCustomConfig(body);
  config.count = 1;
  config.include_answers = false;
  config.per_page_count = batchSize;
  config.fill_mode = type.fillMode ?? "result";
  applyWorksheetRequest(config, body);
  config.worksheet!.rowsPerPage = type.rowsPerPage;
  config.worksheet!.maxColumns = type.autoColumns ? type.columns : undefined;
  // 自动模式只有固定的安全题型配置，所有部署环境均校验。
  validateWorksheetConfig(config);
  return config;
}

/**
 * 不先猜总题数：用真实题目逐批测量，填满目标页，出现下一页后停止。
 * 仅截取完整目标页，不压字号、不缩书写区、不把末页零散题目另加到 PDF。
 */
export function generateWorksheetByPages(doc: jsPDF, type: WorksheetTypeDefinition, pageCount: number): PreparedWorksheetPlan {
  if (!Number.isSafeInteger(pageCount) || pageCount < 1 || pageCount > 20) throw new Error("配置无法生成：页数须为 1～20 的整数");
  const config = configForWorksheetType(type);
  const entries: GeneratedProblemEntry[] = [];
  const maxGenerated = 4200;
  let measured: PreparedWorksheetPlan;
  do {
    if (entries.length + config.per_page_count > maxGenerated) throw new Error("配置无法生成：当前题型无法在安全范围内完成指定页数");
    entries.push(...generateProblems(config));
    measured = createWorksheetPlan(doc, config, entries);
  } while (measured.pages.length <= pageCount);

  const pages = measured.pages.slice(0, pageCount);
  return { ...measured, pages, problems: pages.flatMap((page) => page.questions.map((question) => question.problem)) };
}
