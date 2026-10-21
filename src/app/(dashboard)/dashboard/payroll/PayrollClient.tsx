"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPayrollMonthAction, generateMonthlyPayslipsAction, updatePayslipItemsAction,
  accountantApproveAction, recalculatePayslipAction,
} from "@/actions/payroll";
import {
  FileText, ChevronRight, ChevronLeft, RefreshCw, Save, CheckCircle, X,
  AlertCircle, Loader2, Clock, Pencil, Calculator, Send
} from "lucide-react";

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const STATUS_META: any = {
  Draft:       { label: "در انتظار بررسی حسابدار", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  Pending_CEO: { label: "در انتظار تایید مدیرعامل", color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
  Rejected:    { label: "رد شده توسط مدیرعامل",     color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  Approved:    { label: "تایید نهایی ✓",            color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
  Paid:        { label: "پرداخت شده",               color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
};

const formatRial = (v: any) => Math.round(Number(v) || 0).toLocaleString("fa-IR");
const toNum = (v: any) => Number(v ?? 0) || 0;

export default function PayrollClient({ initialYear, initialMonth }: { initialYear: number; initialMonth: number }) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  // مودال ویرایش
  const [selected, setSelected] = useState<any>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const res: any = await getPayrollMonthAction(y, m);
    setLoading(false);
    if (res?.error) { showToast(res.error, false); setSalaries([]); return; }
    setSalaries(Array.isArray(res) ? res : []);
  }, []);

  useEffect(() => { loadMonth(year, month); }, [year, month, loadMonth]);

  const shiftMonth = (dir: 1 | -1) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const handleGenerate = async () => {
    if (!confirm(`فیش‌های حقوقی "${JALALI_MONTHS[month - 1]} ${year}" از روی کارکرد تاییدشده ساخته شود؟\nفیش‌های موجود دست‌نخورده می‌مانند.`)) return;
    setGenerating(true);
    const res: any = await generateMonthlyPayslipsAction(year, month);
    setGenerating(false);
    if (res?.error) { showToast(res.error, false); return; }
    let msg = `✅ ${res.created} فیش جدید ساخته شد`;
    if (res.skippedExisting?.length) msg += ` | ${res.skippedExisting.length} فیش از قبل موجود بود`;
    if (res.skipped?.length) msg += ` | بدون پارامتر مالی: ${res.skipped.map((s: any) => s.name).join("، ")}`;
    showToast(msg, true);
    loadMonth(year, month);
  };

  const statusCounts = salaries.reduce((acc: any, s) => { acc[s.Status] = (acc[s.Status] || 0) + 1; return acc; }, {});

  // ─────────────── مودال ویرایش ───────────────
  const openModal = (s: any) => { setSelected(s); setEdits({}); };

  const detailAmount = (d: any) => edits[d.Detail_ID] !== undefined ? edits[d.Detail_ID] : String(toNum(d.Amount));

  const localTotals = (() => {
    if (!selected) return { gross: 0, ded: 0, net: 0 };
    let gross = 0, ded = 0;
    for (const d of selected.PR_Monthly_Salary_Details) {
      const amt = toNum(detailAmount(d));
      if (d.Detail_Type === "Deduction") ded += amt;
      else if (d.Detail_Type === "Earning" || d.Detail_Type === "Bonus") gross += amt;
    }
    return { gross, ded, net: gross - ded };
  })();

  const changedItems = () =>
    (selected?.PR_Monthly_Salary_Details || [])
      .map((d: any) => ({ Detail_ID: d.Detail_ID as number, Amount: toNum(detailAmount(d)) }))
      .filter((it: any, i: number) => {
        const d = selected.PR_Monthly_Salary_Details[i];
        return toNum(d.Amount) !== it.Amount;
      });

  const handleSave = async (silent = false) => {
    if (!selected) return false;
    const items = changedItems();
    if (items.length === 0) { if (!silent) showToast("تغییری برای ذخیره نیست"); return true; }
    setSaving(true);
    const res: any = await updatePayslipItemsAction(selected.Salary_ID, items);
    setSaving(false);
    if (res?.error) { showToast(res.error, false); return false; }
    showToast("ویرایش‌ها ذخیره شد");
    await loadMonth(year, month);
    setSelected((prev: any) => prev ? { ...prev, PR_Monthly_Salary_Details: prev.PR_Monthly_Salary_Details.map((d: any) => ({ ...d, Amount: toNum(detailAmount(d)), Is_Manual: true })) } : prev);
    return true;
  };

  const handleApprove = async () => {
    if (!confirm("فیش تایید و برای مدیرعامل ارسال شود؟\n(ویرایش‌های ذخیره‌نشده اول ذخیره می‌شوند)")) return;
    setSaving(true);
    const saved = await handleSave(true);
    if (!saved) { setSaving(false); return; }
    const res: any = await accountantApproveAction(selected.Salary_ID);
    setSaving(false);
    if (res?.error) { showToast(res.error, false); return; }
    showToast("فیش تایید و برای مدیرعامل ارسال شد ✓");
    setSelected(null);
    loadMonth(year, month);
  };

  const handleRecalc = async () => {
    if (!confirm("فیش از روی کارکرد فعلی از نو محاسبه شود؟\nاعداد ویرایش‌شده دستی و جریمه‌ها حفظ می‌شوند.")) return;
    setSaving(true);
    const res: any = await recalculatePayslipAction(selected.Salary_ID);
    setSaving(false);
    if (res?.error) { showToast(res.error, false); return; }
    showToast("فیش بازمحاسبه شد");
    setSelected(null);
    loadMonth(year, month);
  };

  const canEdit = selected && ["Draft", "Rejected"].includes(String(selected.Status));
  const sMeta = selected ? STATUS_META[selected.Status] : null;

  const inputStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "13px", backgroundColor: "white", boxSizing: "border-box", fontFamily: "inherit" };
  const badgeStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#475569" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 760px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
      `}</style>

      {/* هدر */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
          <FileText style={{ color: "#ed6e2b" }} /> فیش‌های حقوقی — حسابداری
        </h1>
        <button onClick={handleGenerate} disabled={generating}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "12px", cursor: generating ? "wait" : "pointer", fontWeight: "bold", fontSize: "14px", boxShadow: "0 4px 14px rgba(237,110,43,0.3)", opacity: generating ? 0.7 : 1 }}>
          {generating ? <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> : <Calculator style={{ width: 18, height: 18 }} />}
          {generating ? "در حال محاسبه..." : "تولید فیش‌های این ماه"}
        </button>
      </div>

      {/* ناوبری ماه */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
        <button onClick={() => shiftMonth(-1)} style={navBtn}><ChevronRight style={{ width: 18, height: 18 }} /> ماه قبل</button>
        <div style={{ minWidth: "160px", textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>
          {JALALI_MONTHS[month - 1]} {year}
        </div>
        <button onClick={() => shiftMonth(1)} style={navBtn}>ماه بعد <ChevronLeft style={{ width: 18, height: 18 }} /></button>
      </div>

      {/* خلاصه وضعیت‌ها */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "24px" }}>
        {Object.entries(STATUS_META).map(([k, v]: any) => (
          <span key={k} style={{ ...badgeStyle, color: v.color, backgroundColor: v.bg, borderColor: v.border, fontSize: "12px", padding: "5px 12px" }}>
            {v.label}: {statusCounts[k] || 0}
          </span>
        ))}
      </div>

      {/* لیست فیش‌ها */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}><Loader2 className="animate-spin" style={{ width: 32, height: 32, margin: "0 auto" }} /></div>
      ) : salaries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: "14px" }}>
          برای این ماه فیشی ثبت نشده — دکمه «تولید فیش‌های این ماه» را بزنید
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {salaries.map((s: any) => {
            const meta = STATUS_META[s.Status] || STATUS_META.Draft;
            return (
              <div key={s.Salary_ID} onClick={() => openModal(s)}
                style={{ backgroundColor: "white", borderRadius: "16px", border: `1px solid ${meta.border}`, padding: "18px", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: "15px", color: "#0f172a" }}>{s.Personnel?.Full_Name}</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>کد پرسنلی: {s.Personnel?.Personnel_Code}</p>
                  </div>
                  <span style={{ ...badgeStyle, color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}>{meta.label}</span>
                </div>
                {s.Status === "Rejected" && s.Reject_Reason && (
                  <div style={{ marginTop: "10px", padding: "6px 10px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "11px", color: "#b91c1c", fontWeight: 600 }}>
                    دلیل رد: {s.Reject_Reason}
                  </div>
                )}
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>خالص پرداختی</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>{formatRial(s.Net_Salary)} ریال</p>
                  </div>
                  <div style={{ textAlign: "left", fontSize: "11px", color: "#64748b" }}>
                    کارکرد: {toNum(s.Total_Work_Hours)} ساعت
                    {toNum(s.Total_Overtime_Hours) > 0 && <span> + اضافه‌کاری {toNum(s.Total_Overtime_Hours)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال جزئیات و ویرایش */}
      {selected && (
        <div className="erp-modal-overlay" onClick={() => setSelected(null)}>
          <div className="erp-modal-container" onClick={e => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>فیش حقوقی: {selected.Personnel?.Full_Name}</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                  {JALALI_MONTHS[selected.Salary_Month - 1]} {selected.Salary_Year} • {selected.Personnel?.OrganizationalPosition?.Name || "بدون جایگاه"} • {selected.Personnel?.Unit?.Name || "بدون واحد"}
                </p>
              </div>
              <span style={{ ...badgeStyle, color: sMeta.color, backgroundColor: sMeta.bg, borderColor: sMeta.border }}>{sMeta.label}</span>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X style={{ color: "#64748b" }} /></button>
            </div>

            <div className="erp-modal-body">
              {/* بنر وضعیت */}
              {selected.Status === "Rejected" && (
                <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", fontSize: "13px", color: "#b91c1c", fontWeight: 600, display: "flex", gap: "8px", alignItems: "center" }}>
                  <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  رد شده توسط مدیرعامل — دلیل: {selected.Reject_Reason || "—"} (اصلاح کنید و دوباره تایید بزنید)
                </div>
              )}
              {selected.Status === "Pending_CEO" && (
                <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", fontSize: "13px", color: "#1e40af", fontWeight: 600, display: "flex", gap: "8px", alignItems: "center" }}>
                  <Clock style={{ width: 18, height: 18, flexShrink: 0 }} />
                  تایید حسابدار ثبت شده — در انتظار بررسی مدیرعامل
                </div>
              )}
              {selected.Status === "Approved" && (
                <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", fontSize: "13px", color: "#166534", fontWeight: 600, display: "flex", gap: "8px", alignItems: "center" }}>
                  <CheckCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  تایید نهایی توسط {selected.Personnel_PR_Monthly_Salary_Approved_ByToPersonnel?.Full_Name || "مدیرعامل"}
                </div>
              )}

              {/* ساعت‌های کارکرد */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                <span style={badgeStyle}>کارکرد عادی: {toNum(selected.Total_Work_Hours)} ساعت</span>
                <span style={badgeStyle}>اضافه‌کاری: {toNum(selected.Total_Overtime_Hours)} ساعت</span>
                <span style={badgeStyle}>جمعه/تعطیل: {toNum(selected.Total_OffHours_Hours)} ساعت</span>
              </div>

              {/* درآمدها */}
              <SectionTitle text="درآمدها (ریال)" color="#166534" />
              <div style={{ display: "grid", gap: "8px", marginBottom: "20px" }}>
                {selected.PR_Monthly_Salary_Details.filter((d: any) => d.Detail_Type !== "Deduction").map((d: any) => (
                  <DetailRow key={d.Detail_ID} d={d} canEdit={!!canEdit} edits={edits} setEdits={setEdits} detailAmount={detailAmount} />
                ))}
              </div>

              {/* کسورات */}
              <SectionTitle text="کسورات (ریال)" color="#b91c1c" />
              <div style={{ display: "grid", gap: "8px", marginBottom: "20px" }}>
                {selected.PR_Monthly_Salary_Details.filter((d: any) => d.Detail_Type === "Deduction").map((d: any) => (
                  <DetailRow key={d.Detail_ID} d={d} canEdit={!!canEdit} edits={edits} setEdits={setEdits} detailAmount={detailAmount} />
                ))}
              </div>

              {/* جمع‌ها (زنده) */}
              <div style={{ backgroundColor: "#fff7ed", border: "2px solid #ed6e2b", borderRadius: "12px", padding: "14px 16px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontWeight: 700 }}>
                <span style={{ fontSize: "13px", color: "#334155" }}>ناخالص: {formatRial(localTotals.gross)}</span>
                <span style={{ fontSize: "13px", color: "#b91c1c" }}>کسورات: {formatRial(localTotals.ded)}</span>
                <span style={{ fontSize: "15px", color: "#166534" }}>خالص: {formatRial(localTotals.net)} ریال</span>
              </div>

              {/* دکمه‌ها */}
              {canEdit && (
                <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                  <button onClick={() => handleSave()} disabled={saving} style={{ ...btn, backgroundColor: "#0f172a" }}>
                    <Save style={{ width: 16, height: 16 }} /> ذخیره تغییرات
                  </button>
                  <button onClick={handleApprove} disabled={saving} style={{ ...btn, backgroundColor: "#16a34a" }}>
                    <Send style={{ width: 16, height: 16 }} /> تایید و ارسال به مدیرعامل
                  </button>
                  <button onClick={handleRecalc} disabled={saving} style={{ ...btn, backgroundColor: "#64748b" }}>
                    <RefreshCw style={{ width: 16, height: 16 }} /> بازمحاسبه از کارکرد
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", backgroundColor: toast.ok ? "#0f172a" : "#b91c1c", color: "white", padding: "12px 24px", borderRadius: "12px", boxShadow: "0 10px 15px rgba(0,0,0,0.3)", zIndex: 100, fontSize: "14px", fontWeight: 600, maxWidth: "90vw", textAlign: "center" }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

// ─────────────── زیرکامپوننت‌ها ───────────────
const navBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: "4px", padding: "8px 14px", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#334155" };
const btn: React.CSSProperties = { flex: 1, minWidth: "160px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };

function SectionTitle({ text, color }: { text: string; color: string }) {
  return (
    <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold", color: "#334155", display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ width: "4px", height: "16px", backgroundColor: color, borderRadius: "2px", display: "inline-block" }} />
      {text}
    </h3>
  );
}

function DetailRow({ d, canEdit, edits, setEdits, detailAmount }: any) {
  const isDed = d.Detail_Type === "Deduction";
  const original = toNum(d.Original_Amount);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ flex: 1, fontSize: "13px", color: "#334155", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        {d.Description}
        {d.Is_Manual && original > 0 && original !== toNum(d.Amount) && (
          <span style={{ fontSize: "10px", color: "#92400e", backgroundColor: "#fefce8", border: "1px solid #fde68a", borderRadius: "6px", padding: "1px 6px" }}>
            <Pencil style={{ width: 9, height: 9, display: "inline" }} /> محاسبه‌شده: {formatRial(original)}
          </span>
        )}
      </div>
      {canEdit ? (
        <input type="number" min="0" value={detailAmount(d)} onChange={e => setEdits((p: any) => ({ ...p, [d.Detail_ID]: e.target.value }))} style={{ ...inputStyle, width: "160px", fontWeight: "bold", textAlign: "center", borderColor: edits[d.Detail_ID] !== undefined ? "#ed6e2b" : "#e2e8f0" }} />
      ) : (
        <span style={{ width: "160px", textAlign: "center", fontSize: "13px", fontWeight: "bold", color: isDed ? "#b91c1c" : "#166534" }}>{formatRial(d.Amount)}</span>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "7px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "13px", backgroundColor: "white", boxSizing: "border-box", fontFamily: "inherit" };