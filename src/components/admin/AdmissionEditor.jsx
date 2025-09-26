"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useCallback,
  useState,
} from "react";
import { saveAdmissionPrices } from "@/lib/data/admission";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const EMPTY_ROW = {
  id: null,
  subsection: "",
  label: "",
  min_age: "",
  max_age: "",
  is_free: false,
  amount: "",
  currency: "JPY",
  requires_id: false,
  valid_from: "",
  valid_to: "",
  note: "",
};

function toEditableRow(row = {}) {
  return {
    id: row.id || null,
    subsection: row.subsection || "",
    label: row.label || "",
    min_age:
      row.min_age === 0 || row.min_age
        ? String(row.min_age)
        : "",
    max_age:
      row.max_age === 0 || row.max_age
        ? String(row.max_age)
        : "",
    is_free: Boolean(row.is_free),
    amount:
      row.amount === 0 || row.amount
        ? String(row.amount)
        : "",
    currency: (row.currency || "JPY").toUpperCase(),
    requires_id: Boolean(row.requires_id),
    valid_from: row.valid_from || "",
    valid_to: row.valid_to || "",
    note: row.note || "",
  };
}

function toDisplayState(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows.map((row) => ({ ...EMPTY_ROW, ...toEditableRow(row) }));
}

function presetRow(type) {
  switch (type) {
    case "adults":
      return {
        ...EMPTY_ROW,
        label: "Adults",
        amount: "2800",
      };
    case "students":
      return {
        ...EMPTY_ROW,
        label: "Students",
        amount: "1800",
        requires_id: true,
      };
    case "children":
      return {
        ...EMPTY_ROW,
        label: "Children (3+)",
        min_age: "3",
        amount: "1600",
      };
    default:
      return { ...EMPTY_ROW };
  }
}

const AdmissionEditor = forwardRef(function AdmissionEditor(
  { sightId, initialRows },
  ref
) {
  const [rows, setRows] = useState(() => toDisplayState(initialRows));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setRows(toDisplayState(initialRows));
  }, [initialRows]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const rowList = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  const canSave = useMemo(() => {
    if (!sightId) return false;
    if (saving) return false;
    if (rowList.length === 0) return true;
    return rowList.every((row) => row.label.trim().length > 0);
  }, [rowList, saving, sightId]);

  function updateRow(index, next) {
    setRows((current) => {
      const list = Array.isArray(current) ? [...current] : [];
      const base = list[index] ? { ...EMPTY_ROW, ...list[index] } : { ...EMPTY_ROW };
      list[index] = { ...base, ...next };
      return list;
    });
  }

  function addRow(type) {
    setRows((current) => {
      const list = Array.isArray(current) ? [...current] : [];
      list.push({ ...presetRow(type) });
      return list;
    });
  }

  function removeRow(index) {
    setRows((current) => {
      if (!Array.isArray(current)) return [];
      return current.filter((_, idx) => idx !== index);
    });
  }

  const persistAdmission = useCallback(
    async (targetId = sightId) => {
      if (!targetId) {
        setError("Save the sight before adding admission prices");
        throw new Error("Missing sight ID");
      }
      setSaving(true);
      setError("");
      try {
      const payload = rowList.map((row, idx) => ({
        ...row,
        idx,
        subsection: row.subsection?.trim() ? row.subsection.trim() : null,
        label: row.label.trim(),
          min_age: row.min_age === "" ? null : row.min_age,
          max_age: row.max_age === "" ? null : row.max_age,
        amount: row.amount === "" ? null : row.amount,
        valid_from: row.valid_from || null,
        valid_to: row.valid_to || null,
        note: row.note?.trim() || null,
      }));

        const fresh = await saveAdmissionPrices(targetId, payload);
        setRows(toDisplayState(fresh));
        setMessage("Admission prices saved");
        return fresh;
      } catch (err) {
        setError(err?.message || "Failed to save admission prices");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [rowList, sightId]
  );

  useImperativeHandle(
    ref,
    () => ({
      save: persistAdmission,
    }),
    [persistAdmission]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => addRow("adults")}>
          + Adults
        </Button>
        <Button variant="outline" size="sm" onClick={() => addRow("students")}>
          + Students
        </Button>
        <Button variant="outline" size="sm" onClick={() => addRow("children")}>
          + Children (3+)
        </Button>
        <Button variant="outline" size="sm" onClick={() => addRow("custom")}>
          + Custom
        </Button>
      </div>

      {!sightId ? (
        <div className="rounded border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          Save the sight details to enable admission pricing.
        </div>
      ) : null}

      {saving ? (
        <p className="text-xs text-muted-foreground">Saving admission prices…</p>
      ) : null}

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="rounded-lg border border-border/60 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36 min-w-[120px]">Sub-section</TableHead>
            <TableHead className="min-w-[140px]">Category</TableHead>
            <TableHead className="min-w-[160px]">Age</TableHead>
            <TableHead className="w-[80px]">Free?</TableHead>
            <TableHead className="min-w-[120px]">Amount</TableHead>
            <TableHead className="w-[80px]">Cur</TableHead>
            <TableHead className="w-[80px]">ID?</TableHead>
            <TableHead className="min-w-[200px]">Valid</TableHead>
            <TableHead className="min-w-[220px]">Note</TableHead>
            <TableHead className="w-[90px]">Remove</TableHead>
          </TableRow>
          </TableHeader>
          <TableBody>
            {rowList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                Add the first admission row to get started.
              </TableCell>
            </TableRow>
          ) : (
            rowList.map((row, index) => (
              <TableRow key={row.id || index}>
                <TableCell>
                  <input
                    className="w-32 rounded border border-border px-2 py-1 text-sm"
                    value={row.subsection}
                    onChange={(event) =>
                      updateRow(index, { subsection: event.target.value })
                    }
                    placeholder="Sub-section"
                  />
                </TableCell>
                <TableCell>
                  <input
                    className="w-full rounded border border-border px-2 py-1 text-sm"
                    value={row.label}
                    onChange={(event) =>
                      updateRow(index, { label: event.target.value })
                    }
                    placeholder="e.g. Adults"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className="w-20 rounded border border-border px-2 py-1 text-sm"
                      value={row.min_age}
                      onChange={(event) =>
                        updateRow(index, { min_age: event.target.value })
                      }
                      placeholder="Min"
                    />
                    <span className="text-xs text-muted-foreground">–</span>
                    <input
                      type="number"
                      min={0}
                      className="w-20 rounded border border-border px-2 py-1 text-sm"
                      value={row.max_age}
                      onChange={(event) =>
                        updateRow(index, { max_age: event.target.value })
                      }
                      placeholder="Max"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.is_free}
                      onChange={(event) =>
                        updateRow(index, {
                          is_free: event.target.checked,
                          amount: event.target.checked ? "" : row.amount,
                        })
                      }
                    />
                    <span>Free</span>
                  </label>
                </TableCell>
                <TableCell>
                  <input
                    type="number"
                    min={0}
                    step="100"
                    className="w-full rounded border border-border px-2 py-1 text-sm disabled:bg-muted"
                    value={row.amount}
                    onChange={(event) =>
                      updateRow(index, { amount: event.target.value })
                    }
                    placeholder="0"
                    disabled={row.is_free}
                  />
                </TableCell>
                <TableCell>
                  <input
                    className="w-full rounded border border-border px-2 py-1 text-sm"
                    value={row.currency}
                    onChange={(event) => {
                      const nextValue = event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z]/g, "")
                        .slice(0, 3);
                      updateRow(index, {
                        currency: nextValue || "",
                      });
                    }}
                    placeholder="JPY"
                    maxLength={3}
                  />
                </TableCell>
                <TableCell>
                  <label className="flex items-center justify-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.requires_id}
                      onChange={(event) =>
                        updateRow(index, { requires_id: event.target.checked })
                      }
                    />
                    <span>ID</span>
                  </label>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      className="rounded border border-border px-2 py-1 text-sm"
                      value={row.valid_from}
                      onChange={(event) =>
                        updateRow(index, { valid_from: event.target.value })
                      }
                    />
                    <input
                      type="date"
                      className="rounded border border-border px-2 py-1 text-sm"
                      value={row.valid_to}
                      onChange={(event) =>
                        updateRow(index, { valid_to: event.target.value })
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <input
                      className="w-full rounded border border-border px-2 py-1 text-sm"
                      value={row.note}
                      onChange={(event) =>
                        updateRow(index, { note: event.target.value })
                      }
                      placeholder="Note"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRow(index)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            persistAdmission().catch(() => {});
          }}
          disabled={!canSave}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
});

export default AdmissionEditor;
