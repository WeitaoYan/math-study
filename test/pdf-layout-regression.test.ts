import { describe, expect, it } from "vitest";
import { renderPage, renderAnswerPage, createWorksheetPlan } from "../server/renderer/PdfRenderer";
import { getPresetConfig } from "../server/Math/LevelPresets";
import { generateProblems } from "../server/Math/ProblemGenerator";
import { applyWorksheetRequest } from "../server/utils/WorksheetRequest";
import { createDoc } from "../server/utils/PdfConfig";
import { WORKSHEET_PAGE } from "../shared/utils/worksheetLayout";

describe("统一真实 PDF 布局", () => {
  it("字体包含所有三类题的共同页眉和答案字符", async () => {
    const doc = await createDoc();
    const metadata = doc.getFont().metadata as unknown as { characterToGlyph(code: number): number };
    for (const character of "答案·竖页班级写出过程") expect(metadata.characterToGlyph(character.charCodeAt(0))).toBeGreaterThan(0);
  });

  it("一列 12 道脱式题保持一列、自动分页，不把留白挤小", async () => {
    const config = getPresetConfig("1-1");
    config.addition = { ...config.addition, ratio: 0 };
    config.multi_step = { ...config.multi_step, ratio: 1 };
    applyWorksheetRequest(config, { worksheet_type: "steps", columns: "1", problem_count: 12, workspace_height_mm: 55 });
    const entries = Array.from({ length: 12 }, () => ["25 + 36 - 18 = ___", "43", ["61 - 18", "43"]] as [string, string, string[]]);
    const doc = await createDoc();
    const questions = renderPage(doc, 0, config, entries);
    const answers = renderAnswerPage(doc, 0, config, entries);
    expect(questions.columns).toBe(1);
    expect(questions.pages).toHaveLength(4);
    expect(questions.pages).toEqual(answers.pages);
    expect(doc.getNumberOfPages()).toBe(8);
    expect(questions.pages.flatMap((page) => page.questions.map((question) => question.number))).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    for (const page of questions.pages) for (const question of page.questions) {
      expect(question.workspace.height).toBeGreaterThanOrEqual(55);
      expect(question.y + question.height).toBeLessThanOrEqual(WORKSHEET_PAGE.contentBottom + 0.001);
    }
  });

  it("长算式换行并增加题干高度，不降低配置字号", async () => {
    const config = getPresetConfig("1-1");
    config.addition = { ...config.addition, ratio: 0 };
    config.multi_step = { ...config.multi_step, ratio: 1 };
    applyWorksheetRequest(config, { worksheet_type: "steps", columns: "2", workspace_height_mm: 55, font_size_pt: 20 });
    const doc = await createDoc();
    const plan = createWorksheetPlan(doc, config, [["( 98765 - 12345 ) × 8 + 12345 = ___", "703705", ["86420 × 8 + 12345", "691360 + 12345", "703705"]]]);
    const question = plan.pages[0]!.questions[0]!;
    expect(plan.settings.fontSizePt).toBe(20);
    expect(question.expressionLines.length).toBeGreaterThan(1);
    expect(question.workspace.height).toBeGreaterThanOrEqual(55);
    doc.setFontSize(20);
    for (const line of question.expressionLines) expect(doc.getTextWidth(line)).toBeLessThanOrEqual(question.workspace.width + 0.01);
  });

  it("口算与脱式走相同的题块模型，200 题按固定字号分多页", async () => {
    const config = getPresetConfig("1-1");
    applyWorksheetRequest(config, { worksheet_type: "oral", problem_count: 200, columns: "5", font_size_pt: 12 });
    const doc = await createDoc();
    const entries = generateProblems(config);
    const questions = renderPage(doc, 0, config, entries);
    const answers = renderAnswerPage(doc, 0, config, entries);
    expect(questions.pages.length).toBeGreaterThan(1);
    expect(questions.settings.fontSizePt).toBe(12);
    expect(questions.pages).toEqual(answers.pages);
    expect(questions.pages.flatMap((page) => page.questions)).toHaveLength(200);
    expect(doc.getNumberOfPages()).toBe(questions.pages.length * 2);
    const last = questions.pages.at(-1)!.questions.at(-1)!;
    doc.setFontSize(12 * 0.8);
    expect(last.workspace.x - last.x + 0.001).toBeGreaterThanOrEqual(doc.getTextWidth("200.") + 1);
  });

  it("真实混排按单题类型分配空间，不把口算题也套进脱式留白", async () => {
    const config = getPresetConfig("1-1");
    config.addition = { ...config.addition, ratio: 0.6 };
    config.multi_step = { ...config.multi_step, ratio: 0.4, range_min: 10, range_max: 100 };
    applyWorksheetRequest(config, { columns: "auto", problem_count: 10 });
    const plan = createWorksheetPlan(await createDoc(), config, generateProblems(config));
    const questions = plan.pages.flatMap((page) => page.questions);
    expect(questions.filter((question) => question.problem.kind === "oral")).toHaveLength(6);
    expect(questions.filter((question) => question.problem.kind === "steps")).toHaveLength(4);
    for (const question of questions) {
      expect(question.workspace.height).toBe(question.problem.kind === "oral" ? 0 : 55);
    }
  });
});
