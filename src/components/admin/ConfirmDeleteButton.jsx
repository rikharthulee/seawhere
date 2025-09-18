"use client";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ConfirmDeleteButton({
  onConfirm,
  title = "Delete this item?",
  description = "This action cannot be undone. This will permanently delete the item and remove any associated data.",
  triggerClassName = "",
  triggerVariant = "destructive",
  triggerSize = "sm",
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
      <Button
        variant={triggerVariant}
        size={triggerSize}
        className={cn(
          triggerSize === "icon" ? "" : "h-8 rounded-md",
          triggerClassName
        )}
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        {pending ? "Please wait…" : children}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50" onClick={() => !pending && setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:max-w-lg rounded-lg border bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-2">
              <h2 className="text-left text-lg font-semibold">{title}</h2>
              <p className="text-left text-sm text-black/70">{description}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-24"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-24"
                onClick={handleConfirm}
                disabled={pending}
              >
                {pending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
