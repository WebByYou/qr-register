<script setup lang="ts">
import QRCode from "qrcode";

const settings = ref({
  backgroundImage: "",
  qrPosition: { x: 300, y: 150 },
  titlePosition: { x: 960, y: 540 },
  subtitlePosition: { x: 960, y: 600 },
  qrSize: 300,
  title: "Lucky Draw",
  subtitle: "ลุ้นรับรางวัลใหญ่",
  showCount: false,
});

const registrationUrl = ref("");
const qrCodeDataUrl = ref("");
const isLoading = ref(true);
const registrationCount = ref(0);
let countInterval: NodeJS.Timeout | null = null;

// Subscribe to SSE stream
let eventSource: EventSource | null = null;

onMounted(async () => {
  const baseUrl = window.location.origin;
  registrationUrl.value = `${baseUrl}/register`;
  await loadSettings();
  await generateQRCode();
  isLoading.value = false;

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

  // Start polling if showCount is enabled
  if (settings.value.showCount) {
    fetchCount();
    countInterval = setInterval(fetchCount, 5000);
  }

  // Preview Mode Logic
  if (isPreview.value) {
    window.addEventListener("message", handleMessage);
  }
});

onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
  if (countInterval) {
    clearInterval(countInterval);
  }
  if (isPreview.value) {
    window.removeEventListener("message", handleMessage);
  }
});

const route = useRoute();
const isPreview = computed(() => route.query.preview === "true");
const qrElement = ref<HTMLElement | null>(null);
const isDragging = ref<string | null>(null); // 'qr', 'title', 'subtitle' or null

// Handle messages from Admin Panel
const handleMessage = (event: MessageEvent) => {
  if (event.data.type === "UPDATE_SETTINGS") {
    // Update local settings from parent
    settings.value = { ...settings.value, ...event.data.settings };
  }
};

// Drag Logic
const startDrag = (e: MouseEvent, type: string) => {
  if (!isPreview.value) return;

  isDragging.value = type;
  const startX = e.clientX;
  const startY = e.clientY;

  let startLeft = 0;
  let startTop = 0;

  if (type === "qr") {
    startLeft = settings.value.qrPosition.x;
    startTop = settings.value.qrPosition.y;
  } else if (type === "title") {
    startLeft = settings.value.titlePosition.x;
    startTop = settings.value.titlePosition.y;
  } else if (type === "subtitle") {
    startLeft = settings.value.subtitlePosition.x;
    startTop = settings.value.subtitlePosition.y;
  }

  // Calculate scale based on the 16:9 container width vs 1920
  // We need to find the container element
  // Since qrElement might not be the target if dragging title, we need a reliable container ref or traverse up
  // But for simplicity, we can assume the parent of the target is the container (or close enough)
  // Actually, let's use qrElement's parent if available, or just document.body if we are in iframe
  // Better: use e.target to find the container
  const target = e.target as HTMLElement;
  const container = target.closest(".aspect-video");

  if (!container) return;

  const rect = container.getBoundingClientRect();
  const scaleX = 1920 / rect.width;
  const scaleY = 1080 / rect.height;

  const onMouseMove = (moveEvent: MouseEvent) => {
    const dx = (moveEvent.clientX - startX) * scaleX;
    const dy = (moveEvent.clientY - startY) * scaleY;

    const newX = Math.round(startLeft + dx);
    const newY = Math.round(startTop + dy);

    if (type === "qr") {
      settings.value.qrPosition = { x: newX, y: newY };
      window.parent.postMessage(
        {
          type: "UPDATE_QR_POSITION",
          position: { x: newX, y: newY },
        },
        "*"
      );
    } else if (type === "title") {
      settings.value.titlePosition = { x: newX, y: newY };
      window.parent.postMessage(
        {
          type: "UPDATE_TITLE_POSITION",
          position: { x: newX, y: newY },
        },
        "*"
      );
    } else if (type === "subtitle") {
      settings.value.subtitlePosition = { x: newX, y: newY };
      window.parent.postMessage(
        {
          type: "UPDATE_SUBTITLE_POSITION",
          position: { x: newX, y: newY },
        },
        "*"
      );
    }
  };

  const onMouseUp = () => {
    isDragging.value = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const fetchCount = async () => {
  try {
    const res: any = await $fetch("/api/registrations/count");
    if (res?.success) {
      registrationCount.value = res.count;
    }
  } catch (error) {
    console.error("Error fetching count:", error);
  }
};

// Watch for showCount changes to start/stop polling
watch(
  () => settings.value.showCount,
  (newVal) => {
    if (newVal) {
      fetchCount();
      if (!countInterval) {
        countInterval = setInterval(fetchCount, 5000);
      }
    } else {
      if (countInterval) {
        clearInterval(countInterval);
        countInterval = null;
      }
    }
  }
);

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

// Full Screen Logic
const isFullScreen = ref(false);

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(
        `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
      );
    });
    isFullScreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      isFullScreen.value = false;
    }
  }
};

// Listen for fullscreen change events (e.g. user presses Esc)
onMounted(() => {
  document.addEventListener("fullscreenchange", () => {
    isFullScreen.value = !!document.fullscreenElement;
  });
});
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
    <div v-else class="fixed inset-0 flex items-center justify-center bg-black">
      <!-- 16:9 Aspect Ratio Container -->
      <div
        class="relative w-full aspect-video max-h-screen max-w-[177.78vh] shadow-2xl overflow-hidden"
        style="container-type: inline-size"
        :style="{
          backgroundImage: settings.backgroundImage
            ? `url(${settings.backgroundImage})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }"
      >
        <!-- Content Container (Title/Subtitle/WaitText) -->
        <!-- Use percentages relative to the 16:9 container for consistent scaling -->
        <!-- Content Container (Title/Subtitle/WaitText) -->
        <!-- Title -->
        <div
          class="absolute transition-all duration-75 ease-out text-white font-bold text-[3.1cqw] drop-shadow-lg whitespace-nowrap"
          :class="{
            'cursor-move hover:ring-2 ring-blue-500 rounded': isPreview,
          }"
          :style="{
            left: `${(settings.titlePosition.x / 1920) * 100}%`,
            top: `${(settings.titlePosition.y / 1080) * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: isDragging === 'title' ? 50 : 20,
          }"
          @mousedown="(e) => startDrag(e, 'title')"
        >
          {{ settings.title || "Lucky Draw" }}
        </div>

        <!-- Subtitle -->
        <div
          class="absolute transition-all duration-75 ease-out text-white opacity-90 text-[1.5cqw] drop-shadow-md whitespace-nowrap"
          :class="{
            'cursor-move hover:ring-2 ring-blue-500 rounded': isPreview,
          }"
          :style="{
            left: `${(settings.subtitlePosition.x / 1920) * 100}%`,
            top: `${(settings.subtitlePosition.y / 1080) * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: isDragging === 'subtitle' ? 50 : 20,
          }"
          @mousedown="(e) => startDrag(e, 'subtitle')"
        >
          {{ settings.subtitle || "ลุ้นรับรางวัลใหญ่" }}
        </div>

        <!-- Registration Count (Positioned relative to subtitle or fixed? Let's keep it fixed for now or move with subtitle?) -->
        <!-- User only asked for Title and Subtitle. Let's keep count fixed or maybe make it draggable later if asked. -->
        <!-- Actually, usually count is part of the text group. Let's put it below subtitle for now, or maybe it should be draggable too? -->
        <!-- For now, I'll keep it centered as a fallback or maybe just hide it if not draggable? -->
        <!-- Wait, the original code had it in a flex container centered. -->
        <!-- If I move title and subtitle out of the flex container, the count will be left alone. -->
        <!-- Let's make the count draggable too? Or just leave it in the center? -->
        <!-- The user request specifically mentioned "Title and sub". -->
        <!-- I will leave the count in the center for now, but maybe I should make it draggable too to be safe. -->
        <!-- Let's stick to the request: Title and Sub. -->

        <div
          v-if="settings.showCount"
          class="absolute transition-all duration-75 ease-out text-white font-light tracking-wider text-[1.25cqw] whitespace-nowrap"
          :style="{
            left: '50%',
            top: '60%',
            transform: 'translate(-50%, -50%)',
          }"
        >
          ลงทะเบียนแล้ว
          <span class="font-bold text-[1.5cqw]">{{ registrationCount }}</span>
          คน
        </div>

        <div
          v-if="qrCodeDataUrl"
          ref="qrElement"
          class="absolute transition-all duration-75 ease-out"
          :class="{ 'cursor-move hover:ring-2 ring-blue-500': isPreview }"
          :style="{
            left: `${(settings.qrPosition.x / 1920) * 100}%`,
            top: `${(settings.qrPosition.y / 1080) * 100}%`,
            width: `${(settings.qrSize / 1920) * 100}%`,
            zIndex: isDragging === 'qr' ? 50 : 10,
          }"
          @mousedown="(e) => startDrag(e, 'qr')"
        >
          <img
            :src="qrCodeDataUrl"
            alt="QR Code for Registration"
            class="block w-full h-auto pointer-events-none"
          />
        </div>
      </div>

      <!-- Admin Link (Hidden, only visible on hover bottom right) -->
      <NuxtLink
        to="/admin"
        class="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity duration-300 text-xs text-white/50 hover:text-white/80"
      >
        Admin
      </NuxtLink>

      <!-- Full Screen Toggle Button -->
      <button
        v-if="!isPreview"
        @click="toggleFullScreen"
        class="fixed top-4 right-4 z-50 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all duration-300 backdrop-blur-sm"
        title="Toggle Full Screen"
      >
        <svg
          v-if="!isFullScreen"
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
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
        <svg
          v-else
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
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
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
