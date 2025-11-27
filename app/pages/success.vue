<script setup lang="ts">
definePageMeta({
  layout: "default",
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body items-center text-center">
        <div
          class="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-10 w-10 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 class="card-title text-2xl font-bold text-success">
          ลงทะเบียนสำเร็จ!
        </h2>
        <p class="text-base-content/70">ขอบคุณสำหรับการลงทะเบียน</p>
        <div class="card-actions justify-end mt-6">
          <NuxtLink to="/register" class="btn btn-primary w-full"
            >กลับหน้าลงทะเบียน</NuxtLink
          >
        </div>
      </div>
    </div>
  </div>
</template>
