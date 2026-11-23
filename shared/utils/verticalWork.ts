import type { WorksheetProblem } from "./worksheetLayout";
export const VERTICAL_HEADER_HEIGHT = 26;

export interface VerticalWorkRow {
  kind: "number" | "rule";
  value: string;
  shift: number;
  endColumn: number;
  widthDigits: number;
  y: number;
}
export interface VerticalWork {
  rows: VerticalWorkRow[];
  quotient: { value: string; column: number }[];
  digitCount: number;
  widthMm: number;
  bodyHeightMm: number;
  pitchMm: number;
  headerHeightMm: number;
}

/** 纯确定性的解题过程：没有随机取数，没有字符串反解操作数。 */
export function buildVerticalWork(problem: WorksheetProblem, fontSizePt: number): VerticalWork {
  const { left, right, operator } = problem;
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || left! < 0 || right! < 0 || !operator || (operator === "÷" && right === 0)) {
    throw new RangeError("竖式需要有效的非负整数操作数，除数不能为零");
  }
  const a = left!;
  const b = right!;
  const result = operator === "+" ? a + b : operator === "-" ? a - b : operator === "×" ? a * b : Math.floor(a / b);
  if (result < 0 || !Number.isSafeInteger(result)) throw new RangeError("竖式结果超出整数范围");
  if (problem.result !== undefined && problem.result !== result) throw new RangeError("竖式结果与操作数不一致");
  if (operator === "÷" && problem.remainder !== undefined && problem.remainder !== a % b) throw new RangeError("竖式余数与操作数不一致");
  const pitch = fontSizePt * 25.4 / 72 * 0.85;
  const lineHeight = Math.max(8, fontSizePt * 25.4 / 72 * 1.4);
  const rows: VerticalWorkRow[] = [];
  const quotient: VerticalWork["quotient"] = [];
  let y = 7;
  const append = (value: number, shift = 0, endColumn = 0) => {
    rows.push({ kind: "number", value: String(value), shift, endColumn, widthDigits: String(value).length, y });
    y += lineHeight;
  };

  if (operator === "÷") {
    const digits = String(a).split("").map(Number);
    let remainder = 0;
    let started = false;
    for (let index = 0; index < digits.length; index++) {
      const current = remainder * 10 + digits[index]!;
      const digit = Math.floor(current / b);
      if (!started && !digit && index < digits.length - 1) { remainder = current; continue; }
      started = true;
      quotient.push({ value: String(digit), column: index });
      const product = digit * b;
      append(product, 0, index);
      rows.push({ kind: "rule", value: "", shift: 0, endColumn: index, widthDigits: Math.max(String(current).length, String(product).length), y: y - lineHeight + 3 });
      remainder = current - product;
      if (index < digits.length - 1) append(remainder * 10 + digits[index + 1]!, 0, index + 1);
      else append(remainder, 0, index);
    }
  } else if (operator === "×" && String(b).length > 1) {
    [...String(b)].reverse().forEach((digit, index) => append(a * Number(digit), index));
    rows.push({ kind: "rule", value: "", shift: 0, endColumn: 0, widthDigits: String(result).length, y: y - 3 });
    y += 2;
    append(result);
  } else {
    append(result);
  }
  const digitCount = Math.max(String(a).length, String(b).length, String(result).length);
  return {
    rows, quotient, digitCount, pitchMm: pitch,
    headerHeightMm: Math.max(VERTICAL_HEADER_HEIGHT, VERTICAL_HEADER_HEIGHT * fontSizePt / 16),
    widthMm: (operator === "÷" ? String(a).length + String(b).length + 3 : digitCount + 2) * pitch,
    bodyHeightMm: Math.max(...rows.map((row) => row.y + (row.kind === "number" ? fontSizePt * 25.4 / 72 * 0.3 : 0.5))),
  };
}

export function measureVerticalWork(problem: WorksheetProblem, fontSizePt: number, mode: "self" | "setup", availableWidth: number): number {
  const work = buildVerticalWork(problem, fontSizePt);
  if (work.widthMm > availableWidth) throw new RangeError("竖式数位过宽，请减少列数或使用较小的字号");
  return work.bodyHeightMm + (mode === "self" ? work.headerHeightMm : 0);
}
