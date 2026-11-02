import { useSyncExternalStore } from "react";

const PENDING_VERIFICATION_EMAIL = "ct24f.pending-verification-email";
const PENDING_RESET_EMAIL = "ct24f.pending-password-reset-email";
const VERIFICATION_MAIL_STATE = "ct24f.verification-mail-state";
const VERIFICATION_RESEND_AT = "ct24f.verification-resend-at";
const RESET_RESEND_AT = "ct24f.reset-resend-at";
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };

const read = (key) => (typeof window === "undefined" ? "" : window.sessionStorage.getItem(key) ?? "");
const write = (key, value) => { if (typeof window !== "undefined") { window.sessionStorage.setItem(key, value); notify(); } };
const remove = (key) => { if (typeof window !== "undefined") { window.sessionStorage.removeItem(key); notify(); } };

const serverSnapshot = () => "";
export function usePendingAuthEmail(purpose) {
  const key = purpose === "reset" ? PENDING_RESET_EMAIL : PENDING_VERIFICATION_EMAIL;
  return useSyncExternalStore(subscribe, () => read(key), serverSnapshot);
}
export function useAuthResendTimestamp(purpose) {
  const key = purpose === "reset" ? RESET_RESEND_AT : VERIFICATION_RESEND_AT;
  return useSyncExternalStore(subscribe, () => Number(read(key)) || 0, () => 0);
}
export function useVerificationMailState() {
  return useSyncExternalStore(subscribe, () => read(VERIFICATION_MAIL_STATE), serverSnapshot);
}
export const setVerificationMailState = (state) => write(VERIFICATION_MAIL_STATE, state);

export const getPendingVerificationEmail = () => read(PENDING_VERIFICATION_EMAIL);
export const setPendingVerificationEmail = (email) => write(PENDING_VERIFICATION_EMAIL, email);
export const clearPendingVerificationEmail = () => { remove(PENDING_VERIFICATION_EMAIL); remove(VERIFICATION_RESEND_AT); remove(VERIFICATION_MAIL_STATE); };
export const getVerificationResendAt = () => Number(read(VERIFICATION_RESEND_AT)) || 0;
export const setVerificationResendAt = (timestamp) => write(VERIFICATION_RESEND_AT, String(timestamp));

export const getPendingResetEmail = () => read(PENDING_RESET_EMAIL);
export const setPendingResetEmail = (email) => write(PENDING_RESET_EMAIL, email);
export const clearPendingResetEmail = () => { remove(PENDING_RESET_EMAIL); remove(RESET_RESEND_AT); };
export const getResetResendAt = () => Number(read(RESET_RESEND_AT)) || 0;
export const setResetResendAt = (timestamp) => write(RESET_RESEND_AT, String(timestamp));
