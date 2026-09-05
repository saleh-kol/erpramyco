"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLeaveRequestAction } from "@/actions/leave";
import { Search, Plus, Calendar, X, Save, CheckCircle, Clock, Check, XCircle } from "lucide-react";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const toPersianDate = (date: Date | string) => { if (!date) return "-"; const d = new Date(date); if (isNaN(d.getTime())) return "-"; return d.toLocaleDateString("fa-IR"); };
const translateLeaveStatus = (status: string) => { const s: any = { "Pending": "در انتظار تایید", "Approved": "تایید شده", "Rejected": "رد شده", "Cancelled": "لغو شده" }; return s[status] || status; };
const formatToLocalISO = (dateObj: any) => {
  if (!dateObj) return "";
  try {
    const date = dateObj instanceof Date ? dateObj : dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    if (isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) { return ""; }
};

export default function LeaveClient({ types, requests, searchParams }: { types: any[], requests: any[], searchParams: any }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [filterStart, setFilterStart] = useState<any>(searchParams.start ? new Date(`${searchParams.start}T00:00:00`) : null);
  const [filterEnd, setFilterEnd] = useState<any>(searchParams.end ? new Date(`${searchParams.end}T00:00:00`) : null);
  
  const [formStart, setFormStart] = useState<any>(null);
  const [formEnd, setFormEnd] = useState<any>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const applyDateFilter = () => {
    const params = new URLSearchParams();
    const s = formatToLocalISO(filterStart);
    const e = formatToLocalISO(filterEnd);
    if (s) params.set("start", s);
    if (e) params.set("end", e);
    router.push(`/dashboard/leave?${params.toString()}`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const s = formatToLocalISO(formStart);
    const en = formatToLocalISO(formEnd);
    if (s) formData.append('startDate', s);
    if (en) formData.append('endDate', en);

    const result = await createLeaveRequestAction(formData);
    if (result?.error) {
      setFormError(result.error);
    } else if (result?.success) {
      setIsModalOpen(false);
      setFormStart(null);
      setFormEnd(null);
      setToast("درخواست مرخصی با موفقیت ثبت شد");
      setTimeout(() => setToast(null), 3000);
    }
  };

  // استایل مشترک فیلدها
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box" };
  const dateInputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "white", boxShadow: "none", boxSizing: "border-box" };

  const getStatusBadge = (status: string) => {
    if (status === 'Approved') return { bg: "#f0fdf4", color: "#166534", icon: <Check style={{width:"14px", height:"14px"}} /> };
    if (status === 'Rejected') return { bg: "#fef2f2", color: "#991b1b", icon: <XCircle style={{width:"14px", height:"14px"}} /> };
    return { bg: "#fff7ed", color: "#c2410c", icon: <Clock style={{width:"14px", height:"14px"}} /> };
  };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .rmdp-wrapper { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; border-radius: 16px !important; }
        .rmdp-day.rmdp-today span { background: #ed6e2b !important; color: white !important; }
        .rmdp-selected span { background: #ed6e2b !important; color: white !important; }
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-btn-close { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; }
        .erp-btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(237, 110, 43, 0.2); }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر صفحه */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "20px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        
        <button onClick={() => setIsModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)" }}>
          <Plus style={{ width: "18px", height: "18px" }} /> ثبت درخواست مرخصی
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textAlign: "center" }}>از تاریخ</label>
            {isMounted ? <DatePicker value={filterStart} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setFilterStart} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" style={dateInputStyle} disabled />}
          </div>
          <div style={{ height: "2px", width: "20px", backgroundColor: "#cbd5e1", marginBottom: "14px" }}></div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textAlign: "center" }}>تا تاریخ</label>
            {isMounted ? <DatePicker value={filterEnd} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setFilterEnd} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" style={dateInputStyle} disabled />}
          </div>
          <button onClick={applyDateFilter} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", height: "42px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Search style={{ width: "16px", height: "16px" }} /> اعمال فیلتر
          </button>
        </div>
      </div>

      {/* جدول سوابق */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", textAlign: "right" }}>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>نوع مرخصی</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>از تاریخ</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>تا تاریخ</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>تعداد روز</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>توضیحات</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r: any) => {
              const status = getStatusBadge(r.Status);
              return (
                <tr key={r.Leave_ID} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>{r.PR_Leave_Types?.Leave_Type_Name || "-"}</td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{toPersianDate(r.Start_Date)}</td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{toPersianDate(r.End_Date)}</td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{r.Days_Count || 1} روز</td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#64748b", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.Reason || "-"}</td>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, backgroundColor: status.bg, color: status.color }}>
                      {status.icon}
                      {translateLeaveStatus(r.Status)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (<tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>سابقه مرخصی‌ای در این بازه یافت نشد</td></tr>)}
          </tbody>
        </table>
      </div>

      {/* پاپ‌آپ ثبت مرخصی */}
      {isModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Calendar style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>فرم درخواست مرخصی</h2>
              </div>
              <button className="erp-btn-close" onClick={() => setIsModalOpen(false)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="erp-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>نوع مرخصی *</label>
                <select name="leaveTypeId" required className="erp-input" style={inputStyle}>
                  {types.map((t: any) => <option key={t.Leave_Type_ID} value={t.Leave_Type_ID}>{t.Leave_Type_Name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>از تاریخ *</label>
                {isMounted ? <DatePicker value={formStart} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setFormStart} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" className="erp-input" style={inputStyle} disabled />}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>تا تاریخ *</label>
                {isMounted ? <DatePicker value={formEnd} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setFormEnd} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" className="erp-input" style={inputStyle} disabled />}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>دلیل مرخصی</label>
                <textarea name="reason" rows={3} className="erp-input" style={{ ...inputStyle, resize: "vertical" }} placeholder="در صورت نیاز توضیحات خود را وارد کنید..."></textarea>
              </div>

              {formError && (
                <div style={{ gridColumn: "1 / -1", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", paddingTop: "12px" }}>
                <button type="submit" className="erp-btn-submit"><Save style={{ width: "18px", height: "18px" }} /> ثبت درخواست</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (<div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, animation: 'slideUp 0.3s ease-out' }}><CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />{toast}</div>)}
    </div>
  );
}