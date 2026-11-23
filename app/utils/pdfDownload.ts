import type { WorksheetPdfPageInfo } from "../../shared/types/worksheetPdf";

/** 兼容 RFC 5987 和普通 filename 响应头，不依赖浏览器环境。 */
export function getPdfFilename(header: string | null, fallback: string): string {
  const encoded = header?.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
  const plain = header?.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i);
  const candidate = encoded ?? plain?.[1] ?? plain?.[2];
  if (!candidate) return fallback;
  try {
    const filename = decodeURIComponent(candidate.trim().replace(/^"|"$/g, ""));
    return filename.split(/[\\/]/).at(-1) || fallback;
  } catch {
    return fallback;
  }
}

export function getPdfErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const response = data as Record<string, unknown>;
  for (const value of [response.error, response.message]) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

export function getPdfPageInfo(headers: Pick<Headers, "get">): WorksheetPdfPageInfo | null {
  const raw = ["Question", "Answer", "Total"].map((name) => headers.get(`X-Worksheet-${name}-Pages`));
  if (raw.some((value) => value === null || !/^\d+$/.test(value))) return null;
  const [questionPages, answerPages, totalPages] = raw.map(Number) as [number, number, number];
  if (!Number.isSafeInteger(totalPages) || questionPages < 1 || totalPages !== questionPages + answerPages) return null;
  const info: WorksheetPdfPageInfo = { questionPages, answerPages, totalPages };
  const rawCount = headers.get("X-Worksheet-Question-Count");
  const rawPerPage = headers.get("X-Worksheet-Questions-Per-Page");
  const rawColumns = headers.get("X-Worksheet-Columns");
  if (rawColumns && /^[1-6]$/.test(rawColumns)) info.columns = Number(rawColumns);
  if (rawCount && /^\d+$/.test(rawCount) && Number.isSafeInteger(Number(rawCount))) info.questionCount = Number(rawCount);
  if (rawPerPage && /^\d+(,\d+)*$/.test(rawPerPage)) {
    const counts = rawPerPage.split(",").map(Number);
    if (counts.length === questionPages && counts.every((count) => Number.isSafeInteger(count) && count > 0) && (info.questionCount === undefined || counts.reduce((sum, count) => sum + count, 0) === info.questionCount)) info.questionsPerPage = counts;
  }
  return info;
}
