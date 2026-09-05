"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createMyMissionAction, completeMyMissionAction } from "@/actions/myMissions";
import { Navigation, Plus, X, Save, CheckCircle, Check } from "lucide-react";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const toPersianDate = (date: Date | string) => { if (!date) return "-"; const d = new Date(date); if (isNaN(d.getTime())) return "-"; return d.toLocaleDateString("fa-IR"); };
const translateCommuteType = (type: string) => { const types: any = { "CompanyVehicle": "وسیله نقلیه شرکت", "PersonalVehicle": "وسیله نقلیه شخصی", "PublicTransport": "حمل و نقل عمومی", "Taxi": "تاکسی", "Other": "سایر" }; return types[type] || type; };
const formatToLocalISO = (dateObj: any) => {
  if (!dateObj) return "";
  try {
    const date = dateObj instanceof Date ? dateObj : dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    if (isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) { return ""; }
};

export default function MyMissionsClient({ missions, currentStatus }: { missions: any[], currentStatus: string }) {
  const router = useRouter();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [dateVal, setDateVal] = useState<any>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const handleTabChange = (status: string) => { router.push(`/dashboard/my-missions?status=${status}`); };
  
  const openDetails = (m: any) => { 
    setSelectedMission(m); 
    setIsDetailsModalOpen(true); 
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const dateStr = formatToLocalISO(dateVal);
    if (dateStr) formData.append('commuteDate', dateStr);

    const result = await createMyMissionAction(formData);
    if (result?.error) setFormError(result.error);
    else if (result?.success) {
      setIsAddModalOpen(false);
      setDateVal(null);
      setToast("درخواست ماموریت ثبت شد و در انتظار تایید مدیر است");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await completeMyMissionAction(formData);
    setIsDetailsModalOpen(false);
    setToast("ماموریت با موفقیت تکمیل شد");
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusBadge = (m: any) => {
    if (m.Status === 'Completed') return { bg: "#f0fdf4", color: "#166534", text: "انجام شده" };
    if (m.Status === 'InProgress') return { bg: "#eff6ff", color: "#1d4ed8", text: "در حال انجام" };
    if (m.Status === 'Rejected') return { bg: "#fef2f2", color: "#991b1b", text: "رد شده" };
    return { bg: "#fff7ed", color: "#c2410c", text: "در انتظار تایید مدیر" };
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box" };
  const dateInputStyle: React.CSSProperties = { ...inputStyle, padding: "10px", textAlign: "center", boxShadow: "none", backgroundColor: "white" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-data-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
        .erp-data-label { font-size: 12px; color: #64748b; display: block; margin-bottom: 4px; }
        .erp-data-value { font-size: 14px; font-weight: 600; color: #0f172a; }
        .erp-row-hover:hover { background-color: #fffbf5 !important; cursor: pointer; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر، تب‌های فیلتر و دکمه ثبت */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>ماموریت‌های من</h1>
        
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => handleTabChange("pending")} style={{ padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: currentStatus === "pending" ? "#ed6e2b" : "white", color: currentStatus === "pending" ? "white" : "#64748b" }}>در انتظار تایید</button>
          <button onClick={() => handleTabChange("inprogress")} style={{ padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: currentStatus === "inprogress" ? "#3b82f6" : "white", color: currentStatus === "inprogress" ? "white" : "#64748b" }}>در حال انجام</button>
          <button onClick={() => handleTabChange("completed")} style={{ padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: currentStatus === "completed" ? "#16a34a" : "white", color: currentStatus === "completed" ? "white" : "#64748b" }}>انجام شده</button>
          <button onClick={() => handleTabChange("rejected")} style={{ padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: currentStatus === "rejected" ? "#ef4444" : "white", color: currentStatus === "rejected" ? "white" : "#64748b" }}>رد شده</button>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)" }}>
          <Plus style={{ width: "18px", height: "18px" }} /> ثبت ماموریت جدید
        </button>
      </div>

      {/* جدول ماموریت‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", textAlign: "right" }}>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>تاریخ</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>مسیر</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>مبلغ</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((m: any) => {
              const status = getStatusBadge(m);
              return (
                <tr key={m.Commute_ID} className="erp-row-hover" onClick={() => openDetails(m)} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" }}>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155", fontWeight: 600 }}>{toPersianDate(m.Commute_Date)}</td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{m.Origin} به {m.Destination}</td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{Number(m.Amount || 0).toLocaleString('fa-IR')} ریال</td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, backgroundColor: status.bg, color: status.color }}>{status.text}</span>
                  </td>
                </tr>
              );
            })}
            {missions.length === 0 && <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>ماموریتی در این بخش ثبت نشده است</td></tr>}
          </tbody>
        </table>
      </div>

      {/* ===== پاپ‌آپ جزئیات ماموریت ===== */}
      {isDetailsModalOpen && selectedMission && (
        <div className="erp-modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>جزئیات ماموریت</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X style={{ color: "#64748b" }} /></button>
            </div>
            <div className="erp-modal-body">
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="erp-data-box">
                  <span className="erp-data-label">تاریخ</span>
                  <span className="erp-data-value">{toPersianDate(selectedMission.Commute_Date)}</span>
                </div>
                <div className="erp-data-box">
                  <span className="erp-data-label">نوع وسیله</span>
                  <span className="erp-data-value">{translateCommuteType(selectedMission.Commute_Type)}</span>
                </div>
                <div className="erp-data-box">
                  <span className="erp-data-label">مبدا</span>
                  <span className="erp-data-value">{selectedMission.Origin}</span>
                </div>
                <div className="erp-data-box">
                  <span className="erp-data-label">مقصد</span>
                  <span className="erp-data-value">{selectedMission.Destination}</span>
                </div>
                <div className="erp-data-box">
                  <span className="erp-data-label">مسافت (کیلومتر)</span>
                  <span className="erp-data-value">{selectedMission.Distance_KM || 0}</span>
                </div>
                <div className="erp-data-box">
                  <span className="erp-data-label">مبلغ (ریال)</span>
                  <span className="erp-data-value">{Number(selectedMission.Amount || 0).toLocaleString('fa-IR')}</span>
                </div>
                <div className="erp-data-box">
                  <span className="erp-data-label">شماره رسید</span>
                  <span className="erp-data-value">{selectedMission.Receipt_Number || "-"}</span>
                </div>
                <div className="erp-data-box">
                  <span className="erp-data-label">وضعیت</span>
                  <span className="erp-data-value" style={{ color: getStatusBadge(selectedMission).color }}>{getStatusBadge(selectedMission).text}</span>
                </div>
              </div>

              <div className="erp-data-box" style={{ marginBottom: "24px" }}>
                <span className="erp-data-label">توضیحات</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>{selectedMission.Description || "توضیحاتی ثبت نشده است."}</p>
              </div>

              {/* دکمه اتمام ماموریت فقط در صورت تایید مدیر نمایش داده می‌شود */}
              {selectedMission.Status === 'InProgress' && (
                <form onSubmit={handleComplete}>
                  <input type="hidden" name="commuteId" value={selectedMission.Commute_ID} />
                  <button type="submit" style={{ width: "100%", padding: "12px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 6px rgba(22,163,74,0.2)" }}>
                    <Check style={{ width: "18px", height: "18px" }} /> اتمام ماموریت
                  </button>
                </form>
              )}
              
            </div>
          </div>
        </div>
      )}

      {/* ===== پاپ‌آپ ثبت ماموریت جدید ===== */}
      {isAddModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>ثبت ماموریت جدید</h2>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X style={{ color: "#64748b" }} /></button>
            </div>
            <form onSubmit={handleSubmit} className="erp-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>تاریخ ماموریت *</label>
                {isMounted ? <DatePicker value={dateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" className="erp-input" disabled />}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>نوع وسیله نقلیه *</label>
                <select name="commuteType" required className="erp-input">
                  <option value="PersonalVehicle">وسیله نقلیه شخصی</option>
                  <option value="CompanyVehicle">وسیله نقلیه شرکت</option>
                  <option value="PublicTransport">حمل و نقل عمومی</option>
                  <option value="Taxi">تاکسی</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>مبدا *</label>
                <input name="origin" required type="text" className="erp-input" placeholder="مبدا حرکت" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>مقصد *</label>
                <input name="destination" required type="text" className="erp-input" placeholder="مقصد حرکت" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>مسافت (کیلومتر)</label>
                <input name="distanceKm" type="number" min="0" className="erp-input" placeholder="0" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>مبلغ هزینه (ریال) *</label>
                <input name="amount" required type="number" min="0" className="erp-input" placeholder="0" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>توضیحات</label>
                <textarea name="description" rows={2} className="erp-input" style={{ resize: "vertical" }} placeholder="در صورت نیاز توضیحات وارد کنید..."></textarea>
              </div>

              {formError && (
                <div style={{ gridColumn: "1 / -1", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600 }}>{formError}</div>
              )}

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" style={{ padding: "12px 28px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}><Save style={{ width: "18px", height: "18px" }} /> ثبت درخواست</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (<div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, animation: 'slideUp 0.3s ease-out' }}><CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />{toast}</div>)}
    </div>
  );
}