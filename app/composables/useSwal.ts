import Swal from "sweetalert2";
export const useSwal = () => {
  const showSuccess = (message: string, title: string = "สำเร็จ!") => {
    return Swal.fire({
      icon: "success",
      title,
      text: message,
      confirmButtonText: "ตกลง",
      confirmButtonColor: "#3b82f6",
    });
  };
  const showError = (message: string, title: string = "เกิดข้อผิดพลาด!") => {
    return Swal.fire({
      icon: "error",
      title,
      text: message,
      confirmButtonText: "ตกลง",
      confirmButtonColor: "#ef4444",
    });
  };
  const showConfirm = async (
    message: string,
    title: string = "คุณแน่ใจหรือไม่?",
    options: {
      confirmButtonText?: string;
      confirmButtonColor?: string;
      cancelButtonText?: string;
      icon?: "warning" | "error" | "success" | "info" | "question";
      isHtml?: boolean;
    } = {}
  ) => {
    const result = await Swal.fire({
      icon: options.icon || "warning",
      title,
      [options.isHtml ? "html" : "text"]: message,
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || "ยืนยัน",
      cancelButtonText: options.cancelButtonText || "ยกเลิก",
      confirmButtonColor: options.confirmButtonColor || "#3b82f6",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });
    return result.isConfirmed;
  };
  const showInfo = (message: string, title: string = "แจ้งเตือน") => {
    return Swal.fire({
      icon: "info",
      title,
      text: message,
      confirmButtonText: "ตกลง",
      confirmButtonColor: "#3b82f6",
    });
  };
  const showPasswordConfirm = async (
    message: string,
    title: string = "กรุณากรอกรหัสผ่าน"
  ) => {
    const result = await Swal.fire({
      icon: "warning",
      title,
      text: message,
      input: "password",
      inputPlaceholder: "รหัสผ่าน Admin",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) {
          return "กรุณากรอกรหัสผ่าน";
        }
        return null;
      },
    });
    if (result.isConfirmed && result.value) {
      return result.value;
    }
    return null;
  };
  return {
    showSuccess,
    showError,
    showConfirm,
    showInfo,
    showPasswordConfirm,
  };
};
