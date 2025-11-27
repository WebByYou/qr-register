<script setup lang="ts">
import QRCode from "qrcode";

definePageMeta({
  layout: "admin",
});

const registrationUrl = ref("");
const qrSize = ref(300);
const qrColor = ref("#000000");
const qrBgColor = ref("#ffffff");
const qrCodeDataUrl = ref("");

// Get full registration URL
onMounted(() => {
  const baseUrl = window.location.origin;
  registrationUrl.value = `${baseUrl}/register`;
  generateQRCode();
});

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

// Watch for changes and regenerate
watch([qrSize, qrColor, qrBgColor], () => {
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
  doc.write("<html><head><title>Print QR Code<" + "/title>");
  doc.write("<style>");
  doc.write(
    'body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: "Kanit", sans-serif; }'
  );
  doc.write("img { max-width: 100%; height: auto; }");
  doc.write(".info { text-align: center; margin-top: 20px; }");
  doc.write("@media print { body { padding: 20px; } }");
  doc.write("<" + "/style><" + "/head><body>");
  doc.write('<img src="' + qrCodeDataUrl.value + '" alt="QR Code" />');
  doc.write('<div class="info"><h2>สแกน QR Code เพื่อลงทะเบียน<' + "/h2>");
  doc.write("<p>" + registrationUrl.value + "<" + "/p><" + "/div>");
  doc.write("<" + "/body><" + "/html>");
  doc.close();

  setTimeout(() => {
    printWindow.print();
  }, 500);
};

const { showSuccess } = useSwal();

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
    <h2 class="text-2xl font-bold mb-6">จัดการ QR Code</h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- QR Code Preview -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body items-center">
          <h3 class="card-title mb-4">QR Code Preview</h3>

          <div class="bg-white p-6 rounded-xl shadow-lg">
            <img
              v-if="qrCodeDataUrl"
              :src="qrCodeDataUrl"
              alt="QR Code"
              class="w-full h-auto"
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
        </div>
      </div>

      <!-- Settings -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title mb-4">ตั้งค่า QR Code</h3>

          <!-- Size -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">ขนาด</span>
              <span class="label-text-alt">{{ qrSize }}x{{ qrSize }} px</span>
            </label>
            <input
              v-model="qrSize"
              type="range"
              min="200"
              max="1000"
              step="50"
              class="range range-primary"
            />
            <div class="flex justify-between text-xs px-2 mt-1">
              <span>200px</span>
              <span>1000px</span>
            </div>
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
          <div class="divider">Presets</div>
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
    </div>
  </div>
</template>
