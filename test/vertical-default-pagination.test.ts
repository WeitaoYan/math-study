import { describe, expect, it } from "vitest";
import { createVerticalForm } from "../shared/utils/oralConfig";
import { worksheetInputDefaults } from "../shared/utils/worksheetDefaults";
import { parseCustomConfig } from "../server/Math/RequestParser";
import { applyWorksheetRequest } from "../server/utils/WorksheetRequest";
import { generateProblems } from "../server/Math/ProblemGenerator";
import { renderPage, renderAnswerPage } from "../server/renderer/PdfRenderer";
import { createDoc } from "../server/utils/PdfConfig";
import type { RequestBody } from "../server/api/generate-math-problems";

async function renderDefault(overrides: Record<string, unknown> = {}) {
  const body = { ...createVerticalForm(), ...worksheetInputDefaults("vertical"), ...overrides } as unknown as RequestBody;
  const config = parseCustomConfig(body);
  applyWorksheetRequest(config, body);
  const doc = await createDoc();
  const questions = [];
  const answers = [];
  for (let group = 0; group < config.count; group++) {
    const entries = generateProblems(config);
    questions.push(renderPage(doc, group, config, entries));
    if (config.include_answers) answers.push(renderAnswerPage(doc, group, config, entries));
  }
  return { doc, config, questions, answers };
}

describe("竖式默认配置的页数", () => {
  it("默认两组各六题，各占一页，下载正好两页", async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const result = await renderDefault();
      expect(result.config.count).toBe(2);
      expect(result.config.worksheet?.workspaceHeightMm).toBe(55);
      expect(result.questions.map((plan) => plan.pages.length)).toEqual([1, 1]);
      expect(result.questions.map((plan) => plan.pages[0]!.questions.length)).toEqual([6, 6]);
      expect(result.doc.getNumberOfPages()).toBe(2);
      for (const plan of result.questions) for (const question of plan.pages[0]!.questions) {
        expect(question.workspace.height).toBeGreaterThanOrEqual(55);
      }
    }
  });

  it("主动选择75mm大留白时仍保留空白，不再以缩字或挤空间凑页", async () => {
    const result = await renderDefault({ workspace_height_mm: 75 });
    expect(result.questions.map((plan) => plan.pages.map((page) => page.questions.length))).toEqual([[4, 2], [4, 2]]);
    expect(result.doc.getNumberOfPages()).toBe(4);
    for (const plan of result.questions) for (const page of plan.pages) for (const question of page.questions) {
      expect(question.workspace.height).toBeGreaterThanOrEqual(75);
    }
  });

  it("两页题目附答案时是两页题目加两页答案，合计四页", async () => {
    const result = await renderDefault({ include_answers: true });
    expect(result.questions.reduce((sum, plan) => sum + plan.pages.length, 0)).toBe(2);
    expect(result.answers.reduce((sum, plan) => sum + plan.pages.length, 0)).toBe(2);
    expect(result.doc.getNumberOfPages()).toBe(4);
  });

  it("预列竖式需额外题干空间，不能挤占独立书写区", async () => {
    const result = await renderDefault({ vertical_mode: "setup" });
    expect(result.doc.getNumberOfPages()).toBe(4);
    for (const plan of result.questions) for (const page of plan.pages) for (const question of page.questions) {
      expect(question.headerHeight).toBeGreaterThanOrEqual(26);
      expect(question.workspace.height).toBeGreaterThanOrEqual(55);
    }
  });
});
