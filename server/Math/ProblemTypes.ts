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
 * 脱式计算（多步混合运算）题
 * 生成形如「a ○ b ○ c = ___」的连算表达式。开启乘除混合时运算符从 +、-、×、÷ 中选取，
 * 并按「先乘除、后加减」的优先级逐步化简生成步骤。
 * 返回 [题目, 答案, 各步骤算式]：步骤为化简过程中的逐行剩余算式，用于答案页展示。
 */
export class MultiStep extends BaseMathProblem {
  /** @type {string} */
  symbol = "";
  terms: number;
  min: number;
  max: number;
  useMulDiv: boolean;
  useParentheses: boolean;
  factorMin: number;
  factorMax: number;

  /**
   * @param {number} terms - 参与运算的数字个数（3 = 两步，4 = 三步）
   * @param {number} min - 加减操作数与最终结果的最小值
   * @param {number} max - 加减操作数与最终结果的最大值
   * @param {boolean} useMulDiv - 是否混入乘除运算
   * @param {boolean} compact - 紧凑模式（关闭符号空格）
   * @param {number} factorMin - 乘除因数最小值（默认 2）
   * @param {number} factorMax - 乘除因数最大值（默认 9，表内范围）
   * @param {boolean} useParentheses - 是否使用括号（需要同时开启乘除）
   */
  constructor(
    terms = 3,
    min = 10,
    max = 100,
    useMulDiv = false,
    compact = false,
    factorMin = 2,
    factorMax = 9,
    useParentheses = false,
  ) {
    super();
    this.terms = Math.max(2, Math.min(4, Math.round(terms)));
    this.spacing = !compact;
    this.min = min;
    this.max = max;
    this.useMulDiv = useMulDiv;
    this.useParentheses = useParentheses && useMulDiv;
    this.factorMin = Math.max(2, factorMin);
    this.factorMax = Math.max(this.factorMin, factorMax);
  }

  /** 生成一道脱式计算题 */
  generate(): [string, string, string[]] {
    for (let attempt = 0; attempt < 10000; attempt++) {
      const built = this.useParentheses
        ? this.tryBuildWithParentheses()
        : this.tryBuild();
      if (built) return built;
    }
    throw new Error(
      "配置无法生成脱式计算题：数值范围过小，请增大最大值或减小参与数字个数",
    );
  }

  /** 在范围内随机抽取一个整数（含边界） */
  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** 在因子范围内随机抽取一个小因子 */
  private randFactor(): number {
    return this.rand(this.factorMin, this.factorMax);
  }

  /** 随机抽取一个表内积：两个因子都在表内 */
  private randTableProduct(): number {
    return this.randFactor() * this.randFactor();
  }

  /** 求 v 的所有「表内除」除数：d 在因子范围内，且商 v/d 也在因子范围内 */
  private tableDivisors(v: number): number[] {
    const out: number[] = [];
    for (let d = this.factorMin; d <= this.factorMax; d++) {
      if (v % d === 0 && v / d >= this.factorMin && v / d <= this.factorMax) {
        out.push(d);
      }
    }
    return out;
  }

  /** 检查值是否落在乘除因子范围内（表内数） */
  private inFactorRange(v: number): boolean {
    return v >= this.factorMin && v <= this.factorMax;
  }

  // ================================================================
  //  不带括号的表达式生成
  // ================================================================

  /** 尝试构造一道不带括号的题，任何一步不满足约束则返回 null */
  private tryBuild(): [string, string, string[]] | null {
    const n = this.terms;
    const nums: number[] = [];
    const ops: string[] = [];

    // 1. 先决定运算符（混入乘除时保证至少包含一次 × 或 ÷）
    const pool = this.useMulDiv ? ["+", "-", "×", "÷"] : ["+", "-"];
    for (let i = 0; i < n - 1; i++) {
      ops.push(pool[this.rand(0, pool.length - 1)]!);
    }
    if (
      this.useMulDiv &&
      !ops.some((o) => o === "×" || o === "÷")
    ) {
      ops[this.rand(0, n - 2)] = Math.random() < 0.5 ? "×" : "÷";
    }

    // 2. 再生成操作数：乘除运算的每一步都必须是表内乘除法，
    //    因此凡参与 ×/÷ 的操作数都按因子范围取值，避免出现「64 × 2」「100 ÷ 5」、
    //    「92 ÷ 2」这类越出乘法口诀表的中间运算；加减号操作数用全区间。
    const isMul = (o: string) => o === "×";
    const isDiv = (o: string) => o === "÷";

    // 首位：若从乘/除开始，直接落在表内
    if (isMul(ops[0]!)) {
      nums.push(this.randFactor());
    } else if (isDiv(ops[0]!)) {
      nums.push(this.randTableProduct());
    } else {
      nums.push(this.rand(this.min, this.max));
    }

    for (let i = 1; i < n; i++) {
      const op = ops[i - 1]!;
      const next = i < n - 1 ? ops[i] : undefined;
      if (op === "×") {
        nums.push(this.randFactor());
      } else if (op === "÷") {
        const divisors = this.tableDivisors(nums[i - 1]!);
        if (divisors.length === 0) return null;
        nums.push(divisors[this.rand(0, divisors.length - 1)]!);
      } else {
        // 加减号操作数：若它同时是右侧 ×/÷ 的左操作数，按表内规则取值
        if (next === "×") {
          nums.push(this.randFactor());
        } else if (next === "÷") {
          nums.push(this.randTableProduct());
        } else {
          nums.push(this.rand(this.min, this.max));
        }
      }
    }

    // 3. 按「先乘除、后加减」逐次化简，记录每一步的剩余算式
    const nArr = [...nums];
    const oArr = [...ops];
    const steps: string[] = [];
    const finalCap = Math.max(this.max * 1.5, this.min);
    while (oArr.length > 0) {
      let idx = oArr.findIndex((o) => o === "×" || o === "÷");
      if (idx < 0) idx = 0;
      const a = nArr[idx]!;
      const b = nArr[idx + 1]!;
      const op = oArr[idx]!;
      const r = this.applyOp(a, op, b);

      // 表内校验：凡是 ×/÷ 的中间步骤，操作数必须全部落在因子范围内。
      // 优先采用「先乘除」保守校验——即乘法因子与除法除数、商都须是表内数，
      // 保证脱式计算过程中每一步乘除法都是九九乘法表以内的运算。
      if (op === "×") {
        if (
          a < this.factorMin ||
          a > this.factorMax ||
          b < this.factorMin ||
          b > this.factorMax
        ) {
          return null;
        }
      } else if (op === "÷") {
        if (
          b < this.factorMin ||
          b > this.factorMax ||
          r < this.factorMin ||
          r > this.factorMax
        ) {
          return null;
        }
      }

      if (!Number.isInteger(r) || r < 1 || r > finalCap) return null;
      nArr[idx] = r;
      nArr.splice(idx + 1, 1);
      oArr.splice(idx, 1);
      const line: string[] = [];
      for (let i = 0; i < nArr.length; i++) {
        line.push(`${nArr[i]}`);
        if (i < oArr.length) line.push(oArr[i]!);
      }
      steps.push(line.join(" "));
    }
    const final = nArr[0]!;
    if (final < this.min || final > this.max) return null;

    // 原表达式（第 1 行）
    const parts: string[] = [];
    for (let i = 0; i < nums.length; i++) {
      parts.push(`${nums[i]}`);
      if (i < ops.length) parts.push(ops[i]!);
    }
    return [`${parts.join(" ")} = ___`, `${final}`, steps];
  }

  // ================================================================
  //  带括号的表达式生成
  // ================================================================

  /**
   * 带括号表达式的模板（不受数值范围约束，所有取值由因数范围派生）
   * - kinds[i] 决定第 i 个操作数的取值来源：
   *   'factor' => [factorMin, factorMax]（乘除因子）
   *   'small'  => [1, factorMax]（括号内加法的小加数，保证和落在表内）
   *   'wide'   => [1, factorMax²]（表内积量级的大数，用于减法被减数/减数、除法和差、尾部加减数）
   * - build(nums) 返回 { expr, steps } 或 null（数值不满足约束时）
   * - 约束：括号外为 × 时，括号内计算结果须为表内数；
   *   括号外为 ÷ 时，除数与商须为表内数；其余结果仅要求为正数；
   *   保证每一步乘除都是九九乘法表以内的运算
   */
  private parenTemplates: {
    kinds: ("factor" | "wide" | "small")[];
    build: (nums: number[]) => { expr: string; steps: string[] } | null;
  }[] = [
    // ============ 3 个数 ============
    // (a + b) × c
    { kinds: ["small", "small", "factor"], build: (n) => {
      const inner = n[0]! + n[1]!;
      if (!this.inFactorRange(inner)) return null;
      const result = inner * n[2]!;
      return { expr: `( ${n[0]} + ${n[1]} ) × ${n[2]}`, steps: [`${inner} × ${n[2]}`, `${result}`] };
    }},
    // (a - b) × c
    { kinds: ["wide", "wide", "factor"], build: (n) => {
      const inner = n[0]! - n[1]!;
      if (!this.inFactorRange(inner)) return null;
      const result = inner * n[2]!;
      return { expr: `( ${n[0]} - ${n[1]} ) × ${n[2]}`, steps: [`${inner} × ${n[2]}`, `${result}`] };
    }},
    // a × (b + c)
    { kinds: ["factor", "small", "small"], build: (n) => {
      const inner = n[1]! + n[2]!;
      if (!this.inFactorRange(inner)) return null;
      const result = n[0]! * inner;
      return { expr: `${n[0]} × ( ${n[1]} + ${n[2]} )`, steps: [`${n[0]} × ${inner}`, `${result}`] };
    }},
    // a × (b - c)
    { kinds: ["factor", "wide", "wide"], build: (n) => {
      const inner = n[1]! - n[2]!;
      if (!this.inFactorRange(inner)) return null;
      const result = n[0]! * inner;
      return { expr: `${n[0]} × ( ${n[1]} - ${n[2]} )`, steps: [`${n[0]} × ${inner}`, `${result}`] };
    }},
    // (a + b) ÷ c：除数与商须为表内数（口诀表内除法）。
    // 注意：商即最终答案，故数值最小值须 ≤ 因数最大值，否则此模板无解（自动跳过）
    { kinds: ["wide", "wide", "factor"], build: (n) => {
      const inner = n[0]! + n[1]!;
      if (inner % n[2]! !== 0) return null;
      const result = inner / n[2]!;
      if (!this.inFactorRange(result)) return null;
      return { expr: `( ${n[0]} + ${n[1]} ) ÷ ${n[2]}`, steps: [`${inner} ÷ ${n[2]}`, `${result}`] };
    }},
    // (a - b) ÷ c：除数与商须为表内数（口诀表内除法）
    { kinds: ["wide", "wide", "factor"], build: (n) => {
      const inner = n[0]! - n[1]!;
      if (inner < 1) return null;
      if (inner % n[2]! !== 0) return null;
      const result = inner / n[2]!;
      if (!this.inFactorRange(result)) return null;
      return { expr: `( ${n[0]} - ${n[1]} ) ÷ ${n[2]}`, steps: [`${inner} ÷ ${n[2]}`, `${result}`] };
    }},
    // ============ 4 个数 ============
    // a × (b + c) + d
    { kinds: ["factor", "small", "small", "wide"], build: (n) => {
      const inner = n[1]! + n[2]!;
      if (!this.inFactorRange(inner)) return null;
      const mid = n[0]! * inner;
      if (mid < 1) return null;
      const result = mid + n[3]!;
      return { expr: `${n[0]} × ( ${n[1]} + ${n[2]} ) + ${n[3]}`, steps: [`${n[0]} × ${inner}`, `${mid} + ${n[3]}`, `${result}`] };
    }},
    // a × (b + c) - d
    { kinds: ["factor", "small", "small", "wide"], build: (n) => {
      const inner = n[1]! + n[2]!;
      if (!this.inFactorRange(inner)) return null;
      const mid = n[0]! * inner;
      if (mid < 1) return null;
      const result = mid - n[3]!;
      if (result < 1) return null;
      return { expr: `${n[0]} × ( ${n[1]} + ${n[2]} ) - ${n[3]}`, steps: [`${n[0]} × ${inner}`, `${mid} - ${n[3]}`, `${result}`] };
    }},
    // a × (b - c) + d
    { kinds: ["factor", "wide", "wide", "wide"], build: (n) => {
      const inner = n[1]! - n[2]!;
      if (!this.inFactorRange(inner)) return null;
      const mid = n[0]! * inner;
      if (mid < 1) return null;
      const result = mid + n[3]!;
      return { expr: `${n[0]} × ( ${n[1]} - ${n[2]} ) + ${n[3]}`, steps: [`${n[0]} × ${inner}`, `${mid} + ${n[3]}`, `${result}`] };
    }},
    // a × (b - c) - d
    { kinds: ["factor", "wide", "wide", "wide"], build: (n) => {
      const inner = n[1]! - n[2]!;
      if (!this.inFactorRange(inner)) return null;
      const mid = n[0]! * inner;
      if (mid < 1) return null;
      const result = mid - n[3]!;
      if (result < 1) return null;
      return { expr: `${n[0]} × ( ${n[1]} - ${n[2]} ) - ${n[3]}`, steps: [`${n[0]} × ${inner}`, `${mid} - ${n[3]}`, `${result}`] };
    }},
    // (a + b) × c + d
    { kinds: ["small", "small", "factor", "wide"], build: (n) => {
      const inner = n[0]! + n[1]!;
      if (!this.inFactorRange(inner)) return null;
      const mid = inner * n[2]!;
      if (mid < 1) return null;
      const result = mid + n[3]!;
      return { expr: `( ${n[0]} + ${n[1]} ) × ${n[2]} + ${n[3]}`, steps: [`${inner} × ${n[2]}`, `${mid} + ${n[3]}`, `${result}`] };
    }},
    // (a + b) × c - d
    { kinds: ["small", "small", "factor", "wide"], build: (n) => {
      const inner = n[0]! + n[1]!;
      if (!this.inFactorRange(inner)) return null;
      const mid = inner * n[2]!;
      if (mid < 1) return null;
      const result = mid - n[3]!;
      if (result < 1) return null;
      return { expr: `( ${n[0]} + ${n[1]} ) × ${n[2]} - ${n[3]}`, steps: [`${inner} × ${n[2]}`, `${mid} - ${n[3]}`, `${result}`] };
    }},
    // (a - b) × c + d
    { kinds: ["wide", "wide", "factor", "wide"], build: (n) => {
      const inner = n[0]! - n[1]!;
      if (!this.inFactorRange(inner)) return null;
      const mid = inner * n[2]!;
      if (mid < 1) return null;
      const result = mid + n[3]!;
      return { expr: `( ${n[0]} - ${n[1]} ) × ${n[2]} + ${n[3]}`, steps: [`${inner} × ${n[2]}`, `${mid} + ${n[3]}`, `${result}`] };
    }},
    // (a - b) × c - d
    { kinds: ["wide", "wide", "factor", "wide"], build: (n) => {
      const inner = n[0]! - n[1]!;
      if (!this.inFactorRange(inner)) return null;
      const mid = inner * n[2]!;
      if (mid < 1) return null;
      const result = mid - n[3]!;
      if (result < 1) return null;
      return { expr: `( ${n[0]} - ${n[1]} ) × ${n[2]} - ${n[3]}`, steps: [`${inner} × ${n[2]}`, `${mid} - ${n[3]}`, `${result}`] };
    }},
  ];

  /** 尝试构造一道带括号的题 */
  private tryBuildWithParentheses(): [string, string, string[]] | null {
    // 依据个数过滤可用模板，并随机打乱
    const templates = this.parenTemplates.filter(
      (t) => t.kinds.length === this.terms,
    );
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    const nums: number[] = [];
    let result: { expr: string; steps: string[] } | null = null;

    for (const tpl of shuffled) {
      for (let attempt = 0; attempt < 200; attempt++) {
        nums.length = 0;
        for (const kind of tpl.kinds) {
          nums.push(
            kind === "factor"
              ? this.randFactor()
              : kind === "small"
                ? this.rand(1, this.factorMax)
                : this.rand(1, this.factorMax * this.factorMax),
          );
        }
        result = tpl.build(nums);
        if (result) break;
      }
      if (result) break;
    }

    if (!result) return null;
    const final = result.steps[result.steps.length - 1]!;
    return [`${result.expr} = ___`, `${final}`, result.steps];
  }

  /** 计算单步结果 */
  private applyOp(a: number, op: string, b: number): number {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return a / b;
      default:
        return a + b;
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
