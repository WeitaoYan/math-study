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
  resolveMultiStepLayout,
  reshapeMultiStep,
  solveProblem,
} from "./PdfLayout";
import type { Config } from "../Math/Config";

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
  const base = config.multi_step.ratio > 0 ? "脱式计算" : "小学生口算题";
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
  // 脱式计算：每题在表格中占 6 行（1 行算式 + 5 行留白），走专用排版
  if (config.multi_step.ratio > 0) {
    return renderMultiStepTable(doc, config, problems, answerMode);
  }

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
 * 渲染脱式计算表格
 * 每题 = 1 行算式 + 5 行空白；答案页第 1 行填完整算式，后 5 行展示计算步骤。
 */
function renderMultiStepTable(
  doc: any,
  config: Config,
  problems: ProblemEntry[],
  answerMode: boolean,
) {
  const { columns, cellHeight, fontSize } = resolveMultiStepLayout(
    config.per_page_count,
    config.columns,
  );

  doc.setFont(S.font.name, S.font.style);
  autoTable(doc, {
    head: [createDateHeaders(columns)],
    body: reshapeMultiStep(problems, columns, answerMode),
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
