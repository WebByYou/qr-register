<script setup lang="ts">
import QRCode from "qrcode";

const settings = ref({
  backgroundImage: "",
  qrPosition: { x: 300, y: 150 },
  qrSize: 300,
  title: "Lucky Draw",
  subtitle: "ลุ้นรับรางวัลใหญ่",
  waitText: "รอลุ้นรางวัล...",
});

const registrationUrl = ref("");
const qrCodeDataUrl = ref("");
const isLoading = ref(true);

onMounted(async () => {
  const baseUrl = window.location.origin;
  registrationUrl.value = `${baseUrl}/register`;
  await loadSettings();
  await generateQRCode();
  isLoading.value = false;

  // Subscribe to SSE stream
  let eventSource: EventSource | null = null;

  if (typeof window !== "undefined") {
    eventSource = new EventSource("/api/qr-display/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (JSON.stringify(settings.value) !== JSON.stringify(data)) {
          settings.value = data;
        }
      } catch (e) {
        console.error("Error parsing SSE data:", e);
      }
    };
  }

  onUnmounted(() => {
    if (eventSource) {
      eventSource.close();
    }
  });
});

// Watch for size changes to regenerate QR code with correct resolution
watch(
  () => settings.value.qrSize,
  () => {
    generateQRCode();
  }
);

const loadSettings = async () => {
  try {
    const response: any = await $fetch("/api/qr-display/settings");
    if (response?.success && response?.data) {
      // Only update if values changed to avoid unnecessary re-renders if Vue doesn't handle deep equal automatically (it usually does for refs but good to be safe, though replacing the object works too)
      // For simplicity, we just replace the value, Vue handles the rest.
      // We might want to check if background image changed to avoid flickering?
      // Vue's diffing should handle it.

      // Check if we need to update to avoid replacing if identical (optional optimization, but replacing is fine)
      if (JSON.stringify(settings.value) !== JSON.stringify(response.data)) {
        settings.value = response.data;
      }
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
};

const generateQRCode = async () => {
  if (!registrationUrl.value) return;

  try {
    const dataUrl = await QRCode.toDataURL(registrationUrl.value, {
      width: settings.value.qrSize,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    qrCodeDataUrl.value = dataUrl;
  } catch (err) {
    console.error("Error generating QR code:", err);
  }
};
</script>

<template>
  <div class="min-h-screen w-full overflow-hidden">
    <!-- Loading State -->
    <!-- Loading State (Skeleton) -->
    <div
      v-if="isLoading"
      class="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
    >
      <div
        class="relative z-10 text-center p-8 w-full max-w-4xl flex flex-col items-center"
      >
        <!-- Title Skeleton -->
        <div class="h-16 w-3/4 bg-gray-300 rounded-lg animate-pulse mb-4"></div>

        <!-- Subtitle Skeleton -->
        <div class="h-8 w-1/2 bg-gray-300 rounded-lg animate-pulse mb-12"></div>

        <!-- QR Code Skeleton -->
        <div class="bg-white p-4 rounded-xl shadow-2xl mb-8 animate-pulse">
          <div class="w-[300px] h-[300px] bg-gray-200 rounded-lg"></div>
        </div>

        <!-- Wait Text Skeleton -->
        <div class="h-8 w-1/3 bg-gray-300 rounded-lg animate-pulse"></div>
      </div>
    </div>

    <!-- Display Container -->
    <div
      v-else
      class="fixed inset-0 flex items-center justify-center"
      :style="{
        backgroundImage: settings.backgroundImage
          ? `url(${settings.backgroundImage})`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }"
    >
      <!-- Content Container -->
      <div class="relative z-10 text-center text-white p-8">
        <h1 class="text-6xl font-bold mb-4 drop-shadow-lg">
          {{ settings.title || "Lucky Draw" }}
        </h1>
        <p class="text-3xl mb-12 drop-shadow-md opacity-90">
          {{ settings.subtitle || "ลุ้นรับรางวัลใหญ่" }}
        </p>

        <!-- QR Code Display -->
        <div
          v-if="qrCodeDataUrl"
          class="inline-block bg-white p-4 rounded-xl shadow-2xl mb-8"
        >
          <img
            :src="qrCodeDataUrl"
            alt="QR Code for Registration"
            :style="{
              width: settings.qrSize + 'px',
              height: settings.qrSize + 'px',
            }"
            class="block"
          />
        </div>

        <p class="text-2xl font-light tracking-wider animate-pulse">
          {{ settings.waitText || "รอลุ้นรางวัล..." }}
        </p>
      </div>

      <!-- Admin Link (Hidden, only visible on hover bottom right) -->
      <NuxtLink
        to="/admin"
        class="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity duration-300 text-xs text-white/50 hover:text-white/80"
      >
        Admin
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
/* Ensure fullscreen */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
