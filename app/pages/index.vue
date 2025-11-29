<script setup lang="ts">
definePageMeta({
  layout: "default",
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden"
  >
    <!-- Decorative Background Blob -->
    <div
      class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl pointer-events-none"
    ></div>
    <div
      class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl pointer-events-none"
    ></div>

    <div class="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center z-10">
      <!-- Text Content -->
      <div class="text-center md:text-left space-y-6">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"
            ></span>
          </span>
          ระบบลงทะเบียนออนไลน์
        </div>
        <h1 class="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
          ระบบสุ่ม<br />
          <span class="text-indigo-600">ผู้โชคดี</span>
        </h1>
        <p class="text-lg text-gray-600 leading-relaxed">
          Lucky Draw System ประจำปี 2025 <br />
          ลงทะเบียนง่ายๆ เพียงไม่กี่ขั้นตอน เพื่อลุ้นรับของรางวัลมากมาย
        </p>
        <div
          class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4"
        >
          <NuxtLink
            to="/register"
            class="btn btn-primary btn-lg rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 px-8"
          >
            ลงทะเบียนเลย
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </NuxtLink>
          <NuxtLink
            to="/admin/login"
            class="btn btn-ghost btn-lg rounded-xl text-gray-600 hover:bg-gray-100"
          >
            สำหรับเจ้าหน้าที่
          </NuxtLink>
        </div>
      </div>

      <!-- Illustration / Visual -->
      <div class="relative hidden md:block">
        <div
          class="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl rotate-3 opacity-10 blur-lg"
        ></div>
        <div
          class="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 transform hover:scale-[1.02] transition-transform duration-500"
        >
          <div
            class="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4"
          >
            <div
              class="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v1m6 11h2m-6 0h-2v4h-4v-4H8m13-4V4a1 1 0 00-1-1h-4.372M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v11l-3-3h-6"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-gray-900">รางวัลใหญ่รอคุณอยู่</h3>
              <p class="text-sm text-gray-500">
                ลุ้นรับของรางวัลมูลค่ารวมกว่า 100,000 บาท
              </p>
            </div>
          </div>
          <div class="space-y-3">
            <div class="h-24 bg-gray-50 rounded-xl w-full animate-pulse"></div>
            <div class="flex gap-3">
              <div class="h-8 bg-indigo-50 rounded-lg w-1/3"></div>
              <div class="h-8 bg-gray-50 rounded-lg w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific custom styles if needed, but Tailwind covers most */
</style>
