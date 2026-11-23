import { describe, expect, it } from "vitest";
import { createWorksheetTestProblems } from "./fixtures/worksheetProblems";
import {
  layoutWorksheet,
  WORKSHEET_PAGE,
  type WorksheetLayoutOptions,
  type WorksheetProblem,
} from "../shared/utils/worksheetLayout";

const options: WorksheetLayoutOptions = {
  columns: 2,
  workspaceHeightMm: 55,
  fontSizePt: 16,
  rowGapMm: 8,
  verticalMode: "self",
};

describe("书写区优先的练习纸布局", () => {
  it("标准 6 题保留各自 55mm 书写区，放在一页", () => {
    const problems = createWorksheetTestProblems("vertical", 6).map((problem) => ({ ...problem, operator: "+" as const, expression: `${problem.left} + ${problem.right}`, answer: String(problem.left! + problem.right!) }));
    const layout = layoutWorksheet(problems, options);
    expect(layout.pages).toHaveLength(1);
    expect(layout.pages[0]!.questions).toHaveLength(6);
    for (const question of layout.pages[0]!.questions) {
      expect(question.workspace.height).toBe(55);
      expect(question.workspace.width).toBeGreaterThanOrEqual(WORKSHEET_PAGE.minWorkspaceWidth);
    }
  });

  it("增加留白时分页，不缩小留白、字号或增加列数", () => {
    const layout = layoutWorksheet(createWorksheetTestProblems("steps", 6), {
      ...options,
      workspaceHeightMm: 90,
    });
    expect(layout.pages).toHaveLength(2);
    expect(layout.columns).toBe(2);
    for (const page of layout.pages) for (const question of page.questions) expect(question.workspace.height).toBeGreaterThanOrEqual(90);
  });

  it("真正支持 1 列，题号跨页连续且不丢题", () => {
    const problems = createWorksheetTestProblems("steps", 12);
    const layout = layoutWorksheet(problems, { ...options, columns: 1 });
    expect(layout.columns).toBe(1);
    expect(layout.pages).toHaveLength(4);
    const placed = layout.pages.flatMap((page) => page.questions);
    expect(placed.map((question) => question.problem.id)).toEqual(problems.map((problem) => problem.id));
    expect(placed.map((question) => question.number)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it("所有题块和书写区都在页面边界内，行间不重叠", () => {
    const layout = layoutWorksheet(createWorksheetTestProblems("mixed", 36), {
      ...options,
      workspaceHeightMm: 75,
    });
    for (const page of layout.pages) {
      for (const question of page.questions) {
        expect(question.y).toBeGreaterThanOrEqual(WORKSHEET_PAGE.contentTop);
        expect(question.y + question.height).toBeLessThanOrEqual(WORKSHEET_PAGE.contentBottom + 0.001);
        if (question.workspace.height) {
          expect(question.workspace.y + question.workspace.height).toBeLessThanOrEqual(question.y + question.height);
        }
        expect(question.x + question.width).toBeLessThanOrEqual(WORKSHEET_PAGE.width - WORKSHEET_PAGE.marginX);
      }
      const rowTops = [...new Set(page.questions.map((question) => question.y))];
      for (let index = 1; index < rowTops.length; index++) {
        const previousBottom = Math.max(...page.questions
          .filter((question) => question.y === rowTops[index - 1])
          .map((question) => question.y + question.height));
        expect(rowTops[index]!).toBeGreaterThanOrEqual(previousBottom + options.rowGapMm);
      }
    }
  });

  it("预列竖式的印刷内容不会占用承诺给学生的留白", () => {
    const layout = layoutWorksheet(createWorksheetTestProblems("vertical", 6), {
      ...options,
      verticalMode: "setup",
    });
    expect(layout.pages).toHaveLength(2);
    const question = layout.pages[0]!.questions[0]!;
    expect(question.headerHeight).toBe(WORKSHEET_PAGE.setupHeight);
    expect(question.workspace.height).toBe(55);
    expect(question.workspace.y).toBeGreaterThan(question.y + question.headerHeight);
  });

  it("长表达式换行后增加题干高度，不侵占书写区", () => {
    const problem: WorksheetProblem = {
      id: "long",
      kind: "steps",
      expression: "(76 - 67) × 8 + 81",
      answer: "153",
    };
    const layout = layoutWorksheet([problem], options, (text) => text.length * 5);
    const question = layout.pages[0]!.questions[0]!;
    expect(question.expressionLines.length).toBeGreaterThan(1);
    expect(question.headerHeight).toBeGreaterThan(9);
    expect(question.workspace.height).toBe(55);
    for (const line of question.expressionLines) expect(line.length * 5).toBeLessThanOrEqual(question.workspace.width);
  });

  it("3 列导致过程题过窄时明确拒绝，不静默改列数", () => {
    expect(() => layoutWorksheet(createWorksheetTestProblems("steps", 6), {
      ...options,
      columns: 3,
    })).toThrow(/书写区/);
  });

  it("单题放不下时明确拒绝，而不是绘制到页外", () => {
    expect(() => layoutWorksheet(createWorksheetTestProblems("steps", 1), {
      ...options,
      workspaceHeightMm: 250,
    })).toThrow(/超过一页/);
  });

  it("拒绝 NaN、无限大和非法列数", () => {
    const problems = createWorksheetTestProblems("vertical", 6);
    expect(() => layoutWorksheet(problems, { ...options, columns: 0 })).toThrow();
    expect(() => layoutWorksheet(problems, { ...options, columns: 1.5 })).toThrow();
    expect(() => layoutWorksheet(problems, { ...options, workspaceHeightMm: NaN })).toThrow();
    expect(() => layoutWorksheet(problems, { ...options, workspaceHeightMm: Infinity })).toThrow();
  });

  it("固定示例的二元运算答案正确，示例不会修改生成器", () => {
    for (const problem of createWorksheetTestProblems("vertical", 12)) {
      const left = problem.left!;
      const right = problem.right!;
      const result = problem.operator === "+" ? left + right
        : problem.operator === "-" ? left - right
          : problem.operator === "×" ? left * right : left / right;
      expect(String(result)).toBe(problem.answer);
    }
    for (const problem of createWorksheetTestProblems("steps", 12)) {
      expect(problem.steps!.at(-1)).toBe(`= ${problem.answer}`);
    }
  });
});
