// 使用类来模拟Python的dataclass
export interface AdditionConfig {
  ratio: number;
  range_min: number;
  range_max: number;
  carry: boolean;
}

export const empty_addition_config: AdditionConfig = {
  ratio: 0,
  range_min: 0,
  range_max: 0,
  carry: false,
};

export interface SubtractionConfig {
  ratio: number;
  range_min: number;
  range_max: number;
  borrow: boolean;
}

export const empty_subtraction_config: SubtractionConfig = {
  ratio: 0,
  range_min: 0,
  range_max: 0,
  borrow: false,
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
  total_count: number;
  count: number;
  addition: AdditionConfig;
  subtraction: SubtractionConfig;
  multiplication: MultiplicationConfig;
  division: DivisionConfig;
  division_with_remainder: DivisionWithRemainderConfig;
  include_answers: boolean;
  columns: number;
}
