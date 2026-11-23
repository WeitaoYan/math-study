import { createOralForm, ORAL_OPERATIONS } from "../../shared/utils/oralConfig";
import type { WorksheetTypeDefinition } from "../../shared/utils/worksheetTypes";

export const CUSTOM_ORAL_TYPE = "oral:custom";

/** 仅接收数学参数；页数、字号、列数等版式参数不由用户手工决定。 */
export function customOralWorksheetType(input: Record<string, unknown>): WorksheetTypeDefinition {
  const defaults = createOralForm();
  const parameters: Record<string, string | number | boolean> = {};
  const keys = ORAL_OPERATIONS.flatMap((operation) => [operation.ratioKey, ...operation.fields.map((field) => field.key), ...(operation.toggle ? [operation.toggle.key] : []), ...(operation.roundKey ? [operation.roundKey] : [])]);
  for (const key of keys) {
    const value = input[key] ?? defaults[key];
    if (!["string", "number", "boolean"].includes(typeof value)) throw new Error("配置无法生成：自定义数学参数格式无效");
    parameters[key] = value as string | number | boolean;
  }
  const fillMode = input.fill_mode ?? defaults.fill_mode;
  if (typeof fillMode !== "string" || !["random", "result", "left", "right", "none"].includes(fillMode)) throw new Error("配置无法生成：填空模式无效");
  return {
    id: CUSTOM_ORAL_TYPE, title: "自定义口算", description: "按自定义比例和数值范围生成口算。", category: "自定义口算", kind: "oral", parameters,
    columns: 5, autoColumns: true, fontSizePt: 12, workspaceHeightMm: 0, rowGapMm: 2, verticalMode: "self", rowsPerPage: 20, fillMode,
  };
}
