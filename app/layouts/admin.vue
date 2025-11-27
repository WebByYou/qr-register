<script setup lang="ts">
const router = useRouter();
const handleLogout = () => {
  const isAuth = useCookie("isAuth");
  isAuth.value = null;
  router.push("/admin/login");
};
</script>

<template>
  <div class="min-h-screen bg-base-200 flex font-sans p-4 gap-4">
    <!-- Sidebar -->
    <aside class="w-64 bg-base-100 rounded-2xl shadow-lg flex flex-col">
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
          to="/admin"
          exact-active-class="bg-primary/10 text-primary"
          class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-200"
        >
          <!-- Active Indicator -->
          <span
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full opacity-0 group-[.router-link-exact-active]:opacity-100 transition-opacity"
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
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          Dashboard
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
    <main class="flex-1 bg-base-100 rounded-2xl shadow-lg p-8 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
