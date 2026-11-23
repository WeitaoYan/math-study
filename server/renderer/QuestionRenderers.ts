import type { jsPDF } from "jspdf";
import { pointsToMm, type PlacedWorksheetProblem, type WorksheetSettings } from "../../shared/utils/worksheetLayout";
import { buildVerticalWork, type VerticalWork } from "../../shared/utils/verticalWork";

function textLines(doc: jsPDF, lines: string[], x: number, y: number, spacing: number, font: number) {
  doc.setFontSize(font);
  lines.forEach((line, index) => doc.text(line, x, y + index * spacing));
}

function digits(doc: jsPDF, value: string, right: number, y: number, pitch: number) {
  [...value].forEach((digit, index) => doc.text(digit, right - (value.length - 1 - index) * pitch, y, { align: "center" }));
}

function verticalAnchors(question: PlacedWorksheetProblem, work: VerticalWork) {
  const origin = question.workspace.x + (question.workspace.width - work.widthMm) / 2;
  const division = question.problem.operator === "÷";
  return {
    left: origin,
    right: origin + (work.digitCount + 1) * work.pitchMm,
    divisionStart: origin + String(question.problem.right).length * work.pitchMm,
    division,
  };
}

function drawGivens(doc: jsPDF, question: PlacedWorksheetProblem, work: VerticalWork, top: number, answer: boolean) {
  const a = verticalAnchors(question, work);
  const pitch = work.pitchMm;
  const scale = pitch / (16 * 25.4 / 72 * 0.85);
  if (a.division) {
    doc.text(String(question.problem.right), a.divisionStart - pitch * 0.6, top + 16 * scale, { align: "right" });
    [...String(question.problem.left)].forEach((digit, index) => doc.text(digit, a.divisionStart + (index + 1) * pitch, top + 16 * scale, { align: "center" }));
    doc.line(a.divisionStart, top + 20 * scale, a.divisionStart + pitch * 0.45, top + 7 * scale);
    doc.line(a.divisionStart + pitch * 0.45, top + 7 * scale, a.divisionStart + (String(question.problem.left).length + 0.6) * pitch, top + 7 * scale);
    if (answer) work.quotient.forEach((digit) => doc.text(digit.value, a.divisionStart + (digit.column + 1) * pitch, top + 4.5 * scale, { align: "center" }));
  } else {
    digits(doc, String(question.problem.left), a.right, top + 7 * scale, pitch);
    digits(doc, String(question.problem.right), a.right, top + 16 * scale, pitch);
    doc.text(question.problem.operator!, a.left + pitch * 0.4, top + 16 * scale, { align: "center" });
    doc.line(a.left, top + 21 * scale, a.right + pitch * 0.6, top + 21 * scale);
  }
}

function drawVerticalAnswer(doc: jsPDF, question: PlacedWorksheetProblem, work: VerticalWork, top: number) {
  const anchors = verticalAnchors(question, work);
  for (const row of work.rows) {
    const end = anchors.division
      ? anchors.divisionStart + (row.endColumn + 1) * work.pitchMm
      : anchors.right - row.shift * work.pitchMm;
    if (row.kind === "number") digits(doc, row.value, end, top + row.y, work.pitchMm);
    else doc.line(end - (row.widthDigits - 0.5) * work.pitchMm, top + row.y, end + work.pitchMm * 0.6, top + row.y);
  }
}

export function drawWorkspace(doc: jsPDF, question: PlacedWorksheetProblem, guide: WorksheetSettings["guide"]) {
  const box = question.workspace;
  if (!box.height || guide === "blank") return;
  doc.setDrawColor(205, 210, 210);
  doc.setLineWidth(0.12);
  const step = guide === "grid" ? 5 : 9;
  for (let offset = step; offset < box.height; offset += step) doc.line(box.x, box.y + offset, box.x + box.width, box.y + offset);
  if (guide === "grid") {
    for (let offset = 0; offset <= box.width; offset += step) doc.line(box.x + offset, box.y, box.x + offset, box.y + box.height);
    doc.rect(box.x, box.y, box.width, box.height);
  }
}

/** 各题型只绘制自己的题块，完全不决定列数、题块位置或分页。 */
export function drawWorksheetQuestion(doc: jsPDF, question: PlacedWorksheetProblem, settings: WorksheetSettings, answer: boolean) {
  const font = settings.fontSizePt;
  const textTop = question.y + question.contentOffsetY;
  doc.setTextColor(25, 25, 25);
  doc.setDrawColor(25, 25, 25);
  doc.setLineWidth(0.25);
  doc.setFontSize(font * 0.8);
  doc.text(`${question.number}.`, question.x, textTop + pointsToMm(font) * 1.1);
  drawWorkspace(doc, question, settings.guide);
  doc.setDrawColor(25, 25, 25);
  doc.setLineWidth(0.25);

  if (question.problem.kind === "vertical") {
    const work = buildVerticalWork(question.problem, font);
    doc.setFontSize(font);
    if (settings.verticalMode === "setup") {
      drawGivens(doc, question, work, question.y, answer);
      if (answer) drawVerticalAnswer(doc, question, work, question.workspace.y);
    } else {
      textLines(doc, answer ? question.answerLines : question.expressionLines, question.workspace.x, textTop + pointsToMm(font) * 1.1, question.lineHeight, font);
      if (answer) {
        doc.setFontSize(font);
        drawGivens(doc, question, work, question.workspace.y, true);
        drawVerticalAnswer(doc, question, work, question.workspace.y + work.headerHeightMm);
      }
    }
    return;
  }

  textLines(doc, answer ? question.answerLines : question.expressionLines, question.workspace.x, textTop + pointsToMm(font) * 1.1, question.lineHeight, font);
  if (answer && question.problem.kind === "steps") {
    textLines(doc, question.solutionLines, question.workspace.x, question.workspace.y + question.solutionLineHeight * 0.75, question.solutionLineHeight, Math.max(10, font * 0.88));
  }
}
