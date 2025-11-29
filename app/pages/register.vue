<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
const router = useRouter();
const isSubmitting = ref(false);
const submitError = ref("");
const schema = toTypedSchema(
  z.object({
    firstName: z.string().min(1, "กรุณากรอกชื่อ"),
    lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
    employeeId: z
      .string()
      .min(1, "กรุณากรอกรหัสพนักงาน")
      .max(7, "รหัสพนักงานต้องไม่เกิน 7 หลัก")
      .regex(/^\d+$/, "รหัสพนักงานต้องเป็นตัวเลขเท่านั้น"),
  })
);
const { handleSubmit, errors, defineField, setErrors } = useForm({
  validationSchema: schema,
  initialValues: {
    firstName: "",
    lastName: "",
    employeeId: "",
  },
});
const [firstName, firstNameProps] = defineField("firstName");
const [lastName, lastNameProps] = defineField("lastName");
const [employeeId, employeeIdProps] = defineField("employeeId");
const { showSuccess, showError } = useSwal();
const onSubmit = handleSubmit(async (values) => {
  isSubmitting.value = true;
  submitError.value = "";
  try {
    const response: any = await $fetch("/api/registrations/create", {
      method: "POST",
      body: values,
    });
    router.push(`/success?id=${response.id}`);
  } catch (error: any) {
    if (error.data?.statusMessage) {
      const message = error.data.statusMessage;
      if (message.includes("employeeId")) {
        setErrors({ employeeId: "รหัสพนักงานนี้ถูกลงทะเบียนแล้ว" });
      } else {
        showError(message, "เกิดข้อผิดพลาด");
      }
    } else {
      showError("กรุณาลองใหม่อีกครั้ง", "เกิดข้อผิดพลาด");
    }
  } finally {
    isSubmitting.value = false;
  }
});
</script>
<template>
  <div
    class="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden"
  >
    <div
      class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50 to-transparent pointer-events-none"
    ></div>
    <div
      class="card w-full max-w-md bg-white shadow-xl border border-gray-100 z-10"
    >
      <div class="card-body p-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900">ลงทะเบียน</h2>
          <p class="text-gray-500 mt-2">กรอกข้อมูลเพื่อเข้าร่วมกิจกรรม</p>
        </div>
        <form @submit="onSubmit" class="space-y-5">
          <div class="form-control w-full">
            <label class="label px-0">
              <span class="label-text font-semibold text-gray-700">ชื่อ</span>
            </label>
            <input
              type="text"
              v-model="firstName"
              v-bind="firstNameProps"
              placeholder="กรอกชื่อจริง"
              class="input input-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all"
              :class="{ 'input-error': errors.firstName }"
            />
            <label class="label px-0" v-if="errors.firstName">
              <span class="label-text-alt text-error">{{
                errors.firstName
              }}</span>
            </label>
          </div>
          <div class="form-control w-full">
            <label class="label px-0">
              <span class="label-text font-semibold text-gray-700"
                >นามสกุล</span
              >
            </label>
            <input
              type="text"
              v-model="lastName"
              v-bind="lastNameProps"
              placeholder="กรอกนามสกุล"
              class="input input-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all"
              :class="{ 'input-error': errors.lastName }"
            />
            <label class="label px-0" v-if="errors.lastName">
              <span class="label-text-alt text-error">{{
                errors.lastName
              }}</span>
            </label>
          </div>
          <div class="form-control w-full">
            <label class="label px-0">
              <span class="label-text font-semibold text-gray-700"
                >รหัสพนักงาน</span
              >
            </label>
            <input
              type="text"
              v-model="employeeId"
              v-bind="employeeIdProps"
              placeholder="เช่น 1234567"
              maxlength="7"
              class="input input-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all"
              :class="{ 'input-error': errors.employeeId }"
            />
            <label class="label px-0" v-if="errors.employeeId">
              <span class="label-text-alt text-error">{{
                errors.employeeId
              }}</span>
            </label>
          </div>
          <div
            v-if="submitError"
            class="alert alert-error bg-red-50 text-red-600 border-red-100 text-sm mt-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{{ submitError }}</span>
          </div>
          <div class="card-actions justify-end mt-8">
            <button
              type="submit"
              class="btn btn-primary w-full text-lg rounded-xl shadow-lg shadow-indigo-100"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              {{ isSubmitting ? "กำลังบันทึก..." : "ยืนยันการลงทะเบียน" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
