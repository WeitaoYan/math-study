export interface ArithmeticPreset {
  level: string;
  title: string;
  desc: string;
}

export interface ArithmeticPresetCategory {
  title: string;
  symbol: string;
  description: string;
  presets: ArithmeticPreset[];
}

/** 前后端共用的口算题型目录，原有 37 个 level ID 不变。 */
export const ARITHMETIC_PRESET_CATEGORIES: ArithmeticPresetCategory[] = [
  {
    title: "20以内加减法", symbol: "+", description: "从基础计算到进位、借位，循序渐进。",
    presets: [
      { level: "1-1", title: "5以内加法", desc: "基础加法练习" },
      { level: "1-2", title: "10以内加法", desc: "简单加法运算" },
      { level: "1-3", title: "20以内不进位加法", desc: "无进位加法练习" },
      { level: "1-4", title: "20以内进位加法", desc: "包含进位的加法" },
      { level: "1-5", title: "5以内减法", desc: "基础减法练习" },
      { level: "1-6", title: "10以内减法", desc: "简单减法运算" },
      { level: "1-7", title: "20以内不借位减法", desc: "无借位减法练习" },
      { level: "1-8", title: "20以内借位减法", desc: "包含借位的减法" },
    ],
  },
  {
    title: "综合加减法", symbol: "±", description: "将加法与减法组合，练习运算转换。",
    presets: [
      { level: "1-9", title: "5以内加减法", desc: "混合加减法练习" },
      { level: "1-10", title: "10以内加减法", desc: "简单混合运算" },
      { level: "1-11", title: "20以内加减法", desc: "标准混合运算" },
      { level: "1-12", title: "20以内进位/借位加减法", desc: "复杂混合运算" },
    ],
  },
  {
    title: "100以内加减法", symbol: "100", description: "两位数计算，巩固进位和借位。",
    presets: [
      { level: "1-13", title: "100以内加法", desc: "两位数加法练习" },
      { level: "1-14", title: "100以内进位加法", desc: "包含进位的加法" },
      { level: "1-15", title: "100以内减法", desc: "两位数减法练习" },
      { level: "1-16", title: "100以内借位减法", desc: "包含借位的减法" },
      { level: "1-17", title: "100以内加减法", desc: "标准混合运算" },
      { level: "1-18", title: "100以内进位/借位加减法", desc: "复杂混合运算" },
    ],
  },
  {
    title: "乘除法", symbol: "×", description: "从单项训练到乘除混合，熟练运用口诀。",
    presets: [
      { level: "2-1", title: "5以内乘法", desc: "基础乘法练习" },
      { level: "2-2", title: "7以内乘法", desc: "简单乘法运算" },
      { level: "2-3", title: "9以内乘法", desc: "标准乘法练习" },
      { level: "2-4", title: "5以内除法", desc: "基础除法练习" },
      { level: "2-5", title: "7以内除法", desc: "简单除法运算" },
      { level: "2-6", title: "9以内除法", desc: "标准除法练习" },
      { level: "2-7", title: "5以内乘除法", desc: "混合乘除法练习" },
      { level: "2-8", title: "7以内乘除法", desc: "简单混合运算" },
      { level: "2-9", title: "9以内乘除法", desc: "标准混合运算" },
    ],
  },
  {
    title: "有余数除法", symbol: "÷", description: "同时练习求商与余数，理解除法关系。",
    presets: [
      { level: "3-1", title: "10以内有余数除法", desc: "被除数≤10，除数2-5" },
      { level: "3-2", title: "20以内有余数除法", desc: "被除数≤20，除数2-6" },
      { level: "3-3", title: "50以内有余数除法", desc: "被除数≤50，除数2-8" },
      { level: "3-4", title: "100以内有余数除法", desc: "被除数≤100，除数2-9" },
    ],
  },
  {
    title: "整十整百口算", symbol: "10", description: "用整十、整百数练习，更清楚地理解数位。",
    presets: [
      { level: "4-1", title: "整十加法", desc: "1000以内，如 380+540=920" },
      { level: "4-2", title: "整十减法", desc: "1000以内，如 810-370=440" },
      { level: "4-3", title: "整十加减混合", desc: "1000以内整十数混合运算" },
      { level: "4-4", title: "整百加法", desc: "10000以内，如 3500+5900=9400" },
      { level: "4-5", title: "整百减法", desc: "10000以内，如 8400-3800=4600" },
      { level: "4-6", title: "整百加减混合", desc: "10000以内整百数混合运算" },
    ],
  },
];

export const ARITHMETIC_PRESETS = ARITHMETIC_PRESET_CATEGORIES.flatMap((category) => category.presets);
