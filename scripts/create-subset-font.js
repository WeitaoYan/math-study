// scripts/create-subset-font.js
import subsetFontModule from "subset-font";
import * as fs from "fs";
import * as path from "path";

console.log("subsetFont module:", Object.keys(subsetFontModule)); // 调试输出

// 尝试不同的导入方式
const subsetFont =
  subsetFontModule.default || subsetFontModule.subsetFont || subsetFontModule;

// 定义你的应用中实际使用的字符
const requiredCharacters = [
  // 数字
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  // 基本汉字
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
  "十",
  "百",
  "千",
  "万",
  "加",
  "减",
  "乘",
  "除",
  "等",
  "于",
  "小",
  "学",
  "生",
  "口",
  "算",
  "题",
  "第",
  "组",
  "姓",
  "名",
  "成",
  "绩",
  "日",
  "期",
  "认",
  "真",
  "计",
  "算",
  "仔",
  "细",
  "检",
  "查",
  "数",
  "学",
  "练",
  "习",
  // 运算符号
  "+",
  "-",
  "×",
  "÷",
  "=",
  "(",
  ")",
  "：",
  // 其他符号
  " ",
  "_",
  "——",
  "______",
  // URL 特殊字符
  ":",
  ".",
  "/",
  // 英文字母（如果需要）
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
].join("");

async function createSubsetFont() {
  try {
    // 读取原始完整字体文件
    const originalFontPath = path.join(
      process.cwd(),
      "scripts/Alibaba-PuHuiTi-Regular.ttf"
    ); // 替换为你的原始字体文件路径
    console.log("正在读取字体文件:", originalFontPath);

    if (!fs.existsSync(originalFontPath)) {
      console.error("❌ 找不到字体文件:", originalFontPath);
      console.log("请确保字体文件存在于该路径");
      return;
    }

    const originalFontBuffer = fs.readFileSync(originalFontPath);

    console.log(
      "原始字体大小:",
      (originalFontBuffer.length / 1024 / 1024).toFixed(2),
      "MB"
    );

    // 检查 subsetFont 是否为函数
    if (typeof subsetFont !== "function") {
      console.error("❌ subsetFont 不是函数，实际类型:", typeof subsetFont);
      console.error("❌ subsetFont 值:", subsetFont);
      return;
    }

    // 创建子集字体
    const subsetBuffer = await subsetFont(
      originalFontBuffer,
      requiredCharacters
    );

    console.log("子集字体大小:", (subsetBuffer.length / 1024).toFixed(2), "KB");

    // 保存子集字体文件
    const outputPath = path.join(
      process.cwd(),
      "app/assets/fonts/chinese-subset.ttf"
    );
    fs.writeFileSync(outputPath, subsetBuffer);

    // 生成Base64编码
    const base64Font = subsetBuffer.toString("base64");

    // 生成字体配置文件
    const configContent = `export const CHINESE_FONT_BASE64 = "${base64Font}";
export const CHINESE_FONT_NAME = "ChineseSubset";`;

    const configPath = path.join(
      process.cwd(),
      "app/assets/fonts/chinese-font.js"
    );
    fs.writeFileSync(configPath, configContent);

    console.log("✅ 子集字体生成完成！");
    console.log("📁 子集字体已保存到:", outputPath);
    console.log("📄 配置文件已保存到:", configPath);
    console.log(
      "📈 字体压缩比:",
      ((1 - subsetBuffer.length / originalFontBuffer.length) * 100).toFixed(2),
      "%"
    );
  } catch (error) {
    console.error("❌ 字体子集生成失败:", error);
  }
}

// 运行生成函数
createSubsetFont();
