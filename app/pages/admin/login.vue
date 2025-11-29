<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
const router = useRouter();
const error = ref("");
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
    await $fetch("/api/auth/login", {
      method: "POST",
      body: { password: values.password },
    });
    router.push("/admin/lucky-draw");
  } catch (e: any) {
    error.value = e.data?.statusMessage || "Login failed";
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
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            :class="{ 'border-red-500': errors.password }"
          />
          <span v-if="errors.password" class="text-red-500 text-sm">{{
            errors.password
          }}</span>
        </div>
        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
        <button
          type="submit"
          class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Login
        </button>
      </form>
    </div>
  </div>
</template>
