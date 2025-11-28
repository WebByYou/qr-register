<script setup lang="ts">
import confetti from "canvas-confetti";

definePageMeta({
  layout: false,
});

const isSpinning = ref(false);
const winner = ref<any>(null);
const winnersList = ref<any[]>([]);
const displayDigits = ref<string[]>(["0", "0", "0", "0", "0", "0"]);
const connectionStatus = ref("Initializing...");
const lastMessageType = ref("");
const debugLogs = ref<string[]>([]);
const showDebug = ref(false);

const settings = ref({
  title: "จับฉลากผู้โชคดี",
  subtitle: "งานเลี้ยงปีใหม่ ๒๕๖๙",
  waitText: "รอการสุ่มรางวัล...",
});

const isLoading = ref(true);

const loadSettings = async () => {
  try {
    const response: any = await $fetch("/api/qr-display/settings");
    if (response?.success && response?.data) {
      settings.value = {
        ...settings.value,
        ...response.data,
      };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadSettings();

  // Subscribe to SSE stream
  let eventSource: EventSource | null = null;
  if (typeof window !== "undefined") {
    eventSource = new EventSource("/api/qr-display/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Update settings if changed
        if (data.title || data.subtitle || data.waitText) {
          settings.value = {
            ...settings.value,
            ...data,
          };
        }
      } catch (e) {
        console.error("Error parsing SSE data:", e);
      }
    };
  }

  const route = useRoute();
  if (route.query.debug === "true") {
    showDebug.value = true;
  }
});

const addLog = (msg: string) => {
  debugLogs.value.unshift(`${new Date().toLocaleTimeString()} - ${msg}`);
  if (debugLogs.value.length > 20) debugLogs.value.pop();
};

const fireConfetti = () => {
  const duration = 5 * 1000;
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
      colors: ["#FFD700", "#C0C0C0", "#DAA520"], // Gold, Silver, Goldenrod
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      colors: ["#FFD700", "#C0C0C0", "#DAA520"],
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

const showWinner = (winnerData: any) => {
  addLog("Showing winner");
  winner.value = winnerData;
  isSpinning.value = false;
  fireConfetti();
};

const resetDisplay = () => {
  addLog("Resetting display");
  winner.value = null;
  isSpinning.value = false;
  displayDigits.value = ["0", "0", "0", "0", "0", "0"];
};

const startAnimation = (
  employeeId: string,
  winnerData: any,
  duration: number
) => {
  isSpinning.value = true;
  winner.value = null;

  // Reset digits to random before starting, matching the length of the employeeId
  displayDigits.value = new Array(employeeId.length)
    .fill("0")
    .map(() => Math.floor(Math.random() * 10).toString());

  const intervals: NodeJS.Timeout[] = [];
  intervals.forEach(clearInterval);
  intervals.length = 0;

  displayDigits.value.forEach((_, index) => {
    const interval = setInterval(() => {
      displayDigits.value[index] = Math.floor(Math.random() * 10).toString();
    }, 50);
    intervals.push(interval);

    const stopTime = duration - (5 - index) * 600;

    setTimeout(() => {
      clearInterval(interval);
      displayDigits.value[index] = employeeId[index] || "0";
    }, stopTime);
  });

  setTimeout(() => {
    isSpinning.value = false;
  }, duration);
};

const handleMessage = (data: any) => {
  lastMessageType.value = data.type;
  addLog(`Received: ${data.type}`);

  const {
    type,
    employeeId,
    winner: winnerData,
    duration,
    winnersList: newWinnersList,
  } = data;

  if (newWinnersList) {
    winnersList.value = newWinnersList;
  }

  if (type === "start-draw") {
    addLog(`Starting draw for ${employeeId}`);
    startAnimation(employeeId, winnerData, duration);
  } else if (type === "show-winner") {
    showWinner(winnerData);
  } else if (type === "reset") {
    resetDisplay();
  } else if (type === "sync-state") {
    addLog("State synced");
  }
};

let broadcastChannel: BroadcastChannel | null = null;

onMounted(() => {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    connectionStatus.value = "BroadcastChannel Ready";
    broadcastChannel = new BroadcastChannel("lucky-draw-channel");
    broadcastChannel.postMessage({ type: "display-ready" });
    broadcastChannel.onmessage = (event) => {
      connectionStatus.value = "BC Message Received";
      handleMessage(event.data);
    };
  }

  window.addEventListener("message", (event) => {
    connectionStatus.value = "PostMessage Received";
    handleMessage(event.data);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === "lucky-draw-event" && event.newValue) {
      connectionStatus.value = "Storage Event Received";
      try {
        const data = JSON.parse(event.newValue);
        handleMessage(data);
      } catch (e) {
        console.error("Error parsing storage event data", e);
      }
    }
  });
});

onUnmounted(() => {
  broadcastChannel?.close();
  window.removeEventListener("message", (event) => handleMessage(event.data));
});
</script>

<template>
  <div class="fixed inset-0 overflow-hidden bg-[#2D0A0A] font-sarabun">
    <!-- Thai Pattern Background -->
    <div
      class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"
    ></div>
    <div
      class="absolute inset-0 bg-gradient-to-b from-[#4A0404] via-[#2D0A0A] to-[#1A0000] opacity-95"
    ></div>

    <!-- Decorative Thai Kanok (CSS Shapes) -->
    <div class="absolute top-0 left-0 w-48 h-48 pointer-events-none">
      <div
        class="absolute top-0 left-0 w-full h-full border-t-[8px] border-l-[8px] border-[#FFD700] rounded-tl-3xl opacity-80"
      ></div>
      <div
        class="absolute top-4 left-4 w-32 h-32 border-t-[2px] border-l-[2px] border-[#DAA520] rounded-tl-2xl opacity-60"
      ></div>
      <!-- Kanok motif simulation -->
      <div
        class="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#FFD700] to-transparent opacity-20 blur-xl"
      ></div>
    </div>

    <div
      class="absolute top-0 right-0 w-48 h-48 pointer-events-none transform scale-x-[-1]"
    >
      <div
        class="absolute top-0 left-0 w-full h-full border-t-[8px] border-l-[8px] border-[#FFD700] rounded-tl-3xl opacity-80"
      ></div>
      <div
        class="absolute top-4 left-4 w-32 h-32 border-t-[2px] border-l-[2px] border-[#DAA520] rounded-tl-2xl opacity-60"
      ></div>
      <div
        class="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#FFD700] to-transparent opacity-20 blur-xl"
      ></div>
    </div>

    <!-- Bottom Corners -->
    <div
      class="absolute bottom-0 left-0 w-48 h-48 pointer-events-none transform scale-y-[-1]"
    >
      <div
        class="absolute top-0 left-0 w-full h-full border-t-[8px] border-l-[8px] border-[#FFD700] rounded-tl-3xl opacity-80"
      ></div>
    </div>
    <div
      class="absolute bottom-0 right-0 w-48 h-48 pointer-events-none transform scale-[-1]"
    >
      <div
        class="absolute top-0 left-0 w-full h-full border-t-[8px] border-l-[8px] border-[#FFD700] rounded-tl-3xl opacity-80"
      ></div>
    </div>

    <!-- Debug Overlay -->
    <div
      v-if="showDebug"
      class="absolute top-0 left-0 p-4 z-50 pointer-events-none"
    >
      <div class="bg-black/50 text-white p-2 rounded text-xs font-mono">
        <p>
          Status:
          <span
            :class="
              connectionStatus === 'Connected'
                ? 'text-green-400'
                : 'text-red-400'
            "
            >{{ connectionStatus }}</span
          >
        </p>
        <p>Last Message: {{ lastMessageType || "None" }}</p>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="relative h-full flex z-10">
      <!-- Left Column: Slot Machine (75%) -->
      <div
        class="w-3/4 h-full flex flex-col items-center justify-center p-8 border-r border-[#FFD700]/30"
      >
        <!-- Header -->
        <div class="text-center mb-16 relative">
          <div v-if="isLoading" class="flex flex-col items-center gap-4">
            <div
              class="h-24 w-3/4 bg-[#FFD700]/20 rounded-lg animate-pulse"
            ></div>
            <div
              class="h-8 w-1/2 bg-[#FFD700]/20 rounded-lg animate-pulse"
            ></div>
          </div>
          <template v-else>
            <h1
              class="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] via-[#FCEEAC] to-[#DAA520] drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-wide mb-4 py-4 leading-relaxed"
            >
              {{ settings.title }}
            </h1>
            <div class="flex items-center justify-center gap-4">
              <div class="h-[2px] w-12 bg-[#FFD700]"></div>
              <p
                class="text-2xl md:text-3xl text-[#FFD700] font-light tracking-widest pt-2"
              >
                {{ settings.subtitle }}
              </p>
              <div class="h-[2px] w-12 bg-[#FFD700]"></div>
            </div>
          </template>
        </div>

        <!-- Slot Machine Frame -->
        <div
          class="relative p-8 rounded-[1rem] bg-[#2D0A0A] border-[4px] border-[#FFD700] shadow-[0_0_60px_rgba(255,215,0,0.2)] transform scale-110"
        >
          <!-- Gold Frame Detail -->
          <div
            class="absolute -inset-2 border-[1px] border-[#DAA520] rounded-[1.2rem] opacity-50 pointer-events-none"
          ></div>

          <!-- Inner Glow -->
          <div
            class="absolute inset-0 rounded-[1rem] shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none"
          ></div>

          <!-- Digits Container -->
          <div class="flex gap-2 md:gap-4 relative z-10">
            <div
              v-for="(digit, index) in displayDigits"
              :key="index"
              class="relative group"
            >
              <!-- Digit Card -->
              <div
                class="w-24 h-36 md:w-40 md:h-60 bg-gradient-to-b from-[#FFF8DC] to-[#F0E68C] rounded-lg flex items-center justify-center overflow-hidden border-2 border-[#B8860B] shadow-inner relative"
              >
                <!-- The Digit -->
                <span
                  :class="[
                    'font-bold text-8xl md:text-[10rem] text-[#4A0404] font-sarabun z-10',
                    isSpinning
                      ? 'blur-sm scale-110 transition-all duration-75'
                      : 'scale-100 transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)',
                  ]"
                >
                  {{ digit }}
                </span>

                <!-- Subtle Texture -->
                <div
                  class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Text -->
        <div class="mt-12 h-12">
          <div
            v-if="isSpinning"
            class="text-[#FFD700] text-3xl font-bold animate-pulse tracking-widest drop-shadow-lg font-sarabun"
          >
            กำลังสุ่มรางวัล...
          </div>
          <div
            v-else
            class="text-3xl text-[#FFD700]/60 font-bold drop-shadow-lg font-sarabun"
          >
            {{ settings.waitText }}
          </div>
        </div>
      </div>

      <!-- Right Column: Winners List (25%) -->
      <div
        class="w-1/4 h-full bg-[#1A0000]/50 backdrop-blur-sm border-l border-[#FFD700]/20 p-6 overflow-hidden flex flex-col"
      >
        <h2
          class="text-3xl font-bold text-[#FFD700] mb-6 text-center border-b-2 border-[#FFD700]/30 pb-4 font-sarabun"
        >
          รายชื่อผู้โชคดี
        </h2>

        <div class="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          <!-- Skeleton Loading -->
          <div v-if="isLoading" class="space-y-4">
            <div
              v-for="i in 5"
              :key="'skeleton-' + i"
              class="bg-gradient-to-r from-[#4A0404] to-[#2D0A0A] p-4 rounded-lg border border-[#FFD700]/30 shadow-lg flex items-center gap-4 animate-pulse"
            >
              <div class="w-10 h-10 rounded-full bg-[#FFD700]/20"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-3/4 bg-[#FFD700]/20 rounded"></div>
                <div class="h-3 w-1/2 bg-[#FFD700]/20 rounded"></div>
              </div>
            </div>
          </div>

          <!-- Winners List -->
          <TransitionGroup v-else name="list" tag="div" class="space-y-4">
            <div
              v-for="(w, index) in winnersList"
              :key="w.id || index"
              class="bg-gradient-to-r from-[#4A0404] to-[#2D0A0A] p-4 rounded-lg border border-[#FFD700]/30 shadow-lg flex items-center gap-4 transform hover:scale-102 transition-transform"
            >
              <div
                class="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center text-[#4A0404] font-bold text-lg shadow-inner"
              >
                {{ winnersList.length - index }}
              </div>
              <div>
                <div
                  class="text-[#FFD700] font-bold text-lg leading-tight font-sarabun"
                >
                  {{ w.firstName }} {{ w.lastName }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ w.department }}
                </div>
                <div class="text-[#FFD700]/60 text-sm font-sarabun">
                  รหัส: {{ w.employeeId }}
                </div>
              </div>
            </div>
          </TransitionGroup>

          <div
            v-if="!isLoading && winnersList.length === 0"
            class="text-center text-[#FFD700]/40 mt-10 font-sarabun"
          >
            ยังไม่มีผู้โชคดี
          </div>
        </div>
      </div>
    </div>

    <!-- Full Screen Winner Reveal Overlay -->
    <Transition name="zoom">
      <div
        v-if="winner && !isSpinning"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      >
        <!-- Background Effects -->
        <div class="absolute inset-0 overflow-hidden">
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-gradient-to-r from-[#FFD700]/20 via-[#FF0000]/10 to-[#FFD700]/20 rounded-full animate-spin-slow blur-3xl"
          ></div>
        </div>

        <!-- Winner Badge -->
        <div
          class="relative bg-gradient-to-b from-[#FFF8DC] via-[#FFD700] to-[#DAA520] text-[#4A0404] px-32 py-20 rounded-[5rem] shadow-[0_0_100px_rgba(255,215,0,0.8)] border-[8px] border-[#B8860B] transform hover:scale-105 transition-transform duration-300 min-w-[800px] text-center"
        >
          <p
            class="text-4xl font-bold mb-8 tracking-wider text-[#8B0000] drop-shadow-sm font-sarabun"
          >
            ขอแสดงความยินดี
          </p>

          <h2
            class="text-8xl md:text-[8rem] font-bold mb-12 whitespace-nowrap text-[#4A0404] drop-shadow-md leading-tight font-sarabun"
          >
            {{ winner.firstName }} {{ winner.lastName }}
          </h2>

          <div
            class="flex items-center justify-center gap-8 text-5xl font-bold font-sarabun"
          >
            <span
              class="bg-[#4A0404] text-[#FFD700] px-10 py-4 rounded-full shadow-inner tracking-wide"
            >
              รหัส: {{ winner.employeeId }}
            </span>
            <span class="text-[#4A0404] tracking-wide">
              {{ winner.department }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Sarabun:wght@100;400;700;800&display=swap");

.font-sarabun {
  font-family: "Sarabun", sans-serif;
}

.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0.5) translateY(50px);
}
</style>
