<script setup lang="ts">
import confetti from "canvas-confetti";
const route = useRoute();
const registrationId = computed(() => route.query.id);
onMounted(() => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };
  const interval: any = setInterval(function () {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
});
</script>
<template>
  <div
    class="min-h-[100dvh] flex items-center justify-center bg-white p-4 relative overflow-hidden"
  >
    <div
      class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-50/50 via-white to-white pointer-events-none"
    ></div>
    <div
      class="w-full max-w-md flex flex-col items-center justify-center p-8 relative z-10 text-center"
    >
      <div class="mb-8 relative inline-block">
        <div
          class="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto animate-bounce-slow"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 text-[#00C853]"
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
      <h2 class="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
        ลงทะเบียนสำเร็จ!
      </h2>
      <p class="text-gray-500 mb-10 text-lg">
        ขอบคุณสำหรับการลงทะเบียน<br />ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว
      </p>
      <div class="mb-8 w-full">
        <div
          class="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4"
        >
          ลำดับที่ของคุณ
        </div>
        <div class="text-8xl font-black text-[#00C853] tracking-tighter">
          {{ registrationId || "-" }}
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(-5%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}
.animate-bounce-slow {
  animation: bounce-slow 2s infinite;
}
</style>
