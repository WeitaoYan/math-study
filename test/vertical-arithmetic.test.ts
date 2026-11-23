import { describe, expect, it } from "vitest";
import { Addition, DivisionWithRemainder } from "../server/Math/ProblemTypes";
import { generateProblems } from "../server/Math/ProblemGenerator";
import { parseCustomConfig } from "../server/Math/RequestParser";
import { applyWorksheetRequest } from "../server/utils/WorksheetRequest";
import { toWorksheetProblems } from "../server/renderer/WorksheetProblems";
import { createWorksheetPlan, renderPage, renderAnswerPage } from "../server/renderer/PdfRenderer";
import { createDoc } from "../server/utils/PdfConfig";
import { createOralForm, createVerticalForm } from "../shared/utils/oralConfig";
import { buildVerticalWork } from "../shared/utils/verticalWork";
import { layoutWorksheet, type WorksheetProblem } from "../shared/utils/worksheetLayout";
import type { RequestBody } from "../server/api/generate-math-problems";

describe("真实竖式题型", () => {
  it("保留原二元题返回值，元数据区分隐藏操作数和最终结果", () => {
    const addition = new Addition();
    const entry = addition.generateFormula(12, 8, 20, "left");
    expect(entry).toEqual(["___ + 8 = 20", "12"]);
    expect(addition.metadata).toEqual({ kind: "binary", operator: "+", left: 12, right: 8, result: 20, blank: "left" });
  });

  it("混合小题量和 50 题不会因比例取整而少题", () => {
    for (const count of [1, 6, 50]) {
      const form = createOralForm();
      form.per_page_count = count;
      const config = parseCustomConfig(form as unknown as RequestBody);
      expect(generateProblems(config)).toHaveLength(count);
    }
  });

  it("竖式复用实际取数，题目和答案保留同一组操作数", async () => {
    const body = { ...createVerticalForm(), include_answers: true, worksheet_type: "vertical", workspace_height_mm: 55 } as unknown as RequestBody;
    const config = parseCustomConfig(body);
    applyWorksheetRequest(config, body);
    const entries = generateProblems(config);
    expect(entries).toHaveLength(6);
    entries.forEach((entry) => {
      expect(entry[3]?.blank).toBe("result");
      expect(entry[3]?.left).toBeGreaterThanOrEqual(10);
    });
    const doc = await createDoc();
    const questions = renderPage(doc, 0, config, entries);
    const answers = renderAnswerPage(doc, 0, config, entries);
    expect(questions.problems.every((problem) => problem.kind === "vertical")).toBe(true);
    expect(questions.pages).toEqual(answers.pages);
    expect(doc.getNumberOfPages()).toBe(questions.pages.length * 2);
  });

  it("预列竖式与独立书写区真实写入 PDF 页计划", async () => {
    const body = { ...createVerticalForm(), worksheet_type: "vertical", workspace_height_mm: 75, vertical_mode: "setup", workspace_guide: "grid" } as unknown as RequestBody;
    const config = parseCustomConfig(body);
    applyWorksheetRequest(config, body);
    const plan = createWorksheetPlan(await createDoc(), config, generateProblems(config));
    expect(plan.settings.guide).toBe("grid");
    expect(plan.pages.length).toBeGreaterThan(1);
    for (const page of plan.pages) for (const question of page.questions) {
      expect(question.headerHeight).toBeGreaterThanOrEqual(26);
      expect(question.workspace.height).toBeGreaterThanOrEqual(75);
      expect(question.workspace.y).toBeGreaterThan(question.y + question.headerHeight);
    }
  });

  it("多位乘法部分积按位错开，结果正确", () => {
    const work = buildVerticalWork({ id: "mul", kind: "vertical", left: 47, right: 26, operator: "×", expression: "47 × 26", answer: "1222", result: 1222 }, 16);
    expect(work.rows.filter((row) => row.kind === "number").map((row) => [row.value, row.shift])).toEqual([["282", 0], ["94", 1], ["1222", 0]]);
  });

  it("长除法保留商中间的零和余数", () => {
    const problem: WorksheetProblem = { id: "div", kind: "vertical", left: 1206, right: 6, operator: "÷", expression: "1206 ÷ 6", answer: "201", result: 201 };
    const work = buildVerticalWork(problem, 16);
    expect(work.quotient.map((digit) => digit.value).join("")).toBe("201");
    expect(work.rows.filter((row) => row.kind === "number").at(-1)!.value).toBe("0");
    const remainder = buildVerticalWork({ ...problem, left: 29, right: 5, answer: "5······4", result: 5, remainder: 4 }, 16);
    expect(remainder.rows.filter((row) => row.kind === "number").at(-1)!.value).toBe("4");
  });

  it("复杂除法按实际过程增大占位，不让答案溢出书写区", () => {
    const problem: WorksheetProblem = { id: "div", kind: "vertical", left: 864, right: 6, operator: "÷", expression: "864 ÷ 6", answer: "144", result: 144 };
    const layout = layoutWorksheet([problem], { columns: 2, workspaceHeightMm: 35, fontSizePt: 16, rowGapMm: 8, verticalMode: "self" });
    expect(layout.pages[0]!.questions[0]!.workspace.height).toBeGreaterThan(55);
  });

  it("不从文本反解竖式操作数，不支持把隐藏操作数误当结果", () => {
    expect(() => toWorksheetProblems([["246 + 178 = ___", "424"]], "vertical")).toThrow(/元数据/);
    const config = parseCustomConfig(createVerticalForm() as unknown as RequestBody);
    expect(() => applyWorksheetRequest(config, { worksheet_type: "vertical", fill_mode: "left" })).toThrow(/隐藏操作数/);
  });

  it("无解的有余数除法不会无限重试", () => {
    expect(() => new DivisionWithRemainder(1, 1).generate()).toThrow(/最大除数/);
  });
});
