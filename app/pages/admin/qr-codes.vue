<script setup lang="ts">
import QRCode from "qrcode";
import { useDebounceFn } from "@vueuse/core";

definePageMeta({
  layout: "admin",
});

const registrationUrl = ref("");
const qrSize = ref(300);
const qrColor = ref("#000000");
const qrBgColor = ref("#ffffff");
const showOnDisplay = ref(false);
const qrCodeDataUrl = ref("");
const isLoading = ref(true);
const isSaving = ref(false);

const { showSuccess, showError } = useSwal();

// Display Settings
const displaySettings = ref({
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
  title: "",
  subtitle: "",
  showCount: false,
  showTitle: true,
  showSubtitle: true,
});
const isSavingDisplay = ref(false);

// Get full registration URL
onMounted(async () => {
  const baseUrl = window.location.origin;
  registrationUrl.value = `${baseUrl}/register`;
  await loadSettings();
  generateQRCode();
});

const loadSettings = async () => {
  try {
    const [qrRes, displayRes]: [any, any] = await Promise.all([
      $fetch("/api/qr-code/settings"),
      $fetch("/api/qr-display/settings"),
    ]);

    if (qrRes?.success && qrRes?.data) {
      qrSize.value = qrRes.data.size || 300;
      qrColor.value = qrRes.data.color || "#000000";
      qrBgColor.value = qrRes.data.bgColor || "#ffffff";
      showOnDisplay.value = qrRes.data.showOnDisplay || false;
    }

    if (displayRes?.success && displayRes?.data) {
      const data = displayRes.data;
      // Ensure locked property exists
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

      displaySettings.value = {
        ...displaySettings.value,
        ...data,
      };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  } finally {
    isLoading.value = false;
  }
};

const saveSettings = useDebounceFn(async () => {
  isSaving.value = true;
  try {
    await $fetch("/api/qr-code/settings", {
      method: "POST",
      body: {
        size: qrSize.value,
        color: qrColor.value,
        bgColor: qrBgColor.value,
        showOnDisplay: showOnDisplay.value,
      },
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    showError("บันทึกการตั้งค่าไม่สำเร็จ", "ข้อผิดพลาด");
  } finally {
    isSaving.value = false;
  }
}, 1000);

// Generate QR Code locally
const generateQRCode = async () => {
  if (!registrationUrl.value) return;

  try {
    const dataUrl = await QRCode.toDataURL(registrationUrl.value, {
      width: qrSize.value,
      margin: 2,
      color: {
        dark: qrColor.value,
        light: qrBgColor.value,
      },
    });
    qrCodeDataUrl.value = dataUrl;
  } catch (err) {
    console.error("Error generating QR code:", err);
  }
};

// Watch for changes and regenerate (but don't auto-save)
watch([qrSize, qrColor, qrBgColor, showOnDisplay], () => {
  generateQRCode();
});

const downloadQR = () => {
  const link = document.createElement("a");
  link.href = qrCodeDataUrl.value;
  link.download = `qr-code-register-${Date.now()}.png`;
  link.click();
};

const printQR = () => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const doc = printWindow.document;
  doc.open();
  doc.write("<!DOCTYPE html>");
  doc.write("<html><head><title>Print QR Code</title>");
  doc.write("<style>");
  doc.write(
    'body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: "Kanit", sans-serif; }'
  );
  doc.write("img { max-width: 100%; height: auto; }");
  doc.write(".info { text-align: center; margin-top: 20px; }");
  doc.write("@media print { body { padding: 20px; } }");
  doc.write("</style></head><body>");
  doc.write('<img src="' + qrCodeDataUrl.value + '" alt="QR Code" />');
  doc.write('<div class="info"><h2>สแกน QR Code เพื่อลงทะเบียน</h2>');
  doc.write("<p>" + registrationUrl.value + "</p></div>");
  doc.write("</body></html>");
  doc.close();

  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// Iframe Communication
const previewIframe = ref<HTMLIFrameElement | null>(null);

// Listen for messages from iframe (drag updates)
const handleIframeMessage = (event: MessageEvent) => {
  if (event.data.type === "UPDATE_QR_POSITION") {
    displaySettings.value.qrPosition = event.data.position;
  } else if (event.data.type === "UPDATE_TITLE_POSITION") {
    displaySettings.value.titlePosition = event.data.position;
  } else if (event.data.type === "UPDATE_SUBTITLE_POSITION") {
    displaySettings.value.subtitlePosition = event.data.position;
  } else if (event.data.type === "UPDATE_COUNT_POSITION") {
    displaySettings.value.countPosition = event.data.position;
  }
};

onMounted(() => {
  window.addEventListener("message", handleIframeMessage);
});

onUnmounted(() => {
  window.removeEventListener("message", handleIframeMessage);
});

// Sync settings to iframe
watch(
  displaySettings,
  (newSettings) => {
    if (previewIframe.value?.contentWindow) {
      // Deep clone to remove Proxy wrappers and avoid DataCloneError
      const plainSettings = JSON.parse(JSON.stringify(newSettings));
      previewIframe.value.contentWindow.postMessage(
        {
          type: "UPDATE_SETTINGS",
          settings: plainSettings,
        },
        "*"
      );
    }
  },
  { deep: true }
);

const saveDisplaySettings = async () => {
  isSavingDisplay.value = true;
  try {
    await $fetch("/api/qr-display/settings", {
      method: "POST",
      body: {
        backgroundImage: displaySettings.value.backgroundImage,
        qrPosition: displaySettings.value.qrPosition,
        titlePosition: displaySettings.value.titlePosition,
        subtitlePosition: displaySettings.value.subtitlePosition,
        countPosition: displaySettings.value.countPosition,
        titleStyle: displaySettings.value.titleStyle,
        subtitleStyle: displaySettings.value.subtitleStyle,
        countStyle: displaySettings.value.countStyle,

        qrStyle: displaySettings.value.qrStyle,
        qrSize: displaySettings.value.qrSize,
        title: displaySettings.value.title,
        subtitle: displaySettings.value.subtitle,
        showCount: displaySettings.value.showCount,
        showTitle: displaySettings.value.showTitle,
        showSubtitle: displaySettings.value.showSubtitle,
      },
    });
    showSuccess("บันทึกการตั้งค่าหน้าจอสำเร็จ", "สำเร็จ!");
  } catch (error) {
    console.error("Error saving display settings:", error);
    showError("บันทึกการตั้งค่าหน้าจอไม่สำเร็จ", "ข้อผิดพลาด");
  } finally {
    isSavingDisplay.value = false;
  }
};

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(registrationUrl.value);
    showSuccess("คัดลอก URL สำเร็จ", "สำเร็จ!");
  } catch (err) {
    alert("ไม่สามารถคัดลอกได้");
  }
};
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">จัดการ QR Code</h2>
      <div
        v-if="isSaving"
        class="text-sm text-gray-500 flex items-center gap-2"
      >
        <span class="loading loading-spinner loading-xs"></span>
        กำลังบันทึก...
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- QR Code Preview -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body items-center">
          <h3 class="card-title mb-4">ตัวอย่าง QR Code</h3>

          <div>
            <div
              v-if="isLoading"
              class="w-64 h-64 bg-gray-200 animate-pulse rounded-lg"
            ></div>
            <img
              v-else-if="qrCodeDataUrl"
              :src="qrCodeDataUrl"
              alt="QR Code"
              class="w-full h-auto max-w-[300px]"
            />
          </div>

          <div class="mt-4 text-center">
            <p class="text-sm text-base-content/60 mb-2">สแกนเพื่อลงทะเบียน</p>
            <code class="text-xs bg-base-200 px-3 py-1 rounded">
              {{ registrationUrl }}
            </code>
          </div>

          <div class="flex gap-2 mt-6">
            <button class="btn btn-primary btn-sm gap-2" @click="downloadQR">
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              ดาวน์โหลด
            </button>
            <button class="btn btn-secondary btn-sm gap-2" @click="printQR">
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
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              พิมพ์
            </button>
            <button class="btn btn-ghost btn-sm gap-2" @click="copyUrl">
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              คัดลอก URL
            </button>
          </div>

          <!-- Info -->
          <div class="alert alert-info mt-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="stroke-current shrink-0 w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span class="text-sm">
              QR Code นี้จะลิงก์ไปยังหน้าลงทะเบียน
              สามารถพิมพ์หรือแชร์ให้ผู้ใช้สแกนได้เลย
            </span>
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title mb-4">ตั้งค่า QR Code</h3>

          <!-- Show on Display Page -->
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-semibold"
                >แสดงบนหน้าจอสุ่มรางวัล</span
              >
              <input
                v-model="showOnDisplay"
                type="checkbox"
                class="toggle toggle-primary"
              />
            </label>
            <div class="text-xs text-base-content/60 px-1">
              เมื่อเปิดใช้งาน QR Code จะแสดงที่มุมขวาล่างของหน้าจอสุ่มรางวัล
            </div>
          </div>

          <div class="divider"></div>

          <!-- Size -->
          <!-- Size -->
          <div class="form-control w-full">
            <label class="label cursor-pointer pb-2">
              <span class="label-text font-semibold">ขนาด</span>
            </label>
            <input
              v-model="qrSize"
              type="range"
              min="200"
              max="1000"
              step="50"
              class="range range-primary w-full"
            />
          </div>

          <!-- QR Color -->
          <div class="form-control mt-4">
            <label class="label">
              <span class="label-text font-semibold">สี QR Code</span>
            </label>
            <div class="flex gap-2">
              <input
                v-model="qrColor"
                type="color"
                class="w-16 h-10 rounded cursor-pointer"
              />
              <input
                v-model="qrColor"
                type="text"
                class="input input-bordered input-sm flex-1"
                placeholder="#000000"
              />
            </div>
          </div>

          <!-- Background Color -->
          <div class="form-control mt-4">
            <label class="label">
              <span class="label-text font-semibold">สีพื้นหลัง</span>
            </label>
            <div class="flex gap-2">
              <input
                v-model="qrBgColor"
                type="color"
                class="w-16 h-10 rounded cursor-pointer"
              />
              <input
                v-model="qrBgColor"
                type="text"
                class="input input-bordered input-sm flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>

          <!-- Presets -->
          <div class="divider">รูปแบบสำเร็จรูป</div>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="btn btn-sm btn-outline"
              @click="
                () => {
                  qrColor = '#000000';
                  qrBgColor = '#ffffff';
                }
              "
            >
              ขาว-ดำ (คลาสสิก)
            </button>
            <button
              class="btn btn-sm btn-outline"
              @click="
                () => {
                  qrColor = '#3b82f6';
                  qrBgColor = '#ffffff';
                }
              "
            >
              น้ำเงิน-ขาว
            </button>
            <button
              class="btn btn-sm btn-outline"
              @click="
                () => {
                  qrColor = '#ffffff';
                  qrBgColor = '#000000';
                }
              "
            >
              ขาว-ดำ (กลับด้าน)
            </button>
            <button
              class="btn btn-sm btn-outline"
              @click="
                () => {
                  qrColor = '#10b981';
                  qrBgColor = '#ffffff';
                }
              "
            >
              เขียว-ขาว
            </button>
          </div>

          <div class="mt-6">
            <button
              class="btn btn-primary w-full"
              @click="saveSettings"
              :disabled="isSaving"
            >
              <span
                v-if="isSaving"
                class="loading loading-spinner loading-xs"
              ></span>
              บันทึกการตั้งค่า QR Code
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Display Management -->
    <div class="card bg-base-100 border border-base-300 mt-6">
      <div class="card-body">
        <h3 class="card-title mb-4">จัดการหน้าจอแสดงผล (QR Display)</h3>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Visual Editor (Iframe) -->
          <div
            class="border rounded-xl overflow-hidden relative w-full aspect-video bg-gray-100 lg:col-span-3"
          >
            <iframe
              ref="previewIframe"
              src="/qr-display?preview=true"
              class="w-full h-full border-0"
              title="QR Display Preview"
            ></iframe>
          </div>

          <!-- Settings Form -->
          <div class="lg:col-span-1">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold"
                  >รูปภาพพื้นหลัง (URL)</span
                >
              </label>
              <input
                v-model="displaySettings.backgroundImage"
                type="text"
                class="input input-bordered w-full"
                placeholder="https://example.com/background.jpg"
              />
              <div class="text-xs text-base-content/60 mt-1">
                ใส่ URL ของรูปภาพที่ต้องการใช้เป็นพื้นหลัง
              </div>
            </div>

            <!-- QR Settings Group -->
            <div class="border rounded-lg p-4 mt-4 bg-base-100 shadow-sm">
              <div class="form-control">
                <div class="label pt-0 pb-1 justify-between">
                  <span class="label-text font-bold text-lg">QR Code</span>
                  <div class="flex items-center gap-1">
                    <button
                      class="btn btn-circle btn-ghost btn-xs"
                      @click="
                        displaySettings.qrStyle.locked =
                          !displaySettings.qrStyle.locked
                      "
                    >
                      <svg
                        v-if="displaySettings.qrStyle.locked"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-error"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- QR Size -->
                <div class="form-control mb-4">
                  <label class="label pt-0 pb-2 justify-start">
                    <span class="label-text text-sm font-medium">ขนาด</span>
                  </label>
                  <input
                    v-model.number="displaySettings.qrSize"
                    type="range"
                    min="100"
                    max="1000"
                    step="10"
                    class="range range-xs range-primary w-full"
                    :disabled="displaySettings.qrStyle.locked"
                  />
                </div>
              </div>
            </div>

            <!-- Title Group -->
            <div class="border rounded-lg p-4 mt-4 bg-base-100 shadow-sm">
              <div class="form-control">
                <div class="label pt-0 pb-1 justify-between">
                  <span class="label-text font-bold text-lg"
                    >หัวข้อ (Title)</span
                  >
                  <div class="flex items-center gap-1">
                    <button
                      class="btn btn-circle btn-ghost btn-xs"
                      @click="
                        displaySettings.titleStyle.locked =
                          !displaySettings.titleStyle.locked
                      "
                    >
                      <svg
                        v-if="displaySettings.titleStyle.locked"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-error"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      class="btn btn-circle btn-ghost btn-xs"
                      @click="
                        displaySettings.showTitle = !displaySettings.showTitle
                      "
                      :disabled="displaySettings.titleStyle.locked"
                    >
                      <svg
                        v-if="displaySettings.showTitle"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div v-if="displaySettings.showTitle">
                  <input
                    v-model="displaySettings.title"
                    type="text"
                    class="input input-bordered w-full mb-3"
                    placeholder="Lucky Draw"
                    :disabled="displaySettings.titleStyle.locked"
                  />

                  <div class="flex gap-4 items-start">
                    <div class="flex-1">
                      <label class="label pt-0 pb-2 justify-start">
                        <span class="label-text text-sm font-medium">ขนาด</span>
                      </label>
                      <input
                        v-model.number="displaySettings.titleStyle.size"
                        type="range"
                        min="1"
                        max="10"
                        step="0.1"
                        class="range range-xs range-primary w-full"
                        :disabled="displaySettings.titleStyle.locked"
                      />
                    </div>
                    <div class="flex-none flex flex-col items-center">
                      <label class="label pt-0 pb-2">
                        <span class="label-text text-sm font-medium">สี</span>
                      </label>
                      <input
                        v-model="displaySettings.titleStyle.color"
                        type="color"
                        class="h-8 w-14 p-0 border-0 rounded overflow-hidden cursor-pointer shadow-sm"
                        :disabled="displaySettings.titleStyle.locked"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Subtitle Group -->
            <div class="border rounded-lg p-4 mt-4 bg-base-100 shadow-sm">
              <div class="form-control">
                <div class="label pt-0 pb-1 justify-between">
                  <span class="label-text font-bold text-lg"
                    >คำบรรยาย (Subtitle)</span
                  >
                  <div class="flex items-center gap-1">
                    <button
                      class="btn btn-circle btn-ghost btn-xs"
                      @click="
                        displaySettings.subtitleStyle.locked =
                          !displaySettings.subtitleStyle.locked
                      "
                    >
                      <svg
                        v-if="displaySettings.subtitleStyle.locked"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-error"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      class="btn btn-circle btn-ghost btn-xs"
                      @click="
                        displaySettings.showSubtitle =
                          !displaySettings.showSubtitle
                      "
                      :disabled="displaySettings.subtitleStyle.locked"
                    >
                      <svg
                        v-if="displaySettings.showSubtitle"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div v-if="displaySettings.showSubtitle">
                  <input
                    v-model="displaySettings.subtitle"
                    type="text"
                    class="input input-bordered w-full mb-3"
                    placeholder="ลุ้นรับรางวัลใหญ่"
                    :disabled="displaySettings.subtitleStyle.locked"
                  />

                  <div class="flex gap-4 items-start">
                    <div class="flex-1">
                      <label class="label pt-0 pb-2 justify-start">
                        <span class="label-text text-sm font-medium">ขนาด</span>
                      </label>
                      <input
                        v-model.number="displaySettings.subtitleStyle.size"
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        class="range range-xs range-primary w-full"
                        :disabled="displaySettings.subtitleStyle.locked"
                      />
                    </div>
                    <div class="flex-none flex flex-col items-center">
                      <label class="label pt-0 pb-2">
                        <span class="label-text text-sm font-medium">สี</span>
                      </label>
                      <input
                        v-model="displaySettings.subtitleStyle.color"
                        type="color"
                        class="h-8 w-14 p-0 border-0 rounded overflow-hidden cursor-pointer shadow-sm"
                        :disabled="displaySettings.subtitleStyle.locked"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Count Group -->
            <div class="border rounded-lg p-4 mt-4 bg-base-100 shadow-sm">
              <div class="form-control">
                <div class="label cursor-pointer justify-between pt-0 pb-2">
                  <span class="label-text font-bold text-lg"
                    >ตัวนับ (Count)</span
                  >
                  <div class="flex items-center gap-1">
                    <button
                      class="btn btn-circle btn-ghost btn-xs"
                      @click="
                        displaySettings.countStyle.locked =
                          !displaySettings.countStyle.locked
                      "
                    >
                      <svg
                        v-if="displaySettings.countStyle.locked"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-error"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      class="btn btn-circle btn-ghost btn-xs"
                      @click="
                        displaySettings.showCount = !displaySettings.showCount
                      "
                      :disabled="displaySettings.countStyle.locked"
                    >
                      <svg
                        v-if="displaySettings.showCount"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="text-xs text-base-content/60 mb-3">
                  แสดงจำนวนผู้ลงทะเบียน
                </div>

                <div
                  v-if="displaySettings.showCount"
                  class="pt-2 border-t mt-2"
                >
                  <div class="flex gap-4 items-start">
                    <div class="flex-1">
                      <label class="label pt-0 pb-2 justify-start">
                        <span class="label-text text-sm font-medium">ขนาด</span>
                      </label>
                      <input
                        v-model.number="displaySettings.countStyle.size"
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        class="range range-xs range-primary w-full"
                        :disabled="displaySettings.countStyle.locked"
                      />
                    </div>
                    <div class="flex-none flex flex-col items-center">
                      <label class="label pt-0 pb-2">
                        <span class="label-text text-sm font-medium">สี</span>
                      </label>
                      <input
                        v-model="displaySettings.countStyle.color"
                        type="color"
                        class="h-8 w-14 p-0 border-0 rounded overflow-hidden cursor-pointer shadow-sm"
                        :disabled="displaySettings.countStyle.locked"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6">
              <button
                class="btn btn-primary"
                @click="saveDisplaySettings"
                :disabled="isSavingDisplay"
              >
                <span
                  v-if="isSavingDisplay"
                  class="loading loading-spinner loading-xs"
                ></span>
                บันทึกการตั้งค่าหน้าจอ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
