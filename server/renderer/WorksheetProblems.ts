import type { GeneratedProblemEntry } from "../../shared/types/mathProblem";
import type { WorksheetProblem, WorksheetProblemKind } from "../../shared/utils/worksheetLayout";

/** 原元组兼容适配；竖式使用原始元数据，绝不正则反推操作数或重新随机出题。 */
export function toWorksheetProblems(entries: GeneratedProblemEntry[], type: WorksheetProblemKind, group = 0): WorksheetProblem[] {
  return entries.map(([text, answer, steps, metadata], index) => {
    const kind = type === "vertical" ? "vertical" : steps || (type === "steps" && !metadata) ? "steps" : "oral";
    if (kind === "vertical" && !metadata) throw new Error("配置无法生成：竖式缺少操作数元数据");
    if (kind === "vertical" && metadata?.blank !== "result") throw new Error("配置无法生成：竖式题只能隐藏结果");
    const expression = kind === "vertical" && metadata
      ? `${metadata.left} ${metadata.operator} ${metadata.right}`
      : text.replace(/\s*=\s*_{3,}\s*$/, "");
    return {
      id: `group-${group}-question-${index + 1}`, kind, expression, answer,
      questionText: kind === "oral" ? text : expression,
      answerText: kind === "vertical" ? `${expression} = ${answer}` : kind === "steps" ? expression : text.replace(/_{3,}/g, answer),
      steps: kind === "steps" ? steps?.length ? [...steps] : [answer] : undefined,
      left: metadata?.left, right: metadata?.right, operator: metadata?.operator, result: metadata?.result,
      remainder: metadata?.kind === "remainder" ? metadata.remainder : undefined,
    };
  });
}
