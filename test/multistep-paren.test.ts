import { describe, it, expect } from "vitest";
import { MultiStep } from "../server/Math/ProblemTypes";

/** 从题目中提取所有「括号 op ×」的内层计算值 */
function parenValuesForMul(q: string): number[] {
  const out: number[] = [];
  // ( a + b ) ×  与  ( a - b ) ×
  for (const m of q.matchAll(/\(\s*(\d+)\s*([+-])\s*(\d+)\s*\)\s*×/g)) {
    const a = parseInt(m[1]!, 10);
    const b = parseInt(m[3]!, 10);
    out.push(m[2] === "+" ? a + b : a - b);
  }
  // × ( a + b )  与  × ( a - b )
  for (const m of q.matchAll(/×\s*\(\s*(\d+)\s*([+-])\s*(\d+)\s*\)/g)) {
    const a = parseInt(m[1]!, 10);
    const b = parseInt(m[3]!, 10);
    out.push(m[2] === "+" ? a + b : a - b);
  }
  return out;
}

/** 校验除法步骤整除 */
function checkDivSteps(steps: string[]) {
  for (const s of steps.slice(0, -1)) {
    const m = s.match(/(\d+)\s*÷\s*(\d+)/);
    if (m) {
      const a = parseInt(m[1]!, 10);
      const b = parseInt(m[2]!, 10);
      expect(a % b).toBe(0);
    }
  }
}

describe("MultiStep 带括号生成", () => {
  it("3 个数带括号", () => {
    const ms = new MultiStep(3, 10, 100, true, false, 2, 9, true);
    for (let i = 0; i < 500; i++) {
      const [q, ans, steps] = ms.generate();
      expect(q).toContain("(");
      expect(q).toContain(")");
      // 答案应在范围内
      const a = parseInt(ans, 10);
      expect(a).toBeGreaterThanOrEqual(10);
      expect(a).toBeLessThanOrEqual(100);
      // 步骤最后一步 == 答案
      expect(parseInt(steps[steps.length - 1]!, 10)).toBe(a);
      // 步骤行数：括号表达式先是括号内计算，再乘除，共 2 行（中间式 + 答案）
      expect(steps.length).toBe(2);
      // 括号外为 × 时，括号内计算结果须为表内数（因数范围 2~9）
      for (const v of parenValuesForMul(q)) {
        expect(v).toBeGreaterThanOrEqual(2);
        expect(v).toBeLessThanOrEqual(9);
      }
      checkDivSteps(steps);
    }
  });

  it("4 个数带括号", () => {
    const ms = new MultiStep(4, 10, 100, true, false, 2, 9, true);
    for (let i = 0; i < 500; i++) {
      const [q, ans, steps] = ms.generate();
      expect(q).toContain("(");
      expect(q).toContain(")");
      const a = parseInt(ans, 10);
      expect(a).toBeGreaterThanOrEqual(10);
      expect(a).toBeLessThanOrEqual(100);
      expect(parseInt(steps[steps.length - 1]!, 10)).toBe(a);
      expect(steps.length).toBe(3);
      // 括号外为 × 时，括号内计算结果须为表内数（因数范围 2~9）
      for (const v of parenValuesForMul(q)) {
        expect(v).toBeGreaterThanOrEqual(2);
        expect(v).toBeLessThanOrEqual(9);
      }
      checkDivSteps(steps);
    }
  });

  it("不带括号模式仍然正常", () => {
    const ms = new MultiStep(4, 10, 100, true, false, 2, 9, false);
    for (let i = 0; i < 500; i++) {
      const [q, ans, steps] = ms.generate();
      const a = parseInt(ans, 10);
      expect(a).toBeGreaterThanOrEqual(10);
      expect(a).toBeLessThanOrEqual(100);
      expect(parseInt(steps[steps.length - 1]!, 10)).toBe(a);
    }
  });

  it("仅加减 + 括号时退化为普通模式", () => {
    const ms = new MultiStep(3, 10, 100, false, false, 2, 9, true);
    for (let i = 0; i < 100; i++) {
      const [q] = ms.generate();
      // 无乘除时 useParentheses 被禁用 => 无括号
      expect(q).not.toContain("(");
      expect(q).not.toContain("×");
      expect(q).not.toContain("÷");
    }
  });
});