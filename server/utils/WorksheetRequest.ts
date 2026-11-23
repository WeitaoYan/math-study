import type { Config } from "../Math/Config";
import type { RequestBody } from "../api/generate-math-problems";
import type { WorksheetProblemKind, WorksheetSettings } from "../../shared/utils/worksheetLayout";
import { worksheetInputDefaults } from "../../shared/utils/worksheetDefaults";

function numberOption(label: string, raw: unknown, fallback: number, min: number, max: number): number {
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`配置无法生成：${label}须在 ${min}～${max} 之间`);
  return value;
}

export function applyWorksheetRequest(config: Config, body: RequestBody): void {
  const kind = body.worksheet_type ?? (config.multi_step.ratio > 0 ? "steps" : "oral");
  if (!["oral", "steps", "vertical"].includes(kind)) throw new Error("配置无法生成：练习形式无效");
  const type = kind as WorksheetProblemKind;
  const process = type !== "oral" || config.multi_step.ratio > 0;
  const defaults = worksheetInputDefaults(type === "oral" && process ? "steps" : type);
  const guide = body.workspace_guide ?? defaults.workspace_guide;
  const verticalMode = body.vertical_mode ?? "self";
  if (!["blank", "lines", "grid"].includes(guide)) throw new Error("配置无法生成：书写区样式无效");
  if (!["self", "setup"].includes(verticalMode)) throw new Error("配置无法生成：竖式呈现方式无效");
  const autoColumns = body.columns === undefined || body.columns === "auto";
  if (!autoColumns) {
    const columns = Number(body.columns);
    if (!Number.isInteger(columns) || columns < 1 || columns > (process ? 2 : 6)) throw new Error(`配置无法生成：${process ? "过程题只能选择 1 或 2 列，以保证书写宽度" : "口算列数须为 1～6"}`);
    config.columns = columns;
  } else config.columns = process ? 2 : 5;

  if (body.problem_count !== undefined) {
    const count = Number(body.problem_count);
    if (!Number.isSafeInteger(count) || count < 1 || count > 1000) throw new Error("配置无法生成：每组题数须为 1～1000 的整数");
    config.per_page_count = count;
  } else if (process && body.per_page_count === undefined) config.per_page_count = 6;

  config.worksheet = {
    type, autoColumns,
    workspaceHeightMm: numberOption("最小书写区高度(mm)", body.workspace_height_mm, defaults.workspace_height_mm, process ? 20 : 0, 110),
    fontSizePt: numberOption("字号(pt)", body.font_size_pt, defaults.font_size_pt, 10, 24),
    rowGapMm: numberOption("题行间距(mm)", body.row_gap_mm, defaults.row_gap_mm, 0, 20),
    guide: guide as WorksheetSettings["guide"], verticalMode: verticalMode as WorksheetSettings["verticalMode"],
  };
  if (type === "vertical") {
    if (config.multi_step.ratio > 0) throw new Error("配置无法生成：竖式只支持二元加减乘除，请关闭脱式比例");
    if (body.fill_mode !== undefined && body.fill_mode !== "result") throw new Error("配置无法生成：竖式使用结果填空，不支持隐藏操作数");
    config.fill_mode = "result";
  }
}
