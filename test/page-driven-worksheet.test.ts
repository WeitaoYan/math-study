import { describe, expect, it } from "vitest";
import { WORKSHEET_TYPES, findWorksheetType } from "../shared/utils/worksheetTypes";
import { LEVEL_PRESETS } from "../server/Math/LevelPresets";
import { configForWorksheetType, generateWorksheetByPages, resolvePageWorksheetRequest } from "../server/Math/PageWorksheetGenerator";
import { renderWorksheetPlan } from "../server/renderer/PdfRenderer";
import { createDoc } from "../server/utils/PdfConfig";
import { WORKSHEET_PAGE } from "../shared/utils/worksheetLayout";
import { getPdfPageInfo } from "../app/utils/pdfDownload";

describe("用户只选题型和页数", () => {
  it("题型目录保留37个口算级别，且所有类型有有效的自动配置", () => {
    expect(WORKSHEET_TYPES.filter((type) => type.kind === "oral")).toHaveLength(37);
    expect(new Set(WORKSHEET_TYPES.map((type) => type.id)).size).toBe(WORKSHEET_TYPES.length);
    for (const type of WORKSHEET_TYPES) {
      if (type.level) expect(LEVEL_PRESETS[type.level]).toBeDefined();
      expect(() => configForWorksheetType(type)).not.toThrow();
    }
  });

  it("打印字体包含全部自动题型标题", async () => {
    const doc = await createDoc();
    const metadata = doc.getFont().metadata as unknown as { characterToGlyph(code: number): number };
    for (const character of new Set(WORKSHEET_TYPES.map((type) => type.title).join(""))) {
      expect(metadata.characterToGlyph(character.charCodeAt(0)), character).toBeGreaterThan(0);
    }
  });

  it("所有题型选择两页均输出两张完整题目页，没有额外零散页", async () => {
    for (const type of WORKSHEET_TYPES) {
      const doc = await createDoc();
      const plan = generateWorksheetByPages(doc, type, 2);
      expect(plan.pages, type.id).toHaveLength(2);
      expect(plan.pages.every((page) => page.questions.length > 0), type.id).toBe(true);
      expect(plan.pages[0]!.questions.length % plan.columns).toBe(0);
      expect(plan.pages[1]!.questions.length % plan.columns).toBe(0);
      if (type.kind === "oral") for (const page of plan.pages) {
        expect(new Set(page.questions.map((question) => question.y)).size, type.id).toBe(20);
        expect(page.questions.length, type.id).toBe(plan.columns * 20);
      }
      renderWorksheetPlan(doc, plan, { title: type.title });
      expect(doc.getNumberOfPages(), type.id).toBe(2);
      for (const page of plan.pages) for (const question of page.questions) {
        expect(question.y + question.height).toBeLessThanOrEqual(WORKSHEET_PAGE.contentBottom + 0.001);
        if (type.kind !== "oral") expect(question.workspace.height).toBeGreaterThanOrEqual(type.workspaceHeightMm);
      }
    }
  });

  it("同样两页，根据题型推断题量，而非让用户指定每页题数", async () => {
    const oral = generateWorksheetByPages(await createDoc(), findWorksheetType("oral:1-1")!, 2);
    const steps = generateWorksheetByPages(await createDoc(), findWorksheetType("steps:mixed")!, 2);
    const vertical = generateWorksheetByPages(await createDoc(), findWorksheetType("vertical:add-sub")!, 2);
    const multiply = generateWorksheetByPages(await createDoc(), findWorksheetType("vertical:multiply")!, 2);
    expect(oral.problems.length).toBeGreaterThan(steps.problems.length);
    expect(oral.pages.map((page) => page.questions.length)).toEqual([100, 100]);
    expect(steps.pages.map((page) => page.questions.length)).toEqual([8, 8]);
    expect(vertical.pages.map((page) => page.questions.length)).toEqual([8, 8]);
    expect(multiply.pages.map((page) => page.questions.length)).toEqual([6, 6]);
    expect(vertical.problems.map((problem) => problem.id)).toHaveLength(16);
    expect(vertical.pages.flatMap((page) => page.questions.map((question) => question.number))).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
  });

  it("选择一页或20页都准确完成页数目标", async () => {
    for (const pages of [1, 20]) {
      const doc = await createDoc();
      const plan = generateWorksheetByPages(doc, findWorksheetType("oral:1-1")!, pages);
      renderWorksheetPlan(doc, plan);
      expect(doc.getNumberOfPages()).toBe(pages);
      expect(plan.pages).toHaveLength(pages);
    }
  });

  it("拒绝无效题型和不合法的页数，不默默转成组数", () => {
    for (const pages of [0, -1, 1.5, 21, NaN, "invalid", undefined]) expect(() => resolvePageWorksheetRequest("vertical", pages)).toThrow();
    expect(() => resolvePageWorksheetRequest("missing-type", 2)).toThrow();
    expect(() => resolvePageWorksheetRequest(undefined, 2)).toThrow();
    expect(resolvePageWorksheetRequest("vertical", 2).type.id).toBe("vertical:add-sub");
  });

  it("真实每页题量响应头可以直接显示，错误数组不混入界面", () => {
    expect(getPdfPageInfo(new Headers({
      "X-Worksheet-Question-Pages": "2", "X-Worksheet-Answer-Pages": "0", "X-Worksheet-Total-Pages": "2",
      "X-Worksheet-Question-Count": "12", "X-Worksheet-Questions-Per-Page": "6,6",
    }))).toEqual({ questionPages: 2, answerPages: 0, totalPages: 2, questionCount: 12, questionsPerPage: [6, 6] });
    expect(getPdfPageInfo(new Headers({
      "X-Worksheet-Question-Pages": "2", "X-Worksheet-Answer-Pages": "0", "X-Worksheet-Total-Pages": "2",
      "X-Worksheet-Question-Count": "12", "X-Worksheet-Questions-Per-Page": "4,4",
    }))?.questionsPerPage).toBeUndefined();
  });
});
