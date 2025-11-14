import { toast as hotToast } from "react-hot-toast";

export const toast = {
  success: (msg, opts) => hotToast.success(msg, opts),
  error: (msg, opts) => hotToast.error(msg, opts),
  message: (msg, opts) => hotToast(msg, opts),
};
