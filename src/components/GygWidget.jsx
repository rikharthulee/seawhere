"use client";
export default function GygWidget({ partnerId = "WVS8AHI", className = "" }) {
  return (
    <div className={className}>
      <div data-gyg-widget="auto" data-gyg-partner-id={partnerId} />
    </div>
  );
}

