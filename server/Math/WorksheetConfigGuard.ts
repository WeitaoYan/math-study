import type { Config } from "./Config";

function requireInteger(label: string, value: number, min: number, max: number) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`配置无法生成：${label}须为 ${min}～${max} 之间的整数`);
  }
}

/** 按页出题前校验数学参数和批次规模，不改变取数算法。 */
export function validateWorksheetConfig(config: Config) {
  requireInteger("生成组数", config.count, 1, 20);
  requireInteger("起始编号", config.start, 1, 999999);
  requireInteger("每组题数", config.per_page_count, 1, 200);
  requireInteger("列数", config.columns, 1, 6);

  const operations = [config.addition, config.subtraction, config.multiplication, config.division, config.division_with_remainder, config.multi_step];
  if (operations.some((operation) => !Number.isFinite(operation.ratio) || operation.ratio < 0 || operation.ratio > 1)) {
    throw new Error("配置无法生成：题型比例须为 0～100%");
  }
  const ratio = operations.reduce((sum, operation) => sum + operation.ratio, 0);
  if (Math.abs(ratio - 1) > 0.0001) throw new Error("配置无法生成：各题型比例总和须为 100%");
  if (!["random", "result", "left", "right", "none"].includes(config.fill_mode)) {
    throw new Error("配置无法生成：填空模式无效");
  }

  for (const [label, operation] of [["加法", config.addition], ["减法", config.subtraction]] as const) {
    if (!operation.ratio) continue;
    requireInteger(`${label}最小值`, operation.range_min, 0, 100000);
    requireInteger(`${label}最大值`, operation.range_max, 1, 100000);
    if (operation.range_min > operation.range_max) throw new Error(`配置无法生成：${label}最小值不能大于最大值`);
    if (![0, 10, 100].includes(operation.round_to)) throw new Error(`配置无法生成：${label}整十整百约束无效`);
  }
  for (const [label, operation] of [["乘法", config.multiplication], ["除法", config.division]] as const) {
    if (!operation.ratio) continue;
    requireInteger(`${label}因数最小值`, operation.factor_min, 1, 1000);
    requireInteger(`${label}因数最大值`, operation.factor_max, 1, 1000);
    if (operation.factor_min > operation.factor_max) throw new Error(`配置无法生成：${label}因数范围无效`);
  }
  const remainder = config.division_with_remainder;
  if (remainder.ratio) {
    requireInteger("有余数除法除数最小值", remainder.divisor_min, 1, 1000);
    requireInteger("有余数除法除数最大值", remainder.divisor_max, 2, 1000);
    if (remainder.divisor_min > remainder.divisor_max) throw new Error("配置无法生成：有余数除法除数范围无效");
  }
  const steps = config.multi_step;
  if (steps.ratio) {
    requireInteger("参与数字个数", steps.terms, 2, 4);
    if (!(steps.use_mul_div && steps.use_parentheses)) {
      requireInteger("脱式最小值", steps.range_min, 0, 100000);
      requireInteger("脱式最大值", steps.range_max, 1, 100000);
      if (steps.range_min > steps.range_max) throw new Error("配置无法生成：脱式数值范围无效");
    }
    if (steps.use_mul_div) {
      requireInteger("脱式因数最小值", steps.factor_min, 2, 20);
      requireInteger("脱式因数最大值", steps.factor_max, 2, 20);
      if (steps.factor_min > steps.factor_max) throw new Error("配置无法生成：脱式因数范围无效");
    }
  }
}
