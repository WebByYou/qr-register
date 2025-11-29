import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      title: "ระบบลงทะเบียนและจับฉลาก",
      htmlAttrs: {
        "data-theme": "light",
      },
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;700&display=swap",
        },
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/favicon.svg",
        },
      ],
    },
  },
  routeRules: {
    "/qr-display": {
      headers: {
        "X-Frame-Options": "SAMEORIGIN",
      },
    },
  },
});
