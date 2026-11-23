import { afterEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, reactive, type EffectScope } from "vue";
import { usePdfDownload } from "../app/composables/usePdfDownload";
import { getPdfPageInfo } from "../app/utils/pdfDownload";

let scope: EffectScope | undefined;
afterEach(() => {
  scope?.stop();
  scope = undefined;
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function response() {
  return new Response("%PDF-test", { headers: {
    "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="test.pdf"',
    "X-Worksheet-Question-Pages": "2", "X-Worksheet-Answer-Pages": "0", "X-Worksheet-Total-Pages": "2",
  } });
}

function environment() {
  vi.useFakeTimers();
  const click = vi.fn();
  vi.stubGlobal("document", { createElement: () => ({ click, remove: vi.fn() }), body: { appendChild: vi.fn() } });
  vi.stubGlobal("window", { setTimeout: globalThis.setTimeout });
  let number = 0;
  const createUrl = vi.spyOn(URL, "createObjectURL").mockImplementation(() => `blob:test-${++number}`);
  const revokeUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  return { click, createUrl, revokeUrl };
}

describe("真实打印预览与下载缓存", () => {
  it("预览后下载不重新出题，修改配置后重建PDF", async () => {
    const { click, createUrl } = environment();
    const fetchMock = vi.fn(async () => response());
    vi.stubGlobal("fetch", fetchMock);
    const payload = reactive({ worksheet_type: "vertical", count: 2, workspace_height_mm: 55 });
    scope = effectScope();
    const pdf = scope.run(() => usePdfDownload(() => ({ ...payload })))!;
    await pdf.previewPdf({ ...payload }, "test.pdf");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(pdf.downloadSuccess.value).toBe(false);
    expect(pdf.previewUrl.value).toBe("blob:test-1");
    expect(pdf.pageInfo.value).toEqual({ questionPages: 2, answerPages: 0, totalPages: 2 });
    await pdf.downloadPdf({ ...payload }, "test.pdf");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledOnce();
    expect(createUrl.mock.calls[0]![0]).toBe(createUrl.mock.calls[1]![0]);
    expect(pdf.downloadSuccess.value).toBe(true);
    payload.workspace_height_mm = 75;
    await nextTick();
    expect(pdf.previewStale.value).toBe(true);
    expect(pdf.downloadSuccess.value).toBe(false);
    await pdf.downloadPdf({ ...payload }, "test.pdf");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(pdf.previewStale.value).toBe(false);
  });

  it("生成期间改变配置，旧响应不能成为可打印的当前预览", async () => {
    environment();
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const payload = reactive({ count: 2 });
    scope = effectScope();
    const pdf = scope.run(() => usePdfDownload(() => ({ ...payload })))!;
    const request = pdf.previewPdf({ ...payload }, "test.pdf");
    payload.count = 3;
    await nextTick();
    finish(response());
    await request;
    expect(pdf.previewStale.value).toBe(true);
    expect(pdf.downloadSuccess.value).toBe(false);
  });

  it("页面离开时释放预览URL", async () => {
    const { revokeUrl } = environment();
    vi.stubGlobal("fetch", vi.fn(async () => response()));
    scope = effectScope();
    const pdf = scope.run(() => usePdfDownload())!;
    await pdf.previewPdf({ count: 1 }, "test.pdf");
    scope.stop();
    expect(revokeUrl).toHaveBeenCalledWith("blob:test-1");
  });

  it("缺失或矛盾的页数响应头不产生错误计数", () => {
    vi.useFakeTimers();
    expect(getPdfPageInfo(new Headers())).toBeNull();
    expect(getPdfPageInfo(new Headers({ "X-Worksheet-Question-Pages": "2", "X-Worksheet-Answer-Pages": "2", "X-Worksheet-Total-Pages": "4" }))).toEqual({ questionPages: 2, answerPages: 2, totalPages: 4 });
    expect(getPdfPageInfo(new Headers({ "X-Worksheet-Question-Pages": "2", "X-Worksheet-Answer-Pages": "2", "X-Worksheet-Total-Pages": "2" }))).toBeNull();
  });
});
