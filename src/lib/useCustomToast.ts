import { toast, ToastOptions } from "react-toastify";

type ToastType = "success" | "error" | "warning" | "info";

interface CustomToastOptions extends ToastOptions {
  type?: ToastType;
}

export const useCustomToast = () => {
  const showToast = (message: string, options: CustomToastOptions = {}) => {
    const defaultOptions: ToastOptions = {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    switch (options.type) {
      case "success":
        return toast.success(`✅ ${message}`, mergedOptions);
      case "error":
        return toast.error(`❌ ${message}`, mergedOptions);
      case "warning":
        return toast.warning(`⚠️ ${message}`, mergedOptions);
      case "info":
        return toast.info(`ℹ️ ${message}`, mergedOptions);
      default:
        return toast(message, mergedOptions);
    }
  };

  const showActionToast = (
    action: "create" | "update" | "delete",
    entity: string,
    success: boolean
  ) => {
    const messages = {
      create: {
        success: `${entity} created successfully!`,
        error: `Failed to create ${entity}. Please try again.`,
      },
      update: {
        success: `${entity} updated successfully!`,
        error: `Failed to update ${entity}. Please try again.`,
      },
      delete: {
        success: `${entity} deleted successfully!`,
        error: `Failed to delete ${entity}. Please try again.`,
      },
    };

    const message = messages[action][success ? "success" : "error"];
    showToast(message, {
      type: success ? "success" : "error",
      autoClose: success ? 3000 : 5000,
    });
  };

  return { showToast, showActionToast };
};
