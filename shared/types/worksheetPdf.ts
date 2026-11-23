export interface WorksheetPdfPageInfo {
  questionPages: number;
  answerPages: number;
  totalPages: number;
  questionCount?: number;
  questionsPerPage?: number[];
  columns?: number;
}
