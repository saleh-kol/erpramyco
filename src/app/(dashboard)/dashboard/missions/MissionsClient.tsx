"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createMissionAction } from "@/actions/missions";
import {
  Search, Plus, Navigation, X, Save, CheckCircle
} from "lucide-react";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const toPersianDate = (date: Date | string) => { if (!date) return "-"; const d = new Date(date); if (isNaN(d.getTime())) return "-"; return d.toLocaleDateString("fa-IR"); };
const translateRole = (role: string) => {
  if (!role) return "-";
  const roles: any = {
    "Factory Manager": "مدیر کارخانه", "Factory_Manager": "مدیر کارخانه",
    "ModirNet": "مدیر نت",
    "Production Supervisor": "سرپرست تولید", "Production_Supervisor": "سرپرست تولید",
    "Repairer": "تعمیرکار",
    "Operator": "اپراتور",
    "Commerce": "بازرگانی",
    "Contractor": "پیمانکار"
  };
  return roles[role] || role.replace(/_/g, ' ');
};
const translateCommuteType = (type: string) => { const types: any = { "CompanyVehicle": "وسیله نقلیه شرکت", "PersonalVehicle": "وسیله نقلیه شخصی", "PublicTransport": "حمل و نقل عمومی", "Taxi": "تاکسی", "Other": "سایر" }; return types[type] || type; };

const formatToLocalISO = (dateObj: any) => {
  if (!dateObj) return "";
  try {
    const date = dateObj instanceof Date ? dateObj : dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    if (isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) { return ""; }
};

export default function MissionsClient({ missions, personnel, currentStatus }: { missions: any[], personnel: any[], currentStatus: string }) {
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [missionSearch, setMissionSearch] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null);
  const [showPersonnelList, setShowPersonnelList] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [dateVal, setDateVal] = useState<any>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const handleTabChange = (status: string) => { router.push(`/dashboard/missions?status=${status}`); };

  const filteredMissions = missions.filter(m => {
    const person = personnel.find((p: any) => p.Personnel_ID === m.Personnel_ID);
    const personName = person?.Full_Name || "";
    return personName.toLowerCase().includes(missionSearch.toLowerCase()) ||
           m.Origin?.toLowerCase().includes(missionSearch.toLowerCase()) ||
           m.Destination?.toLowerCase().includes(missionSearch.toLowerCase());
  });

  const filteredPersonnel = personnel.filter((p: any) => 
    p.Full_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Personnel_Code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectPersonnel = (p: any) => {
    setSelectedPersonnel(p);
    setSearchTerm(p.Full_Name);
    setShowPersonnelList(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dateStr = formatToLocalISO(dateVal);
    if (dateStr) formData.append('commuteDate', dateStr);
    if (selectedPersonnel) formData.append('personnelId', String(selectedPersonnel.Personnel_ID));

    await createMissionAction(formData);
    setIsModalOpen(false);
    setSelectedPersonnel(null);
    setSearchTerm("");
    setDateVal(null);
    setToast("ماموریت با موفقیت ثبت شد");
    setTimeout(() => setToast(null), 3000);
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box" };
  const dateInputStyle: React.CSSProperties = { ...inputStyle, padding: "10px", textAlign: "center", boxShadow: "none" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .rmdp-wrapper { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; border-radius: 16px !important; }
        .rmdp-day.rmdp-today span { background: #ed6e2b !important; color: white !important; }
        .rmdp-selected span { background: #ed6e2b !important; color: white !important; }
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-btn-close { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .erp-btn-close:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
        .erp-btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(237, 110, 43, 0.2); transition: all 0.2s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر صفحه، جستجو و تب‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "20px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
            <Search style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
            <input type="text" placeholder="جستجوی ماموریت..." className="erp-input" style={{ paddingRight: "40px" }} value={missionSearch} onChange={(e) => setMissionSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => handleTabChange("pending")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: currentStatus === "pending" ? "#ed6e2b" : "#f1f5f9", color: currentStatus === "pending" ? "white" : "#64748b" }}>در انتظار تایید</button>
            <button onClick={() => handleTabChange("approved")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: currentStatus === "approved" ? "#ed6e2b" : "#f1f5f9", color: currentStatus === "approved" ? "white" : "#64748b" }}>تایید شده</button>
            {/* این دکمه را اضافه کنید */}
            <button onClick={() => handleTabChange("rejected")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: currentStatus === "rejected" ? "#ed6e2b" : "#f1f5f9", color: currentStatus === "rejected" ? "white" : "#64748b" }}>رد شده</button>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)" }}>
          <Plus style={{ width: "18px", height: "18px" }} /> ثبت ماموریت جدید
        </button>
      </div>

      {/* جدول ماموریت‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", textAlign: "right" }}>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>تاریخ</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>پرسنل</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>مسیر</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>نوع وسیله</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>هزینه (ریال)</th>
            </tr>
          </thead>
          <tbody>
            {filteredMissions.map((m: any) => {
              // پیدا کردن نام پرسنل از لیست آرایه personnel
              const person = personnel.find((p: any) => p.Personnel_ID === m.Personnel_ID);
              return (
                <tr key={m.Commute_ID} onClick={() => router.push(`/dashboard/missions/${m.Commute_ID}`)} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fffbf5"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155", fontWeight: 600 }}>{toPersianDate(m.Commute_Date)}</td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>
                    {person?.Full_Name || "نامشخص"}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{m.Origin} به {m.Destination}</td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{translateCommuteType(m.Commute_Type)}</td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{Number(m.Amount || 0).toLocaleString('fa-IR')}</td>
                </tr>
              );
            })}
            {filteredMissions.length === 0 && (<tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>ماموریتی یافت نشد</td></tr>)}
          </tbody>
        </table>
      </div>

      {/* پاپ‌آپ افزودن ماموریت */}
      {isModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>ثبت ماموریت جدید</h2>
              </div>
              <button className="erp-btn-close" onClick={() => setIsModalOpen(false)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="erp-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              
              {/* جستجوی کارمند */}
              <div style={{ gridColumn: "1 / -1", position: "relative" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>انتخاب پرسنل *</label>
                <div style={{ position: "relative" }}>
                  <Search style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
                  <input type="text" className="erp-input" style={{ paddingRight: "40px" }} placeholder="نام یا کد کارمند را جستجو کنید..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowPersonnelList(true); if(e.target.value === "") setSelectedPersonnel(null) }} onFocus={() => setShowPersonnelList(true)} required />
                </div>
                {showPersonnelList && searchTerm && !selectedPersonnel && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", maxHeight: "200px", overflowY: "auto", zIndex: 20, marginTop: "4px" }}>
                    {filteredPersonnel.map((p: any) => (
                      <div key={p.Personnel_ID} onClick={() => selectPersonnel(p)} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff7ed"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}>
                        <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>{p.Full_Name}</span>
                        <span style={{ fontSize: "12px", color: "#64748b", marginRight: "8px" }}>{p.Personnel_Code} - {translateRole(p.Role)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>تاریخ ماموریت *</label>
                {isMounted ? <DatePicker value={dateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" className="erp-input" disabled />}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>نوع وسیله نقلیه *</label>
                <select name="commuteType" required className="erp-input">
                  <option value="CompanyVehicle">وسیله نقلیه شرکت</option>
                  <option value="PersonalVehicle">وسیله نقلیه شخصی</option>
                  <option value="PublicTransport">حمل و نقل عمومی</option>
                  <option value="Taxi">تاکسی</option>
                  <option value="Other">سایر</option>
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
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>شماره رسید</label>
                <input name="receiptNumber" type="text" className="erp-input" placeholder="شماره فاکتور/رسید" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>توضیحات</label>
                <textarea name="description" rows={2} className="erp-input" style={{ resize: "vertical" }} placeholder="در صورت نیاز توضیحات وارد کنید..."></textarea>
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", paddingTop: "12px" }}>
                <button type="submit" className="erp-btn-submit"><Save style={{ width: "18px", height: "18px" }} /> ثبت ماموریت</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (<div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, animation: 'slideUp 0.3s ease-out' }}><CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />{toast}</div>)}
    </div>
  );
}