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
  qrSize: 300,
  title: "",
  subtitle: "",
  showCount: false,
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
      displaySettings.value.backgroundImage =
        displayRes.data.backgroundImage || "";
      if (displayRes.data.qrPosition) {
        displaySettings.value.qrPosition = displayRes.data.qrPosition;
      }
      displaySettings.value.qrSize = displayRes.data.qrSize || 300;
      displaySettings.value.title = displayRes.data.title || "Lucky Draw";
      displaySettings.value.subtitle =
        displayRes.data.subtitle || "ลุ้นรับรางวัลใหญ่";
      displaySettings.value.showCount = displayRes.data.showCount || false;
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
        qrSize: displaySettings.value.qrSize,
        title: displaySettings.value.title,
        subtitle: displaySettings.value.subtitle,
        showCount: displaySettings.value.showCount,
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

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Settings Form -->
          <div>
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

            <div class="form-control mt-4">
              <label class="label cursor-pointer justify-start gap-4">
                <span class="label-text font-semibold"
                  >แสดงจำนวนผู้ลงทะเบียน</span
                >
                <input
                  v-model="displaySettings.showCount"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </label>
              <div class="text-xs text-base-content/60 mt-1">
                หากเปิดใช้งาน จะแสดงจำนวนผู้ลงทะเบียนทั้งหมดแทนข้อความรอ
              </div>
            </div>

            <div class="form-control mt-4">
              <label class="label">
                <span class="label-text font-semibold">หัวข้อ (Title)</span>
              </label>
              <input
                v-model="displaySettings.title"
                type="text"
                class="input input-bordered w-full"
                placeholder="Lucky Draw"
              />
            </div>

            <div class="form-control mt-4">
              <label class="label">
                <span class="label-text font-semibold"
                  >คำบรรยาย (Subtitle)</span
                >
              </label>
              <input
                v-model="displaySettings.subtitle"
                type="text"
                class="input input-bordered w-full"
                placeholder="ลุ้นรับรางวัลใหญ่"
              />
            </div>

            <div class="form-control mt-4 w-full">
              <label class="label cursor-pointer pb-2">
                <span class="label-text font-semibold">ขนาด QR Code</span>
              </label>
              <input
                v-model.number="displaySettings.qrSize"
                type="range"
                min="100"
                max="1000"
                step="10"
                class="range range-primary w-full"
              />
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

          <!-- Visual Editor (Iframe) -->
          <div
            class="border rounded-xl overflow-hidden relative w-full aspect-video bg-gray-100"
          >
            <iframe
              ref="previewIframe"
              src="/qr-display?preview=true"
              class="w-full h-full border-0"
              title="QR Display Preview"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
