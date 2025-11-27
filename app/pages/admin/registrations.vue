<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

const page = ref(1);
const limit = ref(10);
const searchQuery = ref("");

// Debounce search
const debouncedSearch = ref("");
let searchTimeout: NodeJS.Timeout;

watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newValue;
    page.value = 1; // Reset to first page on search
  }, 300);
});

const { data: response, refresh } = await useFetch("/api/registrations", {
  query: {
    page,
    limit,
    search: debouncedSearch,
  },
  watch: [page, limit, debouncedSearch],
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

const deleteRegistration = async (id: number) => {
  if (!confirm("คุณต้องการลบรายการนี้หรือไม่?")) {
    return;
  }

  try {
    await $fetch(`/api/registrations/${id}`, {
      method: "DELETE",
    });
    await refresh();
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการลบข้อมูล");
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
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">รายชื่อผู้ลงทะเบียน</h2>
      <div class="badge badge-lg badge-ghost">
        ทั้งหมด {{ pagination.total }} รายการ
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-4">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search"
          class="input input-sm input-bordered w-64 pl-9"
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

    <!-- Table -->
    <div class="bg-base-100 rounded-xl overflow-hidden border border-base-300">
      <table class="table table-sm">
        <thead class="bg-base-200/50">
          <tr>
            <th class="font-semibold text-base-content/70">รหัสพนักงาน</th>
            <th class="font-semibold text-base-content/70">ชื่อ-นามสกุล</th>
            <th class="font-semibold text-base-content/70">วันที่ลงทะเบียน</th>
            <th class="font-semibold text-base-content/70 text-right">
              จัดการ
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="reg in registrations"
            :key="reg.id"
            class="hover:bg-base-200/30"
          >
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
                class="text-error hover:underline text-sm font-medium"
              >
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="registrations.length === 0">
            <td colspan="4" class="text-center py-12 text-base-content/40">
              {{
                searchQuery ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีรายการลงทะเบียน"
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination.totalPages > 1"
      class="flex justify-between items-center mt-6"
    >
      <div class="text-sm text-base-content/60">
        แสดง {{ (page - 1) * limit + 1 }} -
        {{ Math.min(page * limit, pagination.total) }} จาก
        {{ pagination.total }}
      </div>

      <div class="flex gap-1">
        <button
          class="btn btn-sm btn-circle btn-ghost"
          :disabled="page === 1"
          @click="prevPage"
        >
          ‹
        </button>

        <template v-for="pageNum in pagination.totalPages" :key="pageNum">
          <button
            v-if="
              pageNum === 1 ||
              pageNum === pagination.totalPages ||
              (pageNum >= page - 1 && pageNum <= page + 1)
            "
            class="btn btn-sm btn-circle"
            :class="page === pageNum ? 'btn-primary' : 'btn-ghost'"
            @click="goToPage(pageNum)"
          >
            {{ pageNum }}
          </button>
          <span
            v-else-if="pageNum === page - 2 || pageNum === page + 2"
            class="flex items-center px-2 text-base-content/40"
          >
            ···
          </span>
        </template>

        <button
          class="btn btn-sm btn-circle btn-ghost"
          :disabled="page === pagination.totalPages"
          @click="nextPage"
        >
          ›
        </button>
      </div>

      <select
        v-model="limit"
        class="select select-sm select-bordered rounded-full"
      >
        <option :value="10">10 / หน้า</option>
        <option :value="25">25 / หน้า</option>
        <option :value="50">50 / หน้า</option>
        <option :value="100">100 / หน้า</option>
      </select>
    </div>
  </div>
</template>
