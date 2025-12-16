import toast from "react-hot-toast";

export const toastSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: "#10B981",
      color: "#fff",
      borderRadius: "8px",
      fontSize: "14px",
    },
  });
};

export const toastError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
    style: {
      background: "#EF4444",
      color: "#fff",
      borderRadius: "8px",
      fontSize: "14px",
    },
  });
};
