import { API_CONFIG } from "@/config/api";
import { create, read, remove, update } from "@/services/transport";
import type { AuthPayload, User } from "@/types/api";

type Credentials = { email: string; password: string };
type Registration = Credentials & { name: string; phone?: string; password_confirmation: string };
export const authService = {
  me: () => read<User>(API_CONFIG.ENDPOINTS.AUTH.ME),
  login: (payload: Credentials) => create<AuthPayload>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, payload),
  register: (payload: Registration) => create<AuthPayload>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, payload),
  logout: () => create<void>(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {}),
  forgotPassword: (email: string) => create<void>(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  sendPasswordOtp: (email: string) => create<void>(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD_OTP, { email }),
  resendPasswordOtp: (email: string) => create<void>(API_CONFIG.ENDPOINTS.AUTH.RESEND_PASSWORD_OTP, { email }),
  resetPassword: (payload: unknown) => create<void>(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, payload),
  verifyEmailCode: (code: string) => create<void>(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL_CODE, { code }),
  resendEmailVerification: () => create<void>(API_CONFIG.ENDPOINTS.AUTH.RESEND_EMAIL_VERIFICATION, {}),
  updateProfile: (payload: unknown) => update<User>(API_CONFIG.ENDPOINTS.AUTH.PROFILE, payload),
  updateEmail: (payload: unknown) => update<User>(API_CONFIG.ENDPOINTS.AUTH.EMAIL, payload),
  changePassword: (payload: unknown) => create<void>(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, payload),
  uploadAvatar: (data: FormData) => create<User>(API_CONFIG.ENDPOINTS.AUTH.AVATAR, data),
  deleteAvatar: () => remove<void>(API_CONFIG.ENDPOINTS.AUTH.AVATAR),
};
