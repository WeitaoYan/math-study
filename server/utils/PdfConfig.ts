import { readFileSync } from "fs";
import { jsPDF } from "jspdf";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

/**
 * 加载字体文件并转换为base64格式
 * @returns base64编码的字体数据
 */
let cachedFontBase64: string | null = null;
// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadFontBase64(): Promise<string> {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }

  try {
    // 尝试多个可能的路径，包括开发环境和生产环境
    const possiblePaths = [
      // 开发环境路径
      join(__dirname, "..", "public", "fonts", "sourcehansanscn-normal.ttf"),
      join(process.cwd(), "public", "fonts", "sourcehansanscn-normal.ttf"),
      // Nuxt 生产环境路径
      join(
        process.cwd(),
        ".output",
        "public",
        "fonts",
        "sourcehansanscn-normal.ttf"
      ),
      join(
        process.cwd(),
        ".output",
        "server",
        "public",
        "fonts",
        "sourcehansanscn-normal.ttf"
      ),
      // 服务器部署路径
      join("/app", "public", "fonts", "sourcehansanscn-normal.ttf"),
    ];

    for (const fontPath of possiblePaths) {
      try {
        const fontBuffer = readFileSync(fontPath);
        cachedFontBase64 = fontBuffer.toString("base64");
        console.log(`字体文件加载成功: ${fontPath}`);
        return cachedFontBase64;
      } catch (e) {
        console.log(`尝试字体路径失败: ${fontPath}`);
        continue;
      }
    }

    throw new Error("所有字体路径都尝试失败");
  } catch (error) {
    console.error("字体加载失败:", error);
    throw error;
  }
}

export async function createDoc() {
  try {
    const fontBase64 = await loadFontBase64();

    // 创建 PDF 文档
    const doc = new jsPDF();

    // 注册中文字体
    doc.addFileToVFS("sourcehansanscn-normal.ttf", fontBase64);
    doc.addFont("sourcehansanscn-normal.ttf", "SourceHanSansCN", "normal");

    // 使用字体
    doc.setFont("SourceHanSansCN");

    return doc;
  } catch (error) {
    console.warn("使用默认字体，因为自定义字体加载失败:", error);
    // 如果字体加载失败，使用默认字体
    return new jsPDF();
  }
}

export function responsePDF(doc: jsPDF, event: any) {
  // 生成 PDF 缓冲区
  const pdfBuffer = doc.output("arraybuffer");

  // 设置响应头 - 正确处理中文文件名
  const filename = "数学练习题.pdf";
  const encodedFilename = encodeURIComponent(filename);

  event.node.res.setHeader("Content-Type", "application/pdf");
  event.node.res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
  );

  // 正确返回PDF内容
  return new Uint8Array(pdfBuffer);
}
