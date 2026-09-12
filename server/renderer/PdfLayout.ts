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
 * 脱式计算专用页面版式（非表格，手工排版）
 * A4 页面上：顶部标题 → 姓名 / 日期一行 → 分隔线 → 题目区域。
 * 每题占据一块：1 行算式 + blankLines 行空白（供书写计算过程）。
 * 行高由题目区域高度按块均分（≥ minLineHeight），列数不足时自动增列保证单页容纳。
 */
export const MULTI_STEP_PAGE = {
  width: 210,
  height: 297,
  marginX: 15,
  /** 标题基线(mm) */
  headerTitleY: 18,
  /** 姓名 / 日期行基线(mm) */
  headerInfoY: 30,
  /** 标题下方分隔线 y(mm) */
  headerRuleY: 34,
  /** 题目区域起始 y(mm) */
  contentTop: 44,
  /** 页面底部留白(mm) */
  bottomMargin: 15,
  /** 每题下方留白行数（写计算过程） */
  blankLines: 5,
  minColumns: 2,
  maxColumns: 4,
  /** 单行最小高度(mm)，行高低于此则增列 */
  minLineHeight: 6,
};

/** 脱式计算每题占据的行数：1 行算式 + 若干空白行 */
export const MULTI_STEP_BLOCK =
  MULTI_STEP_PAGE.blankLines + 1;

/**
 * 手工排版：算出列数、块行数、字号、行高。
 * 字体上限先按列宽估算，渲染时再按实际最长算式微调。
 *
 * @returns columns 列数, rows 块行数, cellHeight 单行高度(mm), expressionFont 算式字号(pt)
 */
export function computeMultiStepPageLayout(
  perPage: number,
  columns: number,
): {
  columns: number;
  rows: number;
  cellHeight: number;
  expressionFont: number;
} {
  const P = MULTI_STEP_PAGE;
  const contentH = P.height - P.contentTop - P.bottomMargin;

  // 先满足「每页恰好 perPage 题、单行高度不小于下限」的最小列数
  let effCols = Math.max(
    P.minColumns,
    Math.min(P.maxColumns, Math.max(1, columns)),
  );
  let blockRows = Math.ceil(perPage / effCols);
  const maxBlockRows = Math.floor(
    contentH / (MULTI_STEP_BLOCK * P.minLineHeight),
  );
  while (blockRows > maxBlockRows && effCols < P.maxColumns) {
    effCols++;
    blockRows = Math.ceil(perPage / effCols);
  }

  const totalLines = blockRows * MULTI_STEP_BLOCK;
  // 行高用满题目区域（保留 0.1mm 精度与少许余量，避免浮点越界）
  const cellHeight = Math.max(
    P.minLineHeight,
    Math.floor((contentH / totalLines) * 10) / 10,
  );

  const colWidth = (P.width - P.marginX * 2) / effCols;
  // 算式字号由列宽反推的上限（渲染时会再按文本实际宽度收窄）
  const expressionFont = Math.round(
    Math.max(10, Math.min(18, colWidth * 0.26)),
  );

  return {
    columns: effCols,
    rows: blockRows,
    cellHeight,
    expressionFont,
  };
}
