import { describe, expect, it } from "vitest";
import { WORKSHEET_PAGE, layoutWorksheet, type WorksheetProblem } from "../shared/utils/worksheetLayout";
import { findWorksheetType } from "../shared/utils/worksheetTypes";
import { generateWorksheetByPages } from "../server/Math/PageWorksheetGenerator";
import { createDoc } from "../server/utils/PdfConfig";

const options = { columns: 5, workspaceHeightMm: 0, fontSizePt: 12, rowGapMm: 2, verticalMode: "self" as const, rowsPerPage: 20 };
const oral: WorksheetProblem = { id: "oral", kind: "oral", expression: "3 + 2", questionText: "3 + 2 = ___", answerText: "3 + 2 = 5", answer: "5" };

describe("自动题型的排版密度", () => {
  it("口算二十行均匀分配整页高度，文本在行内居中且不越界", () => {
    const plan = layoutWorksheet(Array.from({ length: 200 }, (_, index) => ({ ...oral, id: String(index) })), options);
    expect(plan.pages).toHaveLength(2);
    const expectedHeight = (WORKSHEET_PAGE.contentBottom - WORKSHEET_PAGE.contentTop - 19 * options.rowGapMm) / 20;
    for (const page of plan.pages) {
      const rows = [...new Set(page.questions.map((question) => question.y))];
      expect(rows).toHaveLength(20);
      expect(rows[0]).toBe(WORKSHEET_PAGE.contentTop);
      for (const question of page.questions) {
        expect(question.height).toBeCloseTo(expectedHeight, 6);
        expect(question.contentOffsetY).toBeGreaterThan(0);
        expect(question.y + question.height).toBeLessThanOrEqual(WORKSHEET_PAGE.contentBottom + 0.001);
        expect(question.contentOffsetY + question.headerHeight).toBeLessThan(question.height);
      }
      expect(rows.at(-1)! + expectedHeight).toBeCloseTo(WORKSHEET_PAGE.contentBottom, 6);
    }
  });

  it("固定口算行数不能压缩长算式，也不能套用到过程题", () => {
    expect(() => layoutWorksheet([oral], { ...options, rowsPerPage: 0 })).toThrow(/行数/);
    expect(() => layoutWorksheet([oral], { ...options, rowsPerPage: 1.5 })).toThrow(/行数/);
    expect(() => layoutWorksheet([{ ...oral, kind: "steps" }], { ...options, workspaceHeightMm: 40 })).toThrow(/过程题/);
    const long = { ...oral, questionText: Array.from({ length: 15 }, () => "10000").join(" + ") };
    expect(() => layoutWorksheet([long], options)).toThrow(/行高预算/);
  });

  it("同一排长短算式混合时，所有列题号仍保持同一基线", () => {
    const long = { ...oral, id: "long", questionText: "1000 + 2000 + 3000 = ___", answerText: "1000 + 2000 + 3000 = 6000" };
    const plan = layoutWorksheet([oral, long], { ...options, rowsPerPage: 10 });
    const row = plan.pages[0]!.questions;
    expect(row[1]!.expressionLines.length).toBeGreaterThan(row[0]!.expressionLines.length);
    expect(row[0]!.y + row[0]!.contentOffsetY).toBeCloseTo(row[1]!.y + row[1]!.contentOffsetY, 6);
  });

  it("压缩两步/三步脱式后仍保留全部答案步骤的高度", async () => {
    for (const id of ["steps:mixed", "steps:three-parentheses"]) {
      const type = findWorksheetType(id)!;
      const plan = generateWorksheetByPages(await createDoc(), type, 2);
      expect(type.workspaceHeightMm).toBe(id === "steps:mixed" ? 40 : 55);
      expect(plan.pages.map((page) => page.questions.length)).toEqual(id === "steps:mixed" ? [8, 8] : [6, 6]);
      for (const page of plan.pages) for (const question of page.questions) {
        expect(question.workspace.height).toBeGreaterThanOrEqual(question.solutionLines.length * question.solutionLineHeight);
      }
    }
  });

  it("乘除竖式不会为了提高密度压掉必需的计算过程", async () => {
    for (const id of ["vertical:multiply", "vertical:divide", "vertical:remainder"]) {
      const type = findWorksheetType(id)!;
      const plan = generateWorksheetByPages(await createDoc(), type, 2);
      expect(type.workspaceHeightMm).toBe(55);
      expect(type.rowGapMm).toBe(4);
      expect(plan.pages.map((page) => page.questions.length)).toEqual([6, 6]);
      for (const page of plan.pages) for (const question of page.questions) {
        expect(question.workspace.height).toBeGreaterThanOrEqual(55);
        expect(question.y + question.height).toBeLessThanOrEqual(WORKSHEET_PAGE.contentBottom + 0.001);
      }
    }
  });
});
