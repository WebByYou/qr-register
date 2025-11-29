<script setup lang="ts">
import { useRegistration } from "~/composables/useRegistration";
definePageMeta({
  layout: "admin",
});
const { count: registrationCount, init: initRegistration } = useRegistration();
onMounted(() => {
  initRegistration();
});
const page = ref(1);
const limit = ref(10);
const searchQuery = ref("");
const sortBy = ref("createdAt");
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
const { data: response, refresh } = await useFetch("/api/registrations", {
  query: {
    page,
    limit,
    search: debouncedSearch,
    sortBy,
    sortOrder,
  },
  watch: [page, limit, debouncedSearch, sortBy, sortOrder],
});
watch(registrationCount, () => {
  refresh();
});
const registrations = computed(() => response.value?.data || []);
const pagination = computed(
  () =>
    response.value?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    }
);
const toggleSort = (field: string) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = field;
    sortOrder.value = "asc";
  }
};
const { showConfirm, showError, showPasswordConfirm, showSuccess } = useSwal();
const deleteRegistration = async (id: number) => {
  const reg = registrations.value.find((r: any) => r.id === id);
  if (!reg) return;
  const confirmed = await showConfirm(
    `<div class="text-lg font-bold mb-1">${reg.firstName} ${reg.lastName}</div><div class="text-base text-gray-500">รหัสพนักงาน: ${reg.employeeId}</div>`,
    "ยืนยันการลบรายการ",
    {
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบรายการ",
      isHtml: true,
    }
  );
  if (!confirmed) return;
  try {
    await $fetch(`/api/registrations/${id}`, {
      method: "DELETE",
    });
    await refresh();
  } catch (error) {
    showError("กรุณาลองใหม่อีกครั้ง", "เกิดข้อผิดพลาดในการลบข้อมูล");
  }
};
const clearAllRegistrations = async () => {
  const firstConfirm = await showConfirm(
    "การดำเนินการนี้จะลบข้อมูลการลงทะเบียนทั้งหมด และไม่สามารถกู้คืนได้",
    "คุณแน่ใจหรือไม่?"
  );
  if (!firstConfirm) return;
  const password = await showPasswordConfirm(
    "กรุณากรอกรหัสผ่าน Admin เพื่อยืนยันการลบข้อมูลทั้งหมด",
    "ยืนยันด้วยรหัสผ่าน"
  );
  if (!password) return;
  try {
    const result = await $fetch("/api/registrations/clear", {
      method: "POST",
      body: { password },
    });
    await showSuccess(
      `ลบข้อมูลทั้งหมด ${result.count} รายการเรียบร้อยแล้ว`,
      "ลบข้อมูลสำเร็จ"
    );
    await refresh();
  } catch (error: any) {
    if (error.statusCode === 401) {
      showError("กรุณาลองใหม่อีกครั้ง", "รหัสผ่านไม่ถูกต้อง");
    } else {
      showError("กรุณาลองใหม่อีกครั้ง", "เกิดข้อผิดพลาด");
    }
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
const { exportToExcel } = useExcel();
const handleExport = async () => {
  try {
    const response: any = await $fetch("/api/registrations", {
      query: {
        limit: pagination.value.total || 10000, 
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
      },
    });
    const allData = response.data || [];
    if (allData.length === 0) return;
    const exportData = allData.map((reg: any, index: number) => {
      return {
        ลำดับ: reg.id,
        ชื่อ_นามสกุล: `${reg.firstName} ${reg.lastName}`,
        รหัสพนักงาน: reg.employeeId,
        วันที่ลงทะเบียน: new Date(reg.createdAt).toLocaleString("th-TH"),
      };
    });
    exportToExcel(
      exportData,
      `รายชื่อผู้ลงทะเบียนทั้งหมด-${new Date().toISOString().split("T")[0]}`
    );
  } catch (error) {
    console.error("Error exporting data:", error);
    showError("ไม่สามารถส่งออกข้อมูลได้", "เกิดข้อผิดพลาด");
  }
};
</script>
<template>
  <div>
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
    >
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-bold">รายชื่อผู้ลงทะเบียน</h2>
        <div class="badge badge-primary badge-lg font-mono">
          {{ registrationCount }}
        </div>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <button
          class="btn btn-sm btn-success gap-2 flex-1 sm:flex-none"
          @click="handleExport"
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
          <span class="hidden sm:inline">ส่งออก Excel</span>
          <span class="sm:hidden">ส่งออก</span>
        </button>
        <button
          class="btn btn-sm btn-error gap-2 flex-1 sm:flex-none"
          @click="clearAllRegistrations"
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
          <span class="hidden sm:inline">ลบทั้งหมด</span>
          <span class="sm:hidden">ลบ</span>
        </button>
      </div>
    </div>
    <div class="mb-4">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหา..."
          class="input input-sm input-bordered w-full sm:w-64 pl-9"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
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
    <div class="bg-base-100 rounded-xl overflow-x-auto border border-base-300">
      <table class="table table-sm">
        <thead class="bg-base-200/50">
          <tr>
            <th
              class="font-semibold text-base-content/70 cursor-pointer hover:bg-base-300/50 select-none w-24"
              @click="toggleSort('id')"
            >
              <div class="flex items-center gap-2">
                ลำดับที่
                <span v-if="sortBy === 'id'" class="text-xs">
                  {{ sortOrder === "asc" ? "↑" : "↓" }}
                </span>
              </div>
            </th>
            <th
              class="font-semibold text-base-content/70 cursor-pointer hover:bg-base-300/50 select-none"
              @click="toggleSort('employeeId')"
            >
              <div class="flex items-center gap-2">
                รหัสพนักงาน
                <span v-if="sortBy === 'employeeId'" class="text-xs">
                  {{ sortOrder === "asc" ? "↑" : "↓" }}
                </span>
              </div>
            </th>
            <th
              class="font-semibold text-base-content/70 cursor-pointer hover:bg-base-300/50 select-none"
              @click="toggleSort('firstName')"
            >
              <div class="flex items-center gap-2">
                ชื่อ-นามสกุล
                <span v-if="sortBy === 'firstName'" class="text-xs">
                  {{ sortOrder === "asc" ? "↑" : "↓" }}
                </span>
              </div>
            </th>
            <th
              class="font-semibold text-base-content/70 cursor-pointer hover:bg-base-300/50 select-none"
              @click="toggleSort('createdAt')"
            >
              <div class="flex items-center gap-2">
                วันที่ลงทะเบียน
                <span v-if="sortBy === 'createdAt'" class="text-xs">
                  {{ sortOrder === "asc" ? "↑" : "↓" }}
                </span>
              </div>
            </th>
            <th class="font-semibold text-base-content/70 text-right">
              จัดการ
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(reg, index) in registrations"
            :key="reg.id"
            class="hover:bg-base-200/30"
          >
            <td class="text-base-content/60">
              {{ reg.id }}
            </td>
            <td>
              <span class="font-mono font-medium text-primary">
                {{ reg.employeeId }}
              </span>
            </td>
            <td>
              <span class="font-medium">
                {{ reg.firstName }} {{ reg.lastName }}
              </span>
            </td>
            <td>
              <span class="text-sm text-base-content/60">
                {{
                  new Date(reg.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }}
              </span>
            </td>
            <td class="text-right">
              <button
                @click="deleteRegistration(reg.id)"
                class="btn btn-ghost btn-sm text-error hover:bg-error/10"
                title="ลบ"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="registrations.length === 0">
            <td colspan="5" class="text-center py-12 text-base-content/40">
              {{
                searchQuery ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีรายการลงทะเบียน"
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pb-8"
    >
      <div class="text-sm text-gray-500 font-medium order-2 sm:order-1">
        แสดง {{ (page - 1) * limit + 1 }} -
        {{ Math.min(page * limit, pagination.total) }} จาก
        {{ pagination.total }}
      </div>
      <div class="flex items-center gap-2 order-1 sm:order-2">
        <button
          class="btn btn-circle btn-sm btn-ghost text-gray-400 hover:bg-gray-100 hover:text-primary"
          :disabled="page === 1"
          @click="prevPage"
        >
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
            class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200"
            :class="
              page === pageNum
                ? 'bg-[#007AFF] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            "
            @click="goToPage(pageNum)"
          >
            {{ pageNum }}
          </button>
          <span
            v-else-if="pageNum === page - 2 || pageNum === page + 2"
            class="text-gray-300 text-xs"
          >
            •••
          </span>
        </template>
        <button
          class="btn btn-circle btn-sm btn-ghost text-gray-400 hover:bg-gray-100 hover:text-primary"
          :disabled="page === pagination.totalPages"
          @click="nextPage"
        >
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
      <div class="relative order-3">
        <select
          v-model="limit"
          class="appearance-none bg-gray-50 border border-gray-200 rounded-full pl-4 pr-10 py-2 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <option :value="10">10 / หน้า</option>
          <option :value="25">25 / หน้า</option>
          <option :value="50">50 / หน้า</option>
          <option :value="100">100 / หน้า</option>
        </select>
        <div
          class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
