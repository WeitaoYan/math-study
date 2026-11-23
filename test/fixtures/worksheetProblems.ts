import type { WorksheetOperator, WorksheetProblem } from "../../shared/utils/worksheetLayout";

export type WorksheetTestMode = "vertical" | "steps" | "mixed";

// 固定、可复现的布局测试数据，不进入正式应用，也不调用随机出题流程。
const verticalExamples: [number, WorksheetOperator, number, string][] = [
  [246, "+", 178, "424"],
  [503, "-", 267, "236"],
  [38, "×", 24, "912"],
  [864, "÷", 6, "144"],
  [407, "+", 286, "693"],
  [720, "-", 458, "262"],
  [56, "×", 13, "728"],
  [936, "÷", 8, "117"],
  [368, "+", 457, "825"],
  [902, "-", 376, "526"],
  [47, "×", 26, "1222"],
  [756, "÷", 7, "108"],
];

const stepExamples: [string, string, string[]][] = [
  ["(35 + 28) ÷ 7", "9", ["= 63 ÷ 7", "= 9"]],
  ["72 ÷ 8 + 36", "45", ["= 9 + 36", "= 45"]],
  ["46 + 7 × 8", "102", ["= 46 + 56", "= 102"]],
  ["9 × (13 - 6) + 18", "81", ["= 9 × 7 + 18", "= 63 + 18", "= 81"]],
  ["96 - 6 × 9", "42", ["= 96 - 54", "= 42"]],
  ["54 ÷ 6 + 8 × 3", "33", ["= 9 + 8 × 3", "= 9 + 24", "= 33"]],
  ["(18 + 24) ÷ 7", "6", ["= 42 ÷ 7", "= 6"]],
  ["87 - 49 + 26", "64", ["= 38 + 26", "= 64"]],
  ["8 × (21 - 14)", "56", ["= 8 × 7", "= 56"]],
  ["45 + 36 ÷ 9", "49", ["= 45 + 4", "= 49"]],
  ["7 × 6 - 18", "24", ["= 42 - 18", "= 24"]],
  ["(76 - 67) × 8 + 81", "153", ["= 9 × 8 + 81", "= 72 + 81", "= 153"]],
];

const oralExamples: [string, string][] = [
  ["37 + 26", "63"],
  ["84 - 39", "45"],
  ["7 × 8", "56"],
  ["63 ÷ 9", "7"],
  ["48 + 35", "83"],
  ["92 - 47", "45"],
];

export function createWorksheetTestProblems(
  mode: WorksheetTestMode,
  count: number,
  sampleOffset = 0,
): WorksheetProblem[] {
  if (!Number.isInteger(count) || count < 1 || count > 36) {
    throw new RangeError("测试题数必须在 1～36 之间");
  }
  if (!Number.isInteger(sampleOffset) || sampleOffset < 0) {
    throw new RangeError("示例偏移必须是非负整数");
  }

  const mixedOrder = ["oral", "oral", "vertical", "vertical", "steps", "steps"] as const;
  return Array.from({ length: count }, (_, index) => {
    const kind = mode === "mixed" ? mixedOrder[index % mixedOrder.length]! : mode;
    const sourceIndex = sampleOffset + index;
    const id = `test-${kind}-${sampleOffset}-${index}`;

    if (kind === "vertical") {
      const [left, operator, right, answer] = verticalExamples[sourceIndex % verticalExamples.length]!;
      return { id, kind, expression: `${left} ${operator} ${right}`, left, right, operator, answer };
    }
    if (kind === "steps") {
      const [expression, answer, steps] = stepExamples[sourceIndex % stepExamples.length]!;
      return { id, kind, expression, answer, steps: [...steps] };
    }
    const [expression, answer] = oralExamples[sourceIndex % oralExamples.length]!;
    return { id, kind, expression, answer };
  });
}
