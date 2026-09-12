/**
 * PDF 布局计算纯函数
 */

/**
 * A4 页面与表格区域常量（单位：mm，与 jsPDF 默认单位一致）
 */
export const PAGE = {
  width: 210,
  height: 297,
  marginX: 10,
  tableTop: 16, // 表格起始 y（对应 PdfStyles.page.startY）
  // 实测校准：jsPDF-autotable 在 startY=16 时单页可容纳的下边界约为 254mm
  // （其内部页边距预留使页底可用高度小于 297-16-10），超出即自动分页
  tableBottom: 254,
};

/** autoTable 实际最小行高(mm) */
export const MIN_ROW = 5;

/** 脱式计算每题下方的空白行数（写计算过程的格子行） */
export const STEP_ROWS = 5;

/** 脱式计算单题占据的表格行数：1 行表达式 + 5 行空白 */
export const STEP_BLOCK = STEP_ROWS + 1;

/**
 * 根据「每页题数 + 列数」反推排版参数，保证单页不溢出。
 *
 * 核心思路：
 * 1. 行数 = ceil(题数 / 列数)，表格实际行数还需 +2（表头“日期” + 表尾“成绩”）
 * 2. 行高由可用高度均分得出 → 物理上不可能纵向溢出
 * 3. 字号取「行高推导」与「列宽推导」的较小值 → 同时保证横向不溢出
 *
 * @returns rows 题目行数, cellHeight 单格最小高度(mm), fontSize 字号(pt)
 */
export function computeLayout(
  perPage: number,
  columns: number,
): { rows: number; cellHeight: number; fontSize: number } {
  const safePerPage = Math.max(1, perPage);
  const safeColumns = Math.max(1, columns);
  const rows = Math.ceil(safePerPage / safeColumns);
  const totalRows = rows + 2; // + 表头 + 表尾

  const availH = PAGE.tableBottom - PAGE.tableTop;
  // 行高用满全部可用高度（保留 1.5mm 浮点余量，避免累积误差越过 tableBottom 触发分页）。
  // 不做整毫米取整，避免丢弃余量造成页底大片空白；也不设高度上限，题少时行自然变高填满整页。
  const cellHeight = Math.max(
    MIN_ROW,
    Math.floor(((availH - 1.5) / totalRows) * 100) / 100,
  );

  const colW = (PAGE.width - PAGE.marginX * 2) / safeColumns;
  // 字号由“行高预算”反推：autoTable 实际行高 ≈ fontSize*0.95(mm)，
  // 故 fontSize ≤ cellHeight/0.95 才能保证 minCellHeight 不被内容撑高。
  // 再与“列宽横向上限”取较小值，保证横向也不溢出。
  const byHeight = cellHeight / 0.95;
  const byWidth = colW * 0.386; // 约 12 字符宽的横向上限
  const fontSize = Math.round(
    Math.max(4, Math.min(22, Math.min(byHeight, byWidth))),
  );

  return { rows, cellHeight, fontSize };
}

/**
 * 解析最终排版参数，并自动校正列数以保证“每页恰好 perPage 题且单页不溢出”。
 *
 * 由于 autoTable 实际最小行高约 5mm，当「题数 / 列数」导致行数过多时，
 * 单页无法容纳，会被强制分页。此处按可用高度反推能容纳的最大行数，
 * 进而求出最小必要列数，取 max(用户列数, 最小必要列数)。
 *
 * @returns columns 实际采用的列数, rows / cellHeight / fontSize
 */
export function resolveLayout(
  perPage: number,
  columns: number,
): { columns: number; rows: number; cellHeight: number; fontSize: number } {
  const availH = PAGE.tableBottom - PAGE.tableTop;
  const maxRows = Math.floor(availH / MIN_ROW) - 2; // 预留表头 + 表尾 2 行
  const minCols = Math.max(3, Math.ceil(perPage / maxRows));
  const effCols = Math.max(1, Math.max(columns, minCols));

  const { rows, cellHeight, fontSize } = computeLayout(perPage, effCols);
  return { columns: effCols, rows, cellHeight, fontSize };
}

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
 * 生成表尾行（成绩栏）
 */
export function createScoreFooters(columns: number): string[] {
  return Array(columns).fill("成绩");
}

/**
 * 把占位符 ___ 替换为答案（答案页使用）
 */
export function solveProblem(problem: string, answer: string): string {
  return problem.replace(/_{3,}/g, answer);
}

/**
 * 脱式计算排版：
 * 每道题占据 STEP_BLOCK(=6) 行表格——第 1 行写算式，其后 5 行留白供书写计算过程。
 * 同时按可用高度强制列数，保证任何题数下都单页容纳、不触发自动分页。
 *
 * @returns columns 实际列数, cellHeight 单格高度(mm), fontSize 字号(pt)
 */
export function resolveMultiStepLayout(
  perPage: number,
  columns: number,
): { columns: number; cellHeight: number; fontSize: number } {
  const safePerPage = Math.max(1, perPage);
  const availH = PAGE.tableBottom - PAGE.tableTop;
  // 单页最多容纳的块行数（每块 STEP_BLOCK 行，含顶部日期行与底部成绩行）
  const maxBlockRows = Math.floor((availH / MIN_ROW - 2) / STEP_BLOCK);
  const minColsByHeight = Math.max(3, Math.ceil(safePerPage / maxBlockRows));
  const effCols = Math.max(1, Math.max(columns, minColsByHeight));

  const blockRows = Math.ceil(safePerPage / effCols);
  const totalRows = blockRows * STEP_BLOCK + 2; // + 表头 + 表尾
  const cellHeight = Math.max(
    MIN_ROW,
    Math.floor(((availH - 1.5) / totalRows) * 100) / 100,
  );

  const colW = (PAGE.width - PAGE.marginX * 2) / effCols;
  const byHeight = cellHeight / 0.95;
  const byWidth = colW * 0.386;
  const fontSize = Math.round(
    Math.max(4, Math.min(22, Math.min(byHeight, byWidth))),
  );

  return { columns: effCols, cellHeight, fontSize };
}

/**
 * 脱式计算题目一维数组 → 表格行。
 * 每题展开为 STEP_BLOCK 行：第 1 行为算式，其余为空白（答案页填步骤）。
 *
 * @param entries [题目, 答案, 步骤?][]，步骤仅供答案页逐行展示
 * @param answerMode true 时第 1 行填完整算式（= 答案），后续行展示步骤
 */
export function reshapeMultiStep(
  entries: [string, string, string[]?][],
  columns: number,
  answerMode: boolean,
): string[][] {
  const grid: string[][] = [];
  const blockRows = Math.ceil(entries.length / columns);

  for (let b = 0; b < blockRows; b++) {
    for (let r = 0; r < STEP_BLOCK; r++) {
      const row: string[] = [];
      for (let c = 0; c < columns; c++) {
        const idx = b * columns + c;
        if (idx >= entries.length) {
          row.push("");
          continue;
        }
        const [problem, answer, steps] = entries[idx]!;
        if (r === 0) {
          row.push(answerMode ? solveProblem(problem, answer) : problem);
        } else {
          const line = answerMode ? (steps ?? [])[r - 1] : "";
          row.push(line ?? "");
        }
      }
      grid.push(row);
    }
  }
  return grid;
}
