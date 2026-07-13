"use client";

import { useEffect } from "react";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  onConfirm,
  onCancel,
  variant = "default",
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "default" | "danger";
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
      >
        <div className="p-6">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-300">{message}</p>
        </div>
        <div className="flex gap-2 border-t border-white/5 p-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white ${
              variant === "danger"
                ? "bg-gradient-to-l from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500"
                : "bg-gradient-to-l from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
