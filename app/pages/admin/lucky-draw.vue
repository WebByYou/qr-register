<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

const { data: registrations } = await useFetch("/api/registrations", {
  query: {
    limit: 1000,
  },
});

const allRegistrations = computed(() => registrations.value?.data || []);
const isSpinning = ref(false);
const winner = ref<any>(null);
const displayDigits = ref<string[]>(["0", "0", "0", "0", "0", "0"]);
const spinDuration = 5000;

// BroadcastChannel for syncing
let broadcastChannel: BroadcastChannel | null = null;

onMounted(() => {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    broadcastChannel = new BroadcastChannel("lucky-draw-channel");

    broadcastChannel.onmessage = (event) => {
      if (event.data.type === "display-ready") {
        console.log("Display window is ready");
      }
    };
  }
});

onUnmounted(() => {
  broadcastChannel?.close();
});

const openDisplayWindow = () => {
  const displayUrl = window.location.origin + "/admin/lucky-draw/display";
  window.open(displayUrl, "LuckyDrawDisplay", "width=1920,height=1080");
};

const startDraw = () => {
  if (allRegistrations.value.length === 0) {
    alert("ไม่มีผู้ลงทะเบียนในระบบ");
    return;
  }

  isSpinning.value = true;
  winner.value = null;

  const randomIndex = Math.floor(Math.random() * allRegistrations.value.length);
  const selectedWinner = allRegistrations.value[randomIndex];
  const employeeId = selectedWinner.employeeId.padStart(6, "0");

  // Broadcast start event
  broadcastChannel?.postMessage({
    type: "start-draw",
    employeeId,
    winner: selectedWinner,
    duration: spinDuration,
  });

  const intervals: NodeJS.Timeout[] = [];

  displayDigits.value.forEach((_, index) => {
    const interval = setInterval(() => {
      displayDigits.value[index] = Math.floor(Math.random() * 10).toString();
    }, 100);
    intervals.push(interval);

    setTimeout(() => {
      clearInterval(interval);
      displayDigits.value[index] = employeeId[index];
    }, spinDuration - index * 400);
  });

  setTimeout(() => {
    winner.value = selectedWinner;
    isSpinning.value = false;

    broadcastChannel?.postMessage({
      type: "show-winner",
      winner: selectedWinner,
    });
  }, spinDuration);
};

const reset = () => {
  winner.value = null;
  isSpinning.value = false;
  displayDigits.value = ["0", "0", "0", "0", "0", "0"];

  broadcastChannel?.postMessage({
    type: "reset",
  });
};
</script>

<template>
  <div
    class="relative min-h-[calc(100vh-12rem)] bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-2xl overflow-hidden"
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

    <!-- Open Display Button (Floating) -->
    <button
      @click="openDisplayWindow"
      class="absolute top-4 right-4 z-10 btn btn-sm gap-2 bg-white/90 hover:bg-white border-2 border-white/50 shadow-xl backdrop-blur-md"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <span class="hidden sm:inline">เปิดหน้าจอแสดงผล</span>
      <span class="sm:hidden">แสดงผล</span>
    </button>

    <!-- Content Container -->
    <div
      class="relative h-full flex flex-col items-center justify-center p-4 sm:p-8"
    >
      <!-- Title -->
      <div class="text-center mb-6 sm:mb-10">
        <h1
          class="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-2xl mb-3 tracking-tight"
        >
          LUCKY DRAW
        </h1>
        <p
          class="text-lg sm:text-xl md:text-2xl text-white/90 font-bold drop-shadow-lg"
        >
          ผู้เข้าร่วม {{ allRegistrations.length }} คน
        </p>
      </div>

      <!-- Slot Machine Display -->
      <div class="mb-6 sm:mb-12">
        <div class="flex gap-2 sm:gap-3 md:gap-4 justify-center mb-6 sm:mb-8">
          <div
            v-for="(digit, index) in displayDigits"
            :key="index"
            class="relative"
          >
            <!-- Digit Card with Glass Effect -->
            <div
              :class="[
                'backdrop-blur-md bg-white/90 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl',
                'w-14 h-20 sm:w-20 sm:h-28 md:w-28 md:h-40 lg:w-32 lg:h-48',
                'flex items-center justify-center',
                'border-2 sm:border-4 border-white/50',
                'transition-all duration-300',
                isSpinning ? 'scale-105' : 'scale-100',
              ]"
            >
              <span
                :class="[
                  'font-black bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent',
                  'text-3xl sm:text-5xl md:text-6xl lg:text-7xl',
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
              class="absolute inset-0 bg-gradient-to-t from-yellow-400/50 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl animate-pulse"
            ></div>
          </div>
        </div>

        <!-- Winner Name Display -->
        <div class="text-center min-h-[100px] sm:min-h-[140px]">
          <div v-if="winner && !isSpinning" class="animate-fade-in">
            <div
              class="backdrop-blur-md bg-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border-2 sm:border-4 border-white/30 shadow-2xl"
            >
              <p
                class="text-lg sm:text-xl md:text-2xl text-white/80 font-bold mb-2"
              >
                ผู้โชคดี
              </p>
              <p
                class="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl mb-2"
              >
                {{ winner.firstName }} {{ winner.lastName }}
              </p>
              <p
                class="text-base sm:text-xl md:text-2xl text-white/90 font-bold"
              >
                รหัส: {{ winner.employeeId }}
              </p>

              <!-- Confetti -->
              <div
                class="text-3xl sm:text-4xl md:text-5xl mt-3 sm:mt-4 animate-bounce"
              >
                🎉 🎊 ✨
              </div>
            </div>
          </div>

          <div
            v-else-if="isSpinning"
            class="text-2xl sm:text-3xl md:text-4xl text-white font-black animate-pulse drop-shadow-lg"
          >
            กำลังสุ่ม...
          </div>

          <div
            v-else
            class="text-lg sm:text-xl md:text-2xl text-white/60 font-bold drop-shadow-lg"
          >
            กดปุ่มเพื่อเริ่มสุ่มรางวัล
          </div>
        </div>
      </div>

      <!-- Control Button -->
      <div class="flex gap-3 sm:gap-4">
        <button
          v-if="!winner"
          @click="startDraw"
          :disabled="isSpinning || allRegistrations.length === 0"
          :class="[
            'btn btn-md sm:btn-lg gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold',
            'bg-white text-purple-600 hover:bg-white/90',
            'border-2 sm:border-4 border-white/50 shadow-2xl',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-300',
            isSpinning ? 'scale-95' : 'scale-100 hover:scale-105',
          ]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 sm:h-6 sm:w-6"
            :class="{ 'animate-spin': isSpinning }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="hidden sm:inline">{{
            isSpinning ? "กำลังสุ่ม..." : "เริ่มสุ่มรางวัล"
          }}</span>
          <span class="sm:hidden">{{ isSpinning ? "สุ่ม..." : "เริ่ม" }}</span>
        </button>

        <button
          v-if="winner && !isSpinning"
          @click="reset"
          class="btn btn-md sm:btn-lg gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold bg-white/20 text-white hover:bg-white/30 border-2 sm:border-4 border-white/50 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          สุ่มใหม่
        </button>
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
