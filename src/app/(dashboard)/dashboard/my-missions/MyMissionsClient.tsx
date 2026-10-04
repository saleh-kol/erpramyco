"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createMyMissionAction, completeMyMissionAction } from "@/actions/myMissions";
import { Navigation, Plus, X, Save, CheckCircle, Check, Clock, AlertCircle } from "lucide-react";

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
    const result = await completeMyMissionAction(formData);
    if (result?.success) {
      setIsDetailsModalOpen(false);
      setToast("ماموریت با موفقیت تکمیل شد");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getStatusBadge = (m: any) => {
    if (m.Status === 'Completed') return { bg: "#f0fdf4", color: "#166534", text: "انجام شده", icon: <Check style={{ width: "14px", height: "14px" }} /> };
    if (m.Status === 'InProgress') return { bg: "#eff6ff", color: "#1d4ed8", text: "در حال انجام", icon: <Clock style={{ width: "14px", height: "14px" }} /> };
    if (m.Status === 'Rejected') return { bg: "#fef2f2", color: "#991b1b", text: "رد شده", icon: <X style={{ width: "14px", height: "14px" }} /> };
    return { bg: "#fff7ed", color: "#c2410c", text: "در انتظار تایید مدیر", icon: <AlertCircle style={{ width: "14px", height: "14px" }} /> };
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box", transition: "all 0.2s" };
  const dateInputStyle: React.CSSProperties = { ...inputStyle, padding: "10px", textAlign: "center", boxShadow: "none", backgroundColor: "white" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: white; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-data-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
        .erp-data-label { font-size: 12px; color: "#64748b"; display: block; margin-bottom: 4px; }
        .erp-data-value { font-size: 14px; font-weight: 600; color: #0f172a; }
        .erp-row-hover:hover { background-color: #fffbf5 !important; cursor: pointer; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر، تب‌های فیلتر و دکمه ثبت */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "20px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>ماموریت‌های من</h1>
        </div>

        <div style={{ display: "flex", gap: "8px", backgroundColor: "#f8fafc", padding: "4px", borderRadius: "12px" }}>
          <button onClick={() => handleTabChange("pending")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: currentStatus === "pending" ? "#ed6e2b" : "transparent", color: currentStatus === "pending" ? "white" : "#64748b", transition: "all 0.2s" }}>در انتظار تایید</button>
          <button onClick={() => handleTabChange("inprogress")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: currentStatus === "inprogress" ? "#3b82f6" : "transparent", color: currentStatus === "inprogress" ? "white" : "#64748b", transition: "all 0.2s" }}>در حال انجام</button>
          <button onClick={() => handleTabChange("completed")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: currentStatus === "completed" ? "#16a34a" : "transparent", color: currentStatus === "completed" ? "white" : "#64748b", transition: "all 0.2s" }}>انجام شده</button>
          <button onClick={() => handleTabChange("rejected")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: currentStatus === "rejected" ? "#ef4444" : "transparent", color: currentStatus === "rejected" ? "white" : "#64748b", transition: "all 0.2s" }}>رد شده</button>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)", fontSize: "14px", transition: "all 0.2s" }}>
          <Plus style={{ width: "18px", height: "18px" }} /> ثبت ماموریت جدید
        </button>
      </div>

      {/* جدول ماموریت‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", textAlign: "right", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "14px 16px", fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>تاریخ</th>
                <th style={{ padding: "14px 16px", fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>مسیر</th>
                <th style={{ padding: "14px 16px", fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>مبلغ</th>
                <th style={{ padding: "14px 16px", fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m: any) => {
                const status = getStatusBadge(m);
                return (
                  <tr key={m.Commute_ID} className="erp-row-hover" onClick={() => openDetails(m)} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" }}>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#334155", fontWeight: 600 }}>{toPersianDate(m.Commute_Date)}</td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#475569" }}>{m.Origin} به {m.Destination}</td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>{Number(m.Amount || 0).toLocaleString('fa-IR')} ریال</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, backgroundColor: status.bg, color: status.color }}>
                        {status.icon} {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {missions.length === 0 && <tr><td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>ماموریتی در این بخش ثبت نشده است</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== پاپ‌آپ جزئیات ماموریت ===== */}
      {isDetailsModalOpen && selectedMission && (
        <div className="erp-modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><Navigation style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>جزئیات ماموریت</h2>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}><X style={{ color: "#64748b", width: "20px", height: "20px" }} /></button>
            </div>
            <div className="erp-modal-body">
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div className="erp-data-box"><span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>تاریخ</span><span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{toPersianDate(selectedMission.Commute_Date)}</span></div>
                <div className="erp-data-box"><span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>نوع وسیله</span><span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{translateCommuteType(selectedMission.Commute_Type)}</span></div>
                <div className="erp-data-box"><span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>مبدا</span><span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{selectedMission.Origin}</span></div>
                <div className="erp-data-box"><span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>مقصد</span><span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{selectedMission.Destination}</span></div>
                <div className="erp-data-box"><span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>مدت زمان</span><span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{selectedMission.Commute_Duration ? `${Number(selectedMission.Commute_Duration).toFixed(2)} ساعت` : "-"}</span></div>
                <div className="erp-data-box"><span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>مسافت</span><span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{selectedMission.Distance_KM || 0} کیلومتر</span></div>
                <div className="erp-data-box"><span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>مبلغ (ریال)</span><span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{Number(selectedMission.Amount || 0).toLocaleString('fa-IR')}</span></div>
                <div className="erp-data-box"><span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>شماره رسید</span><span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{selectedMission.Receipt_Number || "-"}</span></div>
              </div>

              <div className="erp-data-box" style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>توضیحات</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>{selectedMission.Description || "توضیحاتی ثبت نشده است."}</p>
              </div>

              {selectedMission.Manager_Comment && (
                <div style={{ backgroundColor: "#eff6ff", padding: "12px", borderRadius: "10px", border: "1px solid #bfdbfe", marginBottom: "20px" }}>
                  <span style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: "600", display: "block", marginBottom: "6px" }}>نظر مدیر</span>
                  <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>{selectedMission.Manager_Comment}</p>
                </div>
              )}

              {/* دکمه اتمام ماموریت فقط در صورت "در حال انجام" نمایش داده می‌شود */}
              {selectedMission.Status === 'InProgress' && (
                <form onSubmit={handleComplete}>
                  <input type="hidden" name="commuteId" value={selectedMission.Commute_ID} />
                  <button type="submit" style={{ width: "100%", padding: "12px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 6px rgba(22,163,74,0.2)", transition: "all 0.2s" }}>
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
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>ثبت ماموریت جدید</h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>درخواست شما پس از تایید مدیر فعال می‌شود</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}><X style={{ color: "#64748b", width: "20px", height: "20px" }} /></button>
            </div>
            <form onSubmit={handleSubmit} className="erp-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>تاریخ ماموریت *</label>
                {isMounted ? <DatePicker value={dateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" className="erp-input" disabled />}
              </div>
              <div>
                <label style={labelStyle}>مدت زمان (ساعت) *</label>
                <input name="commuteDuration" required type="number" min="0" step="0.5" className="erp-input" placeholder="مثلاً 2.5" />
              </div>
              <div>
                <label style={labelStyle}>نوع وسیله نقلیه *</label>
                <select name="commuteType" required className="erp-input">
                  <option value="PersonalVehicle">وسیله نقلیه شخصی</option>
                  <option value="CompanyVehicle">وسیله نقلیه شرکت</option>
                  <option value="PublicTransport">حمل و نقل عمومی</option>
                  <option value="Taxi">تاکسی</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>مبلغ هزینه (ریال) *</label>
                <input name="amount" required type="number" min="0" className="erp-input" placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>مبدا *</label>
                <input name="origin" required type="text" className="erp-input" placeholder="مبدا حرکت" />
              </div>
              <div>
                <label style={labelStyle}>مقصد *</label>
                <input name="destination" required type="text" className="erp-input" placeholder="مقصد حرکت" />
              </div>
              <div>
                <label style={labelStyle}>مسافت (کیلومتر)</label>
                <input name="distanceKm" type="number" min="0" className="erp-input" placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>شماره رسید</label>
                <input name="receiptNumber" type="text" className="erp-input" placeholder="شماره فاکتور/رسید" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>توضیحات</label>
                <textarea name="description" rows={2} className="erp-input" style={{ resize: "vertical" }} placeholder="در صورت نیاز توضیحات وارد کنید..."></textarea>
              </div>

              {formError && (
                <div style={{ gridColumn: "1 / -1", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600 }}>{formError}</div>
              )}

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", paddingTop: "12px", borderTop: "1px solid #f1f5f9", marginTop: "8px" }}>
                <button type="submit" style={{ padding: "12px 28px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)" }}><Save style={{ width: "18px", height: "18px" }} /> ثبت درخواست</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, animation: 'slideUp 0.3s ease-out' }}>
          <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />{toast}
        </div>
      )}
    </div>
  );
}