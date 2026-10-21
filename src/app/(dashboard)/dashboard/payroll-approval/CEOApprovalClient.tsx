"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPayrollMonthAction, ceoApproveAction, ceoRejectAction,
  addPenaltyAction, removePenaltyAction,
} from "@/actions/payroll";
import {
  FileCheck2, ChevronRight, ChevronLeft, CheckCircle, XCircle, X,
  AlertTriangle, Loader2, Gavel, Trash2, ShieldCheck
} from "lucide-react";

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const STATUS_META: any = {
  Draft:       { label: "در انتظار بررسی حسابدار", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  Pending_CEO: { label: "در انتظار تایید شما",      color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
  Rejected:    { label: "رد شده — نزد حسابدار",     color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  Approved:    { label: "تایید نهایی ✓",            color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
  Paid:        { label: "پرداخت شده",               color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
};

const formatRial = (v: any) => Math.round(Number(v) || 0).toLocaleString("fa-IR");
const toNum = (v: any) => Number(v ?? 0) || 0;
const isPenalty = (d: any) => String(d.Description || "").startsWith("جریمه:");

export default function CEOApprovalClient({ initialYear, initialMonth }: { initialYear: number; initialMonth: number }) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  // مودال
  const [selected, setSelected] = useState<any>(null);
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyReason, setPenaltyReason] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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

  const statusCounts = salaries.reduce((acc: any, s) => { acc[s.Status] = (acc[s.Status] || 0) + 1; return acc; }, {});

  const openModal = (s: any) => {
    setSelected(s); setPenaltyAmount(""); setPenaltyReason(""); setRejectMode(false); setRejectReason("");
  };

  // محاسبه زنده جمع‌ها با احتساب جریمه جدید (قبل از ثبت)
  const localTotals = (() => {
    if (!selected) return { gross: 0, ded: 0, net: 0 };
    let gross = 0, ded = 0;
    for (const d of selected.PR_Monthly_Salary_Details) {
      const amt = toNum(d.Amount);
      if (d.Detail_Type === "Deduction") ded += amt;
      else if (d.Detail_Type === "Earning" || d.Detail_Type === "Bonus") gross += amt;
    }
    const pending = penaltyAmount ? toNum(penaltyAmount) : 0;
    return { gross, ded: ded + pending, net: gross - ded - pending };
  })();

  const handleAddPenalty = async () => {
    if (!penaltyReason.trim()) { showToast("ثبت دلیل جریمه الزامی است", false); return; }
    if (toNum(penaltyAmount) <= 0) { showToast("مبلغ جریمه نامعتبر است", false); return; }
    setBusy(true);
    const res: any = await addPenaltyAction(selected.Salary_ID, toNum(penaltyAmount), penaltyReason.trim());
    setBusy(false);
    if (res?.error) { showToast(res.error, false); return; }
    showToast("جریمه ثبت و از حقوق کسر شد");
    setPenaltyAmount(""); setPenaltyReason("");
    const res2: any = await getPayrollMonthAction(year, month);
    if (Array.isArray(res2)) {
      setSalaries(res2);
      const upd = res2.find((x: any) => x.Salary_ID === selected.Salary_ID);
      if (upd) setSelected(upd);
    }
  };

  const handleRemovePenalty = async (detailId: number) => {
    if (!confirm("این جریمه حذف شود؟")) return;
    setBusy(true);
    const res: any = await removePenaltyAction(detailId);
    setBusy(false);
    if (res?.error) { showToast(res.error, false); return; }
    showToast("جریمه حذف شد");
    const res2: any = await getPayrollMonthAction(year, month);
    if (Array.isArray(res2)) {
      setSalaries(res2);
      const upd = res2.find((x: any) => x.Salary_ID === selected.Salary_ID);
      if (upd) setSelected(upd);
    }
  };

  const handleApprove = async () => {
    if (!confirm("فیش به‌صورت نهایی تایید شود و برای کارمند قابل مشاهده شود؟")) return;
    setBusy(true);
    const res: any = await ceoApproveAction(selected.Salary_ID);
    setBusy(false);
    if (res?.error) { showToast(res.error, false); return; }
    showToast("فیش به‌صورت نهایی تایید شد ✓");
    setSelected(null);
    loadMonth(year, month);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast("ثبت دلیل رد الزامی است", false); return; }
    if (!confirm("فیش رد و به حسابدار برگردانده شود؟")) return;
    setBusy(true);
    const res: any = await ceoRejectAction(selected.Salary_ID, rejectReason.trim());
    setBusy(false);
    if (res?.error) { showToast(res.error, false); return; }
    showToast("فیش رد و به حسابدار برگشت داده شد");
    setSelected(null);
    loadMonth(year, month);
  };

  const isPending = selected?.Status === "Pending_CEO";
  const sMeta = selected ? STATUS_META[selected.Status] : null;
  const badgeStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#475569" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 760px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
      `}</style>

      <h1 style={{ margin: "0 0 24px 0", fontSize: "22px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
        <FileCheck2 style={{ color: "#ed6e2b" }} /> تایید فیش‌های حقوقی
      </h1>

      {/* ناوبری ماه */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
        <button onClick={() => shiftMonth(-1)} style={navBtn}><ChevronRight style={{ width: 18, height: 18 }} /> ماه قبل</button>
        <div style={{ minWidth: "160px", textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>
          {JALALI_MONTHS[month - 1]} {year}
        </div>
        <button onClick={() => shiftMonth(1)} style={navBtn}>ماه بعد <ChevronLeft style={{ width: 18, height: 18 }} /></button>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "24px" }}>
        {Object.entries(STATUS_META).map(([k, v]: any) => (
          <span key={k} style={{ ...badgeStyle, color: v.color, backgroundColor: v.bg, borderColor: v.border, fontSize: "12px", padding: "5px 12px" }}>
            {v.label}: {statusCounts[k] || 0}
          </span>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}><Loader2 className="animate-spin" style={{ width: 32, height: 32, margin: "0 auto" }} /></div>
      ) : salaries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: "14px" }}>برای این ماه فیشی وجود ندارد</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {salaries.map((s: any) => {
            const meta = STATUS_META[s.Status] || STATUS_META.Draft;
            return (
              <div key={s.Salary_ID} onClick={() => openModal(s)}
                style={{ backgroundColor: "white", borderRadius: "16px", border: `1px solid ${meta.border}`, padding: "18px", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "all 0.2s", opacity: s.Status === "Pending_CEO" ? 1 : 0.85 }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: "15px", color: "#0f172a" }}>{s.Personnel?.Full_Name}</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>{s.Personnel?.OrganizationalPosition?.Name || "بدون جایگاه"}</p>
                  </div>
                  <span style={{ ...badgeStyle, color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}>{meta.label}</span>
                </div>
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>خالص پرداختی</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>{formatRial(s.Net_Salary)} ریال</p>
                  </div>
                  {s.Accountant_ID && (
                    <div style={{ textAlign: "left", fontSize: "11px", color: "#1e40af", display: "flex", alignItems: "center", gap: "4px" }}>
                      <ShieldCheck style={{ width: 13, height: 13 }} /> تایید حسابدار
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال جزئیات */}
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
              {/* برچسب تایید حسابدار */}
              {selected.Accountant_ID && (
                <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", fontSize: "13px", color: "#166534", fontWeight: 700, display: "flex", gap: "8px", alignItems: "center" }}>
                  <ShieldCheck style={{ width: 18, height: 18, flexShrink: 0 }} />
                  ✅ تایید شده توسط حسابدار: {selected.Personnel_PR_Monthly_Salary_Accountant_IDToPersonnel?.Full_Name || "—"}
                </div>
              )}
              {selected.Status === "Rejected" && (
                <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", fontSize: "13px", color: "#b91c1c", fontWeight: 600, display: "flex", gap: "8px", alignItems: "center" }}>
                  <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  این فیش قبلا رد شده (دلیل: {selected.Reject_Reason || "—"}) و اکنون نزد حسابدار است
                </div>
              )}

              {/* ساعت‌ها */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                <span style={badgeStyle}>کارکرد عادی: {toNum(selected.Total_Work_Hours)} ساعت</span>
                <span style={badgeStyle}>اضافه‌کاری: {toNum(selected.Total_Overtime_Hours)} ساعت</span>
                <span style={badgeStyle}>جمعه/تعطیل: {toNum(selected.Total_OffHours_Hours)} ساعت</span>
              </div>

              {/* اقلام (فقط خواندنی) */}
              <div style={{ display: "grid", gap: "6px", marginBottom: "20px" }}>
                {selected.PR_Monthly_Salary_Details.map((d: any) => {
                  const pen = isPenalty(d) && d.Detail_Type === "Deduction";
                  return (
                    <div key={d.Detail_ID} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "6px 10px", backgroundColor: pen ? "#fef2f2" : "#f8fafc", borderRadius: "8px", border: pen ? "1px solid #fecaca" : "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "13px", color: pen ? "#b91c1c" : "#334155", fontWeight: pen ? 700 : 500, display: "flex", alignItems: "center", gap: "6px" }}>
                        {pen && <Gavel style={{ width: 13, height: 13 }} />}
                        {d.Description}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "bold", color: d.Detail_Type === "Deduction" ? "#b91c1c" : "#166534" }}>
                          {formatRial(d.Amount)}
                        </span>
                        {pen && isPending && (
                          <button onClick={(e) => { e.stopPropagation(); handleRemovePenalty(d.Detail_ID); }} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex" }} title="حذف جریمه">
                            <Trash2 style={{ width: 14, height: 14, color: "#b91c1c" }} />
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ثبت جریمه */}
              {isPending && (
                <div style={{ backgroundColor: "#fff7ed", border: "2px solid #ed6e2b", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold", color: "#c2410c", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Gavel style={{ width: 16, height: 16 }} /> ثبت جریمه (کسر از حقوق)
                  </h3>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <input type="number" min="0" placeholder="مبلغ (ریال)" value={penaltyAmount} onChange={e => setPenaltyAmount(e.target.value)} style={{ ...mInput, flex: "1", minWidth: "140px" }} />
                    <input type="text" placeholder="دلیل جریمه *" value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} style={{ ...mInput, flex: "2", minWidth: "200px" }} />
                    <button onClick={handleAddPenalty} disabled={busy} style={{ ...btn, backgroundColor: "#b91c1c", flex: "0 0 auto", minWidth: "110px" }}>
                      <Gavel style={{ width: 15, height: 15 }} /> ثبت جریمه
                    </button>
                  </div>
                </div>
              )}

              {/* جمع‌ها */}
              <div style={{ backgroundColor: "#fff7ed", border: "2px solid #ed6e2b", borderRadius: "12px", padding: "14px 16px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontWeight: 700 }}>
                <span style={{ fontSize: "13px", color: "#334155" }}>ناخالص: {formatRial(localTotals.gross)}</span>
                <span style={{ fontSize: "13px", color: "#b91c1c" }}>کسورات: {formatRial(localTotals.ded)}</span>
                <span style={{ fontSize: "15px", color: "#166534" }}>خالص: {formatRial(localTotals.net)} ریال</span>
              </div>

              {/* تایید / رد */}
              {isPending && (
                <div style={{ marginTop: "20px" }}>
                  {!rejectMode ? (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={handleApprove} disabled={busy} style={{ ...btn, backgroundColor: "#16a34a", flex: 2 }}>
                        <CheckCircle style={{ width: 18, height: 18 }} /> تایید نهایی
                      </button>
                      <button onClick={() => setRejectMode(true)} disabled={busy} style={{ ...btn, backgroundColor: "#b91c1c", flex: 1 }}>
                        <XCircle style={{ width: 18, height: 18 }} /> رد و برگشت به حسابدار
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "10px" }}>
                      <textarea placeholder="دلیل رد (برای حسابدار) *" value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} style={{ ...mInput, resize: "vertical", fontFamily: "inherit" }} />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={handleReject} disabled={busy} style={{ ...btn, backgroundColor: "#b91c1c", flex: 1 }}>
                          <XCircle style={{ width: 16, height: 16 }} /> ثبت رد فیش
                        </button>
                        <button onClick={() => setRejectMode(false)} style={{ ...btn, backgroundColor: "#64748b", flex: 1 }}>انصراف</button>
                      </div>
                    </div>
                  )}
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

const navBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: "4px", padding: "8px 14px", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#334155" };
const btn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" };
const mInput: React.CSSProperties = { padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "13px", backgroundColor: "white", boxSizing: "border-box" };