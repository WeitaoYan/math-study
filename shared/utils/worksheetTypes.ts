import { ARITHMETIC_PRESET_CATEGORIES } from "./arithmeticPresets";
import type { WorksheetProblemKind } from "./worksheetLayout";

export interface WorksheetTypeDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
  kind: WorksheetProblemKind;
  level?: string;
  parameters?: Record<string, string | number | boolean>;
  columns: number;
  fontSizePt: number;
  workspaceHeightMm: number;
  rowGapMm: number;
  verticalMode: "self" | "setup";
  rowsPerPage?: number;
  autoColumns?: boolean;
  fillMode?: string;
}

const oral: WorksheetTypeDefinition[] = ARITHMETIC_PRESET_CATEGORIES.flatMap((category) => category.presets.map((preset) => {
  const remainderMax: Record<string, number> = { "3-1": 5, "3-2": 6, "3-3": 8, "3-4": 9 };
  const isRemainder = preset.level.startsWith("3-");
  return {
    id: `oral:${preset.level}`, kind: "oral" as const, level: preset.level,
    title: isRemainder ? `有余数除法（2～${remainderMax[preset.level]}）` : preset.title,
    description: isRemainder ? `除数和商范围 2～${remainderMax[preset.level]}，结果填写商和余数。` : preset.desc,
    category: `口算 · ${category.title}`,
    columns: isRemainder || preset.level.startsWith("4-") ? 3 : preset.level.startsWith("1-") && Number(preset.level.split("-")[1]) >= 13 ? 4 : 5,
    fontSizePt: 12, workspaceHeightMm: 0, rowGapMm: 2, verticalMode: "self" as const, rowsPerPage: 20, autoColumns: true,
  };
}));

function steps(id: string, title: string, terms: number, mulDiv: boolean, parentheses: boolean): WorksheetTypeDefinition {
  return {
    id, title, kind: "steps", category: "脱式计算", description: terms === 3 ? "两步运算，每题保留完整过程书写区。" : "三步运算，自动增加过程书写区。",
    parameters: { multi_step_ratio: 100, multi_step_range_min: 10, multi_step_range_max: 100, multi_step_terms: terms, multi_step_use_mul_div: mulDiv, multi_step_use_parentheses: parentheses, multi_step_factor_min: 2, multi_step_factor_max: 9 },
    columns: 2, fontSizePt: 16, workspaceHeightMm: terms === 3 ? 40 : 55, rowGapMm: 4, verticalMode: "self",
  };
}

function vertical(id: string, title: string, parameters: WorksheetTypeDefinition["parameters"], complex = false, setup = false): WorksheetTypeDefinition {
  return {
    id, title, kind: "vertical", category: "竖式计算", description: complex ? "自动保留较大的过程区，适合多位数计算。" : setup ? "已列好竖式，同时保留独立书写区。" : "加减法自行列竖式，自动保留标准过程区。",
    parameters, columns: 2, fontSizePt: 16, workspaceHeightMm: complex ? 55 : 40, rowGapMm: 4, verticalMode: setup ? "setup" : "self",
  };
}

const add = { addition_ratio: 100, addition_range_min: 10, addition_range_max: 1000, addition_carry: true };
const subtract = { subtraction_ratio: 100, subtraction_range_min: 10, subtraction_range_max: 1000, subtraction_borrow: true };
const addSubtract = { ...add, ...subtract, addition_ratio: 50, subtraction_ratio: 50 };

export const WORKSHEET_TYPES: WorksheetTypeDefinition[] = [
  ...oral,
  steps("steps:add-sub", "两步加减脱式", 3, false, false),
  steps("steps:mixed", "两步四则脱式", 3, true, false),
  steps("steps:parentheses", "两步含括号脱式", 3, true, true),
  steps("steps:three", "三步四则脱式", 4, true, false),
  steps("steps:three-parentheses", "三步含括号脱式", 4, true, true),
  vertical("vertical:add-sub", "1000以内加减竖式", addSubtract),
  vertical("vertical:add", "1000以内加法竖式", add),
  vertical("vertical:subtract", "1000以内减法竖式", subtract),
  vertical("vertical:multiply", "两位数乘法竖式", { multiplication_ratio: 100, multiplication_factor_min: 10, multiplication_factor_max: 99 }, true),
  vertical("vertical:divide", "多位数除法竖式", { division_ratio: 100, division_factor_min: 2, division_factor_max: 99 }, true),
  vertical("vertical:remainder", "有余数除法竖式", { division_with_remainder_ratio: 100, division_with_remainder_divisor_min: 2, division_with_remainder_divisor_max: 9 }, true),
  vertical("vertical:setup", "预列加减竖式", addSubtract, false, true),
];

export const DEFAULT_WORKSHEET_TYPES: Record<WorksheetProblemKind, string> = { oral: "oral:1-11", steps: "steps:mixed", vertical: "vertical:add-sub" };

export function findWorksheetType(id: string): WorksheetTypeDefinition | undefined {
  const alias = DEFAULT_WORKSHEET_TYPES[id as WorksheetProblemKind];
  return WORKSHEET_TYPES.find((type) => type.id === (alias ?? id));
}
