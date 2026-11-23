import { describe, expect, it } from "vitest";
import { ARITHMETIC_PRESETS } from "../shared/utils/arithmeticPresets";
import { createOralForm, getOralConfigError, getOralRatioTotal, ORAL_OPERATIONS } from "../shared/utils/oralConfig";
import { getPdfErrorMessage, getPdfFilename } from "../app/utils/pdfDownload";
import { getPresetConfig } from "../server/Math/LevelPresets";
import { parseCustomConfig } from "../server/Math/RequestParser";
import { validateWorksheetConfig } from "../server/Math/WorksheetConfigGuard";
import type { RequestBody } from "../server/api/generate-math-problems";

describe("正式站保留口算配置", () => {
  it("保留全部 37 个快速预设及唯一 ID", () => {
    expect(ARITHMETIC_PRESETS).toHaveLength(37);
    expect(new Set(ARITHMETIC_PRESETS.map((preset) => preset.level)).size).toBe(37);
    for (const preset of ARITHMETIC_PRESETS) expect(() => validateWorksheetConfig(getPresetConfig(preset.level))).not.toThrow();
  });

  it("自定义口算默认参数与原页面相同", () => {
    const form = createOralForm();
    expect(form.count).toBe(10);
    expect(form.per_page_count).toBe(100);
    expect(getOralRatioTotal(form)).toBe(100);
    expect(ORAL_OPERATIONS).toHaveLength(5);
    expect(getOralConfigError(form)).toBe("");
    expect(() => validateWorksheetConfig(parseCustomConfig(form as unknown as RequestBody))).not.toThrow();
  });

  it("明确提示比例和范围错误", () => {
    const form = createOralForm();
    form.addition_ratio = 0;
    expect(getOralConfigError(form)).toContain("100%");
    form.addition_ratio = 15;
    form.addition_range_min = 101;
    expect(getOralConfigError(form)).toContain("不能大于");
  });

  it("忽略比例为零的题型参数，不误伤其他题型", () => {
    const form = createOralForm();
    form.division_with_remainder_divisor_max = "";
    expect(getOralConfigError(form)).toBe("");
  });

  it("按页生成校验拒绝资源过量和无解的有余数配置", () => {
    const config = getPresetConfig("3-1");
    config.count = 21;
    expect(() => validateWorksheetConfig(config)).toThrow(/生成组数/);
    config.count = 1;
    config.division_with_remainder = { ratio: 1, divisor_min: 1, divisor_max: 1 };
    expect(() => validateWorksheetConfig(config)).toThrow(/除数最大值/);
  });

  it("正确解析中文 PDF 文件名，并处理异常响应头", () => {
    expect(getPdfFilename("attachment; filename*=UTF-8''%E5%8F%A3%E7%AE%97.pdf", "fallback.pdf")).toBe("口算.pdf");
    expect(getPdfFilename('attachment; filename="test.pdf"', "fallback.pdf")).toBe("test.pdf");
    expect(getPdfFilename("attachment; filename*=UTF-8''%INVALID", "fallback.pdf")).toBe("fallback.pdf");
    expect(getPdfFilename(null, "fallback.pdf")).toBe("fallback.pdf");
  });

  it("下载错误仅接受可读字符串，不展示异常对象", () => {
    expect(getPdfErrorMessage({ error: "配置范围错误" }, "失败")).toBe("配置范围错误");
    expect(getPdfErrorMessage({ message: "暂时不可用" }, "失败")).toBe("暂时不可用");
    expect(getPdfErrorMessage({ error: true }, "失败")).toBe("失败");
    expect(getPdfErrorMessage(undefined, "失败")).toBe("失败");
  });

  it("括号题仍只按因数范围验证，不误用被禁用的数值范围", () => {
    const config = parseCustomConfig({
      count: 1, multi_step_ratio: "100", multi_step_use_mul_div: "true", multi_step_use_parentheses: "true",
      multi_step_range_min: "", multi_step_range_max: "", multi_step_factor_min: "2", multi_step_factor_max: "9",
    });
    expect(() => validateWorksheetConfig(config)).not.toThrow();
  });
});
