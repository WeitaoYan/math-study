import { ADSENSE_CLIENT } from "./siteAds";

export interface AdSenseQueue {
  push(value: Record<string, never>): unknown;
  loaded?: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: AdSenseQueue;
  }
}

let scriptReady: Promise<void> | undefined;
let pendingRequest = Promise.resolve();
const requestedUnits = new WeakSet<HTMLElement>();

/** Google 的 push 不指定元素；串行创建并提交，避免同时可见的广告位错配。 */
export function queueAdSenseRequest<T>(initialize: () => Promise<T>): Promise<T> {
  const request = pendingRequest.then(initialize);
  pendingRequest = request.then(() => undefined, () => undefined);
  return request;
}

/** 广告靠近视野时加载一次 Google 脚本。 */
export function loadAdSenseScript(client = ADSENSE_CLIENT): Promise<void> {
  if (scriptReady) return scriptReady;
  if (window.adsbygoogle?.loaded) return Promise.resolve();

  scriptReady = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.siteAdsense = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("AdSense script unavailable")), { once: true });
    document.head.appendChild(script);
  });
  return scriptReady;
}

/** 无宽度、已移除或已经提交的广告不再 push，避免 SPA 导航重复请求。 */
export function requestAdSenseUnit(element: HTMLElement, queue: AdSenseQueue): boolean {
  if (!element.isConnected || element.getBoundingClientRect().width <= 0
    || element.hasAttribute("data-adsbygoogle-status") || element.hasAttribute("data-ad-status")
    || requestedUnits.has(element)) return false;

  requestedUnits.add(element);
  queue.push({});
  return true;
}
