/**
 * PDF 布局计算纯函数
 */

/**
 * 将一维题目数组重塑为表格行（每行 columns 列）
 */
export function reshapeToTable(
  problems: string[],
  columns: number,
): string[][] {
  const result: string[][] = [];
  for (let i = 0; i < problems.length; i += columns) {
    const row: string[] = [];
    for (let j = 0; j < columns; j++) {
      const idx = i + j;
      row.push(idx < problems.length ? (problems[idx] as string) : "");
    }
    result.push(row);
  }
  return result;
}

/**
 * 生成表格表头行（日期栏）
 */
export function createDateHeaders(columns: number): string[] {
  return Array(columns).fill("日期");
}

/**
 * 生成表格表尾行（成绩栏）
 */
export function createScoreFooters(columns: number): string[] {
  return Array(columns).fill("成绩");
}
