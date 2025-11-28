<script setup lang="ts">
const router = useRouter();
const isDrawerOpen = ref(false);

const { showConfirm } = useSwal();

const handleLogout = async () => {
  const confirmed = await showConfirm(
    "คุณต้องการออกจากระบบหรือไม่?",
    "ยืนยันการออกจากระบบ"
  );

  if (!confirmed) return;

  const isAuth = useCookie("isAuth");
  isAuth.value = null;
  router.push("/admin/login");
};

const closeDrawer = () => {
  isDrawerOpen.value = false;
};

// Close drawer when route changes
watch(
  () => router.currentRoute.value.path,
  () => {
    isDrawerOpen.value = false;
  }
);
</script>

<template>
  <div
    class="h-screen overflow-hidden bg-base-200 flex flex-col lg:flex-row font-sans lg:p-4 lg:gap-4"
  >
    <!-- Mobile Header -->
    <div
      class="lg:hidden bg-base-100 p-4 flex items-center justify-between shadow-sm sticky top-0 z-40"
    >
      <div class="flex items-center gap-3">
        <div class="bg-primary text-primary-content p-2 rounded-xl shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 class="text-lg font-black tracking-tight text-base-content">
          QR Register
        </h1>
      </div>
      <button
        @click="isDrawerOpen = true"
        class="btn btn-ghost btn-sm btn-square"
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>

    <!-- Drawer Overlay (Mobile) -->
    <div
      v-if="isDrawerOpen"
      @click="closeDrawer"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'bg-base-100 flex flex-col shadow-lg transition-transform duration-300 z-50',
        'lg:w-64 lg:rounded-2xl lg:relative',
        'fixed inset-y-0 left-0 w-64',
        isDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <!-- Close Button (Mobile) -->
      <button
        @click="closeDrawer"
        class="lg:hidden absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Header Section -->
      <div class="p-6 space-y-6">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="bg-primary text-primary-content p-2 rounded-xl shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 class="text-xl font-black tracking-tight text-base-content">
            QR Register
          </h1>
        </div>
      </div>

      <!-- Menu -->
      <nav class="flex-1 px-3 overflow-y-auto space-y-1">
        <div
          class="px-3 py-2 text-[11px] font-bold text-base-content/40 uppercase tracking-wider"
        >
          Menu
        </div>

        <NuxtLink
          to="/admin/lucky-draw"
          active-class="bg-primary/10 text-primary"
          class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-200"
        >
          <span
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full opacity-0 group-[.router-link-active]:opacity-100 transition-opacity"
          ></span>
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
              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
            />
          </svg>
          สุ่มรางวัล
        </NuxtLink>

        <NuxtLink
          to="/admin/registrations"
          active-class="bg-primary/10 text-primary"
          class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-200"
        >
          <span
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full opacity-0 group-[.router-link-active]:opacity-100 transition-opacity"
          ></span>
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          รายชื่อผู้ลงทะเบียน
        </NuxtLink>

        <NuxtLink
          to="/admin/qr-codes"
          active-class="bg-primary/10 text-primary"
          class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-200"
        >
          <span
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full opacity-0 group-[.router-link-active]:opacity-100 transition-opacity"
          ></span>
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
              d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          จัดการ QR Code
        </NuxtLink>
      </nav>

      <!-- Bottom Actions -->
      <div class="p-4 border-t border-base-200 space-y-2">
        <button
          @click="handleLogout"
          class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors"
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main
      class="flex-1 bg-base-100 lg:rounded-2xl lg:shadow-lg p-4 sm:p-6 lg:p-8 overflow-y-auto"
    >
      <slot />
    </main>
  </div>
</template>
