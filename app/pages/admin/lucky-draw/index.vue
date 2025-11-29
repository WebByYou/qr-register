<script setup lang="ts">
definePageMeta({
  layout: "admin",
});
const { count: totalRegistrations, init: initRegistration } = useRegistration();
const isSpinning = ref(false);
const winners = ref<any[]>([]);
const spinDuration = 5000;
const totalPrizes = ref(10);
const isPrizeLimited = ref(false);
const allowRepeatWinners = ref(false);
const allRegistrations = ref<any[]>([]);
const { showError, showConfirm, showSuccess } = useSwal();
const { exportToExcel } = useExcel();
const page = ref(1);
const limit = ref(10);
const searchQuery = ref("");
const sortBy = ref("wonAt");
const sortOrder = ref<"asc" | "desc">("desc");
const debouncedSearch = ref("");
let searchTimeout: NodeJS.Timeout;
watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newValue;
    page.value = 1; 
  }, 300);
});
const { data: tableResponse, refresh: refreshTable } = await useFetch(
  "/api/lucky-draw/history",
  {
    query: {
      page,
      limit,
      search: debouncedSearch,
      sortBy,
      sortOrder,
    },
    watch: [page, limit, debouncedSearch, sortBy, sortOrder],
  }
);
const tableWinners = computed(() => tableResponse.value?.data || []);
const pagination = computed(() => {
  const p = tableResponse.value?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };
  return {
    ...p,
    start: (p.page - 1) * p.limit,
    end: Math.min(p.page * p.limit, p.total),
  };
});
const tableWinnersWithRank = computed(() => {
  const total = pagination.value.total;
  const startOffset = (page.value - 1) * limit.value;
  return tableWinners.value.map((w: any, index: number) => {
    let rank = 0;
    if (sortBy.value === "wonAt" && sortOrder.value === "asc") {
      rank = startOffset + index + 1;
    } else if (sortBy.value === "wonAt" && sortOrder.value === "desc") {
      rank = total - startOffset - index;
    } else {
      rank = startOffset + index + 1;
    }
    return {
      ...w,
      winningRank: rank,
    };
  });
});
const paginatedWinners = computed(() => tableWinnersWithRank.value);
const toggleSort = (field: string) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = field;
    sortOrder.value = "asc";
  }
};
const goToPage = (pageNum: number) => {
  page.value = pageNum;
};
const nextPage = () => {
  if (page.value < pagination.value.totalPages) {
    page.value++;
  }
};
const prevPage = () => {
  if (page.value > 1) {
    page.value--;
  }
};
const handleExport = async () => {
  try {
    const exportResponse: any = await $fetch("/api/lucky-draw/history", {
      query: {
        limit: pagination.value.total || 10000, 
        sortBy: "wonAt",
        sortOrder: "asc", 
      },
    });
    const allWinners = exportResponse.data || [];
    if (allWinners.length === 0) {
      showError("ไม่พบข้อมูลที่จะส่งออก", "ไม่สามารถส่งออกได้");
      return;
    }
    const exportData = allWinners.map((winner: any, index: number) => ({
      ลำดับ: index + 1, 
      ชื่อ_นามสกุล: `${winner.firstName} ${winner.lastName}`,
      รหัสพนักงาน: winner.employeeId,
      รางวัล: winner.prize || "-",
      เวลาที่ได้รับรางวัล: new Date(winner.wonAt).toLocaleString("th-TH"),
    }));
    exportToExcel(
      exportData,
      `รายชื่อผู้โชคดี-${new Date().toISOString().split("T")[0]}`
    );
  } catch (error) {
    console.error("Error exporting winners:", error);
    showError("ไม่สามารถส่งออกข้อมูลได้", "เกิดข้อผิดพลาด");
  }
};
let broadcastChannel: BroadcastChannel | null = null;
let displayWindow: Window | null = null;
const displayUrl = ref("");
const settings = ref({
  title: "",
  subtitle: "",
  waitText: "",
});
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
    clearDisplayHistory(); 
    refreshTable(); 
    showSuccess("ล้างประวัติเรียบร้อยแล้ว", "สำเร็จ!");
  } catch (error) {
    console.error("Error clearing history:", error);
    showError("ล้างประวัติไม่สำเร็จ", "เกิดข้อผิดพลาด");
  }
};

const deleteWinner = async (id: number) => {
  const confirmed = await showConfirm(
    "คุณแน่ใจหรือไม่ที่จะลบผู้โชคดีรายนี้?",
    "ยืนยันการลบ?",
    {
      confirmButtonText: "ใช่, ลบเลย",
      confirmButtonColor: "#d33",
    }
  );

  if (!confirmed) return;

  try {
    await $fetch("/api/lucky-draw/history", {
      method: "DELETE",
      query: { id },
    });
    
    winners.value = winners.value.filter(w => w.id !== id);
    
    await nextTick();

    const syncMessage = {
      type: "sync-state",
      winnersList: JSON.parse(JSON.stringify(winners.value)),
    };
    broadcastChannel?.postMessage(syncMessage);
    displayWindow?.postMessage(syncMessage, "*");
    localStorage.setItem(
      "lucky-draw-event",
      JSON.stringify({ ...syncMessage, timestamp: Date.now() })
    );

    refreshTable();
    showSuccess("ลบผู้โชคดีเรียบร้อยแล้ว", "สำเร็จ!");
  } catch (error) {
    console.error("Error deleting winner:", error);
    showError("ลบผู้โชคดีไม่สำเร็จ", "เกิดข้อผิดพลาด");
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
  await Promise.all([loadSettings(), loadHistory(), loadRegistrations()]);
  initRegistration();
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
    // Broadcast initial state on mount to ensure sync
    const syncMessage = {
      type: "sync-state",
      winnersList: JSON.parse(JSON.stringify(winners.value)),
    };
    broadcastChannel.postMessage(syncMessage);
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
const availableCandidates = computed(() => {
  let candidates = allRegistrations.value.filter((reg: any) => {
    const id = reg.employeeId?.toString().trim();
    return id && id.length <= 7;
  });
  if (!allowRepeatWinners.value) {
    candidates = candidates.filter(
      (reg: any) => !winners.value.some((w) => w.id === reg.id)
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
    return;
  }
  isSpinning.value = true;
  const randomIndex = Math.floor(
    Math.random() * availableCandidates.value.length
  );
  const selectedWinner = availableCandidates.value[randomIndex];
  if (!selectedWinner) return;
  let employeeId = selectedWinner.employeeId.toString().trim();
  employeeId = employeeId.padStart(7, "0");
  const message = {
    type: "start-draw",
    employeeId,
    winner: JSON.parse(JSON.stringify({ ...selectedWinner, employeeId })),
    duration: spinDuration,
    winnersList: JSON.parse(JSON.stringify(winners.value)),
  };
  broadcastChannel?.postMessage(message);
  displayWindow?.postMessage(message, "*");
  localStorage.setItem(
    "lucky-draw-event",
    JSON.stringify({ ...message, timestamp: Date.now() })
  );
  setTimeout(async () => {
    isSpinning.value = false;
    let savedWinner = null;
    try {
      const response: any = await $fetch("/api/lucky-draw/history", {
        method: "POST",
        body: {
          employeeId: employeeId,
          firstName: selectedWinner.firstName,
          lastName: selectedWinner.lastName,
          department: (selectedWinner as any).department || "",
          wonAt: new Date(),
        },
      });
      if (response?.data) {
        savedWinner = response.data;
      }
    } catch (error) {
      console.error("Error saving winner:", error);
    }

    const winnerToAdd = savedWinner || {
      ...selectedWinner,
      employeeId: employeeId,
      wonAt: new Date(),
    };

    winners.value.unshift(winnerToAdd);
    
    const winnerMessage = {
      type: "show-winner",
      winner: JSON.parse(JSON.stringify(winnerToAdd)),
      winnersList: JSON.parse(JSON.stringify(winners.value)),
    };
    broadcastChannel?.postMessage(winnerMessage);
    displayWindow?.postMessage(winnerMessage, "*");
    localStorage.setItem(
      "lucky-draw-event",
      JSON.stringify({ ...winnerMessage, timestamp: Date.now() })
    );
    refreshTable();
  }, spinDuration);
};
const loadHistory = async () => {
  try {
    const response: any = await $fetch("/api/lucky-draw/history", {
      query: { limit: 10000 },
    });
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
const loadRegistrations = async () => {
  try {
    const response: any = await $fetch("/api/registrations", {
      query: { limit: 10000 },
    });
    if (response?.data) {
      allRegistrations.value = response.data;
    }
  } catch (error) {
    console.error("Error loading registrations:", error);
  }
};
const clearDisplayHistory = () => {
  isSpinning.value = false;
  const resetMessage = {
    type: "clear-history",
  };
  broadcastChannel?.postMessage(resetMessage);
  displayWindow?.postMessage(resetMessage, "*");
  localStorage.setItem(
    "lucky-draw-event",
    JSON.stringify({ ...resetMessage, timestamp: Date.now() })
  );
};
const resetDisplay = () => {
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
              {{ totalRegistrations }}
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
              {{ pagination.total }}
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
                isPrizeLimited
                  ? Math.max(0, totalPrizes - pagination.total)
                  : "∞"
              }}
            </h3>
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div
            class="p-6 border-b border-gray-100 flex justify-between items-center"
          >
            <h2 class="text-xl font-bold text-gray-800">รายชื่อผู้โชคดี</h2>
            <div class="flex gap-4 items-center">
              <button
                v-if="winners.length > 0"
                @click="handleExport"
                class="btn btn-sm bg-[#00C853] hover:bg-[#00B048] text-white border-none gap-2 font-normal"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Excel
              </button>
              <button
                v-if="winners.length > 0"
                @click="clearHistory"
                class="btn btn-sm btn-ghost text-red-500 hover:bg-red-50 font-bold"
              >
                ล้างประวัติ
              </button>
            </div>
          </div>
          <div class="p-4 border-b border-gray-100">
            <div class="relative w-full">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหาชื่อ, รหัส, หรือรางวัล..."
                class="input input-bordered w-full pl-10 bg-gray-50/50"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr
                  class="bg-gray-50/50 text-gray-700 border-b border-gray-100"
                >
                  <th
                    class="w-24 text-center cursor-pointer hover:bg-gray-100 select-none py-4"
                    @click="toggleSort('winningRank')"
                  >
                    <div
                      class="flex items-center justify-center gap-1 font-bold"
                    >
                      ลำดับ
                      <span v-if="sortBy === 'winningRank'" class="text-xs">
                        {{ sortOrder === "asc" ? "↑" : "↓" }}
                      </span>
                    </div>
                  </th>
                  <th
                    class="cursor-pointer hover:bg-gray-100 select-none py-4"
                    @click="toggleSort('firstName')"
                  >
                    <div class="flex items-center gap-1 font-bold">
                      ชื่อ-นามสกุล
                      <span v-if="sortBy === 'firstName'" class="text-xs">
                        {{ sortOrder === "asc" ? "↑" : "↓" }}
                      </span>
                    </div>
                  </th>
                  <th
                    class="cursor-pointer hover:bg-gray-100 select-none py-4"
                    @click="toggleSort('employeeId')"
                  >
                    <div class="flex items-center gap-1 font-bold">
                      รหัสพนักงาน
                      <span v-if="sortBy === 'employeeId'" class="text-xs">
                        {{ sortOrder === "asc" ? "↑" : "↓" }}
                      </span>
                    </div>
                  </th>
                  <th
                    class="cursor-pointer hover:bg-gray-100 select-none py-4"
                    @click="toggleSort('prize')"
                  >
                    <div class="flex items-center gap-1 font-bold">
                      รางวัลที่ได้รับ
                      <span v-if="sortBy === 'prize'" class="text-xs">
                        {{ sortOrder === "asc" ? "↑" : "↓" }}
                      </span>
                    </div>
                  </th>
                  <th class="py-4 text-center w-20">จัดการ</th>
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
                  <tr v-if="paginatedWinners.length === 0">
                    <td colspan="5" class="text-center py-8 text-gray-400">
                      {{
                        searchQuery ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีผู้โชคดี"
                      }}
                    </td>
                  </tr>
                  <tr
                    v-for="(winner, index) in paginatedWinners"
                    :key="winner.id"
                    class="hover:bg-gray-50 transition-colors border-b border-gray-50"
                  >
                    <td class="text-center font-bold text-gray-500 py-4">
                      {{ winner.winningRank }}
                    </td>
                    <td class="py-4">
                      <div class="font-medium text-gray-800 text-sm">
                        {{ winner.firstName }} {{ winner.lastName }}
                      </div>
                    </td>
                    <td class="py-4">
                      <span
                        class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-mono text-sm font-medium tracking-wide border border-gray-200"
                        >{{ winner.employeeId }}</span
                      >
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
                    <td class="text-center">
                      <button
                        @click="deleteWinner(winner.id)"
                        class="btn btn-ghost btn-xs text-red-500 hover:bg-red-50"
                        title="ลบรายการ"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div
            class="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4"
          >
            <div class="text-sm text-gray-500 order-2 sm:order-1">
              แสดง {{ pagination.start + 1 }} - {{ pagination.end }} จาก
              {{ pagination.total }}
            </div>
            <div class="flex gap-1 order-1 sm:order-2">
              <button
                class="btn btn-sm btn-circle btn-ghost"
                :disabled="page === 1"
                @click="prevPage"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <template v-for="pageNum in pagination.totalPages" :key="pageNum">
                <button
                  v-if="
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  "
                  class="btn btn-sm btn-circle"
                  :class="
                    page === pageNum ? 'btn-primary text-white' : 'btn-ghost'
                  "
                  @click="goToPage(pageNum)"
                >
                  {{ pageNum }}
                </button>
                <span
                  v-else-if="pageNum === page - 2 || pageNum === page + 2"
                  class="flex items-center px-2 text-gray-300"
                >
                  ···
                </span>
              </template>
              <button
                class="btn btn-sm btn-circle btn-ghost"
                :disabled="page === pagination.totalPages"
                @click="nextPage"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <select
              v-model="limit"
              class="select select-sm select-bordered rounded-full order-3"
            >
              <option :value="10">10 / หน้า</option>
              <option :value="25">25 / หน้า</option>
              <option :value="50">50 / หน้า</option>
              <option :value="100">100 / หน้า</option>
            </select>
          </div>
        </div>
      </div>
      <div class="lg:col-span-1 space-y-6">
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
              @click="resetDisplay"
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
