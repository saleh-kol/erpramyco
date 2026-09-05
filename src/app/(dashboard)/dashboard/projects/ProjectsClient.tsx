"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/actions/projects";
import {
  Search, Plus, Briefcase, X, Save, CheckCircle, UserCircle2, Users, Check, Award, AlertTriangle, Calendar, Crown
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

const formatToLocalISO = (dateObj: any) => {
  if (!dateObj) return "";
  try {
    const date = dateObj instanceof Date ? dateObj : dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    if (isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  } catch (e) { return ""; }
};

export default function ProjectsClient({ projects, personnel, currentStatus }: { projects: any[], personnel: any[], currentStatus: string }) {
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  
  const [projectSearch, setProjectSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState<any[]>([]);
  const [projectLeaderId, setProjectLeaderId] = useState<string>("");
  
  const [toast, setToast] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [startDateVal, setStartDateVal] = useState<any>(null);
  const [goldenDateVal, setGoldenDateVal] = useState<any>(null);
  const [endDateVal, setEndDateVal] = useState<any>(null);
  const [deadlineDateVal, setDeadlineDateVal] = useState<any>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const handleTabChange = (status: string) => { router.push(`/dashboard/projects?status=${status}`); };

  const filteredProjects = projects.filter(p => 
    p.Project_Name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.Project_Code.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const filteredPersonnel = personnel.filter((p: any) => 
    p.Full_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Personnel_Code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePersonnelSelection = (p: any) => {
    setSelectedPersonnel(prev => {
      const exists = prev.find(item => item.Personnel_ID === p.Personnel_ID);
      if (exists) {
        // اگر فرد حذف شده مسئول بود، مسئول را هم پاک کن
        if (String(p.Personnel_ID) === projectLeaderId) {
          setProjectLeaderId("");
        }
        return prev.filter(item => item.Personnel_ID !== p.Personnel_ID);
      } else {
        return [...prev, p];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // اعتبارسنجی: اگر تیم انتخاب شده ولی مسئول انتخاب نشده
    if (selectedPersonnel.length > 0 && !projectLeaderId) {
      setToast("لطفاً مسئول پروژه را انتخاب کنید");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    const startStr = formatToLocalISO(startDateVal);
    const goldenStr = formatToLocalISO(goldenDateVal);
    const endStr = formatToLocalISO(endDateVal);
    const deadlineStr = formatToLocalISO(deadlineDateVal);
    
    if (startStr) formData.append('startDate', startStr);
    if (goldenStr) formData.append('goldenDate', goldenStr);
    if (endStr) formData.append('endDate', endStr);
    if (deadlineStr) formData.append('deadlineDate', deadlineStr);
    if (projectLeaderId) formData.append('projectLeaderId', projectLeaderId);

    selectedPersonnel.forEach(p => {
      formData.append('personnelId', String(p.Personnel_ID));
      formData.append('personnelRole', p.assignedRole || 'عضو پروژه');
    });
    
    await createProjectAction(formData);
    setIsModalOpen(false);
    setSelectedPersonnel([]);
    setProjectLeaderId("");
    setStartDateVal(null);
    setGoldenDateVal(null);
    setEndDateVal(null);
    setDeadlineDateVal(null);
    setToast("پروژه با موفقیت ثبت شد");
    setTimeout(() => setToast(null), 3000);
  };

  const updatePersonnelRole = (personnelId: number, role: string) => {
    setSelectedPersonnel(prev => 
      prev.map(p => p.Personnel_ID === personnelId ? { ...p, assignedRole: role } : p)
    );
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box" };
  const dateInputStyle: React.CSSProperties = { ...inputStyle, padding: "10px", textAlign: "center", boxShadow: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .rmdp-wrapper { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; border-radius: 16px !important; }
        .rmdp-day.rmdp-today span { background: #ed6e2b !important; color: white !important; }
        .rmdp-selected span { background: #ed6e2b !important; color: white !important; }
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 850px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-btn-close { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .erp-btn-close:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
        .erp-btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(237, 110, 43, 0.2); transition: all 0.2s; }
        .erp-section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 16px 0; font-size: 14px; fontWeight: bold; color: #334155; }
        .erp-section-title::before { content: ''; width: 4px; height: 16px; background: #ed6e2b; border-radius: 2px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر صفحه، جستجو و تب‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "20px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
            <Search style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
            <input type="text" placeholder="جستجوی پروژه..." className="erp-input" style={{ paddingRight: "40px" }} value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => handleTabChange("Active")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: currentStatus === "Active" ? "#ed6e2b" : "#f1f5f9", color: currentStatus === "Active" ? "white" : "#64748b" }}>در حال انجام</button>
            <button onClick={() => handleTabChange("Completed")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: currentStatus === "Completed" ? "#ed6e2b" : "#f1f5f9", color: currentStatus === "Completed" ? "white" : "#64748b" }}>اتمام یافته</button>
            <button onClick={() => handleTabChange("OnHold")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: currentStatus === "OnHold" ? "#ed6e2b" : "#f1f5f9", color: currentStatus === "OnHold" ? "white" : "#64748b" }}>در انتظار</button>
            <button onClick={() => handleTabChange("Cancelled")} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: currentStatus === "Cancelled" ? "#ed6e2b" : "#f1f5f9", color: currentStatus === "Cancelled" ? "white" : "#64748b" }}>لغو شده</button>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)" }}>
          <Plus style={{ width: "18px", height: "18px" }} /> افزودن پروژه
        </button>
      </div>

      {/* جدول پروژه‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", textAlign: "right" }}>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>کد پروژه</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>نام پروژه</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>👑 مسئول پروژه</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>بودجه</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>تاریخ طلایی</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>تاریخ پایان</th>
              <th style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>دیرکرد</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((p: any) => (
              <tr key={p.Project_ID} onClick={() => router.push(`/dashboard/projects/${p.Project_ID}`)} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fffbf5"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}>
                <td style={{ padding: "16px", fontSize: "14px", color: "#334155", fontWeight: 600 }}>{p.Project_Code}</td>
                <td style={{ padding: "16px", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>{p.Project_Name}</td>
                <td style={{ padding: "16px", fontSize: "14px", color: "#92400e", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Crown style={{ width: "14px", height: "14px", color: "#d97706" }} />
                    {p.Project_Leader?.Full_Name || "-"}
                  </div>
                </td>
                <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{Number(p.Budget || 0).toLocaleString('fa-IR')} ریال</td>
                <td style={{ padding: "16px", fontSize: "14px", color: "#c2410c", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Award style={{ width: "14px", height: "14px" }} />
                    {toPersianDate(p.Golden_Date)}
                  </div>
                </td>
                <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{toPersianDate(p.End_Date)}</td>
                <td style={{ padding: "16px", fontSize: "14px", color: "#ef4444" }}>{toPersianDate(p.Deadline_Date)}</td>
              </tr>
            ))}
            {filteredProjects.length === 0 && (<tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>پروژه‌ای یافت نشد</td></tr>)}
          </tbody>
        </table>
      </div>

      {/* پاپ‌آپ افزودن پروژه */}
      {isModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Briefcase style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>ثبت پروژه جدید</h2>
              </div>
              <button className="erp-btn-close" onClick={() => setIsModalOpen(false)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="erp-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              
              <div style={{ gridColumn: "1 / -1" }}>
                <h3 className="erp-section-title">اطلاعات پایه</h3>
              </div>
              
              <div><label style={labelStyle}>کد پروژه *</label><input name="projectCode" required type="text" className="erp-input" placeholder="مثال: PRJ-001" /></div>
              <div><label style={labelStyle}>نام پروژه *</label><input name="projectName" required type="text" className="erp-input" placeholder="نام پروژه" /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>شرح پروژه</label><textarea name="description" rows={3} className="erp-input" style={{ resize: "vertical" }} placeholder="توضیحات پروژه..."></textarea></div>
              <div><label style={labelStyle}>بودجه (ریال)</label><input name="budget" type="number" min="0" className="erp-input" placeholder="0" /></div>
              <div><label style={labelStyle}>تاریخ شروع</label>{isMounted ? <DatePicker value={startDateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setStartDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" className="erp-input" disabled />}</div>

              <div style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
                <h3 className="erp-section-title"><Award style={{ width: "16px", height: "16px", color: "#ed6e2b" }} /> تاریخ‌های پاداش و جریمه</h3>
              </div>

              <div>
                <label style={{ ...labelStyle, color: "#c2410c" }}>🥇 تاریخ طلایی *</label>
                {isMounted ? <DatePicker value={goldenDateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setGoldenDateVal} format="YYYY/MM/DD" style={{ ...dateInputStyle, border: "1px solid #fed7aa", backgroundColor: "#fff7ed" }} /> : <input type="text" className="erp-input" disabled />}
                <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#c2410c" }}>تحویل قبل از این تاریخ = پاداش</p>
              </div>
              <div>
                <label style={labelStyle}>📅 تاریخ پایان *</label>
                {isMounted ? <DatePicker value={endDateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setEndDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" className="erp-input" disabled />}
                <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#64748b" }}>تحویل در این بازه = بدون تغییر</p>
              </div>
              <div>
                <label style={{ ...labelStyle, color: "#ef4444" }}>⏰ تاریخ دیرکرد (حد نهایی) *</label>
                {isMounted ? <DatePicker value={deadlineDateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setDeadlineDateVal} format="YYYY/MM/DD" style={{ ...dateInputStyle, border: "1px solid #fecaca", backgroundColor: "#fef2f2" }} /> : <input type="text" className="erp-input" disabled />}
                <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#ef4444" }}>بعد از این تاریخ = لغو پروژه</p>
              </div>
              <div>
                <label style={labelStyle}>درصد پاداش طلایی (%)</label>
                <input name="goldenBonusPercent" type="number" min="0" max="100" className="erp-input" placeholder="مثلاً 20" />
                <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#16a34a" }}>اضافه به مبلغ پروژه</p>
              </div>
              <div>
                <label style={labelStyle}>درصد جریمه دیرکرد (%)</label>
                <input name="delayPenaltyPercent" type="number" min="0" max="100" className="erp-input" placeholder="مثلاً 15" />
                <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#ef4444" }}>کسر از مبلغ پروژه</p>
              </div>

              <div style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
                <h3 className="erp-section-title"><Users style={{ width: "16px", height: "16px", color: "#ed6e2b" }} /> تیم پروژه</h3>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                {selectedPersonnel.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                    {selectedPersonnel.map((p: any) => (
                      <div key={p.Personnel_ID} style={{ 
                        backgroundColor: String(p.Personnel_ID) === projectLeaderId ? "#fef3c7" : "#f8fafc", 
                        padding: "12px", 
                        borderRadius: "10px", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px", 
                        border: String(p.Personnel_ID) === projectLeaderId ? "1px solid #fde68a" : "1px solid #e2e8f0"
                      }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                          {p.Personal_Image_Path ? <img src={p.Personal_Image_Path} alt={p.Full_Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle2 style={{ width: "100%", height: "100%", color: "#cbd5e1" }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "4px" }}>
                            {p.Full_Name}
                            {String(p.Personnel_ID) === projectLeaderId && <Crown style={{ width: "14px", height: "14px", color: "#d97706" }} />}
                          </p>
                          <input 
                            type="text" 
                            value={p.assignedRole || ""}
                            onChange={(e) => updatePersonnelRole(p.Personnel_ID, e.target.value)}
                            placeholder="نقش در پروژه..."
                            style={{ width: "100%", marginTop: "4px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px", fontFamily: "inherit", backgroundColor: "white", boxSizing: "border-box" }}
                          />
                        </div>
                        <button type="button" onClick={() => togglePersonnelSelection(p)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }}>
                          <X style={{ width: "16px", height: "16px" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setIsPersonnelModalOpen(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", border: "1px dashed #cbd5e1", borderRadius: "10px", backgroundColor: "#f8fafc", cursor: "pointer", color: "#64748b", fontWeight: 600 }}>
                  <Users style={{ width: "18px", height: "18px" }} /> انتخاب از لیست پرسنل
                </button>

                {/* انتخاب مسئول پروژه */}
                {selectedPersonnel.length > 0 && (
                  <div style={{ marginTop: "16px", backgroundColor: "#fef3c7", padding: "16px", borderRadius: "10px", border: "1px solid #fde68a" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#92400e", marginBottom: "8px" }}>
                      <Crown style={{ width: "16px", height: "16px", color: "#d97706" }} />
                      انتخاب مسئول پروژه *
                    </label>
                    <select 
                      value={projectLeaderId}
                      onChange={(e) => setProjectLeaderId(e.target.value)}
                      className="erp-input"
                      style={{ border: "1px solid #fde68a", backgroundColor: "white" }}
                    >
                      <option value="">انتخاب کنید...</option>
                      {selectedPersonnel.map(p => (
                        <option key={p.Personnel_ID} value={p.Personnel_ID}>
                          {p.Full_Name} - {p.assignedRole || 'عضو پروژه'}
                        </option>
                      ))}
                    </select>
                    <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#92400e" }}>
                      ⚠️ ثبت اتمام پروژه فقط توسط این فرد انجام می‌شود.
                    </p>
                  </div>
                )}
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                <button type="submit" className="erp-btn-submit"><Save style={{ width: "18px", height: "18px" }} /> ثبت پروژه</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* پاپ‌آپ انتخاب چند کارمند */}
      {isPersonnelModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsPersonnelModalOpen(false)} style={{ zIndex: 60 }}>
          <div className="erp-modal-container" style={{ maxWidth: "900px" }} onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Users style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>انتخاب تیم پروژه</h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{selectedPersonnel.length} نفر انتخاب شده است</p>
                </div>
              </div>
              <button className="erp-btn-close" onClick={() => setIsPersonnelModalOpen(false)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>

            <div className="erp-modal-body">
              <div style={{ position: "relative", marginBottom: "24px" }}>
                <Search style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
                <input type="text" className="erp-input" style={{ paddingRight: "40px" }} placeholder="جستجوی پرسنل..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", maxHeight: "50vh", overflowY: "auto", padding: "4px" }}>
                {filteredPersonnel.map((p: any) => {
                  const isSelected = selectedPersonnel.find(item => item.Personnel_ID === p.Personnel_ID);
                  return (
                    <div key={p.Personnel_ID} onClick={() => togglePersonnelSelection(p)} style={{ backgroundColor: isSelected ? "#fff7ed" : "white", border: `1px solid ${isSelected ? "#ed6e2b" : "#e2e8f0"}`, borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
                      {isSelected && <div style={{ position: "absolute", top: "8px", left: "8px", backgroundColor: "#ed6e2b", borderRadius: "50%", padding: "2px" }}><Check style={{ width: "14px", height: "14px", color: "white" }} /></div>}
                      <div style={{ width: "60px", height: "60px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#f1f5f9" }}>
                        {p.Personal_Image_Path ? <img src={p.Personal_Image_Path} alt={p.Full_Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle2 style={{ width: "100%", height: "100%", color: "#cbd5e1" }} />}
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{p.Full_Name}</p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>{p.Personnel_Code}</p>
                      </div>
                      <span style={{ fontSize: "11px", backgroundColor: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "6px", fontWeight: 600 }}>{translateRole(p.Role)}</span>
                    </div>
                  );
                })}
              </div>
              
              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setIsPersonnelModalOpen(false)} className="erp-btn-submit"><CheckCircle style={{ width: "18px", height: "18px" }} /> تایید و بستن</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (<div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, animation: 'slideUp 0.3s ease-out' }}><CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />{toast}</div>)}
    </div>
  );
}