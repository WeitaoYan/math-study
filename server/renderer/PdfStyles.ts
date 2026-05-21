/**
 * PDF 样式常量
 * 集中管理所有硬编码的字体、颜色、尺寸等样式值
 */
export const PDF_STYLES = {
  /** 页面布局 */
  page: {
    startY: 16,
  },

  /** 标题 */
  title: {
    fontSize: 20,
    y: 12,
  },

  /** 页眉 */
  header: {
    url: "https://study.ikber.cc",
    urlFontSize: 10,
    urlX: 14,
    urlY: 13,
    nameLabel: "姓名：_________",
    nameFontSize: 14,
    nameX: 156,
    nameY: 13,
  },

  /** 表格单元格 */
  cell: {
    fontSize: 14,
    minCellHeight: 12,
  },

  /** 表头/表尾颜色 */
  headerFooter: {
    fillColor: [230, 230, 230] as [number, number, number],
    textColor: [0, 0, 0] as [number, number, number],
  },

  /** 表格主题 */
  tableTheme: "grid" as const,

  /** 字体 */
  font: {
    name: "ChineseSubset" as const,
    style: "normal" as const,
  },
} as const;
