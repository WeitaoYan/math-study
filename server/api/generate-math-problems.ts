import autoTable from "jspdf-autotable";
import { Config } from "../Math/Config";
import { parseBoolean, parseRequestBody } from "../utils/RequestConvert";
import { createDoc, responsePDF } from "../utils/PdfConfig";
import {
  empty_addition_config,
  empty_subtraction_config,
  empty_division_config,
  empty_multiplication_config,
  empty_division_with_remainder_config,
} from "../Math/Config";
import {
  Addition,
  Subtraction,
  Multiplication,
  Division,
  DivisionWithRemainder,
} from "../Math/ProblemTypes";

export default defineEventHandler(async (event) => {
  try {
    if (event.method !== "POST") {
      event.node.res.statusCode = 405;
      return { error: "Method Not Allowed" };
    }
    // 获取查询参数
    const body = await readRawBody(event);
    let requestData = parseRequestBody(body, event);
    // 创建 PDF 文档
    const doc = await createDoc();
    const config = getConfig(requestData);
    for (let i = 0; i < config.count; i++) {
      createPage(doc, i, config, config.start);
    }
    return responsePDF(doc, event);
  } catch (error) {
    console.error("PDF生成错误:", error);
    event.node.res.statusCode = 500;
    return { error: "PDF生成失败" };
  }
});
function createPage(
  doc: any,
  pageIndex: number,
  config: Config,
  start: number,
) {
  // 如果不是第一页，则添加新页面
  if (pageIndex > 0) {
    doc.addPage();
  }
  // 添加页眉
  addHeader(doc);
  // 添加页脚
  addFooter(doc);
  // 添加标题
  doc.setFont("ChineseSubset", "normal"); // 设置中文字体
  doc.setFontSize(20);
  doc.text(`小学生口算题(第${pageIndex + start}组)`, 105, 12, {
    align: "center",
  });
  // 准备表格数据
  const rows: [string, string][] = getTableData(config);
  const dateHeaders = Array(config.columns).fill("日期______");
  const scoreFooters = Array(config.columns).fill("成绩______");
  doc.setFont("ChineseSubset", "normal");
  autoTable(doc, {
    head: [dateHeaders],
    body: reshapeRows(rows, config.columns),
    startY: 16,
    styles: {
      font: "ChineseSubset", // 确保字体名称正确
      fontStyle: "normal",
      fontSize: 14,
      minCellHeight: 12,
      valign: "middle",
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
    },
    footStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
    },
    bodyStyles: {
      font: "ChineseSubset", // 明确指定 body 使用中文字体
      fontStyle: "normal",
    },
    theme: "grid",
    foot: [scoreFooters],
  });
}
// 添加页眉函数
function addHeader(doc: any) {
  doc.setFontSize(14);
  doc.text(`姓名：_________`, 156, 13);
}

// 添加页脚函数
function addFooter(doc: any) {
  // const footerText = "—— 认真计算，仔细检查 ——";
  // doc.setFontSize(12);
  // doc.text(footerText, 105, 290, { align: "center" }); // 通常A4纸高度为297mm
}
function reshapeRows(
  rows: [string, string][],
  columns: number = 4,
): string[][] {
  const result: string[][] = [];

  // 每行显示 columns 个题目
  for (let i = 0; i < rows.length; i += columns) {
    const row: string[] = [];
    for (let j = 0; j < columns; j++) {
      if (i + j < rows.length) {
        row.push(rows[i + j][0]); // 只取题目字符串部分
      } else {
        row.push(""); // 填充空字符串
      }
    }
    result.push(row);
  }

  return result;
}

function getTableData(config: Config): [string, string][] {
  const problems: [string, string][] = [];

  // 计算各题型数量
  const addition_count = Math.floor(config.total_count * config.addition.ratio);
  const subtraction_count = Math.floor(
    config.total_count * config.subtraction.ratio,
  );
  const multiplication_count = Math.floor(
    config.total_count * config.multiplication.ratio,
  );
  const division_count = Math.floor(config.total_count * config.division.ratio);
  const division_with_remainder_count = Math.floor(
    config.total_count * config.division_with_remainder.ratio,
  );
  console.log(division_with_remainder_count);
  for (let i = 0; i < addition_count; i++) {
    problems.push(
      new Addition(
        config.addition.range_max,
        config.addition.range_min,
        config.addition.carry,
      ).generate(),
    );
  }
  for (let i = 0; i < subtraction_count; i++) {
    problems.push(
      new Subtraction(
        config.subtraction.range_max,
        config.subtraction.range_min,
        config.subtraction.borrow,
      ).generate(),
    );
  }
  for (let i = 0; i < multiplication_count; i++) {
    problems.push(
      new Multiplication(
        config.multiplication.factor_min,
        config.multiplication.factor_max,
      ).generate(),
    );
  }
  for (let i = 0; i < division_count; i++) {
    problems.push(
      new Division(
        config.division.factor_min,
        config.division.factor_max,
      ).generate(),
    );
  }
  for (let i = 0; i < division_with_remainder_count; i++) {
    problems.push(
      new DivisionWithRemainder(
        config.division_with_remainder.divisor_min,
        config.division_with_remainder.divisor_max,
      ).generate(),
    );
  }
  // 对problem 洗牌，打乱顺序
  problems.sort(() => Math.random() - 0.5);
  return problems;
}
// 在处理请求的文件中;
interface RequestBody {
  level?: string; // 没有level时表示自定义配置
  total_count?: string;
  count?: number;
  start?: number;
  addition_ratio?: string;
  addition_range_min?: string;
  addition_range_max?: string;
  addition_carry?: string;
  subtraction_ratio?: string;
  subtraction_range_min?: string;
  subtraction_range_max?: string;
  subtraction_borrow?: string;
  multiplication_ratio?: string;
  multiplication_factor_min?: string;
  multiplication_factor_max?: string;
  division_ratio?: string;
  division_factor_min?: string;
  division_factor_max?: string;
  division_with_remainder_ratio?: string;
  division_with_remainder_divisor_min?: string;
  division_with_remainder_divisor_max?: string;
  include_answers?: string;
  columns?: string;
}

function getConfig(body: RequestBody): Config {
  const level = body.level;
  if (level === undefined) {
    return _getConfig(body);
  }

  const total = 100;
  const count = 5;
  const columns = 5;

  switch (level) {
    case "1-1":
      // 5以内加法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 1,
          range_min: 0,
          range_max: 5,
          carry: false,
        },
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-2":
      // 10以内加法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 1,
          range_min: 0,
          range_max: 10,
          carry: false,
        },
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-3":
      // 20以内不进位加法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 1,
          range_min: 0,
          range_max: 20,
          carry: false,
        },
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-4":
      // 20以内进位加法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 1,
          range_min: 0,
          range_max: 20,
          carry: true,
        },
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-5":
      // 5以内减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: {
          ratio: 1,
          range_min: 0,
          range_max: 5,
          borrow: false,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-6":
      // 10以内的减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: {
          ratio: 1,
          range_min: 0,
          range_max: 10,
          borrow: false,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-7":
      // 20以内不借位减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: {
          ratio: 1,
          range_min: 0,
          range_max: 20,
          borrow: false,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-8":
      // 20以内借位减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: {
          ratio: 1,
          range_min: 0,
          range_max: 20,
          borrow: true,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-9":
      // 5以内加减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 0.5,
          range_min: 0,
          range_max: 5,
          carry: false,
        },
        subtraction: {
          ratio: 0.5,
          range_min: 0,
          range_max: 5,
          borrow: false,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-10":
      // 10以内加减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 0.5,
          range_min: 0,
          range_max: 10,
          carry: false,
        },
        subtraction: {
          ratio: 0.5,
          range_min: 0,
          range_max: 10,
          borrow: false,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-11":
      // 20以内加减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 0.5,
          range_min: 0,
          range_max: 20,
          carry: false,
        },
        subtraction: {
          ratio: 0.5,
          range_min: 0,
          range_max: 20,
          borrow: false,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-12":
      // 20以内进位/借位加减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 0.5,
          range_min: 0,
          range_max: 20,
          carry: true,
        },
        subtraction: {
          ratio: 0.5,
          range_min: 0,
          range_max: 20,
          borrow: true,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-13":
      // 100以内加法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 1,
          range_min: 10,
          range_max: 100,
          carry: false,
        },
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-14":
      // 100以内进位加法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 1,
          range_min: 10,
          range_max: 100,
          carry: true,
        },
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-15":
      // 100以内减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: {
          ratio: 1,
          range_min: 10,
          range_max: 100,
          borrow: false,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-16":
      // 100以内借位减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: {
          ratio: 1,
          range_min: 10,
          range_max: 100,
          borrow: true,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-17":
      // 100以内加减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 0.5,
          range_min: 10,
          range_max: 100,
          carry: false,
        },
        subtraction: {
          ratio: 0.5,
          range_min: 10,
          range_max: 100,
          borrow: false,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "1-18":
      // 100以内进位/借位加减法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 0.5,
          range_min: 10,
          range_max: 100,
          carry: true,
        },
        subtraction: {
          ratio: 0.5,
          range_min: 10,
          range_max: 100,
          borrow: true,
        },
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "2-1":
      // 5以内乘法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: {
          ratio: 1,
          factor_min: 1,
          factor_max: 5,
        },
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "2-2":
      // 7以内乘法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: {
          ratio: 1,
          factor_min: 2,
          factor_max: 7,
        },
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "2-3":
      // 9以内乘法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: {
          ratio: 1,
          factor_min: 2,
          factor_max: 9,
        },
        division: empty_division_config,
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "2-4":
      // 5以内除法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: {
          ratio: 1,
          factor_min: 1,
          factor_max: 5,
        },
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "2-5":
      // 7以内除法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: {
          ratio: 1,
          factor_min: 2,
          factor_max: 7,
        },
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "2-6":
      // 9以内除法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: {
          ratio: 1,
          factor_min: 2,
          factor_max: 9,
        },
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "2-7":
      // 5以内乘除法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: {
          ratio: 0.5,
          factor_min: 1,
          factor_max: 5,
        },
        division: {
          ratio: 0.5,
          factor_min: 1,
          factor_max: 5,
        },
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "2-8":
      // 7以内乘除法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: {
          ratio: 0.5,
          factor_min: 2,
          factor_max: 7,
        },
        division: {
          ratio: 0.5,
          factor_min: 2,
          factor_max: 7,
        },
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    case "2-9":
      // 9以内乘除法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: {
          ratio: 0.5,
          factor_min: 2,
          factor_max: 9,
        },
        division: {
          ratio: 0.5,
          factor_min: 2,
          factor_max: 9,
        },
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };

    // 有余数除法
    case "3-1":
      // 10以内有余数除法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: {
          ratio: 1,
          divisor_min: 2,
          divisor_max: 5,
        },
        include_answers: false,
        columns: columns,
      };

    case "3-2":
      // 20以内有余数除法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: {
          ratio: 1,
          divisor_min: 2,
          divisor_max: 6,
        },
        include_answers: false,
        columns: columns,
      };

    case "3-3":
      // 50以内有余数除法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: {
          ratio: 1,
          divisor_min: 2,
          divisor_max: 8,
        },
        include_answers: false,
        columns: columns,
      };

    case "3-4":
      // 100以内有余数除法
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: empty_addition_config,
        subtraction: empty_subtraction_config,
        multiplication: empty_multiplication_config,
        division: empty_division_config,
        division_with_remainder: {
          ratio: 1,
          divisor_min: 2,
          divisor_max: 9,
        },
        include_answers: false,
        columns: columns,
      };

    default:
      return {
        total_count: total,
        count: count,
        start: 1,
        addition: {
          ratio: 0.1,
          range_min: 20,
          range_max: 100,
          carry: true,
        },
        subtraction: {
          ratio: 0.1,
          range_min: 20,
          range_max: 100,
          borrow: true,
        },
        multiplication: {
          ratio: 0.4,
          factor_min: 2,
          factor_max: 9,
        },
        division: {
          ratio: 0.4,
          factor_min: 2,
          factor_max: 9,
        },
        division_with_remainder: empty_division_with_remainder_config,
        include_answers: false,
        columns: columns,
      };
  }
}
function _getConfig(body: RequestBody): Config {
  const total_count = parseInt(body.total_count || "100", 10);
  const count = body.count || 10;
  const start = body.start || 1;
  const addition_ratio = parseFloat(body.addition_ratio || "0") / 100;
  const addition_range_min = parseInt(body.addition_range_min || "0", 10);
  const addition_range_max = parseInt(body.addition_range_max || "0", 10);
  const addition_carry = parseBoolean(body.addition_carry);
  const subtraction_ratio = parseFloat(body.subtraction_ratio || "0") / 100;
  const subtraction_range_min = parseInt(
    body.subtraction_range_min || "20",
    10,
  );
  const subtraction_range_max = parseInt(
    body.subtraction_range_max || "100",
    10,
  );
  const subtraction_borrow = parseBoolean(body.subtraction_borrow);
  const multiplication_ratio =
    parseFloat(body.multiplication_ratio || "0") / 100;
  const multiplication_factor_min = parseInt(
    body.multiplication_factor_min || "2",
    10,
  );
  const multiplication_factor_max = parseInt(
    body.multiplication_factor_max || "9",
    10,
  );
  const division_ratio = parseFloat(body.division_ratio || "0") / 100;
  const division_factor_min = parseInt(body.division_factor_min || "2", 10);
  const division_factor_max = parseInt(body.division_factor_max || "9", 10);
  const division_with_remainder_ratio =
    parseFloat(body.division_with_remainder_ratio || "0") / 100;

  const division_with_remainder_divisor_min = parseInt(
    body.division_with_remainder_divisor_min || "2",
    10,
  );
  const division_with_remainder_divisor_max = parseInt(
    body.division_with_remainder_divisor_max || "9",
    10,
  );
  const include_answers = parseBoolean(body.include_answers);
  const columns = parseInt(body.columns || "5", 10);

  return {
    total_count: total_count,
    count: count,
    start: start,
    addition: {
      ratio: addition_ratio,
      range_min: addition_range_min,
      range_max: addition_range_max,
      carry: addition_carry,
    },
    subtraction: {
      ratio: subtraction_ratio,
      range_min: subtraction_range_min,
      range_max: subtraction_range_max,
      borrow: subtraction_borrow,
    },
    multiplication: {
      ratio: multiplication_ratio,
      factor_min: multiplication_factor_min,
      factor_max: multiplication_factor_max,
    },
    division: {
      ratio: division_ratio,
      factor_min: division_factor_min,
      factor_max: division_factor_max,
    },
    division_with_remainder: {
      ratio: division_with_remainder_ratio,
      divisor_min: division_with_remainder_divisor_min,
      divisor_max: division_with_remainder_divisor_max,
    },
    include_answers: include_answers,
    columns: columns,
  };
}
