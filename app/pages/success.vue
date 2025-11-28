<script setup lang="ts">
const route = useRoute();
const registrationId = computed(() => route.query.id);
</script>

<template>
  <div
    class="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4 overflow-hidden"
  >
    <div
      class="w-full max-w-md flex flex-col items-center justify-center p-6 md:p-10"
    >
      <!-- Success Icon with Animation -->
      <div class="mb-6 relative inline-block">
        <div
          class="absolute inset-0 bg-white/20 rounded-full animate-ping"
        ></div>
        <div
          class="relative w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 text-white drop-shadow-md"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <h2
        class="text-5xl font-black text-white mb-4 drop-shadow-lg tracking-tight text-center"
      >
        ลงทะเบียนสำเร็จ!
      </h2>

      <p
        class="text-white/90 text-xl mb-12 font-light tracking-wide text-center"
      >
        ขอบคุณสำหรับการลงทะเบียน
      </p>

      <!-- Registration ID Display -->
      <div
        class="mb-8 transform hover:scale-105 transition-transform duration-300 flex flex-col items-center"
      >
        <div
          class="text-white/80 text-sm font-bold uppercase tracking-[0.2em] mb-2 pl-[0.2em]"
        >
          ลำดับที่
        </div>
        <div
          class="text-7xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-2xl filter break-all text-center"
          style="text-shadow: 0 4px 20px rgba(234, 179, 8, 0.5)"
        >
          {{ registrationId || "-" }}
        </div>
      </div>
    </div>
  </div>
</template>
