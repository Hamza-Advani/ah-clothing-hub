"use client";

type Row = Record<string, string | number | boolean | null | undefined>;

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportCSV(base: string, rows: Row[]) {
  if (!rows.length) return false;
  const headers = Object.keys(rows[0]);
  const esc = (v: Row[string]) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  // BOM so Excel opens UTF-8 correctly
  download(`${base}-${stamp()}.csv`, "﻿" + csv, "text/csv;charset=utf-8");
  return true;
}

/** Excel-compatible spreadsheet (HTML table in .xls) — opens directly in Excel / Google Sheets. */
export function exportExcel(base: string, rows: Row[]) {
  if (!rows.length) return false;
  const headers = Object.keys(rows[0]);
  const esc = (v: Row[string]) => (v == null ? "" : String(v)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${headers.map((h) => `<th style="background:#1F3D36;color:#fff">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${headers.map((h) => `<td>${esc(r[h])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></body></html>`;
  download(`${base}-${stamp()}.xls`, html, "application/vnd.ms-excel");
  return true;
}
