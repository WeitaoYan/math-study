/**
 * 题目批量生成器
 * 根据 Config 配置批量生成题目，支持多题型混合 + 洗牌
 */
import type { Config } from "./Config";
import {
  Addition,
  Subtraction,
  Multiplication,
  Division,
  DivisionWithRemainder,
} from "./ProblemTypes";

type ProblemEntry = [string, string];

/** 题型生成器工厂项 */
interface ProblemFactory {
  count: number;
  generate(): ProblemEntry;
}

/**
 * 构建所有题型的生成器工厂列表
 * 只包含 ratio > 0 的题型，避免无意义的空循环
 */
function buildFactories(config: Config): ProblemFactory[] {
  const factories: ProblemFactory[] = [];
  const { compact, columns, per_page_count } = config;
  const totalCount = per_page_count;

  // 统一设置填空模式：'random' 由 generateFormula 内部随机决定
  const fillMode = config.fill_mode;

  // 加法
  const addCount = Math.floor(totalCount * config.addition.ratio);
  if (addCount > 0) {
    const { range_max: max, range_min: min, carry, round_to } = config.addition;
    const inst = new Addition(max, min, carry, round_to, compact);
    inst.fillMode = fillMode;
    factories.push({ count: addCount, generate: () => inst.generate() });
  }

  // 减法
  const subCount = Math.floor(totalCount * config.subtraction.ratio);
  if (subCount > 0) {
    const { range_max: max, range_min: min, borrow, round_to } = config.subtraction;
    const inst = new Subtraction(max, min, borrow, round_to, compact);
    inst.fillMode = fillMode;
    factories.push({ count: subCount, generate: () => inst.generate() });
  }

  // 乘法
  const mulCount = Math.floor(totalCount * config.multiplication.ratio);
  if (mulCount > 0) {
    const { factor_min: min, factor_max: max } = config.multiplication;
    const inst = new Multiplication(min, max, compact);
    inst.fillMode = fillMode;
    factories.push({ count: mulCount, generate: () => inst.generate() });
  }

  // 除法
  const divCount = Math.floor(totalCount * config.division.ratio);
  if (divCount > 0) {
    const { factor_min: min, factor_max: max } = config.division;
    const inst = new Division(min, max, compact);
    inst.fillMode = fillMode;
    factories.push({ count: divCount, generate: () => inst.generate() });
  }

  // 有余数除法
  const remCount = Math.floor(
    totalCount * config.division_with_remainder.ratio,
  );
  if (remCount > 0) {
    const { divisor_min: min, divisor_max: max } =
      config.division_with_remainder;
    const inst = new DivisionWithRemainder(min, max, compact);
    inst.fillMode = fillMode;
    factories.push({ count: remCount, generate: () => inst.generate() });
  }

  return factories;
}

/**
 * 批量生成所有题目并洗牌
 * @param config 题目配置
 * @returns [题目字符串, 答案字符串][] 数组
 */
export function generateProblems(config: Config): ProblemEntry[] {
  const factories = buildFactories(config);
  const problems: ProblemEntry[] = [];

  for (const factory of factories) {
    for (let i = 0; i < factory.count; i++) {
      problems.push(factory.generate());
    }
  }

  // 随机洗牌，确保不同题型混合均匀
  problems.sort(() => Math.random() - 0.5);
  return problems;
}
