/**
 * 请求参数解析器
 * 将前端传来的 RequestBody（字符串字段）转换为强类型的 Config
 */
import type { Config } from "./Config";
import { parseBoolean } from "../utils/RequestConvert";
import type { RequestBody } from "../api/generate-math-problems";

/**
 * 解析自定义配置请求体，构建 Config
 * @param body 前端请求体（所有字段为可选的字符串类型）
 * @returns 解析后的 Config 对象
 */
export function parseCustomConfig(body: RequestBody): Config {
  const addition_range_max = parseInt(
    body.addition_range_max ?? "20",
    10,
  );
  const subtraction_range_max = parseInt(
    body.subtraction_range_max ?? "100",
    10,
  );
  const max_number = Math.max(subtraction_range_max, addition_range_max);
  const columns = max_number > 100 ? 4 : 5;
  const total_count = max_number > 100 ? 80 : 100;

  return {
    total_count,
    count: body.count ?? 10,
    start: body.start ?? 1,
    columns,
    include_answers: parseBoolean(body.include_answers),

    addition: {
      ratio: parseFloat(body.addition_ratio ?? "0") / 100,
      range_min: parseInt(body.addition_range_min ?? "0", 10),
      range_max: addition_range_max,
      carry: parseBoolean(body.addition_carry),
    },
    subtraction: {
      ratio: parseFloat(body.subtraction_ratio ?? "0") / 100,
      range_min: parseInt(body.subtraction_range_min ?? "20", 10),
      range_max: subtraction_range_max,
      borrow: parseBoolean(body.subtraction_borrow),
    },
    multiplication: {
      ratio: parseFloat(body.multiplication_ratio ?? "0") / 100,
      factor_min: parseInt(body.multiplication_factor_min ?? "2", 10),
      factor_max: parseInt(body.multiplication_factor_max ?? "9", 10),
    },
    division: {
      ratio: parseFloat(body.division_ratio ?? "0") / 100,
      factor_min: parseInt(body.division_factor_min ?? "2", 10),
      factor_max: parseInt(body.division_factor_max ?? "9", 10),
    },
    division_with_remainder: {
      ratio: parseFloat(body.division_with_remainder_ratio ?? "0") / 100,
      divisor_min: parseInt(
        body.division_with_remainder_divisor_min ?? "2",
        10,
      ),
      divisor_max: parseInt(
        body.division_with_remainder_divisor_max ?? "9",
        10,
      ),
    },
  };
}
