<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";

const router = useRouter();
const error = ref("");
const loading = ref(false);

const schema = toTypedSchema(
  z.object({
    password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  })
);

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: schema,
});

const [password, passwordProps] = defineField("password");

const handleLogin = handleSubmit(async (values) => {
  try {
    loading.value = true;
    error.value = "";

    // Simulate network delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    await $fetch("/api/auth/login", {
      method: "POST",
      body: { password: values.password },
    });
    router.push("/admin/lucky-draw");
  } catch (e: any) {
    error.value = e.data?.statusMessage || "Login failed";
  } finally {
    loading.value = false;
  }
});
</script>
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-96">
      <h1 class="text-2xl font-bold mb-6 text-center">Admin Login</h1>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Password</label
          >
          <input
            v-model="password"
            v-bind="passwordProps"
            type="password"
            :disabled="loading"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 disabled:bg-gray-100 disabled:text-gray-500"
            :class="{ 'border-red-500': errors.password }"
          />
          <span v-if="errors.password" class="text-red-500 text-sm">{{
            errors.password
          }}</span>
        </div>
        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
        >
          <span v-if="loading" class="mr-2">
            <svg
              class="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
          {{ loading ? "Processing..." : "Login" }}
        </button>
      </form>
    </div>
  </div>
</template>
