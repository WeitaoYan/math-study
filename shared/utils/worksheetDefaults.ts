import type { WorksheetProblemKind } from "./worksheetLayout";

export function worksheetInputDefaults(kind: WorksheetProblemKind) {
  return {
    worksheet_type: kind,
    // 标准加减竖式：2 列 × 3 行，6 题与 55mm 留白可在一页内同时满足。
    workspace_height_mm: kind === "oral" ? 0 : 55,
    workspace_guide: "blank",
    font_size_pt: kind === "oral" ? 12 : 16,
    row_gap_mm: kind === "oral" ? 2 : 8,
    vertical_mode: "self",
  };
}
