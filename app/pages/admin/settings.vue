<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
definePageMeta({
  layout: "admin",
});
const { showSuccess, showError } = useSwal();
const isLoading = ref(false);
const validationSchema = toTypedSchema(
  z
    .object({
      currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
      newPassword: z
        .string()
        .min(4, "รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร"),
      confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "รหัสผ่านไม่ตรงกัน",
      path: ["confirmPassword"],
    })
);
const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema,
});
const [currentPassword, currentPasswordProps] = defineField("currentPassword");
const [newPassword, newPasswordProps] = defineField("newPassword");
const [confirmPassword, confirmPasswordProps] = defineField("confirmPassword");
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const onSubmit = handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    await $fetch("/api/auth/change-password", {
      method: "POST",
      body: {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
    });
    showSuccess("เปลี่ยนรหัสผ่านสำเร็จ", "สำเร็จ!");
    resetForm();
  } catch (error: any) {
    console.error("Error changing password:", error);
    showError(
      error.data?.statusMessage || "เปลี่ยนรหัสผ่านไม่สำเร็จ",
      "ข้อผิดพลาด"
    );
  } finally {
    isLoading.value = false;
  }
});
</script>
<template>
  <div class="max-w-md mx-auto mt-10">
    <h2 class="text-2xl font-bold mb-6">เปลี่ยนรหัสผ่าน</h2>
    <form @submit.prevent="onSubmit" class="space-y-4">
      <div class="form-control w-full">
        <label class="label">
          <span class="label-text font-semibold">รหัสผ่านปัจจุบัน</span>
        </label>
        <div class="relative">
          <input
            v-model="currentPassword"
            v-bind="currentPasswordProps"
            :type="showCurrentPassword ? 'text' : 'password'"
            class="input input-bordered w-full pr-10"
            :class="{ 'input-error': errors.currentPassword }"
            placeholder="กรอกรหัสผ่านปัจจุบัน"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            @click="showCurrentPassword = !showCurrentPassword"
          >
            <svg
              v-if="showCurrentPassword"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
        <label class="label" v-if="errors.currentPassword">
          <span class="label-text-alt text-error">{{
            errors.currentPassword
          }}</span>
        </label>
      </div>
      <div class="form-control w-full">
        <label class="label">
          <span class="label-text font-semibold">รหัสผ่านใหม่</span>
        </label>
        <div class="relative">
          <input
            v-model="newPassword"
            v-bind="newPasswordProps"
            :type="showNewPassword ? 'text' : 'password'"
            class="input input-bordered w-full pr-10"
            :class="{ 'input-error': errors.newPassword }"
            placeholder="กรอกรหัสผ่านใหม่"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            @click="showNewPassword = !showNewPassword"
          >
            <svg
              v-if="showNewPassword"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
        <label class="label" v-if="errors.newPassword">
          <span class="label-text-alt text-error">{{
            errors.newPassword
          }}</span>
        </label>
      </div>
      <div class="form-control w-full">
        <label class="label">
          <span class="label-text font-semibold">ยืนยันรหัสผ่านใหม่</span>
        </label>
        <div class="relative">
          <input
            v-model="confirmPassword"
            v-bind="confirmPasswordProps"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="input input-bordered w-full pr-10"
            :class="{ 'input-error': errors.confirmPassword }"
            placeholder="ยืนยันรหัสผ่านใหม่"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <svg
              v-if="showConfirmPassword"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
        <label class="label" v-if="errors.confirmPassword">
          <span class="label-text-alt text-error">{{
            errors.confirmPassword
          }}</span>
        </label>
      </div>
      <div class="mt-6">
        <button
          type="submit"
          class="btn btn-primary w-full text-white"
          :disabled="isLoading"
        >
          <span
            v-if="isLoading"
            class="loading loading-spinner loading-xs"
          ></span>
          เปลี่ยนรหัสผ่าน
        </button>
      </div>
    </form>
  </div>
</template>
