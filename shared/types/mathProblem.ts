export type ArithmeticOperator = "+" | "-" | "×" | "÷";
export type BlankPosition = "left" | "right" | "result" | "none";

/** 在取数完成后附加的原始数学信息，不参与随机生成和约束校验。 */
export interface BinaryProblemMetadata {
  kind: "binary";
  operator: ArithmeticOperator;
  left: number;
  right: number;
  result: number;
  blank: BlankPosition;
}

export interface RemainderProblemMetadata {
  kind: "remainder";
  operator: "÷";
  left: number;
  right: number;
  result: number;
  remainder: number;
  blank: "result" | "none";
}

export type ProblemMetadata = BinaryProblemMetadata | RemainderProblemMetadata;
/** 保留前三项兼容原接口，第四项承载竖式所需的数据。 */
export type GeneratedProblemEntry = [text: string, answer: string, steps?: string[], metadata?: ProblemMetadata];
