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
   * @returns {[string, number]} 公式字符串和答案
   */
  generateFormula(
    left: number,
    right: number,
    result: number
  ): [string, number] {
    const choices = ["left", "right", "result"];
    const choice = choices[Math.floor(Math.random() * choices.length)];

    let problem, answer;
    if (choice === "left") {
      problem = `___ ${this.symbol} ${right} = ${result}`;
      answer = left;
    } else if (choice === "right") {
      problem = `${left} ${this.symbol} ___ = ${result}`;
      answer = right;
    } else {
      problem = `${left} ${this.symbol} ${right} = ___`;
      answer = result;
    }
    return [problem, answer];
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

  /**
   * @param {number} maxSum - 最大和
   * @param {number} minSum - 最小和
   * @param {boolean} carry - 是否进位
   */
  constructor(maxSum = 100, minSum = 0, carry = false) {
    super();
    this.maxSum = maxSum;
    this.minSum = minSum;
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
  generate(): [string, number] {
    // 生成加法题逻辑
    while (true) {
      const a =
        Math.floor(Math.random() * (this.maxSum - this.minSum)) + this.minSum;
      const b = Math.floor(Math.random() * (this.maxSum - a)) + a;
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

  /**
   * @param {number} maxSum - 最大和
   * @param {number} minSum - 最小和
   * @param {boolean} borrow - 是否借位
   */
  constructor(maxSum = 100, minSum = 0, borrow = false) {
    super();
    this.maxSum = maxSum;
    this.minSum = minSum;
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
    // 生成减法题逻辑
    while (true) {
      const a =
        Math.floor(Math.random() * (this.maxSum - this.minSum)) + this.minSum;
      const b = Math.floor(Math.random() * (this.maxSum - a)) + a;
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
