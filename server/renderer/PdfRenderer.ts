/**
 * PDF 渲染核心
 * 负责渲染单页 PDF 的所有元素（页眉、标题、表格）
 */
import autoTable from "jspdf-autotable";
import type { Config } from "../Math/Config";
import { generateProblems } from "../Math/ProblemGenerator";
import { PDF_STYLES } from "./PdfStyles";
import {
  reshapeToTable,
  createDateHeaders,
  createScoreFooters,
} from "./PdfLayout";

const S = PDF_STYLES;

/**
 * 渲染一页完整的 PDF
 * @param doc jsPDF 文档实例
 * @param pageIndex 当前页码（0-based）
 * @param config 题目配置
 */
export function renderPage(doc: any, pageIndex: number, config: Config) {
  if (pageIndex > 0) {
    doc.addPage();
  }

  renderHeader(doc);
  renderTitle(doc, pageIndex, config.start);
  renderTable(doc, config);
}

/** 渲染页眉：网站链接 + 姓名栏 */
function renderHeader(doc: any) {
  doc.setFontSize(S.header.urlFontSize);
  doc.text(S.header.url, S.header.urlX, S.header.urlY);
  doc.setFontSize(S.header.nameFontSize);
  doc.text(S.header.nameLabel, S.header.nameX, S.header.nameY);
}

/** 渲染标题 */
function renderTitle(doc: any, pageIndex: number, start: number) {
  doc.setFont(S.font.name, S.font.style);
  doc.setFontSize(S.title.fontSize);
  doc.text(`小学生口算题(第${pageIndex + start}组)`, 105, S.title.y, {
    align: "center",
  });
}

/** 渲染题目表格 */
function renderTable(doc: any, config: Config) {
  const problems = generateProblems(config);
  const problemTexts = problems.map((p) => p[0]); // 只取题目文本

  /** 紧凑模式：列数 <=3 时用小字号避免换行溢出 */
  const cellFontSize = config.columns <= 3 ? S.cell.compactFontSize : S.cell.fontSize;

  doc.setFont(S.font.name, S.font.style);
  autoTable(doc, {
    head: [createDateHeaders(config.columns)],
    body: reshapeToTable(problemTexts, config.columns),
    startY: S.page.startY,
    styles: {
      font: S.font.name,
      fontStyle: S.font.style,
      fontSize: cellFontSize,
      minCellHeight: S.cell.minCellHeight,
      valign: "middle",
    },
    headStyles: {
      fillColor: S.headerFooter.fillColor,
      textColor: S.headerFooter.textColor,
    },
    footStyles: {
      fillColor: S.headerFooter.fillColor,
      textColor: S.headerFooter.textColor,
    },
    bodyStyles: {
      font: S.font.name,
      fontStyle: S.font.style,
    },
    theme: S.tableTheme,
    foot: [createScoreFooters(config.columns)],
  });
}
