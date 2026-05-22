/**
 * 快速生成模式预设配置
 * 将所有 Level 预设从 switch-case 抽取为声明式数据
 */
import type { Config } from "./Config";
import {
  empty_addition_config,
  empty_subtraction_config,
  empty_multiplication_config,
  empty_division_config,
  empty_division_with_remainder_config,
} from "./Config";

// -------------------- 通用默认值 --------------------
const TOTAL = 100;
const COUNT = 5;
const COLUMNS = 5;
/** 布局切换阈值：最大数超过此值则切换为紧凑布局 */
const LAYOUT_THRESHOLD = 100;
/** 紧凑模式阈值：>= 此值则用 3 列 + 小字号 */
const COMPACT_THRESHOLD = 10000;

/** 根据数值范围自动计算合适的列数 */
export function calcColumns(maxNumber: number): number {
  if (maxNumber >= COMPACT_THRESHOLD) return 3;
  if (maxNumber > LAYOUT_THRESHOLD) return 4;
  return 5;
}
/** 根据数值范围自动计算每页题数 */
export function calcTotalCount(maxNumber: number): number {
  return calcColumns(maxNumber) * 20;
}

// -------------------- 快速配置工厂函数 --------------------
function quickConfig(overrides: Partial<Config>): Config {
  return {
    total_count: TOTAL,
    count: COUNT,
    start: 1,
    addition: empty_addition_config,
    subtraction: empty_subtraction_config,
    multiplication: empty_multiplication_config,
    division: empty_division_config,
    division_with_remainder: empty_division_with_remainder_config,
    include_answers: false,
    columns: COLUMNS,
    ...overrides,
  };
}

/** 纯加法预设 */
function additionOnly(
  rangeMin: number,
  rangeMax: number,
  carry: boolean,
  roundTo = 0,
) {
  return quickConfig({
    addition: {
      ratio: 1,
      range_min: rangeMin,
      range_max: rangeMax,
      carry,
      round_to: roundTo,
    },
  });
}

/** 纯减法预设 */
function subtractionOnly(
  rangeMin: number,
  rangeMax: number,
  borrow: boolean,
  roundTo = 0,
) {
  return quickConfig({
    subtraction: {
      ratio: 1,
      range_min: rangeMin,
      range_max: rangeMax,
      borrow,
      round_to: roundTo,
    },
  });
}

/** 加减混合预设 */
function mixAddSub(
  rangeMin: number,
  rangeMax: number,
  carry: boolean,
  borrow: boolean,
  roundTo = 0,
) {
  return quickConfig({
    addition: {
      ratio: 0.5,
      range_min: rangeMin,
      range_max: rangeMax,
      carry,
      round_to: roundTo,
    },
    subtraction: {
      ratio: 0.5,
      range_min: rangeMin,
      range_max: rangeMax,
      borrow,
      round_to: roundTo,
    },
  });
}

/** 纯乘法预设 */
function multiplicationOnly(factorMin: number, factorMax: number) {
  return quickConfig({
    multiplication: { ratio: 1, factor_min: factorMin, factor_max: factorMax },
  });
}

/** 纯除法预设 */
function divisionOnly(factorMin: number, factorMax: number) {
  return quickConfig({
    division: { ratio: 1, factor_min: factorMin, factor_max: factorMax },
  });
}

/** 乘除混合预设 */
function mixMulDiv(factorMin: number, factorMax: number) {
  return quickConfig({
    multiplication: {
      ratio: 0.5,
      factor_min: factorMin,
      factor_max: factorMax,
    },
    division: { ratio: 0.5, factor_min: factorMin, factor_max: factorMax },
  });
}

/** 有余数除法预设 */
function divRemainder(divisorMin: number, divisorMax: number) {
  return quickConfig({
    division_with_remainder: {
      ratio: 1,
      divisor_min: divisorMin,
      divisor_max: divisorMax,
    },
  });
}

// -------------------- 31 个预设 Registry --------------------
export const LEVEL_PRESETS: Record<string, Config> = {
  // ========== 20以内加减法 ==========
  "1-1": additionOnly(0, 5, false), // 5以内加法
  "1-2": additionOnly(0, 10, false), // 10以内加法
  "1-3": additionOnly(0, 20, false), // 20以内不进位加法
  "1-4": additionOnly(0, 20, true), // 20以内进位加法
  "1-5": subtractionOnly(0, 5, false), // 5以内减法
  "1-6": subtractionOnly(0, 10, false), // 10以内减法
  "1-7": subtractionOnly(0, 20, false), // 20以内不借位减法
  "1-8": subtractionOnly(0, 20, true), // 20以内借位减法

  // ========== 综合加减法 ==========
  "1-9": mixAddSub(0, 5, false, false), // 5以内加减法
  "1-10": mixAddSub(0, 10, false, false), // 10以内加减法
  "1-11": mixAddSub(0, 20, false, false), // 20以内加减法
  "1-12": mixAddSub(0, 20, true, true), // 20以内进位/借位加减法

  // ========== 100以内加减法 ==========
  "1-13": additionOnly(10, 100, false), // 100以内加法
  "1-14": additionOnly(10, 100, true), // 100以内进位加法
  "1-15": subtractionOnly(10, 100, false), // 100以内减法
  "1-16": subtractionOnly(10, 100, true), // 100以内借位减法
  "1-17": mixAddSub(10, 100, false, false), // 100以内加减法
  "1-18": mixAddSub(10, 100, true, true), // 100以内进位/借位加减法

  // ========== 乘除法 ==========
  "2-1": multiplicationOnly(1, 5), // 5以内乘法
  "2-2": multiplicationOnly(2, 7), // 7以内乘法
  "2-3": multiplicationOnly(2, 9), // 9以内乘法
  "2-4": divisionOnly(1, 5), // 5以内除法
  "2-5": divisionOnly(2, 7), // 7以内除法
  "2-6": divisionOnly(2, 9), // 9以内除法
  "2-7": mixMulDiv(1, 5), // 5以内乘除法
  "2-8": mixMulDiv(2, 7), // 7以内乘除法
  "2-9": mixMulDiv(2, 9), // 9以内乘除法

  // ========== 有余数除法 ==========
  "3-1": divRemainder(2, 5), // 10以内有余数除法
  "3-2": divRemainder(2, 6), // 20以内有余数除法
  "3-3": divRemainder(2, 8), // 50以内有余数除法
  "3-4": divRemainder(2, 9), // 100以内有余数除法

  // ========== 整十整百口算 ==========
  "4-1": additionOnly(10, 1000, true, 10), // 整十加法(100以内)
  "4-2": subtractionOnly(10, 1000, true, 10), // 整十减法(100以内)
  "4-3": mixAddSub(10, 1000, true, true, 10), // 整十加减混合
  "4-4": additionOnly(100, 10000, true, 100), // 整百加法(1000以内)
  "4-5": subtractionOnly(100, 10000, true, 100), // 整百减法(1000以内)
  "4-6": mixAddSub(100, 10000, true, true, 100), // 整百加减混合
};

/** 默认综合混合配置（用于未知 Level 的兜底） */
const DEFAULT_CONFIG = quickConfig({
  addition: {
    ratio: 0.1,
    range_min: 20,
    range_max: 100,
    carry: true,
    round_to: 0,
  },
  subtraction: {
    ratio: 0.1,
    range_min: 20,
    range_max: 100,
    borrow: true,
    round_to: 0,
  },
  multiplication: {
    ratio: 0.4,
    factor_min: 2,
    factor_max: 9,
  },
  division: {
    ratio: 0.4,
    factor_min: 2,
    factor_max: 9,
  },
});

/**
 * 根据 Level 编号获取预设配置
 * @param level Level 编号，如 "1-1"
 * @returns 对应配置，Level 不存在时返回默认综合混合配置
 */
export function getPresetConfig(level: string): Config {
  const config = LEVEL_PRESETS[level] ?? DEFAULT_CONFIG;
  // 自动修正布局：范围超过100时用4列 + 每页80题，避免数字过挤
  const maxNumber = Math.max(
    config.addition.range_max,
    config.subtraction.range_max,
  );
  return {
    ...config,
    columns: calcColumns(maxNumber),
    total_count: calcTotalCount(maxNumber),
  };
}
