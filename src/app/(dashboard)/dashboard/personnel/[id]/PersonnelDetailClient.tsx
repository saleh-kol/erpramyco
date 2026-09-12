"use client";

import type { CSSProperties } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { togglePersonnelStatus, reviewReportAction, reviewMissionAction, reviewProjectAction } from "@/actions/personnelDetails";
import {
  ArrowRight, Clock, MapPin, Briefcase, Power, CalendarClock, BarChart3, User,
  Calendar, TrendingUp, ClipboardList, Building2, Navigation, X, CheckCircle, Info, Save
} from "lucide-react";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const toPersianDate = (date: Date | string) => { if (!date) return "-"; const d = new Date(date); if (isNaN(d.getTime())) return "-"; return d.toLocaleDateString("fa-IR"); };
const toPersianTime = (timeStr: Date | string) => { if (!timeStr) return "-"; const d = new Date(timeStr); if (isNaN(d.getTime())) return "-"; return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }); };
const translateStatus = (status: string) => { const statuses: any = { "Draft": "پیش‌نویس", "Submitted": "ارسال شده", "Manager_Reviewed": "بررسی شده توسط مدیر", "Finance_Processed": "تسویه شده توسط مالی", "Rejected": "رد شده" }; return statuses[status] || status; };
const translateCommute = (status: string) => { const s: any = { "CompanyVehicle": "وسیله نقلیه شرکت", "PersonalVehicle": "وسیله نقلیه شخصی", "PublicTransport": "حمل و نقل عمومی", "None": "هیچ‌کدام", "Taxi": "تاکسی", "Other": "سایر" }; return s[status] || status || "-"; };
const formatToLocalISO = (dateObj: any) => { if (!dateObj) return ""; try { const date = dateObj instanceof Date ? dateObj : dateObj.toDate ? dateObj.toDate() : new Date(dateObj); if (isNaN(date.getTime())) return ""; return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; } catch (e) { return ""; } };

export default function PersonnelDetailClient({ data, searchParams }: { data: any; searchParams: any }) {
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);
  const [startDateVal, setStartDateVal] = useState<any>(null);
  const [endDateVal, setEndDateVal] = useState<any>(null);

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  const [modalScore, setModalScore] = useState<string>("100");
  const [modalComment, setModalComment] = useState<string>("");
  const [actionType, setActionType] = useState<string>("approve");

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setStartDateVal(searchParams.start ? new Date(`${searchParams.start}T00:00:00`) : null);
    setEndDateVal(searchParams.end ? new Date(`${searchParams.end}T00:00:00`) : null);
  }, [searchParams.start, searchParams.end]);

  const applyDateFilter = () => { const params = new URLSearchParams(); const s = formatToLocalISO(startDateVal); const e = formatToLocalISO(endDateVal); if (s) params.set("start", s); if (e) params.set("end", e); router.push(`?${params.toString()}`); };

  const openReportModal = (report: any) => { setSelectedReport(report); setModalScore(report.Manager_Score ? String(report.Manager_Score) : "100"); setModalComment(report.Manager_Comment || ""); setActionType(report.Report_Status === 'Rejected' ? 'reject' : 'approve'); };
  const openMissionModal = (mission: any) => { setSelectedMission(mission); setModalScore(mission.Manager_Score ? String(mission.Manager_Score) : "100"); setModalComment(mission.Manager_Comment || ""); setActionType(mission.Is_Approved ? 'approve' : 'reject'); };
  const openProjectModal = (project: any) => { setSelectedProject(project); setModalScore(project.PR_Projects?.Manager_Score ? String(project.PR_Projects.Manager_Score) : "100"); setModalComment(project.PR_Projects?.Manager_Comment || ""); setActionType(project.PR_Projects?.Manager_ID ? 'approve' : 'reject'); };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const formData = new FormData(e.currentTarget); formData.append('actionType', actionType); formData.append('currentPath', `/dashboard/personnel/${data.Personnel_ID}`); await reviewReportAction(formData); setSelectedReport(null); showToast("گزارش با موفقیت بررسی شد"); };
  const handleMissionSubmit = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const formData = new FormData(e.currentTarget); formData.append('actionType', actionType); formData.append('currentPath', `/dashboard/personnel/${data.Personnel_ID}`); await reviewMissionAction(formData); setSelectedMission(null); showToast("ماموریت با موفقیت بررسی شد"); };
  const handleProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const formData = new FormData(e.currentTarget); formData.append('actionType', actionType); formData.append('currentPath', `/dashboard/personnel/${data.Personnel_ID}`); await reviewProjectAction(formData); setSelectedProject(null); showToast("پروژه با موفقیت بررسی شد"); };

  const dailyReports = data.PR_Daily_Reports_PR_Daily_Reports_Personnel_IDToPersonnel || [];
  const commuteLogs = data.PR_Commute_Logs_PR_Commute_Logs_Personnel_IDToPersonnel || [];
  const projectAssignments = data.PR_Project_Assignments || [];
  const totalWorkHours = dailyReports.reduce((sum: number, r: any) => sum + (parseFloat(r.Work_Hours) || 0), 0);
  const chartData = dailyReports.map((r: any) => ({ name: toPersianDate(r.Report_Date), "ساعت کار": parseFloat(r.Work_Hours) || 0 })).reverse();

  const dateInputStyle: CSSProperties = { padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "inherit", width: "160px", textAlign: "center", boxShadow: "none" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .rmdp-wrapper { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; border-radius: 16px !important; }
        .rmdp-day.rmdp-today span { background: #ed6e2b !important; color: white !important; }
        .rmdp-selected span { background: #ed6e2b !important; color: white !important; }
        .box-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.3s ease; }
        .inner-box { background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
        .status-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #475569; }
        .table-row-box { background: white; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 8px; padding: 14px 16px; transition: all 0.2s; cursor: pointer; }
        .table-row-box:hover { background: #fffbf5; border-color: #fed7aa; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        .erp-modal-section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 16px 0; font-size: 14px; font-weight: bold; color: #334155; }
        .erp-modal-section-title::before { content: ''; width: 4px; height: 16px; background: #ed6e2b; border-radius: 2px; }
        .erp-data-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; transition: all 0.2s; }
        .erp-data-box:hover { border-color: #cbd5e1; background: #f8fafc; }
        .erp-data-label { font-size: 12px; color: #64748b; display: block; margin-bottom: 4px; }
        .erp-data-value { font-size: 14px; font-weight: 600; color: #0f172a; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; fontFamily: "inherit", backgroundColor: "#f8fafc", transition: "all 0.2s", boxSizing: "border-box"; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-btn-close { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .erp-btn-close:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
        .erp-btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(237, 110, 43, 0.2); transition: all 0.2s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* باکس ۱: هدر */}
      <div className="box-card" style={{ padding: "24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.push("/dashboard/personnel")} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px", cursor: "pointer", backgroundColor: "white" }}><ArrowRight style={{ width: "20px", height: "20px", color: "#64748b" }} /></button>
          <div style={{ width: "60px", height: "60px", borderRadius: "16px", overflow: "hidden", background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #ffedd5" }}>
            {data.Personal_Image_Path ? <img src={data.Personal_Image_Path} alt={data.Full_Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User style={{ width: "28px", height: "28px", color: "#ed6e2b" }} />}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold", color: "#0f172a" }}>{data.Full_Name}</h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
              {data.Personnel_Code} - {data.OrganizationalPosition?.Name || "بدون جایگاه"} {data.Unit?.Name ? `| ${data.Unit.Name}` : ""}
            </p>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "12px" }}>
          {/* دکمه ویرایش با استایل مشابه دکمه وضعیت (آبی رنگ) */}
          <button 
            onClick={() => router.push(`/dashboard/personnel/${data.Personnel_ID}/edit`)} 
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "1px solid #bfdbfe", cursor: "pointer", fontWeight: "bold", backgroundColor: "#eff6ff", color: "#1d4ed8" }}
          >
            <Save style={{ width: "18px", height: "18px" }} /> ویرایش اطلاعات
          </button>

          <form action={togglePersonnelStatus}>
            <input type="hidden" name="id" value={data.Personnel_ID} /><input type="hidden" name="isActive" value={data.IsActive ? "true" : "false"} />
            <button type="submit" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: `1px solid ${data.IsActive ? "#fecaca" : "#bbf7d0"}`, cursor: "pointer", fontWeight: "bold", backgroundColor: data.IsActive ? "#fef2f2" : "#f0fdf4", color: data.IsActive ? "#991b1b" : "#166534" }}>
              <Power style={{ width: "18px", height: "18px" }} />{data.IsActive ? "غیرفعال کردن" : "فعال کردن"}
            </button>
          </form>
        </div>
      </div>

      {/* باکس ۲: فیلتر تاریخ */}
      <div className="box-card" style={{ padding: "20px 24px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", padding: "12px", borderRadius: "14px", border: "1px solid #fed7aa" }}><CalendarClock style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
          <div><h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>فیلتر بازه زمانی</h3><p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>این فیلتر روی تمام اطلاعات صفحه اعمال می‌شود</p></div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
          <div><label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textAlign: "center" }}>از تاریخ</label>{isMounted ? <DatePicker value={startDateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setStartDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" style={dateInputStyle} disabled />}</div>
          <div style={{ height: "2px", width: "20px", backgroundColor: "#cbd5e1", marginBottom: "14px" }}></div>
          <div><label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textAlign: "center" }}>تا تاریخ</label>{isMounted ? <DatePicker value={endDateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setEndDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" style={dateInputStyle} disabled />}</div>
          <button onClick={applyDateFilter} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", height: "42px", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)" }}><TrendingUp style={{ width: "16px", height: "16px" }} />اعمال فیلتر</button>
        </div>
      </div>

      {/* باکس ۳ و ۴: مجموع + نمودار */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", marginBottom: "20px" }}>
        <div className="box-card" style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%)", border: "1px solid #fed7aa", padding: "28px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div style={{ background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", padding: "14px", borderRadius: "16px", marginBottom: "16px", boxShadow: "0 8px 16px -4px rgba(237, 110, 43, 0.3)" }}><CalendarClock style={{ width: "28px", height: "28px", color: "white" }} /></div>
          <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#c2410c", fontWeight: 600 }}>مجموع کارکرد در بازه انتخابی</p>
          <p style={{ margin: 0, fontSize: "36px", color: "#0f172a", fontWeight: "bold" }}>{totalWorkHours.toFixed(2)} <span style={{ fontSize: "16px", fontWeight: 500, color: "#64748b" }}>ساعت</span></p>
        </div>
        <div className="box-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}><div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><BarChart3 style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div><h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>نمودار کارکرد روزانه</h2></div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "inherit" }} stroke="#94a3b8" /><YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" /><Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #f1f5f9", fontFamily: "inherit", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} labelStyle={{ color: "#0f172a", fontWeight: "bold" }} /><Line type="monotone" dataKey="ساعت کار" stroke="#ed6e2b" strokeWidth={3} dot={{ fill: "#ed6e2b", r: 5, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7, strokeWidth: 3, stroke: "#fff" }} /></LineChart></ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* باکس ۵ و ۶: جدول فعالیت‌ها + پروژه‌ها/ماموریت‌ها */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        
        <div className="box-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><ClipboardList style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>فعالیت‌های انجام شده (برای بررسی کلیک کنید)</h2>
          </div>
          
          {dailyReports.length === 0 ? (
            <div className="inner-box" style={{ padding: "40px", textAlign: "center" }}>
              <Clock style={{ width: "40px", height: "40px", color: "#cbd5e1", marginBottom: "12px" }} />
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>فعالیتی در این بازه ثبت نشده است</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* گروه‌بندی فعالیت‌ها بر اساس روز */}
              {Object.entries(
                dailyReports.reduce((acc: any, r: any) => {
                  const date = toPersianDate(r.Report_Date);
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(r);
                  return acc;
                }, {})
              ).map(([date, reports]: any) => {
                const totalHours = reports.reduce((sum: number, r: any) => sum + (parseFloat(r.Work_Hours) || 0), 0);
                return (
                  <div key={date} style={{ border: "1px solid #f1f5f9", borderRadius: "12px", overflow: "hidden" }}>
                    {/* هدر روز و مجموع ساعت */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar style={{ width: "16px", height: "16px", color: "#ed6e2b" }} />
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{date}</span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#c2410c", backgroundColor: "#fff7ed", padding: "4px 10px", borderRadius: "6px" }}>
                        مجموع: {totalHours.toFixed(2)} ساعت
                      </span>
                    </div>
                    {/* لیست فعالیت‌های آن روز */}
                    <div style={{ padding: "8px 16px" }}>
                      {reports.map((r: any) => (
                        <div key={r.Report_ID} className="table-row-box" style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: "8px", alignItems: "center", margin: "4px 0", cursor: "pointer" }} onClick={() => openReportModal(r)}>
                          <span style={{ fontSize: "13px", color: "#334155" }}>{toPersianTime(r.Check_In)} تا {toPersianTime(r.Check_Out)}</span>
                          <span style={{ fontSize: "13px", color: "#334155", fontWeight: 600 }}>{r.PR_Work_Types?.Work_Type_Name || "نامشخص"}</span>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{r.PR_Work_Locations?.Location_Name || "-"}</span>
                          <span style={{ fontSize: "12px", fontWeight: "bold", color: (r.Manager_Score && r.Manager_Score > 7) ? "#ef4444" : "#64748b" }}>ضریب: {r.Manager_Score || "-"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="box-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}><div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><Building2 style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div><h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>پروژه‌ها (برای بررسی کلیک کنید)</h2></div>
            {projectAssignments.length === 0 ? (<div className="inner-box" style={{ padding: "24px", textAlign: "center" }}><Briefcase style={{ width: "32px", height: "32px", color: "#cbd5e1", marginBottom: "8px" }} /><p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>پروژه فعالی ندارد</p></div>) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {projectAssignments.map((pa: any) => (
                  <div key={pa.Assignment_ID} className="table-row-box" onClick={() => openProjectModal(pa)} style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px", marginTop: "2px", flexShrink: 0 }}><Briefcase style={{ width: "16px", height: "16px", color: "#ed6e2b" }} /></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "14px", color: "#0f172a" }}>{pa.PR_Projects?.Project_Name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ fontSize: "11px", color: "#64748b" }}>نقش:</span><span style={{ fontSize: "12px", color: "#334155", fontWeight: 600 }}>{pa.Role_In_Project || "نامشخص"}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="box-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}><div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><Navigation style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div><h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>ماموریت‌ها (برای بررسی کلیک کنید)</h2></div>
            {commuteLogs.length === 0 ? (<div className="inner-box" style={{ padding: "24px", textAlign: "center" }}><MapPin style={{ width: "32px", height: "32px", color: "#cbd5e1", marginBottom: "8px" }} /><p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>ماموریتی ندارد</p></div>) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {commuteLogs.map((c: any) => (
                  <div key={c.Commute_ID} className="table-row-box" onClick={() => openMissionModal(c)} style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px", marginTop: "2px", flexShrink: 0 }}><MapPin style={{ width: "16px", height: "16px", color: "#ed6e2b" }} /></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "14px", color: "#0f172a" }}>{toPersianDate(c.Commute_Date)}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}><span>{c.Origin}</span><ArrowRight style={{ width: "12px", height: "12px", color: "#ed6e2b" }} /><span>{c.Destination}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════ مودال بررسی گزارش ════════ */}
      {selectedReport && (
        <div className="erp-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Info style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div><h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>بررسی فعالیت روزانه</h2><p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>تاریخ: {toPersianDate(selectedReport.Report_Date)}</p></div>
              </div>
              <button className="erp-btn-close" onClick={() => setSelectedReport(null)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>
            <div className="erp-modal-body">
              <h3 className="erp-modal-section-title">اطلاعات ثبت شده توسط کاربر</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div className="erp-data-box"><span className="erp-data-label">ساعت شروع</span><span className="erp-data-value">{toPersianTime(selectedReport.Check_In) || "-"}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">ساعت پایان</span><span className="erp-data-value">{toPersianTime(selectedReport.Check_Out) || "-"}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">مدت زمان کار</span><span className="erp-data-value">{selectedReport.Work_Hours || 0} ساعت</span></div>
                <div className="erp-data-box"><span className="erp-data-label">نوع فعالیت</span><span className="erp-data-value">{selectedReport.PR_Work_Types?.Work_Type_Name || "-"}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">محل فعالیت</span><span className="erp-data-value">{selectedReport.PR_Work_Locations?.Location_Name || "-"}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">ضریب اهمیت کار</span><span className="erp-data-value">{selectedReport.Manager_Score || "-"}</span></div>
                <div className="erp-data-box" style={{ gridColumn: "1 / -1" }}><span className="erp-data-label">شرح کار انجام شده</span><span className="erp-data-value" style={{ fontWeight: 500, lineHeight: "1.6" }}>{selectedReport.Work_Description || "توضیحاتی ثبت نشده است."}</span></div>
              </div>
              
              <h3 className="erp-modal-section-title" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>بررسی و تایید توسط مدیر</h3>
              <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input type="hidden" name="reportId" value={selectedReport.Report_ID} />
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>امتیاز کار (۰ تا ۱۰۰)</label><input type="number" name="score" min="0" max="100" value={modalScore} onChange={(e) => setModalScore(e.target.value)} className="erp-input" /></div>
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>توضیحات / نظر مدیر</label><textarea name="comment" rows={3} value={modalComment} onChange={(e) => setModalComment(e.target.value)} className="erp-input" style={{ resize: "vertical" }} placeholder="در صورت نیاز توضیحات خود را وارد کنید..."></textarea></div>
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>وضعیت تایید گزارش</label><select value={actionType} onChange={(e) => setActionType(e.target.value)} className="erp-input"><option value="approve">تایید گزارش</option><option value="reject">رد کردن گزارش</option></select></div>
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px" }}><button type="submit" className="erp-btn-submit"><Save style={{ width: "18px", height: "18px" }} />ثبت تغییرات</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ════════ مودال بررسی ماموریت ════════ */}
      {selectedMission && (
        <div className="erp-modal-overlay" onClick={() => setSelectedMission(null)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div><h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>بررسی ماموریت</h2><p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>تاریخ: {toPersianDate(selectedMission.Commute_Date)}</p></div>
              </div>
              <button className="erp-btn-close" onClick={() => setSelectedMission(null)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>
            <div className="erp-modal-body">
              <h3 className="erp-modal-section-title">اطلاعات ماموریت</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div className="erp-data-box"><span className="erp-data-label">نوع وسیله نقلیه</span><span className="erp-data-value">{translateCommute(selectedMission.Commute_Type)}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">مسافت (کیلومتر)</span><span className="erp-data-value">{selectedMission.Distance_KM || 0}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">مبدا</span><span className="erp-data-value">{selectedMission.Origin || "-"}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">مقصد</span><span className="erp-data-value">{selectedMission.Destination || "-"}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">مبلغ هزینه</span><span className="erp-data-value">{Number(selectedMission.Amount || 0).toLocaleString('fa-IR')} ریال</span></div>
                <div className="erp-data-box"><span className="erp-data-label">شماره رسید</span><span className="erp-data-value">{selectedMission.Receipt_Number || "-"}</span></div>
              </div>
              
              <h3 className="erp-modal-section-title" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>بررسی و تایید توسط مدیر</h3>
              <form onSubmit={handleMissionSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input type="hidden" name="commuteId" value={selectedMission.Commute_ID} />
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>امتیاز (۰ تا ۱۰۰)</label><input type="number" name="score" min="0" max="100" value={modalScore} onChange={(e) => setModalScore(e.target.value)} className="erp-input" /></div>
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>نظر مدیر</label><textarea name="comment" rows={3} value={modalComment} onChange={(e) => setModalComment(e.target.value)} className="erp-input" style={{ resize: "vertical" }} placeholder="در صورت نیاز توضیحات خود را وارد کنید..."></textarea></div>
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>وضعیت تایید ماموریت</label><select value={actionType} onChange={(e) => setActionType(e.target.value)} className="erp-input"><option value="approve">تایید ماموریت</option><option value="reject">رد کردن ماموریت</option></select></div>
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px" }}><button type="submit" className="erp-btn-submit"><Save style={{ width: "18px", height: "18px" }} />ثبت تغییرات</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ════════ مودال بررسی پروژه ════════ */}
      {selectedProject && (
        <div className="erp-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Building2 style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div><h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>بررسی پروژه</h2><p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{selectedProject.PR_Projects?.Project_Name}</p></div>
              </div>
              <button className="erp-btn-close" onClick={() => setSelectedProject(null)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>
            <div className="erp-modal-body">
              <h3 className="erp-modal-section-title">اطلاعات پروژه و نقش کاربر</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div className="erp-data-box"><span className="erp-data-label">کد پروژه</span><span className="erp-data-value">{selectedProject.PR_Projects?.Project_Code || "-"}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">بودجه</span><span className="erp-data-value">{Number(selectedProject.PR_Projects?.Budget || 0).toLocaleString('fa-IR')} ریال</span></div>
                <div className="erp-data-box"><span className="erp-data-label">تاریخ شروع</span><span className="erp-data-value">{toPersianDate(selectedProject.PR_Projects?.Start_Date) || "-"}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">تاریخ پایان</span><span className="erp-data-value">{toPersianDate(selectedProject.PR_Projects?.End_Date) || "-"}</span></div>
                <div className="erp-data-box" style={{ gridColumn: "1 / -1", backgroundColor: "#fef3c7", borderColor: "#fde68a" }}>
                  <span className="erp-data-label" style={{ color: "#92400e" }}>نقش این کاربر در پروژه (غیرقابل ویرایش)</span>
                  <span className="erp-data-value" style={{ color: "#78350f", fontWeight: 700 }}>{selectedProject.Role_In_Project || "نقشی تعیین نشده است"}</span>
                </div>
                <div className="erp-data-box" style={{ gridColumn: "1 / -1" }}><span className="erp-data-label">شرح پروژه</span><span className="erp-data-value" style={{ fontWeight: 500, lineHeight: "1.6" }}>{selectedProject.PR_Projects?.Description || "توضیحاتی ثبت نشده است."}</span></div>
              </div>
              
              <h3 className="erp-modal-section-title" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>بررسی و تایید توسط مدیر</h3>
              <form onSubmit={handleProjectSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input type="hidden" name="projectId" value={selectedProject.PR_Projects?.Project_ID} />
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>امتیاز پروژه (۰ تا ۱۰۰)</label><input type="number" name="score" min="0" max="100" value={modalScore} onChange={(e) => setModalScore(e.target.value)} className="erp-input" /></div>
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>نظر مدیر</label><textarea name="comment" rows={3} value={modalComment} onChange={(e) => setModalComment(e.target.value)} className="erp-input" style={{ resize: "vertical" }} placeholder="در صورت نیاز توضیحات خود را وارد کنید..."></textarea></div>
                <div><label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>وضعیت تایید پروژه</label><select value={actionType} onChange={(e) => setActionType(e.target.value)} className="erp-input"><option value="approve">تایید پروژه</option><option value="reject">توقف / رد پروژه</option></select></div>
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px" }}><button type="submit" className="erp-btn-submit"><Save style={{ width: "18px", height: "18px" }} />ثبت تغییرات</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نوتیفیکیشن */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, animation: 'slideUp 0.3s ease-out' }}>
          <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />{toast}
        </div>
      )}

    </div>
  );
}