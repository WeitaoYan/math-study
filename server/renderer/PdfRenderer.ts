/** 唯一的 PDF 页面入口：所有题型共享测量、留白、题块位置与分页。 */
import type { jsPDF } from "jspdf";
import type { Config } from "../Math/Config";
import type { GeneratedProblemEntry } from "../../shared/types/mathProblem";
import { layoutWorksheet, WORKSHEET_PAGE, type WorksheetSettings } from "../../shared/utils/worksheetLayout";
import { worksheetInputDefaults } from "../../shared/utils/worksheetDefaults";
import { PDF_STYLES } from "./PdfStyles";
import { toWorksheetProblems } from "./WorksheetProblems";
import { drawWorksheetQuestion } from "./QuestionRenderers";

function settingsFor(config: Config): WorksheetSettings {
  if (config.worksheet) return config.worksheet;
  const type = config.multi_step.ratio > 0 ? "steps" : "oral";
  const defaults = worksheetInputDefaults(type);
  return { type, autoColumns: false, workspaceHeightMm: defaults.workspace_height_mm, guide: "blank", fontSizePt: defaults.font_size_pt, rowGapMm: defaults.row_gap_mm, verticalMode: "self" };
}

export function createWorksheetPlan(doc: jsPDF, config: Config, entries: GeneratedProblemEntry[], groupIndex = 0) {
  const settings = settingsFor(config);
  const problems = toWorksheetProblems(entries, settings.type, groupIndex);
  if (!problems.length) throw new Error("配置无法生成：本组没有题目，请增加每组题数或调整比例");
  doc.setFont(PDF_STYLES.font.name, PDF_STYLES.font.style);
  try {
    const layout = layoutWorksheet(problems, {
      columns: settings.autoColumns ? "auto" : config.columns,
      workspaceHeightMm: settings.workspaceHeightMm,
      fontSizePt: settings.fontSizePt,
      rowGapMm: settings.rowGapMm,
      verticalMode: settings.verticalMode,
      rowsPerPage: settings.rowsPerPage,
      maxColumns: settings.maxColumns,
    }, (text, font) => { doc.setFontSize(font); return doc.getTextWidth(text); });
    return { ...layout, settings, problems };
  } catch (error) {
    throw new Error(`配置无法生成：${(error as Error).message}`);
  }
}

export type PreparedWorksheetPlan = ReturnType<typeof createWorksheetPlan>;

/** 绘制已测量的页计划；按页数出题时直接复用，不能重新布局改变已选页数。 */
export function renderWorksheetPlan(doc: jsPDF, plan: PreparedWorksheetPlan, options: { answer?: boolean; title?: string; groupNumber?: number; startNewPage?: boolean } = {}) {
  const answer = options.answer ?? false;
  const kinds = new Set(plan.problems.map((problem) => problem.kind));
  const titles = { oral: "口算练习", steps: "脱式计算", vertical: "竖式计算" };
  const title = options.title ?? (kinds.size > 1 ? "综合计算练习" : titles[plan.problems[0]!.kind]);

  plan.pages.forEach((page, index) => {
    if (options.startNewPage || index > 0) doc.addPage();
    doc.setFont(PDF_STYLES.font.name, PDF_STYLES.font.style);
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(18);
    doc.text(`${title}${answer ? "答案" : ""}${options.groupNumber === undefined ? "" : `(第${options.groupNumber}组)`}`, 105, 22, { align: "center" });
    doc.setFontSize(10);
    const instruction = kinds.has("vertical") ? "用竖式计算，写出计算过程。" : kinds.has("steps") ? "请写出计算过程。" : "认真计算，仔细检查。";
    doc.text(instruction, 105, 29, { align: "center" });
    doc.text("姓名：____________", 15, 37);
    doc.text("班级：________", 80, 37);
    doc.text("日期：____________", 195, 37, { align: "right" });
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.3);
    doc.line(15, 42, 195, 42);

    page.questions.forEach((question) => drawWorksheetQuestion(doc, question, plan.settings, answer));
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8.5);
    doc.text(PDF_STYLES.header.url, WORKSHEET_PAGE.marginX, 283);
    doc.text(`第${page.number}/${plan.pages.length}页`, 195, 283, { align: "right" });
  });
  return plan;
}

function renderWorksheet(doc: jsPDF, groupIndex: number, config: Config, entries: GeneratedProblemEntry[], answer: boolean) {
  const plan = createWorksheetPlan(doc, config, entries, groupIndex);
  return renderWorksheetPlan(doc, plan, { answer, groupNumber: groupIndex + config.start, startNewPage: answer || groupIndex > 0 });
}

export function renderPage(doc: jsPDF, pageIndex: number, config: Config, problems: GeneratedProblemEntry[]) {
  return renderWorksheet(doc, pageIndex, config, problems, false);
}

export function renderAnswerPage(doc: jsPDF, pageIndex: number, config: Config, problems: GeneratedProblemEntry[]) {
  return renderWorksheet(doc, pageIndex, config, problems, true);
}
