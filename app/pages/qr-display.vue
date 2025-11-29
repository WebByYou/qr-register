<script setup lang="ts">
import QRCode from "qrcode";
const {
  count: registrationCount,
  isConnected,
  init,
  onMessage,
  removeListener,
} = useRegistration();
const settings = ref({
  backgroundImage: "",
  qrPosition: { x: 300, y: 150 },
  titlePosition: { x: 960, y: 540 },
  subtitlePosition: { x: 960, y: 600 },
  countPosition: { x: 960, y: 660 },
  titleStyle: { color: "#ffffff", size: 3.1, locked: false },
  subtitleStyle: { color: "#ffffff", size: 1.5, locked: false },
  countStyle: { color: "#ffffff", size: 1.25, locked: false },
  qrStyle: {
    locked: false,
    border: false,
    borderColor: "#ffffff",
    borderWidth: 10,
  },
  qrSize: 300,
  title: "Lucky Draw",
  subtitle: "ลุ้นรับรางวัลใหญ่",
  showCount: false,
  showTitle: true,
  showSubtitle: true,
});
const registrationUrl = ref("");
const qrCodeDataUrl = ref("");
const isLoading = ref(true);
const handleSSEMessage = (parsed: any) => {
  if (parsed.type === "settings") {
    const data = parsed.data;
    if (data.titleStyle && typeof data.titleStyle.locked === "undefined")
      data.titleStyle.locked = false;
    if (data.subtitleStyle && typeof data.subtitleStyle.locked === "undefined")
      data.subtitleStyle.locked = false;
    if (data.countStyle && typeof data.countStyle.locked === "undefined")
      data.countStyle.locked = false;
    if (!data.qrStyle) {
      data.qrStyle = {
        locked: false,
        border: false,
        borderColor: "#ffffff",
        borderWidth: 10,
      };
    }
    if (JSON.stringify(settings.value) !== JSON.stringify(data)) {
      settings.value = data;
    }
  }
};
onMounted(async () => {
  const baseUrl = window.location.origin;
  registrationUrl.value = `${baseUrl}/register`;
  await loadSettings();
  await generateQRCode();
  isLoading.value = false;
  init();
  onMessage(handleSSEMessage);
  if (isPreview.value) {
    window.addEventListener("message", handleMessage);
  }
});
onUnmounted(() => {
  removeListener(handleSSEMessage);
  if (isPreview.value) {
    window.removeEventListener("message", handleMessage);
  }
});
const route = useRoute();
const isPreview = computed(() => route.query.preview === "true");
const qrElement = ref<HTMLElement | null>(null);
const isDragging = ref<string | null>(null); 
const handleMessage = (event: MessageEvent) => {
  if (isDragging.value) return; 
  if (event.data.type === "UPDATE_SETTINGS") {
    settings.value = { ...settings.value, ...event.data.settings };
  }
};
const startDrag = (e: MouseEvent, type: string) => {
  if (!isPreview.value) return;
  isDragging.value = type;
  const startX = e.clientX;
  const startY = e.clientY;
  let startLeft = 0;
  let startTop = 0;
  if (type === "qr") {
    if (settings.value.qrStyle.locked) return;
    startLeft = settings.value.qrPosition.x;
    startTop = settings.value.qrPosition.y;
  } else if (type === "title") {
    if (settings.value.titleStyle.locked) return;
    startLeft = settings.value.titlePosition.x;
    startTop = settings.value.titlePosition.y;
  } else if (type === "subtitle") {
    if (settings.value.subtitleStyle.locked) return;
    startLeft = settings.value.subtitlePosition.x;
    startTop = settings.value.subtitlePosition.y;
  } else if (type === "count") {
    if (settings.value.countStyle.locked) return;
    startLeft = settings.value.countPosition.x;
    startTop = settings.value.countPosition.y;
  }
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
    } else if (type === "count") {
      settings.value.countPosition = { x: newX, y: newY };
      window.parent.postMessage(
        {
          type: "UPDATE_COUNT_POSITION",
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
watch(
  () => settings.value.showCount,
  (newVal) => {
  }
);
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
      const data = response.data;
      if (data.titleStyle && typeof data.titleStyle.locked === "undefined")
        data.titleStyle.locked = false;
      if (
        data.subtitleStyle &&
        typeof data.subtitleStyle.locked === "undefined"
      )
        data.subtitleStyle.locked = false;
      if (data.countStyle && typeof data.countStyle.locked === "undefined")
        data.countStyle.locked = false;
      if (!data.qrStyle) {
        data.qrStyle = {
          locked: false,
          border: false,
          borderColor: "#ffffff",
          borderWidth: 10,
        };
      }
      if (JSON.stringify(settings.value) !== JSON.stringify(data)) {
        settings.value = data;
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
onMounted(() => {
  document.addEventListener("fullscreenchange", () => {
    isFullScreen.value = !!document.fullscreenElement;
  });
});
</script>
<template>
  <div class="min-h-screen w-full overflow-hidden">
    <div
      v-if="isLoading"
      class="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
    >
      <div
        class="relative z-10 text-center p-8 w-full max-w-4xl flex flex-col items-center"
      >
        <div class="h-16 w-3/4 bg-gray-300 rounded-lg animate-pulse mb-4"></div>
        <div class="h-8 w-1/2 bg-gray-300 rounded-lg animate-pulse mb-12"></div>
        <div class="bg-white p-4 rounded-xl shadow-2xl mb-8 animate-pulse">
          <div class="w-[300px] h-[300px] bg-gray-200 rounded-lg"></div>
        </div>
        <div class="h-8 w-1/3 bg-gray-300 rounded-lg animate-pulse"></div>
      </div>
    </div>
    <div v-else class="fixed inset-0 flex items-center justify-center bg-black">
      <div
        v-if="settings"
        class="relative w-full aspect-video max-h-screen max-w-[177.78vh] shadow-2xl overflow-hidden"
        style="container-type: inline-size"
        :style="{
          backgroundImage: settings?.backgroundImage
            ? `url(${settings.backgroundImage})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }"
      >
        <div
          v-if="settings.showTitle"
          class="absolute transition-all duration-75 ease-out font-bold drop-shadow-lg whitespace-nowrap select-none"
          :class="{
            'cursor-move hover:ring-2 ring-blue-500 rounded':
              isPreview && !settings.titleStyle.locked,
          }"
          :style="{
            left: `${(settings.titlePosition.x / 1920) * 100}%`,
            top: `${(settings.titlePosition.y / 1080) * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: isDragging === 'title' ? 50 : 20,
            color: settings.titleStyle.color,
            fontSize: `${settings.titleStyle.size}cqw`,
          }"
          @mousedown="(e) => startDrag(e, 'title')"
        >
          {{ settings.title || "Lucky Draw" }}
        </div>
        <div
          v-if="settings.showSubtitle"
          class="absolute transition-all duration-75 ease-out opacity-90 drop-shadow-md whitespace-nowrap select-none"
          :class="{
            'cursor-move hover:ring-2 ring-blue-500 rounded':
              isPreview && !settings.subtitleStyle.locked,
          }"
          :style="{
            left: `${(settings.subtitlePosition.x / 1920) * 100}%`,
            top: `${(settings.subtitlePosition.y / 1080) * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: isDragging === 'subtitle' ? 50 : 20,
            color: settings.subtitleStyle.color,
            fontSize: `${settings.subtitleStyle.size}cqw`,
          }"
          @mousedown="(e) => startDrag(e, 'subtitle')"
        >
          {{ settings.subtitle || "ลุ้นรับรางวัลใหญ่" }}
        </div>
        <div
          v-if="settings.showCount"
          class="absolute transition-all duration-75 ease-out font-light tracking-wider whitespace-nowrap select-none"
          :class="{
            'cursor-move hover:ring-2 ring-blue-500 rounded':
              isPreview && !settings.countStyle.locked,
          }"
          :style="{
            left: `${(settings.countPosition.x / 1920) * 100}%`,
            top: `${(settings.countPosition.y / 1080) * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: isDragging === 'count' ? 50 : 30,
            color: settings.countStyle.color,
            fontSize: `${settings.countStyle.size}cqw`,
          }"
          @mousedown="(e) => startDrag(e, 'count')"
        >
          ลงทะเบียนแล้ว
          <span class="font-bold">{{ registrationCount }}</span>
          คน
        </div>
        <div
          v-if="qrCodeDataUrl"
          ref="qrElement"
          class="absolute transition-all duration-75 ease-out box-content"
          :class="{
            'cursor-move hover:ring-2 ring-blue-500':
              isPreview && !settings.qrStyle.locked,
          }"
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
      <NuxtLink
        to="/admin"
        class="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity duration-300 text-xs text-white/50 hover:text-white/80"
      >
        Admin
      </NuxtLink>
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
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
