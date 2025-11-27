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
const winners = ref<any[]>([]);
const spinDuration = 5000;

// BroadcastChannel for syncing
let broadcastChannel: BroadcastChannel | null = null;
let displayWindow: Window | null = null;

onMounted(() => {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    console.log("Initializing BroadcastChannel: lucky-draw-channel");
    broadcastChannel = new BroadcastChannel("lucky-draw-channel");

    broadcastChannel.onmessage = (event) => {
      console.log("Control received message:", event.data);
      if (event.data.type === "display-ready") {
        console.log("Display window is ready");
        const syncMessage = {
          type: "sync-state",
          winnersList: JSON.parse(JSON.stringify(winners.value)),
        };
        broadcastChannel?.postMessage(syncMessage);
        displayWindow?.postMessage(syncMessage, "*");
      }
    };
  } else {
    console.warn("BroadcastChannel not supported");
  }
});

onUnmounted(() => {
  broadcastChannel?.close();
});

const openDisplayWindow = () => {
  const displayUrl = window.location.origin + "/admin/lucky-draw/display";
  const features =
    "width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes,popup=yes";
  displayWindow = window.open(displayUrl, "LuckyDrawDisplay", features);

  if (displayWindow) {
    console.log("Display window opened successfully");
  } else {
    console.error("Failed to open display window. Check popup blocker.");
  }
};

const startDraw = () => {
  if (allRegistrations.value.length === 0) {
    alert("ไม่มีผู้ลงทะเบียนในระบบ");
    return;
  }

  // Filter out already selected winners to avoid duplicates
  const availableCandidates = allRegistrations.value.filter(
    (reg) => !winners.value.some((w) => w.id === reg.id)
  );

  if (availableCandidates.length === 0) {
    alert("ผู้ลงทะเบียนทุกคนได้รับรางวัลไปหมดแล้ว!");
    return;
  }

  isSpinning.value = true;

  const randomIndex = Math.floor(Math.random() * availableCandidates.length);
  const selectedWinner = availableCandidates[randomIndex];

  if (!selectedWinner) return;

  let employeeId = selectedWinner.employeeId;
  if (employeeId.length <= 5) {
    employeeId = employeeId.padStart(5, "0");
  } else {
    employeeId = employeeId.padStart(7, "0");
  }

  const message = {
    type: "start-draw",
    employeeId,
    winner: selectedWinner,
    duration: spinDuration,
    winnersList: JSON.parse(JSON.stringify(winners.value)),
  };

  // Broadcast start event
  broadcastChannel?.postMessage(message);

  // Direct postMessage fallback
  displayWindow?.postMessage(message, "*");

  // LocalStorage fallback (triggers storage event in other windows)
  localStorage.setItem(
    "lucky-draw-event",
    JSON.stringify({ ...message, timestamp: Date.now() })
  );

  // Wait for animation to finish before showing winner in table
  setTimeout(() => {
    isSpinning.value = false;
    winners.value.unshift({
      ...selectedWinner,
      wonAt: new Date(),
    });

    const winnerMessage = {
      type: "show-winner",
      winner: selectedWinner,
      winnersList: JSON.parse(JSON.stringify(winners.value)),
    };

    broadcastChannel?.postMessage(winnerMessage);
    displayWindow?.postMessage(winnerMessage, "*");
    localStorage.setItem(
      "lucky-draw-event",
      JSON.stringify({ ...winnerMessage, timestamp: Date.now() })
    );
  }, spinDuration);
};

const reset = () => {
  isSpinning.value = false;

  const resetMessage = {
    type: "reset",
  };

  broadcastChannel?.postMessage(resetMessage);
  displayWindow?.postMessage(resetMessage, "*");
  localStorage.setItem(
    "lucky-draw-event",
    JSON.stringify({ ...resetMessage, timestamp: Date.now() })
  );
};
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header Section -->
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold text-gray-800">แผงควบคุมการสุ่มรางวัล</h1>
        <p class="text-gray-600 mt-1">
          จัดการการสุ่มรางวัลและดูรายชื่อผู้โชคดี
        </p>
      </div>
      <div class="flex gap-3">
        <button @click="openDisplayWindow" class="btn btn-outline gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
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
          เปิดหน้าจอแสดงผล
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-50 text-blue-600 rounded-lg">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 font-medium">ผู้ลงทะเบียนทั้งหมด</p>
            <h3 class="text-2xl font-bold text-gray-800">
              {{ allRegistrations.length }}
            </h3>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-50 text-green-600 rounded-lg">
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 font-medium">ผู้โชคดี</p>
            <h3 class="text-2xl font-bold text-gray-800">
              {{ winners.length }}
            </h3>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-purple-50 text-purple-600 rounded-lg">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 font-medium">เหลือสิทธิ์ลุ้น</p>
            <h3 class="text-2xl font-bold text-gray-800">
              {{ Math.max(0, allRegistrations.length - winners.length) }}
            </h3>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Control Panel -->
      <div class="lg:col-span-1 space-y-6">
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div
            class="p-6 bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-center"
          >
            <h2 class="text-2xl font-bold mb-2">ควบคุมการสุ่ม</h2>
            <p class="text-purple-100">
              กดปุ่มเพื่อเริ่มสุ่มรางวัลบนหน้าจอแสดงผล
            </p>
          </div>
          <div class="p-8 flex flex-col gap-4">
            <button
              @click="startDraw"
              :disabled="isSpinning || allRegistrations.length === 0"
              class="btn btn-lg w-full bg-gradient-to-r from-purple-600 to-indigo-600 border-none text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                v-if="isSpinning"
                class="animate-spin h-6 w-6 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span v-if="isSpinning">กำลังสุ่ม...</span>
              <span v-else>เริ่มสุ่มรางวัล 🎲</span>
            </button>

            <button
              @click="reset"
              :disabled="isSpinning"
              class="btn btn-outline w-full hover:bg-gray-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              รีเซ็ตหน้าจอแสดงผล
            </button>
          </div>
        </div>
      </div>

      <!-- Winners Table -->
      <div class="lg:col-span-2">
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div
            class="p-6 border-b border-gray-100 flex justify-between items-center"
          >
            <h2 class="text-xl font-bold text-gray-800">รายชื่อผู้โชคดี</h2>
            <button
              v-if="winners.length > 0"
              @click="winners = []"
              class="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              ล้างประวัติ
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr class="bg-gray-50 text-gray-600">
                  <th class="w-16 text-center">ลำดับ</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>รหัสพนักงาน</th>
                  <th>เวลาที่ได้รับ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="winners.length === 0">
                  <td colspan="4" class="text-center py-8 text-gray-400">
                    ยังไม่มีผู้โชคดี
                  </td>
                </tr>
                <tr
                  v-for="(winner, index) in winners"
                  :key="index"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="text-center font-bold text-gray-500">
                    {{ winners.length - index }}
                  </td>
                  <td>
                    <div class="font-bold text-gray-800">
                      {{ winner.firstName }} {{ winner.lastName }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ winner.department || "-" }}
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-ghost font-mono">{{
                      winner.employeeId
                    }}</span>
                  </td>
                  <td class="text-sm text-gray-500">
                    {{ new Date(winner.wonAt).toLocaleTimeString("th-TH") }}
                  </td>
                </tr>
              </tbody>
            </table>
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
