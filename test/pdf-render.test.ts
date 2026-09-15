import { describe, it, expect } from "vitest";
import { renderPage, renderAnswerPage } from "../server/renderer/PdfRenderer";
import { generateProblems } from "../server/Math/ProblemGenerator";
import { createDoc } from "../server/utils/PdfConfig";

function makeConfig() {
  return {
    count: 2,
    start: 1,
    columns: 3,
    per_page_count: 12,
    include_answers: true,
    fill_mode: "random",
    compact: false,
    addition: { ratio: 0, range_min: 0, range_max: 0, carry: false, round_to: 0 },
    subtraction: { ratio: 0, range_min: 0, range_max: 0, borrow: false, round_to: 0 },
    multiplication: { ratio: 0, factor_min: 0, factor_max: 0 },
    division: { ratio: 0, factor_min: 0, factor_max: 0 },
    division_with_remainder: { ratio: 0, divisor_min: 0, divisor_max: 0 },
    multi_step: {
      ratio: 1, range_min: 10, range_max: 100, terms: 3,
      use_mul_div: true, use_parentheses: true, factor_min: 2, factor_max: 9,
    },
  };
}

describe("脱式计算 + 括号 端到端渲染", () => {
  it("3 个数括号渲染不报错", async () => {
    const doc = await createDoc();
    const config: any = makeConfig();
    for (let i = 0; i < config.count; i++) {
      const problems = generateProblems(config);
      renderPage(doc, i, config, problems);
      renderAnswerPage(doc, i, config, problems);
    }
    const out = doc.output("arraybuffer");
    expect(out.byteLength).toBeGreaterThan(1000);
  });

  it("4 个数括号渲染不报错", async () => {
    const doc = await createDoc();
    const config: any = makeConfig();
    config.multi_step.terms = 4;
    for (let i = 0; i < config.count; i++) {
      const problems = generateProblems(config);
      renderPage(doc, i, config, problems);
      renderAnswerPage(doc, i, config, problems);
    }
    const out = doc.output("arraybuffer");
    expect(out.byteLength).toBeGreaterThan(1000);
  });
});