// 使用类来模拟Python的dataclass
export interface AdditionConfig {
  ratio: number;
  range_min: number;
  range_max: number;
  carry: boolean;
  round_to: number; // 0=无约束, 10=整十, 100=整百
}

export const empty_addition_config: AdditionConfig = {
  ratio: 0,
  range_min: 0,
  range_max: 0,
  carry: false,
  round_to: 0,
};

export interface SubtractionConfig {
  ratio: number;
  range_min: number;
  range_max: number;
  borrow: boolean;
  round_to: number; // 0=无约束, 10=整十, 100=整百
}

export const empty_subtraction_config: SubtractionConfig = {
  ratio: 0,
  range_min: 0,
  range_max: 0,
  borrow: false,
  round_to: 0,
};

export interface MultiplicationConfig {
  ratio: number;
  factor_min: number;
  factor_max: number;
}

export const empty_multiplication_config: MultiplicationConfig = {
  ratio: 0,
  factor_min: 0,
  factor_max: 0,
};

export interface DivisionConfig {
  ratio: number;
  factor_min: number;
  factor_max: number;
}

export const empty_division_config: DivisionConfig = {
  ratio: 0,
  factor_min: 0,
  factor_max: 0,
};

export interface DivisionWithRemainderConfig {
  ratio: number;
  divisor_min: number;
  divisor_max: number;
}

export const empty_division_with_remainder_config: DivisionWithRemainderConfig =
  {
    ratio: 0,
    divisor_min: 0,
    divisor_max: 0,
  };

export interface Config {
  count: number;
  start: number;
  /** 每页题目数量（决定单页排版行数，不再写死 columns*20） */
  per_page_count: number;
  /** 每页列数，可由用户覆盖，缺省按数值范围自动计算 */
  columns: number;
  addition: AdditionConfig;
  subtraction: SubtractionConfig;
  multiplication: MultiplicationConfig;
  division: DivisionConfig;
  division_with_remainder: DivisionWithRemainderConfig;
  include_answers: boolean;
  columns: number;
  /** 紧凑模式：关闭符号两边的空格 */
  compact: boolean;
  /** 填空模式：'random' | 'result' | 'left' | 'right' | 'none' */
  fill_mode: string;
}
