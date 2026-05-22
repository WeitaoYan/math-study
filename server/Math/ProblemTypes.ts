// ProblemTypes.js
import {
  MaxValidator,
  NoCarryValidator,
  CarryValidator,
  Validation,
} from "./Validates.js";

/**
 * 数学题基类
 */
class BaseMathProblem {
  /** @type {string} */
  symbol = "";

  /**
   * 生成公式
   * @param {number} left - 左操作数
   * @param {number} right - 右操作数
   * @param {number} result - 结果
   * @param {string} [choice] - 可选，指定隐藏的位置：'left'、'right' 或 'result'，不指定则随机
   * @returns {[string, number]} 公式字符串和答案
   */
  generateFormula(
    left: number,
    right: number,
    result: number,
    choice?: string,
  ): [string, string] {
    const choices = ["left", "right", "result"];
    const selectedChoice =
      choice || choices[Math.floor(Math.random() * choices.length)];

    let problem, answer;
    if (selectedChoice === "left") {
      problem = `___${this.symbol}${right}=${result}`;
      answer = left;
    } else if (selectedChoice === "right") {
      problem = `${left}${this.symbol}___=${result}`;
      answer = right;
    } else {
      problem = `${left}${this.symbol}${right}=___`;
      answer = result;
    }
    return [problem, `${answer}`];
  }
}

/**
 * 加法题, 可以指定和的最大最小范围, 是否进位
 */
export class Addition extends BaseMathProblem {
  /** @type {string} */
  symbol = "+";
  maxSum: number;
  minSum: number;
  validators: Validation[];
  roundTo: number;

  /**
   * @param {number} maxSum - 最大和
   * @param {number} minSum - 最小和
   * @param {boolean} carry - 是否进位
   * @param {number} roundTo - 整十整百约束: 0=无, 10=整十, 100=整百
   */
  constructor(maxSum = 100, minSum = 0, carry = false, roundTo = 0) {
    super();
    this.maxSum = maxSum;
    this.minSum = minSum;
    this.roundTo = roundTo;
    this.validators = [new MaxValidator(maxSum)];
    if (carry) {
      this.validators.push(new CarryValidator());
    } else {
      this.validators.push(new NoCarryValidator());
    }
  }

  /**
   * 生成加法题
   * @returns {[string, number]} 公式字符串和答案
   */
  generate(): [string, string] {
    while (true) {
      let a: number, b: number;

      if (this.roundTo > 0) {
        // 整十/整百模式：在"步数空间"中生成，确保操作数都是 roundTo 的倍数
        const maxSteps = Math.floor(this.maxSum / this.roundTo);
        const minSteps = Math.floor(this.minSum / this.roundTo);
        const aSteps =
          Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
        a = aSteps * this.roundTo;
        const bSteps =
          Math.floor(Math.random() * (maxSteps - aSteps + 1)) + aSteps;
        b = bSteps * this.roundTo;
      } else {
        // 普通模式
        a =
          Math.floor(Math.random() * (this.maxSum - this.minSum)) +
          this.minSum;
        b = Math.floor(Math.random() * (this.maxSum - a)) + a;
      }

      const r = a + b;
      if (this.validators.every((v) => v.isValid(a, b))) {
        return this.generateFormula(a, b, r);
      }
    }
  }
}

/**
 * 减法题, 可以指定和的最大最小范围
 */
export class Subtraction extends BaseMathProblem {
  /** @type {string} */
  symbol = "-";
  maxSum: number;
  minSum: number;
  validators: Validation[];
  roundTo: number;

  /**
   * @param {number} maxSum - 最大和
   * @param {number} minSum - 最小和
   * @param {boolean} borrow - 是否借位
   * @param {number} roundTo - 整十整百约束: 0=无, 10=整十, 100=整百
   */
  constructor(maxSum = 100, minSum = 0, borrow = false, roundTo = 0) {
    super();
    this.maxSum = maxSum;
    this.minSum = minSum;
    this.roundTo = roundTo;
    this.validators = [new MaxValidator(maxSum)];
    if (borrow) {
      this.validators.push(new CarryValidator());
    } else {
      this.validators.push(new NoCarryValidator());
    }
  }

  /**
   * 生成减法题
   * @returns {[string, number]} 公式字符串和答案
   */
  generate() {
    while (true) {
      let a: number, b: number;

      if (this.roundTo > 0) {
        // 整十/整百模式：在"步数空间"中生成
        const maxSteps = Math.floor(this.maxSum / this.roundTo);
        const minSteps = Math.floor(this.minSum / this.roundTo);
        const aSteps =
          Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
        a = aSteps * this.roundTo;
        const bSteps =
          Math.floor(Math.random() * (maxSteps - aSteps + 1)) + aSteps;
        b = bSteps * this.roundTo;
      } else {
        // 普通模式
        a =
          Math.floor(Math.random() * (this.maxSum - this.minSum)) +
          this.minSum;
        b = Math.floor(Math.random() * (this.maxSum - a)) + a;
      }

      const r = a + b;
      if (this.validators.every((v) => v.isValid(a, b))) {
        return this.generateFormula(r, a, b);
      }
    }
  }
}

/**
 * 乘法题
 */
export class Multiplication extends BaseMathProblem {
  /** @type {string} */
  symbol = "×";
  minFactor: number;
  maxFactor: number;

  /**
   * @param {number} minFactor - 最小因子
   * @param {number} maxFactor - 最大因子
   */
  constructor(minFactor = 2, maxFactor = 9) {
    super();
    this.minFactor = minFactor;
    this.maxFactor = maxFactor;
  }

  /**
   * 生成乘法题
   * @returns {[string, number]} 公式字符串和答案
   */
  generate() {
    // 乘法题逻辑
    const a =
      Math.floor(Math.random() * (this.maxFactor - this.minFactor + 1)) +
      this.minFactor;
    const b =
      Math.floor(Math.random() * (this.maxFactor - this.minFactor + 1)) +
      this.minFactor;
    const r = a * b;
    return this.generateFormula(a, b, r);
  }
}

/**
 * 除法题
 */
export class Division extends BaseMathProblem {
  /** @type {string} */
  symbol = "÷";
  minFactor: number;
  maxFactor: number;
  /**
   * @param {number} minFactor - 最小因子
   * @param {number} maxFactor - 最大因子
   */
  constructor(minFactor = 2, maxFactor = 9) {
    super();
    this.minFactor = minFactor;
    this.maxFactor = maxFactor;
  }

  /**
   * 生成除法题
   * @returns {[string, number]} 公式字符串和答案
   */
  generate() {
    // 除法题逻辑
    const b =
      Math.floor(Math.random() * (this.maxFactor - this.minFactor + 1)) +
      this.minFactor;
    const r =
      Math.floor(Math.random() * (this.maxFactor - this.minFactor + 1)) +
      this.minFactor;
    const a = b * r;
    return this.generateFormula(a, b, r);
  }
}
/**
 * 有余数的除法题
 * 格式：被除数 ÷ 除数 = 商 ... 余数
 * 学生需要填写商和余数
 */
export class DivisionWithRemainder extends BaseMathProblem {
  /** @type {string} */
  symbol = "÷";
  minFactor: number;
  maxFactor: number;

  /**
   * @param {number} minFactor - 最小因子
   * @param {number} maxFactor - 最大因子
   */
  constructor(minFactor = 2, maxFactor = 9) {
    super();
    this.minFactor = minFactor;
    this.maxFactor = maxFactor;
  }
  /**
   * 生成有余数的除法题
   * @returns {[string, string]} 公式字符串和答案（答案编码为：商*100+余数）
   */
  generate(): [string, string] {
    while (true) {
      // 生成除数
      const divisor =
        Math.floor(Math.random() * (this.maxFactor - this.minFactor + 1)) +
        this.minFactor;

      // 生成商
      const quotient =
        Math.floor(Math.random() * (this.maxFactor - this.minFactor + 1)) +
        this.minFactor;

      // 计算被除数（先生成整除算式）
      let dividend = quotient * divisor;

      // 生成余数（必须小于除数，且大于0）
      const maxRemainder = divisor - 1;
      if (maxRemainder < 1) {
        continue;
      }

      const remainder = Math.floor(Math.random() * maxRemainder) + 1;

      // 将余数加到被除数上
      dividend = dividend + remainder;

      // 格式：被除数 ÷ 除数 = ___ ... ___
      const problem = `${dividend}${this.symbol}${divisor}=___`;
      return [problem, `${quotient}......${remainder}`];
    }
  }
}
