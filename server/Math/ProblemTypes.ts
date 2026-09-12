// ProblemTypes.js
import {
  NoCarryValidator,
  CarryValidator,
} from "./Validates.js";

/**
 * 数学题基类
 */
class BaseMathProblem {
  /** @type {string} */
  symbol = "";

  /** 是否在符号两边添加空格，默认开启 */
  spacing = true;

  /** 填空模式：'left' | 'right' | 'result' | 'none'，未设置则随机隐藏 */
  fillMode?: string;

  /**
   * 格式化题目各部分，根据 spacing 开关决定是否加空格
   * @param parts 各部分字符串，依次为：左操作数、运算符、右操作数、=、结果
   */
  fmt(parts: string[]): string {
    const s = this.spacing ? " " : "";
    return parts.join(s);
  }

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
    const raw = choice || this.fillMode;
    const selectedChoice =
      raw === "left" || raw === "right" || raw === "result" || raw === "none"
        ? raw
        : choices[Math.floor(Math.random() * choices.length)];

    // 不填空：输出完整算式（无 ___ 占位）
    if (selectedChoice === "none") {
      return [
        this.fmt([`${left}`, this.symbol, `${right}`, "=", `${result}`]),
        `${result}`,
      ];
    }

    let problem, answer;
    if (selectedChoice === "left") {
      problem = this.fmt(["___", this.symbol, `${right}`, "=", `${result}`]);
      answer = left;
    } else if (selectedChoice === "right") {
      problem = this.fmt([`${left}`, this.symbol, "___", "=", `${result}`]);
      answer = right;
    } else {
      problem = this.fmt([`${left}`, this.symbol, `${right}`, "=", "___"]);
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
  roundTo: number;
  carry: boolean;

  /**
   * @param {number} maxSum - 最大和
   * @param {number} minSum - 最小和
   * @param {boolean} carry - 是否进位
   * @param {number} roundTo - 整十整百约束: 0=无, 10=整十, 100=整百
   */
  constructor(maxSum = 100, minSum = 0, carry = false, roundTo = 0, compact = false) {
    super();
    this.spacing = !compact;
    this.maxSum = maxSum;
    this.minSum = minSum;
    this.roundTo = roundTo;
    this.carry = carry;
  }

  /**
   * 生成加法题
   * 带有限重试 + 逐级回退，保证任何配置都能终止：
   * 1. 原配置（整十来/进位）
   * 2. 放弃整十来，保留进位
   * 3. 保留整十来，放弃进位
   * 4. 全部放弃
   * @returns {[string, string]} 公式字符串和答案
   */
  generate(): [string, string] {
    const combos: [number, boolean][] = [
      [this.roundTo, this.carry],
      [0, this.carry],
      [this.roundTo, false],
      [0, false],
    ];
    for (const [roundTo, carry] of combos) {
      const pick = this.tryPick(roundTo, carry);
      if (pick) return this.generateFormula(pick[0], pick[1], pick[2]);
    }
    throw new Error(
      "配置无法生成加法题：数值范围过小或与进位/整十来约束冲突，请增大 range_max 或关闭进位",
    );
  }

  /** 在给定约束下滑动随机抽取一组满足条件的操作数，带尝试上限 */
  private tryPick(
    roundTo: number,
    carry: boolean,
  ): [number, number, number] | null {
    const { maxSum, minSum } = this;
    for (let i = 0; i < 5000; i++) {
      let a: number, b: number;
      if (roundTo > 0) {
        const maxSteps = Math.floor(maxSum / roundTo);
        const minSteps = Math.floor(minSum / roundTo);
        const aSteps =
          Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
        a = aSteps * roundTo;
        const bSteps =
          Math.floor(Math.random() * (maxSteps - aSteps + 1)) + aSteps;
        b = bSteps * roundTo;
      } else {
        a =
          Math.floor(Math.random() * (maxSum - minSum)) + minSum;
        b = Math.floor(Math.random() * (maxSum - a)) + a;
      }

      const r = a + b;
      if (r > maxSum) continue;
      const carryOk = carry
        ? new CarryValidator().isValid(a, b)
        : new NoCarryValidator().isValid(a, b);
      if (carryOk) return [a, b, r];
    }
    return null;
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
  roundTo: number;
  borrow: boolean;

  /**
   * @param {number} maxSum - 最大和
   * @param {number} minSum - 最小和
   * @param {boolean} borrow - 是否借位
   * @param {number} roundTo - 整十整百约束: 0=无, 10=整十, 100=整百
   */
  constructor(maxSum = 100, minSum = 0, borrow = false, roundTo = 0, compact = false) {
    super();
    this.spacing = !compact;
    this.maxSum = maxSum;
    this.minSum = minSum;
    this.roundTo = roundTo;
    this.borrow = borrow;
  }

  /**
   * 生成减法题
   * 带有限重试 + 逐级回退，保证任何配置都能终止：
   * 1. 原配置（整十来/借位）
   * 2. 放弃整十来，保留借位
   * 3. 保留整十来，放弃借位
   * 4. 全部放弃
   * @returns {[string, string]} 公式字符串和答案
   */
  generate() {
    const combos: [number, boolean][] = [
      [this.roundTo, this.borrow],
      [0, this.borrow],
      [this.roundTo, false],
      [0, false],
    ];
    for (const [roundTo, borrow] of combos) {
      const pick = this.tryPick(roundTo, borrow);
      if (pick) return this.generateFormula(pick[0], pick[1], pick[2]);
    }
    throw new Error(
      "配置无法生成减法题：数值范围过小或与借位/整十来约束冲突，请增大 range_max 或关闭借位",
    );
  }

  /** 在给定约束下滑动随机抽取一组满足条件的操作数，带尝试上限 */
  private tryPick(
    roundTo: number,
    borrow: boolean,
  ): [number, number, number] | null {
    const { maxSum, minSum } = this;
    for (let i = 0; i < 5000; i++) {
      let a: number, b: number;
      if (roundTo > 0) {
        const maxSteps = Math.floor(maxSum / roundTo);
        const minSteps = Math.floor(minSum / roundTo);
        const aSteps =
          Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
        a = aSteps * roundTo;
        const bSteps =
          Math.floor(Math.random() * (maxSteps - aSteps + 1)) + aSteps;
        b = bSteps * roundTo;
      } else {
        a =
          Math.floor(Math.random() * (maxSum - minSum)) + minSum;
        b = Math.floor(Math.random() * (maxSum - a)) + a;
      }

      const r = a + b;
      if (r > maxSum) continue;
      const borrowOk = borrow
        ? new CarryValidator().isValid(a, b)
        : new NoCarryValidator().isValid(a, b);
      if (borrowOk) return [a, b, r];
    }
    return null;
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
  constructor(minFactor = 2, maxFactor = 9, compact = false) {
    super();
    this.spacing = !compact;
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
  constructor(minFactor = 2, maxFactor = 9, compact = false) {
    super();
    this.spacing = !compact;
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
  constructor(minFactor = 2, maxFactor = 9, compact = false) {
    super();
    this.spacing = !compact;
    this.minFactor = minFactor;
    this.maxFactor = maxFactor;
  }
  /**
   * 生成有余数的除法题
   * @returns {[string, string]} 公式字符串和答案
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

      // 格式：被除数 ÷ 除数 = ___ ... ___（none 模式输出完整算式）
      const problem =
        this.fillMode === "none"
          ? this.fmt([
              `${dividend}`,
              this.symbol,
              `${divisor}`,
              "=",
              `${quotient}`,
              "······",
              `${remainder}`,
            ])
          : this.fmt([
              `${dividend}`,
              this.symbol,
              `${divisor}`,
              "=",
              "___",
            ]);
      return [problem, `${quotient}······${remainder}`];
    }
  }
}
