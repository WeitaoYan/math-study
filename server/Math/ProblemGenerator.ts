/**
 * 题目批量生成器
 * 根据 Config 配置批量生成题目，支持多题型混合 + 洗牌
 */
import type { Config } from "./Config";
import type { GeneratedProblemEntry, ProblemMetadata } from "../../shared/types/mathProblem";
import {
  Addition,
  Subtraction,
  Multiplication,
  Division,
  DivisionWithRemainder,
  MultiStep,
} from "./ProblemTypes";

/** 题目条目：[题目文本(含 ___ 占位), 答案文本, 脱式计算步骤(可选)] */
type ProblemEntry = GeneratedProblemEntry;

function withMetadata(inst: { generate(): [string, string]; metadata?: ProblemMetadata }): ProblemEntry {
  const [text, answer] = inst.generate();
  return [text, answer, undefined, inst.metadata];
}

/** 题型生成器工厂项 */
interface ProblemFactory {
  count: number;
  ratio: number;
  generate(): ProblemEntry;
}

/**
 * 构建所有题型的生成器工厂列表
 * 只包含 ratio > 0 的题型，避免无意义的空循环
 */
function buildFactories(config: Config): ProblemFactory[] {
  const factories: ProblemFactory[] = [];
  const { compact, per_page_count } = config;
  const totalCount = per_page_count;

  // 统一设置填空模式：'random' 由 generateFormula 内部随机决定
  const fillMode = config.fill_mode;

  // 加法
  const addCount = Math.floor(totalCount * config.addition.ratio);
  if (config.addition.ratio > 0) {
    const { range_max: max, range_min: min, carry, round_to } = config.addition;
    const inst = new Addition(max, min, carry, round_to, compact);
    inst.fillMode = fillMode;
    factories.push({ count: addCount, ratio: config.addition.ratio, generate: () => withMetadata(inst) });
  }

  // 减法
  const subCount = Math.floor(totalCount * config.subtraction.ratio);
  if (config.subtraction.ratio > 0) {
    const { range_max: max, range_min: min, borrow, round_to } = config.subtraction;
    const inst = new Subtraction(max, min, borrow, round_to, compact);
    inst.fillMode = fillMode;
    factories.push({ count: subCount, ratio: config.subtraction.ratio, generate: () => withMetadata(inst) });
  }

  // 乘法
  const mulCount = Math.floor(totalCount * config.multiplication.ratio);
  if (config.multiplication.ratio > 0) {
    const { factor_min: min, factor_max: max } = config.multiplication;
    const inst = new Multiplication(min, max, compact);
    inst.fillMode = fillMode;
    factories.push({ count: mulCount, ratio: config.multiplication.ratio, generate: () => withMetadata(inst) });
  }

  // 除法
  const divCount = Math.floor(totalCount * config.division.ratio);
  if (config.division.ratio > 0) {
    const { factor_min: min, factor_max: max } = config.division;
    const inst = new Division(min, max, compact);
    inst.fillMode = fillMode;
    factories.push({ count: divCount, ratio: config.division.ratio, generate: () => withMetadata(inst) });
  }

  // 有余数除法
  const remCount = Math.floor(
    totalCount * config.division_with_remainder.ratio,
  );
  if (config.division_with_remainder.ratio > 0) {
    const { divisor_min: min, divisor_max: max } =
      config.division_with_remainder;
    const inst = new DivisionWithRemainder(min, max, compact);
    inst.fillMode = fillMode;
    factories.push({ count: remCount, ratio: config.division_with_remainder.ratio, generate: () => withMetadata(inst) });
  }

  // 脱式计算
  const msCount = Math.floor(totalCount * config.multi_step.ratio);
  if (config.multi_step.ratio > 0) {
    const {
      range_min: min,
      range_max: max,
      terms,
      use_mul_div,
      use_parentheses,
      factor_min,
      factor_max,
    } = config.multi_step;
    const inst = new MultiStep(
      terms,
      min,
      max,
      use_mul_div,
      compact,
      factor_min,
      factor_max,
      use_parentheses,
    );
    factories.push({ count: msCount, ratio: config.multi_step.ratio, generate: () => inst.generate() });
  }

  // 最大余数分配补齐取整缺口，数学取数/约束规则不变，小组也不会少题。
  if (Math.abs(factories.reduce((sum, factory) => sum + factory.ratio, 0) - 1) < 0.0001) {
    const missing = totalCount - factories.reduce((sum, factory) => sum + factory.count, 0);
    const priority = [...factories].sort((a, b) => (totalCount * b.ratio - Math.floor(totalCount * b.ratio)) - (totalCount * a.ratio - Math.floor(totalCount * a.ratio)));
    for (let index = 0; index < missing; index++) priority[index % priority.length]!.count++;
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
