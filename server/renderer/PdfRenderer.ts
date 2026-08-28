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
} from "./PdfLayout";

const S = PDF_STYLES;

/** 题目条目：[题目文本(含 ___ 占位), 答案文本] */
type ProblemEntry = [string, string];

/**
 * 将题目文本中的占位符 ___ 替换为答案，得到完整算式（用于答案页）
 */
function solve(entry: ProblemEntry): string {
  return entry[0].replace(/_{3,}/g, entry[1]);
}

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
  renderTitle(doc, pageIndex, config.start, false);
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
  renderTitle(doc, pageIndex, config.start, true);
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
  start: number,
  isAnswer: boolean,
) {
  doc.setFont(S.font.name, S.font.style);
  doc.setFontSize(S.title.fontSize);
  const label = isAnswer
    ? `小学生口算题答案(第${pageIndex + start}组)`
    : `小学生口算题(第${pageIndex + start}组)`;
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
    answerMode ? solve(p) : p[0],
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
