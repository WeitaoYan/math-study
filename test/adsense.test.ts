import { afterEach, describe, expect, it, vi } from "vitest";
import { queueAdSenseRequest, requestAdSenseUnit } from "../app/utils/adsense";
import { ADSENSE_CLIENT, SITE_AD_SLOTS, isUnfilledAd } from "../app/utils/siteAds";

function adElement(width = 300, attributes: string[] = []) {
  const box = { width };
  const element = {
    isConnected: true,
    getBoundingClientRect: () => box,
    hasAttribute: (name: string) => attributes.includes(name),
  };
  return { element: element as unknown as HTMLElement, box };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("AdSense 接入与版式保护", () => {
  it("所有启用广告位都来自原正式站，恢复原口算和脱式广告位", () => {
    expect(ADSENSE_CLIENT).toBe("ca-pub-7935584531479999");
    expect(SITE_AD_SLOTS).toEqual({
      homeIntro: "2080529466", homeGuide: "5119335358", customOral: "3423110309",
      oral: "2082108475", steps: "4544620286", vertical: "4500388259", footer: "8398525801",
    });
    expect(new Set(Object.values(SITE_AD_SLOTS)).size).toBe(Object.keys(SITE_AD_SLOTS).length);
  });

  it("无宽度时不提交广告，宽度恢复后仍可正常提交", () => {
    const { element, box } = adElement(0);
    const queue = { push: vi.fn() };
    expect(requestAdSenseUnit(element, queue)).toBe(false);
    box.width = 300;
    expect(requestAdSenseUnit(element, queue)).toBe(true);
    expect(queue.push).toHaveBeenCalledExactlyOnceWith({});
  });

  it("路由切换后已移除的元素与 Google 已处理的元素不再提交", () => {
    const removed = adElement().element;
    Object.defineProperty(removed, "isConnected", { value: false });
    const queue = { push: vi.fn() };
    for (const element of [removed, adElement(300, ["data-adsbygoogle-status"]).element, adElement(300, ["data-ad-status"]).element]) {
      expect(requestAdSenseUnit(element, queue)).toBe(false);
    }
    expect(queue.push).not.toHaveBeenCalled();
  });

  it("同一广告元素只 push 一次，新页面的新元素仍可提交", () => {
    const first = adElement().element;
    const second = adElement().element;
    const queue = { push: vi.fn() };
    expect(requestAdSenseUnit(first, queue)).toBe(true);
    expect(requestAdSenseUnit(first, queue)).toBe(false);
    expect(requestAdSenseUnit(second, queue)).toBe(true);
    expect(queue.push).toHaveBeenCalledTimes(2);
  });

  it("广告 push 抛错后不重复提交，避免影响页面其他操作", () => {
    const element = adElement().element;
    const queue = { push: vi.fn(() => { throw new Error("AdSense unavailable"); }) };
    expect(() => requestAdSenseUnit(element, queue)).toThrow("AdSense unavailable");
    expect(requestAdSenseUnit(element, queue)).toBe(false);
    expect(queue.push).toHaveBeenCalledTimes(1);
  });

  it("只隐藏明确的空广告，不隐藏已填充或 Google 优化的广告", () => {
    expect(isUnfilledAd("unfilled")).toBe(true);
    for (const status of [null, "filled", "unfill-optimized"]) expect(isUnfilledAd(status)).toBe(false);
  });

  it("串行挂载并提交广告，防止同时可见的广告位被 Google push 错配", async () => {
    const events: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const first = queueAdSenseRequest(async () => { events.push("first:start"); await gate; events.push("first:end"); });
    const second = queueAdSenseRequest(async () => { events.push("second"); });
    await Promise.resolve();
    expect(events).toEqual(["first:start"]);
    release();
    await Promise.all([first, second]);
    expect(events).toEqual(["first:start", "first:end", "second"]);
  });

  it("一个广告初始化失败不会阻塞其他广告位", async () => {
    const failed = queueAdSenseRequest(async () => { throw new Error("One ad failed"); });
    const failure = expect(failed).rejects.toThrow("One ad failed");
    const next = queueAdSenseRequest(async () => "next ad");
    await failure;
    expect(await next).toBe("next ad");
  });

  it("多个广告位并发加载时只插入一份 Google 脚本", async () => {
    vi.resetModules();
    const { loadAdSenseScript } = await import("../app/utils/adsense");
    const listeners = new Map<string, () => void>();
    const script = { src: "", async: false, crossOrigin: "", dataset: {} as Record<string, string>, addEventListener: vi.fn((event: string, callback: () => void) => listeners.set(event, callback)) };
    const append = vi.fn();
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { createElement: vi.fn(() => script), head: { appendChild: append } });
    const first = loadAdSenseScript();
    const second = loadAdSenseScript();
    expect(first).toBe(second);
    expect(append).toHaveBeenCalledTimes(1);
    expect(script.src).toBe(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`);
    expect(script.async).toBe(true);
    expect(script.crossOrigin).toBe("anonymous");
    listeners.get("load")!();
    await Promise.all([first, second]);
  });

  it("脚本被拦截时返回可处理的失败，不反复加载", async () => {
    vi.resetModules();
    const { loadAdSenseScript } = await import("../app/utils/adsense");
    const listeners = new Map<string, () => void>();
    const append = vi.fn();
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { createElement: () => ({ dataset: {}, addEventListener: (event: string, callback: () => void) => listeners.set(event, callback) }), head: { appendChild: append } });
    const first = loadAdSenseScript();
    const failure = expect(first).rejects.toThrow("AdSense script unavailable");
    listeners.get("error")!();
    await failure;
    expect(loadAdSenseScript()).toBe(first);
    expect(append).toHaveBeenCalledTimes(1);
  });

  it("已由 Google 加载的脚本不重复插入", async () => {
    vi.resetModules();
    const { loadAdSenseScript } = await import("../app/utils/adsense");
    const append = vi.fn();
    vi.stubGlobal("window", { adsbygoogle: { loaded: true } });
    vi.stubGlobal("document", { head: { appendChild: append } });
    await loadAdSenseScript();
    expect(append).not.toHaveBeenCalled();
  });
});
