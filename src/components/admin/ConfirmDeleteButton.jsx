"use client";
import { useEffect, useState, useCallback } from "react";

export default function ConfirmDeleteButton({
  onConfirm,
  title = "Delete this item?",
  description = "This action cannot be undone. This will permanently delete the item and remove any associated data.",
  triggerClassName = "rounded bg-red-600 text-white px-2 py-1",
  children = "Delete",
}) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  const handleConfirm = useCallback(async () => {
    try {
      setPending(true);
      await onConfirm?.();
      setOpen(false);
    } finally {
      setPending(false);
    }
  }, [onConfirm]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button className={triggerClassName} disabled={pending} onClick={() => setOpen(true)}>
        {pending ? "Please wait…" : children}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50" onClick={() => !pending && setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:max-w-lg rounded-lg border bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-2">
              <h2 className="text-left text-lg font-semibold">{title}</h2>
              <p className="text-left text-sm text-black/70">{description}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1.5 disabled:opacity-60"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-red-600 text-white px-3 py-1.5 disabled:opacity-60"
                onClick={handleConfirm}
                disabled={pending}
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
