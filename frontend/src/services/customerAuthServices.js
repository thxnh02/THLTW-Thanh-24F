import authClient, { ensureAuthCsrfCookie } from "@/lib/axiosAuth";

const mutate = async (path, data) => {
  await ensureAuthCsrfCookie();
  return authClient.post(`/auth/${path}`, data);
};

const customerAuthServices = {
  register: (data) => mutate("register", data),
  verifyEmail: (data) => mutate("email/verify", data),
  resendVerification: (data) => mutate("email/resend", data),
  login: (data) => mutate("login", data),
  me: () => authClient.get("/auth/me"),
  logout: () => mutate("logout", {}),
  forgotPassword: (data) => mutate("forgot-password", data),
  resetPassword: (data) => mutate("forgot-password/reset", data),
};

export default customerAuthServices;
