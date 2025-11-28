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
const totalPrizes = ref(10);
const isPrizeLimited = ref(false);
const allowRepeatWinners = ref(false);

const { showError, showConfirm, showSuccess } = useSwal();

// BroadcastChannel for syncing
let broadcastChannel: BroadcastChannel | null = null;
let displayWindow: Window | null = null;
const displayUrl = ref("");

const settings = ref({
  title: "",
  subtitle: "",
  waitText: "",
});

// Inline editing state
const editingField = ref<string | null>(null);
const tempValue = ref("");

const startEdit = (field: string, value: string) => {
  editingField.value = field;
  tempValue.value = value;
};

const cancelEdit = () => {
  editingField.value = null;
  tempValue.value = "";
};

const isSaving = ref(false);

const saveEdit = async () => {
  if (!editingField.value || isSaving.value) return;

  const field = editingField.value;
  const value = tempValue.value;

  isSaving.value = true;

  // Optimistic update
  const originalValue = (settings.value as any)[field];
  (settings.value as any)[field] = value;

  try {
    await $fetch("/api/settings", {
      method: "POST",
      body: settings.value,
    });
    editingField.value = null;
    tempValue.value = "";
  } catch (error) {
    console.error("Error saving settings:", error);
    showError("บันทึกการตั้งค่าไม่สำเร็จ", "ข้อผิดพลาด");
    // Revert on error
    (settings.value as any)[field] = originalValue;
  } finally {
    isSaving.value = false;
  }
};

const editingWinnerId = ref<number | null>(null);
const tempPrizeValue = ref("");
const isSavingPrize = ref(false);

const startEditPrize = (winner: any) => {
  editingWinnerId.value = winner.id;
  tempPrizeValue.value = winner.prize || "";
};

const cancelEditPrize = () => {
  editingWinnerId.value = null;
  tempPrizeValue.value = "";
};

const savePrize = async (winner: any) => {
  if (isSavingPrize.value) return;
  isSavingPrize.value = true;

  try {
    await $fetch("/api/lucky-draw/history", {
      method: "PUT",
      body: {
        id: winner.id,
        prize: tempPrizeValue.value,
      },
    });

    // Update local state
    winner.prize = tempPrizeValue.value;
    editingWinnerId.value = null;
    tempPrizeValue.value = "";
  } catch (error) {
    console.error("Error saving prize:", error);
    showError("บันทึกรางวัลไม่สำเร็จ", "ข้อผิดพลาด");
  } finally {
    isSavingPrize.value = false;
  }
};

const clearHistory = async () => {
  const confirmed = await showConfirm(
    "คุณแน่ใจหรือไม่ที่จะล้างประวัติผู้โชคดีทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้",
    "ยืนยันการล้างประวัติ?",
    {
      confirmButtonText: "ใช่, ล้างประวัติ",
      confirmButtonColor: "#d33",
    }
  );

  if (!confirmed) return;

  try {
    await $fetch("/api/lucky-draw/history", {
      method: "DELETE",
    });
    winners.value = [];
    showSuccess("ล้างประวัติเรียบร้อยแล้ว", "สำเร็จ!");
  } catch (error) {
    console.error("Error clearing history:", error);
    showError("ล้างประวัติไม่สำเร็จ", "เกิดข้อผิดพลาด");
  }
};

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
  }
};

const isLoading = ref(true);

onMounted(async () => {
  await Promise.all([loadSettings(), loadHistory()]);
  isLoading.value = false;
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    broadcastChannel = new BroadcastChannel("lucky-draw-channel");

    broadcastChannel.onmessage = (event) => {
      if (event.data.type === "display-ready") {
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
  displayUrl.value = window.location.origin + "/admin/lucky-draw/display";
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
  } else {
    console.error("Failed to open display window. Check popup blocker.");
  }
};

// Computed property for available candidates
const availableCandidates = computed(() => {
  // 1. Filter by valid ID length (5 or 7 digits)
  let candidates = allRegistrations.value.filter((reg) => {
    const id = reg.employeeId?.toString().trim();
    return id && (id.length === 5 || id.length === 7);
  });

  // 2. Filter out winners if repeats are not allowed
  if (!allowRepeatWinners.value) {
    candidates = candidates.filter(
      (reg) => !winners.value.some((w) => w.id === reg.id)
    );
  }

  return candidates;
});

const startDraw = () => {
  if (isSpinning.value) return;

  if (isPrizeLimited.value && winners.value.length >= totalPrizes.value) {
    showError("ครบจำนวนรางวัลที่กำหนดแล้ว!", "แจ้งเตือน");
    return;
  }

  if (availableCandidates.value.length === 0) {
    showError("ไม่พบผู้มีสิทธิ์ลุ้นรางวัล (หรือรางวัลหมดแล้ว)!", "แจ้งเตือน");
    return;
  }

  isSpinning.value = true;

  const randomIndex = Math.floor(
    Math.random() * availableCandidates.value.length
  );
  const selectedWinner = availableCandidates.value[randomIndex];

  if (!selectedWinner) return;

  let employeeId = selectedWinner.employeeId.toString().trim();
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
  setTimeout(async () => {
    isSpinning.value = false;

    // Save winner to DB
    try {
      await $fetch("/api/lucky-draw/history", {
        method: "POST",
        body: {
          employeeId: selectedWinner.employeeId,
          firstName: selectedWinner.firstName,
          lastName: selectedWinner.lastName,
          department: (selectedWinner as any).department || "",
          wonAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error saving winner:", error);
    }

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

const loadHistory = async () => {
  try {
    const response: any = await $fetch("/api/lucky-draw/history");
    if (response?.success && response?.data) {
      winners.value = response.data.map((w: any) => ({
        ...w,
        wonAt: new Date(w.wonAt),
      }));
    }
  } catch (error) {
    console.error("Error loading history:", error);
  }
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
  <div class="space-y-6">
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
            <div
              v-if="isLoading"
              class="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"
            ></div>
            <h3 v-else class="text-2xl font-bold text-gray-800">
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
            <div
              v-if="isLoading"
              class="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"
            ></div>
            <h3 v-else class="text-2xl font-bold text-gray-800">
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
            <div
              v-if="isLoading"
              class="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"
            ></div>
            <h3 v-else class="text-2xl font-bold text-gray-800">
              {{
                isPrizeLimited ? Math.max(0, totalPrizes - winners.length) : "∞"
              }}
            </h3>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              @click="clearHistory"
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
                  <th>รางวัลที่ได้รับ</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="isLoading">
                  <tr v-for="i in 5" :key="i" class="animate-pulse">
                    <td class="text-center">
                      <div
                        class="h-6 w-6 bg-gray-200 rounded-full mx-auto"
                      ></div>
                    </td>
                    <td>
                      <div class="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                      <div class="h-3 w-20 bg-gray-200 rounded"></div>
                    </td>
                    <td>
                      <div class="h-6 w-16 bg-gray-200 rounded mx-auto"></div>
                    </td>
                    <td><div class="h-4 w-24 bg-gray-200 rounded"></div></td>
                  </tr>
                </template>
                <template v-else>
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
                        {{ winner.department }}
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-ghost font-mono">{{
                        winner.employeeId
                      }}</span>
                    </td>
                    <td class="text-sm text-gray-500">
                      <div
                        v-if="editingWinnerId === winner.id"
                        class="flex gap-2 items-center"
                      >
                        <input
                          v-model="tempPrizeValue"
                          type="text"
                          class="input input-bordered input-sm w-full max-w-[150px]"
                          @keyup.enter="savePrize(winner)"
                          @keyup.esc="cancelEditPrize"
                          :disabled="isSavingPrize"
                          autoFocus
                        />
                        <button
                          @click="savePrize(winner)"
                          class="btn btn-square btn-success btn-xs"
                          :disabled="isSavingPrize"
                        >
                          <span
                            v-if="isSavingPrize"
                            class="loading loading-spinner loading-xs"
                          ></span>
                          <svg
                            v-else
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3 w-3"
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
                        </button>
                        <button
                          @click="cancelEditPrize"
                          class="btn btn-square btn-error btn-xs"
                          :disabled="isSavingPrize"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div
                        v-else
                        class="flex justify-between items-center group"
                      >
                        <span>{{ winner.prize || "-" }}</span>
                        <button
                          @click="startEditPrize(winner)"
                          class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Control Panel -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Display Preview Card -->
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div
            class="relative w-full aspect-video bg-gray-900 group cursor-pointer overflow-hidden"
            @click="openDisplayWindow"
          >
            <iframe
              v-if="displayUrl"
              :src="displayUrl"
              class="absolute inset-0 w-[400%] h-[400%] origin-top-left transform scale-[0.25] pointer-events-none select-none"
              tabindex="-1"
            ></iframe>

            <!-- Hover Overlay -->
            <div
              class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm rounded-xl"
            >
              <span
                class="text-white font-bold text-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                เปิดหน้าจอแสดงผล
              </span>
            </div>
          </div>
        </div>

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
              :disabled="
                isSpinning ||
                availableCandidates.length === 0 ||
                (isPrizeLimited && winners.length >= totalPrizes)
              "
              class="btn btn-lg w-full bg-gradient-to-r from-amber-500 to-orange-600 border-none text-white hover:from-amber-600 hover:to-orange-700 shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span v-else>{{
                winners.length > 0 ? "สุ่มอีกครั้ง 🎲" : "เริ่มสุ่มรางวัล 🎲"
              }}</span>
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

        <!-- Settings Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">ตั้งค่าการสุ่ม</h3>
          <div class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">หัวข้อ (Title)</span>
              </label>
              <div
                v-if="isLoading"
                class="h-12 w-full bg-gray-200 rounded-lg animate-pulse"
              ></div>
              <div v-else-if="editingField === 'title'" class="flex gap-2">
                <input
                  v-model="tempValue"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="Lucky Draw"
                  @keyup.enter="saveEdit"
                  @keyup.esc="cancelEdit"
                  :disabled="isSaving"
                  autoFocus
                />
                <button
                  @click="saveEdit"
                  class="btn btn-square btn-success btn-sm"
                  :disabled="isSaving"
                >
                  <span
                    v-if="isSaving"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  <svg
                    v-else
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
                <button
                  @click="cancelEdit"
                  class="btn btn-square btn-error btn-sm"
                  :disabled="isSaving"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div
                v-else
                class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span class="font-medium text-gray-700">{{
                  settings.title || "Lucky Draw"
                }}</span>
                <button
                  @click="startEdit('title', settings.title)"
                  class="btn btn-ghost btn-xs text-gray-500 hover:text-primary"
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  แก้ไข
                </button>
              </div>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">คำโปรย (Subtitle)</span>
              </label>
              <div
                v-if="isLoading"
                class="h-12 w-full bg-gray-200 rounded-lg animate-pulse"
              ></div>
              <div v-else-if="editingField === 'subtitle'" class="flex gap-2">
                <input
                  v-model="tempValue"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="ลุ้นรับรางวัลใหญ่"
                  @keyup.enter="saveEdit"
                  @keyup.esc="cancelEdit"
                  :disabled="isSaving"
                  autoFocus
                />
                <button
                  @click="saveEdit"
                  class="btn btn-square btn-success btn-sm"
                  :disabled="isSaving"
                >
                  <span
                    v-if="isSaving"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  <svg
                    v-else
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
                <button
                  @click="cancelEdit"
                  class="btn btn-square btn-error btn-sm"
                  :disabled="isSaving"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div
                v-else
                class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span class="font-medium text-gray-700">{{
                  settings.subtitle || "ลุ้นรับรางวัลใหญ่"
                }}</span>
                <button
                  @click="startEdit('subtitle', settings.subtitle)"
                  class="btn btn-ghost btn-xs text-gray-500 hover:text-primary"
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  แก้ไข
                </button>
              </div>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">ข้อความรอ (Wait Text)</span>
              </label>
              <div
                v-if="isLoading"
                class="h-12 w-full bg-gray-200 rounded-lg animate-pulse"
              ></div>
              <div v-else-if="editingField === 'waitText'" class="flex gap-2">
                <input
                  v-model="tempValue"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="รอลุ้นรางวัล..."
                  @keyup.enter="saveEdit"
                  @keyup.esc="cancelEdit"
                  :disabled="isSaving"
                  autoFocus
                />
                <button
                  @click="saveEdit"
                  class="btn btn-square btn-success btn-sm"
                  :disabled="isSaving"
                >
                  <span
                    v-if="isSaving"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  <svg
                    v-else
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
                <button
                  @click="cancelEdit"
                  class="btn btn-square btn-error btn-sm"
                  :disabled="isSaving"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div
                v-else
                class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span class="font-medium text-gray-700">{{
                  settings.waitText || "รอลุ้นรางวัล..."
                }}</span>
                <button
                  @click="startEdit('waitText', settings.waitText)"
                  class="btn btn-ghost btn-xs text-gray-500 hover:text-primary"
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  แก้ไข
                </button>
              </div>
            </div>

            <div class="divider"></div>

            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-4">
                <input
                  v-model="isPrizeLimited"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
                <span class="label-text">จำกัดจำนวนรางวัล</span>
              </label>
            </div>

            <div v-if="isPrizeLimited" class="form-control">
              <label class="label">
                <span class="label-text">จำนวนรางวัลทั้งหมด</span>
              </label>
              <input
                v-model.number="totalPrizes"
                type="number"
                class="input input-bordered w-full"
                min="1"
              />
            </div>

            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-4">
                <input
                  v-model="allowRepeatWinners"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
                <span class="label-text">อนุญาตให้ได้รางวัลซ้ำ</span>
              </label>
            </div>
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
