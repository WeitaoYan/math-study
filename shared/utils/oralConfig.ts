export type OralForm = Record<string, number | string | boolean>;

export interface OralOperation {
  title: string;
  symbol: string;
  description: string;
  ratioKey: string;
  fields: { key: string; label: string; min: number }[];
  toggle?: { key: string; label: string };
  roundKey?: string;
}

export const ORAL_OPERATIONS: OralOperation[] = [
  { title: "加法", symbol: "+", description: "设置数值范围与进位条件", ratioKey: "addition_ratio",
    fields: [{ key: "addition_range_min", label: "最小值", min: 0 }, { key: "addition_range_max", label: "最大值", min: 1 }],
    toggle: { key: "addition_carry", label: "允许进位" }, roundKey: "addition_round_to" },
  { title: "减法", symbol: "−", description: "设置数值范围与借位条件", ratioKey: "subtraction_ratio",
    fields: [{ key: "subtraction_range_min", label: "最小值", min: 0 }, { key: "subtraction_range_max", label: "最大值", min: 1 }],
    toggle: { key: "subtraction_borrow", label: "允许借位" }, roundKey: "subtraction_round_to" },
  { title: "乘法", symbol: "×", description: "设置参与相乘的因数范围", ratioKey: "multiplication_ratio",
    fields: [{ key: "multiplication_factor_min", label: "因数最小值", min: 1 }, { key: "multiplication_factor_max", label: "因数最大值", min: 1 }] },
  { title: "除法", symbol: "÷", description: "设置除数与商的范围", ratioKey: "division_ratio",
    fields: [{ key: "division_factor_min", label: "除数/商最小值", min: 1 }, { key: "division_factor_max", label: "除数/商最大值", min: 1 }] },
  { title: "有余数除法", symbol: "…", description: "学生填写商和余数", ratioKey: "division_with_remainder_ratio",
    fields: [{ key: "division_with_remainder_divisor_min", label: "除数最小值", min: 1 }, { key: "division_with_remainder_divisor_max", label: "除数最大值", min: 2 }] },
];

export function createOralForm(): OralForm {
  return {
    count: 10, start: 1, per_page_count: 100, columns: "auto", include_answers: false, fill_mode: "random",
    addition_ratio: 15, addition_range_min: 20, addition_range_max: 100, addition_carry: true, addition_round_to: 0,
    subtraction_ratio: 15, subtraction_range_min: 20, subtraction_range_max: 100, subtraction_borrow: true, subtraction_round_to: 0,
    multiplication_ratio: 35, multiplication_factor_min: 2, multiplication_factor_max: 9,
    division_ratio: 35, division_factor_min: 2, division_factor_max: 9,
    division_with_remainder_ratio: 0, division_with_remainder_divisor_min: 2, division_with_remainder_divisor_max: 9,
  };
}

export function createVerticalForm(): OralForm {
  return {
    ...createOralForm(), count: 2, per_page_count: 6, columns: "2", fill_mode: "result",
    addition_ratio: 50, subtraction_ratio: 50, multiplication_ratio: 0, division_ratio: 0,
    addition_range_min: 10, addition_range_max: 1000, subtraction_range_min: 10, subtraction_range_max: 1000,
    multiplication_factor_min: 2, multiplication_factor_max: 99, division_factor_min: 2, division_factor_max: 99,
  };
}

export function getOralRatioTotal(form: OralForm): number {
  return ORAL_OPERATIONS.reduce((sum, operation) => sum + Number(form[operation.ratioKey] || 0), 0);
}

export function getOralConfigError(form: OralForm): string {
  for (const operation of ORAL_OPERATIONS) {
    const ratio = Number(form[operation.ratioKey]);
    if (!Number.isFinite(ratio) || ratio < 0 || ratio > 100) return `${operation.title}比例需要在 0～100% 之间。`;
    if (!ratio) continue;
    for (const field of operation.fields) {
      const raw = form[field.key];
      const value = Number(raw);
      if (raw === "" || !Number.isSafeInteger(value) || value < field.min) return `请填写有效的${operation.title}${field.label}。`;
    }
    if (Number(form[operation.fields[0]!.key]) > Number(form[operation.fields[1]!.key])) {
      return `${operation.title}最小值不能大于最大值。`;
    }
  }
  if (Math.abs(getOralRatioTotal(form) - 100) > 0.0001) return "请将各题型的比例总和调整为 100%。";
  return "";
}
