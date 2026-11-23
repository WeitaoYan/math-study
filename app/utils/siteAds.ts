/** 沿用正式站的 AdSense 账户与广告位，不创建新的广告 ID。 */
export const ADSENSE_CLIENT = "ca-pub-7935584531479999";

export const SITE_AD_SLOTS = {
  homeIntro: "2080529466",
  homeGuide: "5119335358",
  customOral: "3423110309",
  oral: "2082108475",
  steps: "4544620286",
  // 新竖式页复用原布局顶部的自适应广告位，顶部不再放广告。
  vertical: "4500388259",
  footer: "8398525801",
} as const;

export function isUnfilledAd(status: string | null): boolean {
  // unfill-optimized 仍由 Google 管理，不能当作空白广告隐藏。
  return status === "unfilled";
}
