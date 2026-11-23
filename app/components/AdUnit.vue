<template>
  <section ref="container" v-show="!collapsed" class="ad-unit" :class="[`ad-unit--${placement}`, { 'is-empty': empty }]" :data-ad-slot="slot" aria-label="广告">
    <div class="ad-unit-label"><span>广告</span></div>
    <div class="ad-unit-content">
      <ins v-if="renderAd" ref="adElement" class="adsbygoogle" style="display:block;width:100%;height:100%" :data-ad-client="client" :data-ad-slot="slot"></ins>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { loadAdSenseScript, queueAdSenseRequest, requestAdSenseUnit } from "../utils/adsense";
import { ADSENSE_CLIENT, isUnfilledAd } from "../utils/siteAds";

const props = withDefaults(
  defineProps<{
    slot: string;
    client?: string;
    placement?: "banner" | "sidebar";
  }>(),
  {
    client: ADSENSE_CLIENT,
    placement: "banner",
  },
);

const container = ref<HTMLElement>();
const adElement = ref<HTMLElement>();
const renderAd = ref(false);
const empty = ref(false);
const collapsed = ref(false);
let disposed = false;
let loadingScript = false;
let requested = false;
let nearViewport = false;
let intersection: IntersectionObserver | undefined;
let resize: ResizeObserver | undefined;
let status: MutationObserver | undefined;
let emptyVisibility: IntersectionObserver | undefined;

function isStillNearViewport(element: HTMLElement): boolean {
  if (!intersection) return true;
  const bounds = element.getBoundingClientRect();
  return bounds.bottom >= -200 && bounds.top <= window.innerHeight + 200;
}

function hideEmptyUnit() {
  empty.value = true;
  const element = container.value;
  if (!element) return;
  const bounds = element.getBoundingClientRect();
  // 视野内保留已分配的高度，离开视野后收起，避免表单突然上下跳动。
  if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) collapsed.value = true;
  else if (typeof IntersectionObserver !== "undefined") {
    emptyVisibility ??= new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) {
        collapsed.value = true;
        emptyVisibility?.disconnect();
      }
    });
    emptyVisibility.observe(element);
  }
  intersection?.disconnect();
  resize?.disconnect();
}

async function initialize() {
  const wrapper = container.value;
  const content = wrapper?.querySelector<HTMLElement>(".ad-unit-content");
  if (disposed || requested || loadingScript || empty.value || !nearViewport || !wrapper
    || !wrapper.isConnected || !content || content.getBoundingClientRect().width <= 0) return;

  loadingScript = true;
  try {
    await loadAdSenseScript(props.client);
    await queueAdSenseRequest(async () => {
      if (disposed || !wrapper.isConnected || !nearViewport || !isStillNearViewport(wrapper)
        || content.getBoundingClientRect().width <= 0) return;
      // 尚未接近视野的广告不放入 Google 的待处理元素列表。
      renderAd.value = true;
      await nextTick();
      const element = adElement.value;
      if (disposed || !element?.isConnected || !isStillNearViewport(wrapper)
        || element.getBoundingClientRect().width <= 0) {
        renderAd.value = false;
        await nextTick();
        return;
      }
      status ??= new MutationObserver(() => {
        if (isUnfilledAd(element.getAttribute("data-ad-status"))) hideEmptyUnit();
      });
      status.observe(element, { attributes: true, attributeFilter: ["data-ad-status"] });
      try {
        window.adsbygoogle ||= [];
        requested = requestAdSenseUnit(element, window.adsbygoogle);
      } catch (error) {
        // 失败的待处理元素也须移除，不能被下一广告位的 push 错误选中。
        renderAd.value = false;
        await nextTick();
        throw error;
      }
      if (requested) {
        intersection?.disconnect();
        resize?.disconnect();
      }
    });
  } catch {
    if (!disposed) hideEmptyUnit();
  } finally {
    loadingScript = false;
  }
}

onMounted(() => {
  const wrapper = container.value;
  if (!wrapper) return;

  if (typeof ResizeObserver !== "undefined") {
    resize = new ResizeObserver(() => { void initialize(); });
    resize.observe(wrapper.querySelector(".ad-unit-content")!);
  }
  if (typeof IntersectionObserver !== "undefined") {
    intersection = new IntersectionObserver(([entry]) => {
      nearViewport = !!entry?.isIntersecting;
      if (nearViewport) void initialize();
    }, { rootMargin: "200px 0px" });
    intersection.observe(wrapper);
  } else {
    nearViewport = true;
    void initialize();
  }
});

onBeforeUnmount(() => {
  disposed = true;
  intersection?.disconnect();
  resize?.disconnect();
  status?.disconnect();
  emptyVisibility?.disconnect();
});
</script>

<style scoped>
.ad-unit { width: 100%; min-width: 0; padding: 12px 14px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-card); background: #fbfcfa; }
.ad-unit--banner { margin: 28px 0; }
.ad-unit-label { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 9px; font-size: 10px; line-height: 14px; color: #88958b; }
.ad-unit-label > span:first-child { letter-spacing: 2px; }
.ad-unit-content { width: 100%; max-width: 970px; height: 90px; margin: 0 auto; }
.ad-unit--sidebar .ad-unit-content { max-width: 300px; height: 250px; }
.ad-unit.is-empty { border-color: transparent; background: transparent; }
.ad-unit.is-empty .ad-unit-label, .ad-unit.is-empty .ad-unit-content { visibility: hidden; }
@media (max-width: 900px) {
  .ad-unit--sidebar .ad-unit-content { max-width: 970px; height: 100px; }
}
@media (max-width: 640px) {
  .ad-unit { padding: 11px 12px 12px; }
  .ad-unit--banner { margin: 24px 0; }
  .ad-unit-content { height: 100px; }
}
@media print { .ad-unit { display: none !important; } }
</style>
