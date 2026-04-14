import { jsPDF } from "jspdf";
import {
  CHINESE_FONT_BASE64,
  CHINESE_FONT_NAME,
} from "~/assets/fonts/chinese-font.js";

export async function createDoc() {
  try {
    const doc = new jsPDF();

    // 添加字体到虚拟文件系统
    doc.addFileToVFS(`${CHINESE_FONT_NAME}.ttf`, CHINESE_FONT_BASE64);

    // 添加字体，使用 Identity-H 编码处理中文
    const fontName = doc.addFont(
      `${CHINESE_FONT_NAME}.ttf`,
      CHINESE_FONT_NAME,
      "normal",
      "Identity-H"
    );

    // 重要：确保使用正确的字体名称
    doc.setFont(CHINESE_FONT_NAME, "normal");
    return doc;
  } catch (error) {
    // 如果字体加载失败，使用默认字体
    console.error("❌ 字体注册失败:", error);
    return new jsPDF();
  }
}

export function responsePDF(doc: jsPDF, event: any) {
  // 生成 PDF 缓冲区
  const pdfBuffer = doc.output("arraybuffer");

  // 设置响应头 - 正确处理中文文件名
  const filename = "小学生口算练习题.pdf";
  const encodedFilename = encodeURIComponent(filename);

  event.node.res.setHeader("Content-Type", "application/pdf");
  event.node.res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
  );

  // 正确返回PDF内容
  return new Uint8Array(pdfBuffer);
}
