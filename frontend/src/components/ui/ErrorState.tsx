import { Button } from "./Button";

export function ErrorState({ title = "Đã xảy ra lỗi", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center"><p className="font-semibold text-red-900">{title}</p><p className="mt-2 text-sm text-red-800">{message}</p>{onRetry ? <Button variant="secondary" className="mt-5" onClick={onRetry}>Thử lại</Button> : null}</div>;
}
