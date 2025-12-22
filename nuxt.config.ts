// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  nitro: {
    preset: "cloudflare_module",
    prerender: {
      crawlLinks: false,
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  modules: ["nitro-cloudflare-dev"],

  css: ["~/assets/global.css"],
});
