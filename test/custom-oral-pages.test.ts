import { describe, expect, it } from "vitest";
import { createOralForm, ORAL_OPERATIONS } from "../shared/utils/oralConfig";
import { customOralWorksheetType } from "../server/Math/CustomOralWorksheet";
import { configForWorksheetType, generateWorksheetByPages, resolvePageWorksheetRequest } from "../server/Math/PageWorksheetGenerator";
import { createDoc } from "../server/utils/PdfConfig";
import { renderWorksheetPlan } from "../server/renderer/PdfRenderer";

describe("自定义口算与预设口算分开", () => {
  it("保留所有数学参数，却不接受用户的组数或版式设置", () => {
    const form = createOralForm();
    const type = customOralWorksheetType({ ...form, fill_mode: "right", count: 20, columns: "1", font_size_pt: 6, workspace_height_mm: 110 });
    const config = configForWorksheetType(type);
    expect(config.addition.ratio).toBe(0.15);
    expect(config.subtraction.borrow).toBe(true);
    expect(config.multiplication.factor_max).toBe(9);
    expect(config.fill_mode).toBe("right");
    expect(config.count).toBe(1);
    expect(config.worksheet?.rowsPerPage).toBe(20);
    expect(config.worksheet?.fontSizePt).toBe(12);
    expect(config.worksheet?.autoColumns).toBe(true);
  });

  it("自定义数学配置也按所选页数填满，每页20行", async () => {
    const form = createOralForm();
    const { type, pages } = resolvePageWorksheetRequest("oral:custom", 2, form);
    const doc = await createDoc();
    const plan = generateWorksheetByPages(doc, type, pages);
    renderWorksheetPlan(doc, plan, { title: type.title });
    expect(doc.getNumberOfPages()).toBe(2);
    for (const page of plan.pages) expect(new Set(page.questions.map((question) => question.y)).size).toBe(20);
    expect(plan.problems.some((problem) => problem.operator === "+")).toBe(true);
    expect(plan.problems.some((problem) => problem.operator === "×")).toBe(true);
  });

  it("大范围算式自动减少列数，不因20行限制而压小字号", async () => {
    const form = createOralForm();
    for (const operation of ORAL_OPERATIONS) form[operation.ratioKey] = operation.title === "乘法" ? 100 : 0;
    form.multiplication_factor_min = 1000;
    form.multiplication_factor_max = 1000;
    const type = customOralWorksheetType(form);
    const plan = generateWorksheetByPages(await createDoc(), type, 2);
    expect(plan.columns).toBeLessThan(5);
    expect(plan.settings.fontSizePt).toBe(12);
    expect(plan.pages).toHaveLength(2);
    for (const page of plan.pages) expect(new Set(page.questions.map((question) => question.y)).size).toBe(20);
  });

  it("无效比例、格式和填空方式会在生成前拒绝", () => {
    expect(() => configForWorksheetType(customOralWorksheetType({ ...createOralForm(), addition_ratio: 99 }))).toThrow(/比例总和/);
    expect(() => customOralWorksheetType({ addition_ratio: [] })).toThrow(/格式/);
    expect(() => customOralWorksheetType({ fill_mode: "invalid" })).toThrow(/填空/);
  });

  it("旧自定义口算的整十整百与进借位参数仍生效", () => {
    const form = createOralForm();
    form.addition_round_to = 10;
    form.subtraction_round_to = 100;
    form.addition_carry = false;
    const config = configForWorksheetType(customOralWorksheetType(form));
    expect(config.addition.round_to).toBe(10);
    expect(config.subtraction.round_to).toBe(100);
    expect(config.addition.carry).toBe(false);
  });
});
