"use client";

import { useState, useEffect } from "react";
import { getMyPayslipsAction } from "@/actions/payroll";
import { ReceiptText, Printer, X, Loader2, CheckCircle, Banknote } from "lucide-react";

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const formatRial = (v: any) => Math.round(Number(v) || 0).toLocaleString("fa-IR");
const toNum = (v: any) => Number(v ?? 0) || 0;

export default function MyPayslipsClient() {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res: any = await getMyPayslipsAction();
      setLoading(false);
      if (res?.error) { setError(res.error); return; }
      setSalaries(Array.isArray(res) ? res : []);
    })();
  }, []);

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; right: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <h1 style={{ margin: "0 0 24px 0", fontSize: "22px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
        <ReceiptText style={{ color: "#ed6e2b" }} /> فیش حقوقی من
      </h1>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}><Loader2 className="animate-spin" style={{ width: 32, height: 32, margin: "0 auto" }} /></div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#b91c1c", fontSize: "14px" }}>{error}</div>
      ) : salaries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: "14px" }}>
          هنوز فیش حقوقی تاییدشده‌ای برای شما ثبت نشده است
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {salaries.map((s: any) => (
            <div key={s.Salary_ID} onClick={() => setSelected(s)}
              style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "18px", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: "15px", color: "#0f172a" }}>
                  {JALALI_MONTHS[s.Salary_Month - 1]} {s.Salary_Year}
                </p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", color: s.Status === "Paid" ? "#475569" : "#166534", backgroundColor: s.Status === "Paid" ? "#f8fafc" : "#f0fdf4", border: `1px solid ${s.Status === "Paid" ? "#e2e8f0" : "#bbf7d0"}` }}>
                  {s.Status === "Paid" ? <Banknote style={{ width: 12, height: 12 }} /> : <CheckCircle style={{ width: 12, height: 12 }} />}
                  {s.Status === "Paid" ? "پرداخت شد" : "تایید شده"}
                </span>
              </div>
              <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>خالص پرداختی</p>
                <p style={{ margin: "2px 0 0 0", fontSize: "17px", fontWeight: "bold", color: "#166534" }}>
                  {formatRial(s.Net_Salary)} ریال
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال فیش */}
      {selected && (
        <div className="erp-modal-overlay" onClick={() => setSelected(null)}>
          <div className="erp-modal-container" onClick={e => e.stopPropagation()}>
            <div className="erp-modal-header no-print">
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>
                فیش حقوقی {JALALI_MONTHS[selected.Salary_Month - 1]} {selected.Salary_Year}
              </h2>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X style={{ color: "#64748b" }} /></button>
            </div>

            <div className="erp-modal-body print-area">
              <div style={{ textAlign: "center", marginBottom: "18px" }}>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>فیش حقوق و دستمزد</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                  {JALALI_MONTHS[selected.Salary_Month - 1]} {selected.Salary_Year}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "10px", fontSize: "12px", color: "#334155", marginBottom: "16px" }}>
                <span>کارکرد عادی: {toNum(selected.Total_Work_Hours)} ساعت</span>
                <span>اضافه‌کاری: {toNum(selected.Total_Overtime_Hours)} ساعت</span>
                <span>جمعه/تعطیل: {toNum(selected.Total_OffHours_Hours)} ساعت</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    <th style={{ ...cell, backgroundColor: "#f1f5f9", textAlign: "right" }}>شرح</th>
                    <th style={{ ...cell, backgroundColor: "#f1f5f9", textAlign: "center" }}>مبلغ (ریال)</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.PR_Monthly_Salary_Details.map((d: any) => (
                    <tr key={d.Detail_ID}>
                      <td style={{ ...cell, color: d.Detail_Type === "Deduction" ? "#b91c1c" : "#334155" }}>{d.Description}</td>
                      <td style={{ ...cell, textAlign: "center", fontWeight: "bold", color: d.Detail_Type === "Deduction" ? "#b91c1c" : "#166534" }}>
                        {formatRial(d.Amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: "16px", padding: "14px 16px", backgroundColor: "#fff7ed", border: "2px solid #ed6e2b", borderRadius: "12px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", fontWeight: 700 }}>
                <span style={{ fontSize: "13px", color: "#334155" }}>ناخالص: {formatRial(selected.Gross_Salary)}</span>
                <span style={{ fontSize: "13px", color: "#b91c1c" }}>کسورات: {formatRial(selected.Total_Deductions)}</span>
                <span style={{ fontSize: "15px", color: "#166534" }}>خالص: {formatRial(selected.Net_Salary)} ریال</span>
              </div>

              {selected.Status === "Paid" && selected.Paid_At && (
                <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "#166534", textAlign: "center", fontWeight: 600 }}>
                  ✓ در تاریخ {new Date(selected.Paid_At).toLocaleDateString("fa-IR")} پرداخت شده است
                </p>
              )}

              <button onClick={() => window.print()} className="no-print"
                style={{ width: "100%", marginTop: "20px", padding: "12px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Printer style={{ width: 17, height: 17 }} /> چاپ فیش
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cell: React.CSSProperties = { border: "1px solid #e2e8f0", padding: "8px 10px" };