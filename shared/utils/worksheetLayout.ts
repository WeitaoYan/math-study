/**
 * 浏览器预览与真实 PDF 共用的布局模型。所有坐标和尺寸均为 mm，字号为 pt。
 * 书写区参与容量计算，即使没有绘制线条，也不能被下一题占用。
 * 此模块不依赖 DOM、PDF 库或现有出题器。
 */
import { measureVerticalWork, VERTICAL_HEADER_HEIGHT } from "./verticalWork";

export type WorksheetProblemKind = "oral" | "vertical" | "steps";
export type WorksheetOperator = "+" | "-" | "×" | "÷";

export interface WorksheetProblem {
  id: string;
  kind: WorksheetProblemKind;
  expression: string;
  answer: string;
  left?: number;
  right?: number;
  operator?: WorksheetOperator;
  steps?: string[];
  questionText?: string;
  answerText?: string;
  result?: number;
  remainder?: number;
}

export interface WorksheetBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorksheetLayoutOptions {
  columns: number | "auto";
  workspaceHeightMm: number;
  fontSizePt: number;
  rowGapMm: number;
  verticalMode: "self" | "setup";
  columnGapMm?: number;
  numberWidthMm?: number;
  /** 口算固定行数，按整页高度均分行距；过程题不适用。 */
  rowsPerPage?: number;
  maxColumns?: number;
}

export interface PlacedWorksheetProblem extends WorksheetBox {
  problem: WorksheetProblem;
  number: number;
  headerHeight: number;
  expressionLines: string[];
  answerLines: string[];
  solutionLines: string[];
  lineHeight: number;
  solutionLineHeight: number;
  contentOffsetY: number;
  workspace: WorksheetBox;
}

export interface WorksheetPage {
  number: number;
  questions: PlacedWorksheetProblem[];
}

export interface WorksheetLayout {
  pages: WorksheetPage[];
  columns: number;
  columnWidthMm: number;
  workspaceWidthMm: number;
}

/** measureText 返回 mm；浏览器可注入 Canvas 测量，测试使用纯函数。 */
export type WorksheetTextMeasurer = (text: string, fontSizePt: number) => number;

export type WorksheetGuide = "blank" | "lines" | "grid";
export interface WorksheetSettings {
  type: WorksheetProblemKind;
  workspaceHeightMm: number;
  guide: WorksheetGuide;
  fontSizePt: number;
  rowGapMm: number;
  verticalMode: "self" | "setup";
  autoColumns: boolean;
  rowsPerPage?: number;
  maxColumns?: number;
}

export const WORKSHEET_PAGE = {
  width: 210,
  height: 297,
  marginX: 15,
  contentTop: 48,
  contentBottom: 274,
  columnGap: 8,
  numberWidth: 8,
  workspaceGap: 3,
  minWorkspaceWidth: 60,
  setupHeight: VERTICAL_HEADER_HEIGHT,
} as const;

export function pointsToMm(points: number): number {
  return (points * 25.4) / 72;
}

/** SSR / 静态测试的保守估算。浏览器挂载后用实际字体重新测量。 */
export const estimateWorksheetTextWidth: WorksheetTextMeasurer = (text, size) => {
  let ems = 0;
  for (const char of text) {
    if (/\s/u.test(char)) ems += 0.3;
    else if (/[.,:·]/u.test(char)) ems += 0.3;
    else if (/[0-9_]/u.test(char)) ems += 0.56;
    else if (/[()+\-=×÷]/u.test(char)) ems += 0.7;
    else ems += 1;
  }
  return ems * pointsToMm(size);
};

export function normalizeWorksheetText(text: string): string {
  return (text.trim().match(/_{3,}|\d+(?:\.\d+)?|[()+\-=×÷]|[^\s\d()+\-=×÷]+/gu) ?? []).join(" ");
}

export function wrapWorksheetText(
  text: string,
  width: number,
  fontSize: number,
  measureText: WorksheetTextMeasurer,
): string[] {
  const lines: string[] = [];
  let line = "";

  // 紧凑算式也在运算符处分词，不拆数字，不为了塞下内容缩小字号。
  const tokens = normalizeWorksheetText(text).split(" ").filter(Boolean);
  for (const token of tokens) {
    if (measureText(token, fontSize) > width) {
      throw new RangeError("单个算式片段过宽，请减少列数或调整字号");
    }
    const candidate = line ? `${line} ${token}` : token;
    if (line && measureText(candidate, fontSize) > width) {
      lines.push(line);
      line = token;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function validateOptions(options: WorksheetLayoutOptions) {
  if (options.columns !== "auto" && (!Number.isInteger(options.columns) || options.columns < 1 || options.columns > 6)) {
    throw new RangeError("列数必须在 1～6 之间");
  }
  if (!Number.isFinite(options.workspaceHeightMm) || options.workspaceHeightMm < 0) {
    throw new RangeError("书写区高度不能为负数");
  }
  if (!Number.isFinite(options.fontSizePt) || options.fontSizePt < 10 || options.fontSizePt > 28) {
    throw new RangeError("字号必须在 10～28pt 之间");
  }
  if (!Number.isFinite(options.rowGapMm) || options.rowGapMm < 0 || options.rowGapMm > 30) {
    throw new RangeError("题间距必须在 0～30mm 之间");
  }
  if (options.rowsPerPage !== undefined && (!Number.isInteger(options.rowsPerPage) || options.rowsPerPage < 1 || options.rowsPerPage > 40)) {
    throw new RangeError("每页行数须为 1～40 的整数");
  }
  if (options.maxColumns !== undefined && (!Number.isInteger(options.maxColumns) || options.maxColumns < 1 || options.maxColumns > 6)) throw new RangeError("自动列数上限须为 1～6");
}

export function layoutWorksheet(
  problems: readonly WorksheetProblem[],
  options: WorksheetLayoutOptions,
  measureText: WorksheetTextMeasurer = estimateWorksheetTextWidth,
): WorksheetLayout {
  validateOptions(options);
  const P = WORKSHEET_PAGE;
  const contentWidth = P.width - P.marginX * 2;
  const contentHeight = P.contentBottom - P.contentTop;
  const hasProcess = problems.some((problem) => problem.kind !== "oral");
  if (hasProcess && options.rowsPerPage !== undefined) throw new RangeError("过程题不能用固定口算行数压缩书写区");
  const fixedRowHeight = options.rowsPerPage === undefined ? undefined
    : (contentHeight - (options.rowsPerPage - 1) * options.rowGapMm) / options.rowsPerPage;
  if (fixedRowHeight !== undefined && fixedRowHeight <= 0) throw new RangeError("当前行数和题间距无法在一页内安排");
  const columnGap = options.columnGapMm ?? (hasProcess ? P.columnGap : 4);
  const requestedNumberWidth = options.numberWidthMm ?? (hasProcess ? P.numberWidth : 5);
  if (!Number.isFinite(columnGap) || columnGap < 0 || columnGap > 20 || !Number.isFinite(requestedNumberWidth) || requestedNumberWidth < 3 || requestedNumberWidth > 12) {
    throw new RangeError("列间距或题号宽度无效");
  }
  // 三位以上题号也参与测量，避免 100. / 200. 与算式相撞。
  const numberWidth = Math.max(requestedNumberWidth, measureText(`${problems.length}.`, options.fontSizePt * 0.8) + 1);
  if (hasProcess && options.workspaceHeightMm < 20) throw new RangeError("过程题书写区至少为 20mm");
  let columns = options.columns === "auto" ? (hasProcess ? 2 : options.maxColumns ?? 5) : options.columns;
  if (options.columns === "auto" && !hasProcess) {
    const longest = Math.max(0, ...problems.flatMap((problem) => [
      problem.questionText ?? `${problem.expression} = ____`, problem.answerText ?? problem.questionText ?? `${problem.expression} = ____`,
    ]).map((text) => measureText(normalizeWorksheetText(text), options.fontSizePt)));
    while (columns > 1 && longest > (contentWidth - (columns - 1) * columnGap) / columns - numberWidth) columns--;
  }
  const columnWidth = (contentWidth - (columns - 1) * columnGap) / columns;
  const workspaceWidth = columnWidth - numberWidth;

  if (problems.some((problem) => problem.kind !== "oral") && workspaceWidth < P.minWorkspaceWidth) {
    throw new RangeError(
      `当前列数下书写区仅 ${workspaceWidth.toFixed(1)}mm 宽，过程题至少需要 ${P.minWorkspaceWidth}mm，请减少列数`,
    );
  }

  const pages: WorksheetPage[] = [];
  let page: WorksheetPage | undefined;
  let y: number = P.contentTop;
  let pageRows = 0;

  for (let offset = 0; offset < problems.length; offset += columns) {
    const row = problems.slice(offset, offset + columns).map((problem, column) => {
      const setup = problem.kind === "vertical" && options.verticalMode === "setup";
      const text = problem.questionText ?? (problem.kind === "oral" ? `${problem.expression} = ____` : problem.expression);
      const expressionLines = setup
        ? []
        : wrapWorksheetText(text, workspaceWidth, options.fontSizePt, measureText);
      const answerLines = setup ? [] : wrapWorksheetText(problem.answerText ?? text, workspaceWidth, options.fontSizePt, measureText);
      const solutionFont = Math.max(10, options.fontSizePt * 0.88);
      const solutionLines = (problem.steps ?? []).flatMap((step) => wrapWorksheetText(step.startsWith("=") ? step : `= ${step}`, workspaceWidth, solutionFont, measureText));
      const lineHeight = pointsToMm(options.fontSizePt) * (problem.kind === "oral" ? 1.4 : 1.5);
      const solutionLineHeight = Math.max(8, pointsToMm(solutionFont) * 1.5);
      const headerHeight = setup
        ? Math.max(P.setupHeight, P.setupHeight * options.fontSizePt / 16)
        : Math.max(problem.kind === "oral" ? 0 : 9, Math.max(expressionLines.length, answerLines.length) * lineHeight);
      const solutionHeight = solutionLines.length * solutionLineHeight;
      const verticalHeight = problem.kind === "vertical" && problem.left !== undefined && problem.right !== undefined && problem.operator
        ? measureVerticalWork(problem, options.fontSizePt, options.verticalMode, workspaceWidth)
        : 0;
      const workspaceHeight = problem.kind === "oral" ? 0 : Math.max(options.workspaceHeightMm, solutionHeight, verticalHeight);
      const gap = workspaceHeight ? P.workspaceGap : 2;

      return {
        problem,
        number: offset + column + 1,
        x: P.marginX + column * (columnWidth + columnGap),
        width: columnWidth,
        height: headerHeight + gap + workspaceHeight,
        headerHeight,
        expressionLines,
        answerLines,
        solutionLines,
        lineHeight,
        solutionLineHeight,
        workspaceHeight,
      };
    });

    // 同一行按最高题块占用空间，避免混排时下一行侵入书写区。
    const measuredRowHeight = Math.max(...row.map((question) => question.height));
    if (fixedRowHeight !== undefined && measuredRowHeight > fixedRowHeight + 0.001) {
      throw new RangeError("算式超出口算行高预算，请减少列数，不能为了固定行数缩小字号");
    }
    const rowHeight = fixedRowHeight ?? measuredRowHeight;
    if (rowHeight > contentHeight) {
      throw new RangeError("单题及书写区超过一页可用高度，请降低留白高度");
    }

    if (!page || (options.rowsPerPage !== undefined && pageRows >= options.rowsPerPage) || y + rowHeight > P.contentBottom + 0.001) {
      page = { number: pages.length + 1, questions: [] };
      pages.push(page);
      y = P.contentTop;
      pageRows = 0;
    }

    // 一排所有题目共用内容起点，长算式换行时也不让其他列题号上下错位。
    const contentOffsetY = fixedRowHeight === undefined ? 0 : Math.max(0, (rowHeight - measuredRowHeight) / 2);
    for (const question of row) {
      page.questions.push({
        problem: question.problem,
        number: question.number,
        x: question.x,
        y,
        width: question.width,
        height: fixedRowHeight ?? question.height,
        headerHeight: question.headerHeight,
        expressionLines: question.expressionLines,
        answerLines: question.answerLines,
        solutionLines: question.solutionLines,
        lineHeight: question.lineHeight,
        solutionLineHeight: question.solutionLineHeight,
        contentOffsetY,
        workspace: {
          x: question.x + numberWidth,
          y: y + contentOffsetY + question.headerHeight + (question.workspaceHeight ? P.workspaceGap : 2),
          width: workspaceWidth,
          height: question.workspaceHeight,
        },
      });
    }

    y += rowHeight + options.rowGapMm;
    pageRows++;
  }

  return {
    pages,
    columns,
    columnWidthMm: columnWidth,
    workspaceWidthMm: workspaceWidth,
  };
}
