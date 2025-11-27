export default defineNuxtRouteMiddleware(async (to, from) => {
  const isAuth = useCookie("isAuth");
  if (
    !isAuth.value &&
    to.path.startsWith("/admin") &&
    to.path !== "/admin/login"
  ) {
    return navigateTo("/admin/login");
  }
});
