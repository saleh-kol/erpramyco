"use client";

import { useState, useEffect } from "react";
import { addHolidayAction, deleteHolidayAction } from "@/actions/calendar";
import { Calendar, Plus, Trash2, CheckCircle } from "lucide-react";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const toPersianDate = (date: Date | string) => { if (!date) return "-"; const d = new Date(date); if (isNaN(d.getTime())) return "-"; return d.toLocaleDateString("fa-IR"); };
const formatToLocalISO = (dateObj: any) => {
  if (!dateObj) return "";
  try {
    const date = dateObj instanceof Date ? dateObj : dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    if (isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) { return ""; }
};

export default function CalendarClient({ holidays }: { holidays: any[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [dateVal, setDateVal] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateStr = formatToLocalISO(dateVal);
    if (dateStr) formData.append('date', dateStr);
    
    if (!dateStr) {
      setToast("لطفاً یک تاریخ انتخاب کنید");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    await addHolidayAction(formData);
    setDateVal(null);
    setToast("روز تعطیل با موفقیت ثبت شد");
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ایجاد FormData از فرم
    const formData = new FormData(e.currentTarget);
    await deleteHolidayAction(formData);
    setToast("روز تعطیل حذف شد");
    setTimeout(() => setToast(null), 3000);
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box" };
  const dateInputStyle: React.CSSProperties = { ...inputStyle, padding: "10px", textAlign: "center", boxShadow: "none", backgroundColor: "white" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        
        {/* باکس راست: فرم ثبت تعطیلی */}
        <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><Calendar style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>تعریف روز تعطیل</h2>
          </div>
          
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>تاریخ *</label>
              {isMounted ? <DatePicker value={dateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" style={dateInputStyle} disabled />}
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>توضیحات (مناسبت)</label>
              <input name="description" type="text" style={inputStyle} placeholder="مثال: عید نوروز" />
            </div>
            <button type="submit" style={{ padding: "12px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Plus style={{ width: "18px", height: "18px" }} /> ثبت تعطیلی
            </button>
          </form>

          <div style={{ marginTop: "24px", backgroundColor: "#eff6ff", padding: "16px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#1d4ed8", fontWeight: 600 }}>نکته:</p>
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#1e40af", lineHeight: 1.6 }}>روزهای جمعه به صورت خودکار در سیستم تعطیل محسوب می‌شوند و نیازی به ثبت آن‌ها در این بخش نیست.</p>
          </div>
        </div>

        {/* باکس چپ: لیست تعطیلات */}
        <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>لیست روزهای تعطیل</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", textAlign: "right" }}>
                <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>تاریخ</th>
                <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>توضیحات</th>
                <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h: any) => (
                <tr key={h.Holiday_ID} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>{toPersianDate(h.Date)}</td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{h.Description || "-"}</td>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    <form onSubmit={handleDelete}>
                      <input type="hidden" name="id" value={h.Holiday_ID} />
                      <button type="submit" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>
                        <Trash2 style={{ width: "12px", height: "12px" }} /> حذف
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {holidays.length === 0 && (<tr><td colSpan={3} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>هیچ روز تعطلی ثبت نشده است</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (<div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, animation: 'slideUp 0.3s ease-out' }}><CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />{toast}</div>)}
    </div>
  );
}