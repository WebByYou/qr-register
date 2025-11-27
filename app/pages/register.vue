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
      .length(6, "รหัสพนักงานต้องมี 6 หลัก"),
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
    await $fetch("/api/registrations/create", {
      method: "POST",
      body: values,
    });
    await showSuccess("ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว", "ลงทะเบียนสำเร็จ!");
    router.push("/success");
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
  <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    <div class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body">
        <h2
          class="card-title text-2xl font-bold text-center justify-center mb-6"
        >
          ลงทะเบียน
        </h2>

        <form @submit="onSubmit" class="space-y-4">
          <!-- First Name -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">ชื่อ</span>
            </label>
            <input
              type="text"
              v-model="firstName"
              v-bind="firstNameProps"
              placeholder="กรอกชื่อ"
              class="input input-bordered w-full"
              :class="{ 'input-error': errors.firstName }"
            />
            <label class="label" v-if="errors.firstName">
              <span class="label-text-alt text-error">{{
                errors.firstName
              }}</span>
            </label>
          </div>

          <!-- Last Name -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">นามสกุล</span>
            </label>
            <input
              type="text"
              v-model="lastName"
              v-bind="lastNameProps"
              placeholder="กรอกนามสกุล"
              class="input input-bordered w-full"
              :class="{ 'input-error': errors.lastName }"
            />
            <label class="label" v-if="errors.lastName">
              <span class="label-text-alt text-error">{{
                errors.lastName
              }}</span>
            </label>
          </div>

          <!-- Employee ID -->
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">รหัสพนักงาน</span>
            </label>
            <input
              type="text"
              v-model="employeeId"
              v-bind="employeeIdProps"
              placeholder="รหัส 6 หลัก"
              maxlength="6"
              class="input input-bordered w-full"
              :class="{ 'input-error': errors.employeeId }"
            />
            <label class="label" v-if="errors.employeeId">
              <span class="label-text-alt text-error">{{
                errors.employeeId
              }}</span>
            </label>
          </div>

          <!-- General Error -->
          <div v-if="submitError" class="alert alert-error text-sm mt-4">
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

          <!-- Submit Button -->
          <div class="card-actions justify-end mt-6">
            <button
              type="submit"
              class="btn btn-primary w-full text-lg"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              {{ isSubmitting ? "กำลังบันทึก..." : "ลงทะเบียน" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
