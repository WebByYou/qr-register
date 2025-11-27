<script setup lang="ts">
definePageMeta({
  layout: false,
});

const isSpinning = ref(false);
const winner = ref<any>(null);
const displayDigits = ref<string[]>(["0", "0", "0", "0", "0", "0"]);

// BroadcastChannel for receiving updates
let broadcastChannel: BroadcastChannel | null = null;

onMounted(() => {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    broadcastChannel = new BroadcastChannel("lucky-draw-channel");

    // Notify control that display is ready
    broadcastChannel.postMessage({ type: "display-ready" });

    // Listen for draw events
    broadcastChannel.onmessage = (event) => {
      const { type, employeeId, winner: winnerData, duration } = event.data;

      if (type === "start-draw") {
        startAnimation(employeeId, winnerData, duration);
      } else if (type === "show-winner") {
        showWinner(winnerData);
      } else if (type === "reset") {
        resetDisplay();
      }
    };
  }
});

onUnmounted(() => {
  broadcastChannel?.close();
});

const startAnimation = (
  employeeId: string,
  winnerData: any,
  duration: number
) => {
  isSpinning.value = true;
  winner.value = null;

  const intervals: NodeJS.Timeout[] = [];

  displayDigits.value.forEach((_, index) => {
    const interval = setInterval(() => {
      displayDigits.value[index] = Math.floor(Math.random() * 10).toString();
    }, 100);
    intervals.push(interval);

    setTimeout(() => {
      clearInterval(interval);
      displayDigits.value[index] = employeeId[index];
    }, duration - index * 400);
  });

  setTimeout(() => {
    isSpinning.value = false;
  }, duration);
};

const showWinner = (winnerData: any) => {
  winner.value = winnerData;
  isSpinning.value = false;
};

const resetDisplay = () => {
  winner.value = null;
  isSpinning.value = false;
  displayDigits.value = ["0", "0", "0", "0", "0", "0"];
};
</script>

<template>
  <div
    class="fixed inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 overflow-hidden"
  >
    <!-- Decorative Background Elements -->
    <div class="absolute inset-0 opacity-20">
      <div
        class="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute top-40 right-20 w-40 h-40 bg-blue-400 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute bottom-20 left-1/4 w-48 h-48 bg-pink-400 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute bottom-40 right-1/3 w-36 h-36 bg-purple-400 rounded-full blur-3xl"
      ></div>
    </div>

    <!-- Content Container -->
    <div class="relative h-full flex flex-col items-center justify-center p-8">
      <!-- Title -->
      <div class="text-center mb-12">
        <h1
          class="text-7xl md:text-9xl font-black text-white drop-shadow-2xl mb-4 tracking-tight"
        >
          LUCKY DRAW
        </h1>
      </div>

      <!-- Slot Machine Display -->
      <div class="mb-16">
        <div class="flex gap-4 justify-center mb-8">
          <div
            v-for="(digit, index) in displayDigits"
            :key="index"
            class="relative"
          >
            <!-- Digit Card with Glass Effect -->
            <div
              :class="[
                'backdrop-blur-md bg-white/90 rounded-3xl shadow-2xl',
                'w-32 h-48 md:w-44 md:h-64',
                'flex items-center justify-center',
                'border-4 border-white/50',
                'transition-all duration-300',
                isSpinning ? 'scale-105' : 'scale-100',
              ]"
            >
              <span
                :class="[
                  'font-black bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent',
                  'text-8xl md:text-9xl',
                  'transition-all duration-200',
                  isSpinning ? 'blur-sm scale-110' : 'blur-0 scale-100',
                ]"
              >
                {{ digit }}
              </span>
            </div>

            <!-- Glow Effect -->
            <div
              v-if="isSpinning"
              class="absolute inset-0 bg-gradient-to-t from-yellow-400/50 to-transparent rounded-3xl animate-pulse"
            ></div>
          </div>
        </div>

        <!-- Winner Name Display -->
        <div class="text-center min-h-[200px]">
          <div v-if="winner && !isSpinning" class="animate-fade-in">
            <div
              class="backdrop-blur-md bg-white/20 rounded-[3rem] p-12 border-4 border-white/30 shadow-2xl"
            >
              <p class="text-4xl text-white/80 font-bold mb-4">ผู้โชคดี</p>
              <p class="text-8xl font-black text-white drop-shadow-2xl mb-4">
                {{ winner.firstName }} {{ winner.lastName }}
              </p>
              <p class="text-3xl text-white/90 font-bold">
                รหัส: {{ winner.employeeId }}
              </p>

              <!-- Confetti -->
              <div class="text-7xl mt-6 animate-bounce">🎉 🎊 ✨</div>
            </div>
          </div>

          <div
            v-else-if="isSpinning"
            class="text-5xl text-white font-black animate-pulse drop-shadow-lg"
          >
            กำลังสุ่ม...
          </div>

          <div v-else class="text-3xl text-white/60 font-bold drop-shadow-lg">
            รอการสุ่มรางวัล...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
