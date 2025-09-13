export function fmtTime(t) {
  if (!t) return null;
  const s = String(t);
  const m = s.match(/^([0-9]{1,2}:[0-9]{2})(?::[0-9]{2})?$/);
  return m ? m[1] : s;
}

export function fmtJPY(amount) {
  if (amount == null || amount === "") return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return `¥${Math.round(n).toLocaleString("en-US")}`;
}

