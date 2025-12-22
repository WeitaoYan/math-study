/**
 * 验证器类
 */
export class Validation {
  /**
   * @returns {void}
   */
  constructor() {
    // pass
  }

  /**
   * @param {number} a - 第一个数字
   * @param {number} b - 第二个数字
   * @returns {boolean}
   */
  isValid(a: number, b: number) {
    throw new Error("NotImplementedError");
  }
}
/**
 * 进位验证器类
 */
export class CarryValidator extends Validation {
  /**
   * 按位验证是否进位，有进位就通过验证
   * @param {number} a - 第一个数字
   * @param {number} b - 第二个数字
   * @returns {boolean} 如果有进位则返回true，否则返回false
   */
  isValid(a: number, b: number) {
    while (a > 0 || b > 0) {
      if ((a % 10) + (b % 10) > 9) {
        return true;
      }
      a = Math.floor(a / 10);
      b = Math.floor(b / 10);
    }
    return false;
  }
}

/**
 * 非进位验证器类
 */
export class NoCarryValidator extends Validation {
  /**
   * 按位验证是否进位，有进位就不通过验证
   * @param {number} a - 第一个数字
   * @param {number} b - 第二个数字
   * @returns {boolean} 如果没有进位则返回true，否则返回false
   */
  isValid(a: number, b: number) {
    while (a > 0 || b > 0) {
      if ((a % 10) + (b % 10) > 9) {
        return false;
      }
      a = Math.floor(a / 10);
      b = Math.floor(b / 10);
    }
    return true;
  }
}

/**
 * 最大和验证器类
 */
export class MaxValidator extends Validation {
  maxSum: number;
  /**
   * @param {number} maxSum - 最大和
   */
  constructor(maxSum: number) {
    super();
    this.maxSum = maxSum;
  }

  /**
   * 验证两个数字的和是否不超过最大和
   * @param {number} a - 第一个数字
   * @param {number} b - 第二个数字
   * @returns {boolean} 如果和不超过最大和则返回true，否则返回false
   */
  isValid(a: number, b: number) {
    return a + b <= this.maxSum;
  }
}
