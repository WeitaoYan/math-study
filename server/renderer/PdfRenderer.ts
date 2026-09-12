/**
 * PDF 渲染核心
 * 负责渲染单页 PDF 的所有元素（页眉、标题、表格）
 */
import autoTable from "jspdf-autotable";
import type { Config } from "../Math/Config";
import { PDF_STYLES } from "./PdfStyles";
import {
  reshapeToTable,
  createDateHeaders,
  createScoreFooters,
  resolveLayout,
  solveProblem,
  computeMultiStepPageLayout,
  MULTI_STEP_PAGE,
  MULTI_STEP_BLOCK,
} from "./PdfLayout";

const S = PDF_STYLES;

/** 题目条目：[题目文本(含 ___ 占位), 答案文本, 脱式计算步骤(可选)] */
type ProblemEntry = [string, string, string[]?];

/**
 * 渲染一组题目的「题目页」
 * @param problems 该组题目（已生成，题目页与答案页共用，保证一一对应）
 */
export function renderPage(
  doc: any,
  pageIndex: number,
  config: Config,
  problems: ProblemEntry[],
) {
  if (pageIndex > 0) {
    doc.addPage();
  }

  // 脱式计算走独立版式（标题 + 姓名/日期 + 手工排版题目区）
  if (config.multi_step.ratio > 0) {
    renderMultiStepPage(doc, pageIndex, config, problems, false);
    return;
  }

  renderHeader(doc);
  renderTitle(doc, pageIndex, config, false);
  renderTable(doc, config, problems, false);
}

/**
 * 渲染一组题目的「答案页」
 * 与题目页使用同一份 problems，仅把 ___ 替换为答案
 */
export function renderAnswerPage(
  doc: any,
  pageIndex: number,
  config: Config,
  problems: ProblemEntry[],
) {
  doc.addPage();

  // 脱式计算走独立版式（答案页：完整算式 + 逐步过程）
  if (config.multi_step.ratio > 0) {
    renderMultiStepPage(doc, pageIndex, config, problems, true);
    return;
  }

  renderHeader(doc);
  renderTitle(doc, pageIndex, config, true);
  renderTable(doc, config, problems, true);
}

/** 渲染页眉：网站链接 + 姓名栏 */
function renderHeader(doc: any) {
  doc.setFontSize(S.header.urlFontSize);
  doc.text(S.header.url, S.header.urlX, S.header.urlY);
  doc.setFontSize(S.header.nameFontSize);
  doc.text(S.header.nameLabel, S.header.nameX, S.header.nameY);
}

/** 渲染标题 */
function renderTitle(
  doc: any,
  pageIndex: number,
  config: Config,
  isAnswer: boolean,
) {
  doc.setFont(S.font.name, S.font.style);
  doc.setFontSize(S.title.fontSize);
  const base = "小学生口算题";
  const label = isAnswer
    ? `${base}答案(第${pageIndex + config.start}组)`
    : `${base}(第${pageIndex + config.start}组)`;
  doc.text(label, 105, S.title.y, { align: "center" });
}

/**
 * 渲染题目/答案表格
 * @param problems 题目数据
 * @param answerMode true 时渲染答案（把 ___ 替换为答案）
 */
function renderTable(
  doc: any,
  config: Config,
  problems: ProblemEntry[],
  answerMode: boolean,
) {
  // 由「每页题数 + 列数」反推行高与字号，并自动校正列数保证单页不溢出
  const { columns, cellHeight, fontSize } = resolveLayout(
    config.per_page_count,
    config.columns,
  );

  const texts = problems.map((p) =>
    answerMode ? solveProblem(p[0], p[1]) : p[0],
  );

  doc.setFont(S.font.name, S.font.style);
  autoTable(doc, {
    head: [createDateHeaders(columns)],
    body: reshapeToTable(texts, columns),
    startY: S.page.startY,
    styles: {
      font: S.font.name,
      fontStyle: S.font.style,
      fontSize,
      minCellHeight: cellHeight,
      valign: "middle",
    },
    headStyles: {
      fillColor: S.headerFooter.fillColor,
      textColor: S.headerFooter.textColor,
      minCellHeight: cellHeight,
    },
    footStyles: {
      fillColor: S.headerFooter.fillColor,
      textColor: S.headerFooter.textColor,
      minCellHeight: cellHeight,
    },
    bodyStyles: {
      font: S.font.name,
      fontStyle: S.font.style,
    },
    theme: S.tableTheme,
    foot: [createScoreFooters(columns)],
  });
}

/**
 * 渲染脱式计算整页（独立版式，不使用表格）
 * 页面结构：标题 → 姓名/日期 → 分隔线 → 题目区。
 * 每题一块：第 1 行为算式，其余 blankLines 行画书写引导线；
 * 答案页在引导线上填入计算步骤。全部坐标/字号由 layout 计算得出。
 */
function renderMultiStepPage(
  doc: any,
  pageIndex: number,
  config: Config,
  problems: ProblemEntry[],
  answerMode: boolean,
) {
  const P = MULTI_STEP_PAGE;

  // 标题
  doc.setFont(S.font.name, S.font.style);
  doc.setFontSize(S.title.fontSize);
  const base = "脱式计算";
  const label = answerMode
    ? `${base}答案第${pageIndex + config.start}组`
    : `${base}第${pageIndex + config.start}组`;
  doc.setTextColor(0, 0, 0);
  doc.text(label, P.width / 2, P.headerTitleY, { align: "center" });

  // 姓名 / 日期
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`姓名：____________`, P.marginX, P.headerInfoY);
  doc.text(`日期：____________`, P.width - P.marginX, P.headerInfoY, {
    align: "right",
  });

  // 标题分隔线
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(P.marginX, P.headerRuleY, P.width - P.marginX, P.headerRuleY);

  const { columns, rows, cellHeight, expressionFont } =
    computeMultiStepPageLayout(config.per_page_count, config.columns);

  const colW = (P.width - P.marginX * 2) / columns;
  const blockH = MULTI_STEP_BLOCK * cellHeight;
  const innerPad = 2.5; // 块内左右留白(mm)

  for (let i = 0; i < problems.length; i++) {
    const [problem, answer, steps] = problems[i];
    const blockRow = Math.floor(i / columns);
    const blockCol = i % columns;
    const blockTop = P.contentTop + blockRow * blockH;
    const x0 = P.marginX + blockCol * colW + innerPad;
    const availW = colW - innerPad * 2; // mm
    const availWpt = (availW * 72) / 25.4;

    const text = answerMode ? solveProblem(problem, answer) : problem;

    // 算式（第 1 行）：按实际宽度收缩字号，保证单行放下
    let fSize = expressionFont;
    doc.setFontSize(fSize);
    const needed = doc.getTextWidth(text);
    if (needed > availWpt) {
      fSize = Math.max(8, Math.floor((availWpt / needed) * fSize * 10) / 10);
      doc.setFontSize(fSize);
    }
    doc.setTextColor(0, 0, 0);
    // 算式落在该块的第一行位置（无网格线，仅通过留白划分书写区）
    doc.text(text, x0, blockTop + cellHeight * 0.78);

    // 答案页：在算式下方逐行填入计算步骤（整齐对齐书写区）
    if (answerMode && steps && steps.length > 0) {
      doc.setFontSize(Math.max(8, fSize * 0.82));
      doc.setTextColor(70, 70, 70);
      steps.forEach((step, si) => {
        const lineY = blockTop + (si + 2) * cellHeight - cellHeight * 0.22;
        doc.text(step, x0, lineY);
      });
    }
  }
}
