"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  togglePersonnelStatus,
  reviewReportAction,
  reviewMissionAction,
  reviewProjectAction,
} from "@/actions/personnelDetails";

import {
  ArrowRight, Clock, MapPin, Briefcase, Power, CalendarClock, BarChart3, User,
  TrendingUp, ClipboardList, Building2, Navigation, X, CheckCircle, Info, Save,
  Bell, ChevronDown, ChevronUp, Calculator,
} from "lucide-react";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const toPersianDate = (date: Date | string) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fa-IR");
};

const toPersianTime = (timeStr: Date | string) => {
  if (!timeStr) return "-";
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
};

const translateCommute = (status: string) => {
  const values: Record<string, string> = {
    CompanyVehicle: "وسیله نقلیه شرکت", PersonalVehicle: "وسیله نقلیه شخصی",
    PublicTransport: "حمل و نقل عمومی", None: "هیچ‌کدام", Taxi: "تاکسی", Other: "سایر",
  };
  return values[status] || status || "-";
};

const formatToLocalISO = (dateObj: any) => {
  if (!dateObj) return "";
  try {
    const date = dateObj instanceof Date ? dateObj : dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    if (isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  } catch { return ""; }
};

const getActualHours = (report: any) => {
  const checkIn = report?.Check_In ? new Date(report.Check_In) : null;
  const checkOut = report?.Check_Out ? new Date(report.Check_Out) : null;
  if (checkIn && checkOut && !isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
    let difference = checkOut.getTime() - checkIn.getTime();
    if (difference < 0) difference += 24 * 60 * 60 * 1000;
    const hours = difference / (1000 * 60 * 60);
    if (hours >= 0) return hours;
  }
  const storedHours = Number(report?.Work_Hours);
  return Number.isFinite(storedHours) ? storedHours : 0;
};

const getManagerScore = (report: any) => {
  const score = Number(report?.Manager_Score);
  if (!Number.isFinite(score)) return 100;
  return Math.min(100, Math.max(0, score));
};

// فرمول محاسبه ساعت موثر
const getEffectiveHours = (report: any) => {
  const actualHours = getActualHours(report);
  const managerScore = getManagerScore(report);
  return actualHours * (managerScore / 100);
};

const formatHoursAndMinutes = (hours: number) => {
  if (!Number.isFinite(hours) || hours <= 0) return "00:00";
  const totalMinutes = Math.round(hours * 60);
  const hourPart = Math.floor(totalMinutes / 60);
  const minutePart = totalMinutes % 60;
  return `${String(hourPart).padStart(2, "0")}:${String(minutePart).padStart(2, "0")}`;
};

const formatDecimalHours = (hours: number) => {
  if (!Number.isFinite(hours)) return "0.00";
  return hours.toFixed(2);
};

const getDateGroupKey = (report: any) => {
  if (!report?.Report_Date) return "unknown";
  const date = new Date(report.Report_Date);
  if (isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getStatusLabel = (report: any) => {
  if (report?.Report_Status === "Manager_Reviewed") return "تأیید شده";
  if (report?.Report_Status === "Rejected") return "رد شده";
  return "در انتظار بررسی";
};

const getStatusClass = (report: any) => {
  if (report?.Report_Status === "Manager_Reviewed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (report?.Report_Status === "Rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-orange-50 text-[#c6531c] border-orange-200";
};

export default function PersonnelDetailClient({ data, searchParams }: { data: any; searchParams: any }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [startDateVal, setStartDateVal] = useState<any>(null);
  const [endDateVal, setEndDateVal] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const [modalScore, setModalScore] = useState<string>("100");
  const [modalDifficulty, setModalDifficulty] = useState<string>("1");
  const [modalComment, setModalComment] = useState<string>("");
  const [actionType, setActionType] = useState<string>("approve");
  const [toast, setToast] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsMounted(true);
    setStartDateVal(searchParams.start ? new Date(`${searchParams.start}T00:00:00`) : null);
    setEndDateVal(searchParams.end ? new Date(`${searchParams.end}T00:00:00`) : null);
  }, [searchParams.start, searchParams.end]);

  const dailyReports = data.PR_Daily_Reports_PR_Daily_Reports_Personnel_IDToPersonnel || [];
  const commuteLogs = data.PR_Commute_Logs_PR_Commute_Logs_Personnel_IDToPersonnel || [];
  const projectAssignments = data.PR_Project_Assignments || [];
  const tasks = data.Tasks_AssignedTo || [];

  const groupedReports = useMemo(() => {
    const groups: Record<string, { key: string; label: string; reports: any[]; actualHours: number; effectiveHours: number; }> = {};
    dailyReports.forEach((report: any) => {
      const key = getDateGroupKey(report);
      if (!groups[key]) {
        groups[key] = { key, label: key === "unknown" ? "تاریخ نامشخص" : toPersianDate(report.Report_Date), reports: [], actualHours: 0, effectiveHours: 0 };
      }
      groups[key].reports.push(report);
      groups[key].actualHours += getActualHours(report);
      groups[key].effectiveHours += getEffectiveHours(report);
    });
    return Object.values(groups).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [dailyReports]);

  const totalActualHours = useMemo(() => dailyReports.reduce((sum: number, r: any) => sum + getActualHours(r), 0), [dailyReports]);
  const totalEffectiveHours = useMemo(() => dailyReports.reduce((sum: number, r: any) => sum + getEffectiveHours(r), 0), [dailyReports]);
  const chartData = useMemo(() => [...groupedReports].reverse().map((day) => ({ name: day.label, "ساعت موثر": Number(day.effectiveHours.toFixed(2)) })), [groupedReports]);

  const applyDateFilter = () => {
    const params = new URLSearchParams();
    const start = formatToLocalISO(startDateVal);
    const end = formatToLocalISO(endDateVal);
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    router.push(params.toString() ? `?${params.toString()}` : window.location.pathname);
  };

  const openReportModal = (report: any) => {
    setSelectedReport(report);
    setModalScore(report.Manager_Score !== null && report.Manager_Score !== undefined ? String(report.Manager_Score) : "100");
    setModalDifficulty(report.Difficulty !== null && report.Difficulty !== undefined ? String(report.Difficulty) : "1");
    setModalComment(report.Manager_Comment || "");
    setActionType(report.Report_Status === "Rejected" ? "reject" : "approve");
  };

  const openMissionModal = (mission: any) => {
    setSelectedMission(mission);
    setModalScore(mission.Manager_Score ? String(mission.Manager_Score) : "100");
    setModalComment(mission.Manager_Comment || "");
    setActionType(mission.Is_Approved ? "approve" : "reject");
  };

  const openProjectModal = (project: any) => {
    setSelectedProject(project);
    setModalScore(project.PR_Projects?.Manager_Score ? String(project.PR_Projects.Manager_Score) : "100");
    setModalComment(project.PR_Projects?.Manager_Comment || "");
    setActionType(project.PR_Projects?.Manager_ID ? "approve" : "reject");
  };

  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast(null), 3000); };

  // اصلاح خطای سینتکس تابع toggleDay
  const toggleDay = (key: string) => {
    setExpandedDays((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("actionType", actionType);
    formData.append("currentPath", `/dashboard/personnel/${data.Personnel_ID}`);
    await reviewReportAction(formData);
    setSelectedReport(null);
    showToast("گزارش با موفقیت بررسی شد");
  };

  const handleMissionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("actionType", actionType);
    formData.append("currentPath", `/dashboard/personnel/${data.Personnel_ID}`);
    await reviewMissionAction(formData);
    setSelectedMission(null);
    showToast("ماموریت با موفقیت بررسی شد");
  };

  const handleProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("actionType", actionType);
    formData.append("currentPath", `/dashboard/personnel/${data.Personnel_ID}`);
    await reviewProjectAction(formData);
    setSelectedProject(null);
    showToast("پروژه با موفقیت بررسی شد");
  };

  const dateInputStyle: CSSProperties = { padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "inherit", width: "160px", textAlign: "center", boxShadow: "none" };

  return (
    <div dir="rtl" style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .rmdp-wrapper { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; border-radius: 16px !important; }
        .rmdp-day.rmdp-today span { background: #ed6e2b !important; color: white !important; }
        .rmdp-selected span { background: #ed6e2b !important; color: white !important; }
        .box-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .day-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; transition: all 0.2s ease; }
        .day-card:hover { border-color: #fed7aa; }
        .activity-table-row { transition: background-color 0.2s ease; }
        .activity-table-row:hover { background: #fffaf5; }
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; }
        .erp-modal-body { padding: 24px; }
        .erp-modal-section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 16px 0; font-size: 14px; font-weight: bold; color: #334155; }
        .erp-modal-section-title::before { content: ''; width: 4px; height: 16px; background: #ed6e2b; border-radius: 2px; }
        .erp-data-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
        .erp-data-label { font-size: 12px; color: #64748b; display: block; margin-bottom: 4px; }
        .erp-data-value { font-size: 14px; font-weight: 600; color: #0f172a; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-btn-close { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; }
        .erp-btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(237, 110, 43, 0.2); }
        @media (max-width: 1000px) { .erp-main-grid { grid-template-columns: 1fr !important; } .erp-summary-chart { grid-template-columns: 1fr !important; } }
        @media (max-width: 700px) { .erp-page { padding: 12px !important; } .erp-header { flex-direction: column !important; align-items: stretch !important; } .erp-header-actions { flex-direction: column !important; } .erp-filter { flex-direction: column !important; align-items: stretch !important; } .erp-filter-fields { width: 100%; flex-wrap: wrap !important; } .erp-date-field { flex: 1; } .erp-date-field input { width: 100% !important; } .activity-desktop-table { display: none !important; } .activity-mobile { display: block !important; } }
        .activity-mobile { display: none; }
      `}</style>

      <div className="erp-page" style={{ maxWidth: "1500px", margin: "0 auto" }}>
        {/* Header */}
        <div className="box-card erp-header" style={{ padding: "24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => router.push("/dashboard/personnel")} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px", cursor: "pointer", backgroundColor: "white" }}>
              <ArrowRight style={{ width: "20px", height: "20px", color: "#64748b" }} />
            </button>
            <div style={{ width: "60px", height: "60px", borderRadius: "16px", overflow: "hidden", background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #ffedd5", flexShrink: 0 }}>
              {data.Personal_Image_Path ? <img src={data.Personal_Image_Path} alt={data.Full_Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User style={{ width: "28px", height: "28px", color: "#ed6e2b" }} />}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold", color: "#0f172a" }}>{data.Full_Name}</h1>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>{data.Personnel_Code} - {data.OrganizationalPosition?.Name || "بدون جایگاه"} {data.Unit?.Name ? ` | ${data.Unit.Name}` : ""}</p>
            </div>
          </div>
          <div className="erp-header-actions" style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => router.push(`/dashboard/personnel/${data.Personnel_ID}/edit`)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "1px solid #fed7aa", cursor: "pointer", fontWeight: "bold", backgroundColor: "#fff7ed", color: "#c6531c" }}>
              <Save style={{ width: "18px", height: "18px" }} /> ویرایش اطلاعات
            </button>
            <form action={togglePersonnelStatus}>
              <input type="hidden" name="id" value={data.Personnel_ID} />
              <input type="hidden" name="isActive" value={data.IsActive ? "true" : "false"} />
              <button type="submit" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: `1px solid ${data.IsActive ? "#fecaca" : "#bbf7d0"}`, cursor: "pointer", fontWeight: "bold", backgroundColor: data.IsActive ? "#fef2f2" : "#f0fdf4", color: data.IsActive ? "#991b1b" : "#166534" }}>
                <Power style={{ width: "18px", height: "18px" }} /> {data.IsActive ? "غیرفعال کردن" : "فعال کردن"}
              </button>
            </form>
          </div>
        </div>

        {/* Date Filter */}
        <div className="box-card erp-filter" style={{ padding: "20px 24px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", padding: "12px", borderRadius: "14px", border: "1px solid #fed7aa" }}>
              <CalendarClock style={{ width: "24px", height: "24px", color: "#ed6e2b" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>فیلتر بازه زمانی</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>این فیلتر روی تمام اطلاعات صفحه اعمال می‌شود</p>
            </div>
          </div>
          <div className="erp-filter-fields" style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
            <div className="erp-date-field">
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textAlign: "center" }}>از تاریخ</label>
              {isMounted ? <DatePicker value={startDateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setStartDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" style={dateInputStyle} disabled />}
            </div>
            <div style={{ height: "2px", width: "20px", backgroundColor: "#cbd5e1", marginBottom: "14px" }} />
            <div className="erp-date-field">
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px", textAlign: "center" }}>تا تاریخ</label>
              {isMounted ? <DatePicker value={endDateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setEndDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" style={dateInputStyle} disabled />}
            </div>
            <button onClick={applyDateFilter} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", height: "42px", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)" }}>
              <TrendingUp style={{ width: "16px", height: "16px" }} /> اعمال فیلتر
            </button>
          </div>
        </div>

        {/* Summary + Chart */}
        <div className="erp-summary-chart" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", marginBottom: "20px" }}>
          <div className="box-card" style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%)", border: "1px solid #fed7aa", padding: "28px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <div style={{ background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", padding: "14px", borderRadius: "16px", marginBottom: "16px", boxShadow: "0 8px 16px -4px rgba(237, 110, 43, 0.3)" }}>
              <Calculator style={{ width: "28px", height: "28px", color: "white" }} />
            </div>
            <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#c2410c", fontWeight: 600 }}>مجموع کارکرد موثر</p>
            <p style={{ margin: 0, fontSize: "36px", color: "#0f172a", fontWeight: "bold" }}>
              {formatDecimalHours(totalEffectiveHours)} <span style={{ fontSize: "16px", fontWeight: 500, color: "#64748b", marginRight: "5px" }}>ساعت</span>
            </p>
            <div style={{ marginTop: "12px", padding: "7px 12px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.7)", color: "#64748b", fontSize: "12px" }}>
              زمان واقعی: <strong>{formatHoursAndMinutes(totalActualHours)}</strong>
            </div>
          </div>
          <div className="box-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><BarChart3 style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>نمودار کارکرد روزانه موثر</h2>
                <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#94a3b8" }}>پس از اعمال ضریب مدیر</p>
              </div>
            </div>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "inherit" }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #f1f5f9", fontFamily: "inherit", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                  <Line type="monotone" dataKey="ساعت موثر" stroke="#ed6e2b" strokeWidth={3} dot={{ fill: "#ed6e2b", r: 5, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7, strokeWidth: 3, stroke: "#fff" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="erp-main-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          {/* Activity Table */}
          <div className="box-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><ClipboardList style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>فعالیت‌های انجام شده</h2>
                  <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#94a3b8" }}>برای بررسی هر فعالیت روی ردیف آن کلیک کنید</p>
                </div>
              </div>
              <div style={{ background: "#fff7ed", color: "#c6531c", border: "1px solid #fed7aa", padding: "6px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }}>{dailyReports.length} فعالیت</div>
            </div>

            {dailyReports.length === 0 ? (
              <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: "14px", padding: "50px 20px", textAlign: "center" }}>
                <Clock style={{ width: "40px", height: "40px", color: "#cbd5e1", margin: "0 auto 12px" }} />
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>فعالیتی در این بازه ثبت نشده است</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {groupedReports.map((day) => {
                  const isExpanded = expandedDays[day.key] !== false;
                  return (
                    <div key={day.key} className="day-card">
                      <button type="button" onClick={() => toggleDay(day.key)} style={{ width: "100%", border: "none", background: isExpanded ? "#fffaf5" : "white", padding: "16px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#fff7ed", color: "#ed6e2b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <CalendarClock style={{ width: "18px", height: "18px" }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: "bold", color: "#0f172a", fontSize: "14px" }}>{day.label}</div>
                            <div style={{ marginTop: "3px", fontSize: "11px", color: "#64748b" }}>{day.reports.length} فعالیت</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>موثر:</span>
                            <strong style={{ color: "#c6531c", fontSize: "13px" }}>{formatHoursAndMinutes(day.effectiveHours)}</strong>
                          </div>
                          {isExpanded ? <ChevronUp style={{ width: "18px", height: "18px", color: "#94a3b8" }} /> : <ChevronDown style={{ width: "18px", height: "18px", color: "#94a3b8" }} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <>
                          <div className="activity-desktop-table" style={{ overflowX: "auto", borderTop: "1px solid #f1f5f9" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px" }}>
                              <thead>
                                <tr style={{ background: "#f8fafc" }}>
                                  <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>نوع فعالیت</th>
                                  <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>شروع</th>
                                  <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>پایان</th>
                                  <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>زمان واقعی</th>
                                  <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>ضریب مدیر</th>
                                  <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>ساعت موثر</th>
                                  <th style={{ padding: "12px 14px", textAlign: "right", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>وضعیت</th>
                                </tr>
                              </thead>
                              <tbody>
                                {day.reports.map((report: any) => {
                                  const actual = getActualHours(report);
                                  const effective = getEffectiveHours(report);
                                  const score = getManagerScore(report);
                                  return (
                                    <tr key={report.Report_ID} className="activity-table-row" onClick={() => openReportModal(report)} style={{ cursor: "pointer", borderTop: "1px solid #f1f5f9" }}>
                                      <td style={{ padding: "14px" }}>
                                        <div style={{ fontWeight: "bold", fontSize: "13px", color: "#334155" }}>{report.PR_Work_Types?.Work_Type_Name || "نامشخص"}</div>
                                        {report.PR_Work_Locations?.Location_Name && <div style={{ marginTop: "4px", fontSize: "10px", color: "#94a3b8" }}>{report.PR_Work_Locations.Location_Name}</div>}
                                      </td>
                                      <td style={{ padding: "14px", fontSize: "12px", color: "#475569", whiteSpace: "nowrap" }}>{toPersianTime(report.Check_In)}</td>
                                      <td style={{ padding: "14px", fontSize: "12px", color: "#475569", whiteSpace: "nowrap" }}>{toPersianTime(report.Check_Out)}</td>
                                      <td style={{ padding: "14px" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 8px", borderRadius: "7px", background: "#f1f5f9", color: "#475569", fontSize: "11px", fontWeight: 700 }}>{formatHoursAndMinutes(actual)}</span>
                                      </td>
                                      <td style={{ padding: "14px" }}>
                                        <span style={{ display: "inline-flex", padding: "5px 9px", borderRadius: "7px", background: score < 100 ? "#fff7ed" : "#f0fdf4", color: score < 100 ? "#c6531c" : "#15803d", border: `1px solid ${score < 100 ? "#fed7aa" : "#bbf7d0"}`, fontSize: "11px", fontWeight: 800 }}>{score}٪</span>
                                      </td>
                                      <td style={{ padding: "14px" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                          <strong style={{ color: "#ed6e2b", fontSize: "13px" }}>{formatDecimalHours(effective)} ساعت</strong>
                                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>({formatHoursAndMinutes(effective)})</span>
                                        </div>
                                      </td>
                                      <td style={{ padding: "14px" }}>
                                        <span style={{ display: "inline-flex", padding: "5px 8px", borderRadius: "7px", border: `1px solid ${getStatusClass(report).includes("emerald") ? "#bbf7d0" : getStatusClass(report).includes("red") ? "#fecaca" : "#fed7aa"}`, background: getStatusClass(report).includes("emerald") ? "#f0fdf4" : getStatusClass(report).includes("red") ? "#fef2f2" : "#fff7ed", color: getStatusClass(report).includes("emerald") ? "#15803d" : getStatusClass(report).includes("red") ? "#b91c1c" : "#c6531c", fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap" }}>{getStatusLabel(report)}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr style={{ background: "#fffaf5", borderTop: "1px solid #fed7aa" }}>
                                  <td colSpan={3} style={{ padding: "13px 14px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>جمع این روز</td>
                                  <td style={{ padding: "13px 14px", fontSize: "12px", fontWeight: 800, color: "#475569" }}>{formatHoursAndMinutes(day.actualHours)}</td>
                                  <td />
                                  <td style={{ padding: "13px 14px", fontSize: "13px", fontWeight: 900, color: "#ed6e2b" }}>{formatDecimalHours(day.effectiveHours)} ساعت</td>
                                  <td />
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          <div className="activity-mobile" style={{ borderTop: "1px solid #f1f5f9" }}>
                            {day.reports.map((report: any) => {
                              const actual = getActualHours(report);
                              const effective = getEffectiveHours(report);
                              const score = getManagerScore(report);
                              return (
                                <button key={report.Report_ID} type="button" onClick={() => openReportModal(report)} style={{ width: "100%", border: "none", borderBottom: "1px solid #f1f5f9", background: "white", padding: "16px", textAlign: "right" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
                                    <strong style={{ fontSize: "13px", color: "#334155" }}>{report.PR_Work_Types?.Work_Type_Name || "نامشخص"}</strong>
                                    <span style={{ fontSize: "10px", padding: "4px 7px", borderRadius: "6px", background: score < 100 ? "#fff7ed" : "#f0fdf4", color: score < 100 ? "#c6531c" : "#15803d", fontWeight: 800 }}>ضریب {score}٪</span>
                                  </div>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                    <div style={{ background: "#f8fafc", borderRadius: "9px", padding: "9px" }}>
                                      <small style={{ color: "#94a3b8", display: "block", fontSize: "10px" }}>زمان</small>
                                      <strong style={{ color: "#475569", fontSize: "12px" }}>{toPersianTime(report.Check_In)} تا {toPersianTime(report.Check_Out)}</strong>
                                    </div>
                                    <div style={{ background: "#fff7ed", borderRadius: "9px", padding: "9px" }}>
                                      <small style={{ color: "#c6531c", display: "block", fontSize: "10px" }}>ساعت موثر</small>
                                      <strong style={{ color: "#ed6e2b", fontSize: "13px" }}>{formatDecimalHours(effective)} ساعت</strong>
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "9px", fontSize: "10px", color: "#94a3b8" }}>
                                    <span>زمان واقعی: {formatHoursAndMinutes(actual)}</span>
                                    <span>{getStatusLabel(report)}</span>
                                  </div>
                                </button>
                              );
                            })}
                            <div style={{ background: "#fffaf5", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #fed7aa" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>جمع روز</span>
                              <strong style={{ fontSize: "14px", color: "#ed6e2b" }}>{formatDecimalHours(day.effectiveHours)} ساعت</strong>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {dailyReports.length > 0 && (
              <div style={{ marginTop: "16px", padding: "16px", borderRadius: "14px", background: "linear-gradient(135deg, #fff7ed, #ffedd5)", border: "1px solid #fed7aa", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#9a3412", marginBottom: "4px" }}>مجموع زمان واقعی</div>
                  <strong style={{ fontSize: "16px", color: "#334155" }}>{formatHoursAndMinutes(totalActualHours)}</strong>
                </div>
                <div style={{ height: "35px", width: "1px", background: "#fed7aa" }} />
                <div>
                  <div style={{ fontSize: "11px", color: "#9a3412", marginBottom: "4px" }}>مجموع ساعت موثر پس از ضریب مدیر</div>
                  <strong style={{ fontSize: "20px", color: "#ed6e2b" }}>{formatDecimalHours(totalEffectiveHours)} ساعت</strong>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Tasks */}
            <div className="box-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><Bell style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>ابلاغیه‌های اخیر</h2>
              </div>
              {tasks.length === 0 ? (
                <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
                  <Bell style={{ width: "32px", height: "32px", color: "#cbd5e1", margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>ابلاغیه‌ای ندارد</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {tasks.map((task: any) => (
                    <div key={task.Task_ID} style={{ padding: "13px", border: "1px solid #f1f5f9", borderRadius: "11px", background: "#fff" }}>
                      <p style={{ margin: "0 0 5px", fontWeight: "bold", fontSize: "13px", color: "#0f172a" }}>{task.Title}</p>
                      <span style={{ fontSize: "11px", color: task.Status === "Approved" ? "#16a34a" : task.Status === "Submitted" ? "#c6531c" : "#64748b" }}>
                        وضعیت: {task.Status === "Approved" ? "تأیید شده" : task.Status === "Submitted" ? "در انتظار تأیید" : "در حال انجام"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="box-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><Building2 style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>پروژه‌ها</h2>
              </div>
              {projectAssignments.length === 0 ? (
                <div style={{ background: "#f8fafc", padding: "24px", textAlign: "center", borderRadius: "12px" }}>
                  <Briefcase style={{ width: "32px", height: "32px", color: "#cbd5e1", margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>پروژه فعالی ندارد</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {projectAssignments.map((assignment: any) => (
                    <button key={assignment.Assignment_ID} type="button" onClick={() => openProjectModal(assignment)} style={{ border: "1px solid #f1f5f9", background: "white", borderRadius: "11px", padding: "13px", textAlign: "right", cursor: "pointer" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "9px" }}><Briefcase style={{ width: "16px", height: "16px", color: "#ed6e2b" }} /></div>
                        <div>
                          <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "13px", color: "#0f172a" }}>{assignment.PR_Projects?.Project_Name}</p>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>نقش: {assignment.Role_In_Project || "نامشخص"}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Missions */}
            <div className="box-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><Navigation style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>ماموریت‌ها</h2>
              </div>
              {commuteLogs.length === 0 ? (
                <div style={{ background: "#f8fafc", padding: "24px", textAlign: "center", borderRadius: "12px" }}>
                  <MapPin style={{ width: "32px", height: "32px", color: "#cbd5e1", margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>ماموریتی ندارد</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {commuteLogs.map((commute: any) => (
                    <button key={commute.Commute_ID} type="button" onClick={() => openMissionModal(commute)} style={{ border: "1px solid #f1f5f9", background: "white", borderRadius: "11px", padding: "13px", textAlign: "right", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "9px" }}><MapPin style={{ width: "16px", height: "16px", color: "#ed6e2b" }} /></div>
                        <div>
                          <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "13px", color: "#0f172a" }}>{toPersianDate(commute.Commute_Date)}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#64748b" }}>
                            <span>{commute.Origin}</span>
                            <ArrowRight style={{ width: "12px", height: "12px", color: "#ed6e2b" }} />
                            <span>{commute.Destination}</span>
                          </div>
                          {commute.Transport_Type && <div style={{ marginTop: "5px", fontSize: "10px", color: "#94a3b8" }}>{translateCommute(commute.Transport_Type)}</div>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div className="erp-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Info style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>بررسی فعالیت روزانه</h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>تاریخ: {toPersianDate(selectedReport.Report_Date)}</p>
                </div>
              </div>
              <button className="erp-btn-close" type="button" onClick={() => setSelectedReport(null)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>
            <div className="erp-modal-body">
              <h3 className="erp-modal-section-title">اطلاعات ثبت شده توسط کاربر</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div className="erp-data-box"><span className="erp-data-label">ساعت شروع</span><span className="erp-data-value">{toPersianTime(selectedReport.Check_In)}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">ساعت پایان</span><span className="erp-data-value">{toPersianTime(selectedReport.Check_Out)}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">زمان واقعی محاسبه‌شده</span><span className="erp-data-value" style={{ color: "#ed6e2b" }}>{formatHoursAndMinutes(getActualHours(selectedReport))}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">ضریب فعلی مدیر</span><span className="erp-data-value">{getManagerScore(selectedReport)}٪</span></div>
                <div className="erp-data-box"><span className="erp-data-label">ساعت موثر فعلی</span><span className="erp-data-value" style={{ color: "#ed6e2b" }}>{formatDecimalHours(getEffectiveHours(selectedReport))} ساعت</span></div>
                <div className="erp-data-box"><span className="erp-data-label">نوع فعالیت</span><span className="erp-data-value">{selectedReport.PR_Work_Types?.Work_Type_Name || "-"}</span></div>
                <div className="erp-data-box" style={{ gridColumn: "1 / -1" }}><span className="erp-data-label">محل فعالیت</span><span className="erp-data-value">{selectedReport.PR_Work_Locations?.Location_Name || "-"}</span></div>
                <div className="erp-data-box" style={{ gridColumn: "1 / -1" }}><span className="erp-data-label">شرح کار انجام شده</span><span className="erp-data-value" style={{ fontWeight: 500, lineHeight: "1.8" }}>{selectedReport.Work_Description || "توضیحاتی ثبت نشده است."}</span></div>
              </div>

              <h3 className="erp-modal-section-title" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>بررسی و تأیید توسط مدیر</h3>
              <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input type="hidden" name="reportId" value={selectedReport.Report_ID} />
                
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>ضریب سختی کار</label>
                  <input type="number" name="difficulty" min="1" max="10" value={modalDifficulty} onChange={(e) => setModalDifficulty(e.target.value)} className="erp-input" />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>ضریب تأیید مدیر (۰ تا ۱۰۰)</label>
                  <input type="number" name="score" min="0" max="100" value={modalScore} onChange={(e) => setModalScore(e.target.value)} className="erp-input" />
                  <div style={{ marginTop: "8px", padding: "10px 12px", borderRadius: "10px", background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", fontSize: "12px" }}>
                    ساعت واقعی: <strong>{formatHoursAndMinutes(getActualHours(selectedReport))}</strong>
                    <span style={{ margin: "0 7px" }}>×</span>
                    ضریب <strong>{modalScore || 0}٪</strong>
                    <span style={{ margin: "0 7px" }}>=</span>
                    <strong style={{ color: "#ed6e2b" }}>{formatDecimalHours(getActualHours(selectedReport) * (Math.min(100, Math.max(0, Number(modalScore) || 0)) / 100))} ساعت موثر</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>توضیحات / نظر مدیر</label>
                  <textarea name="comment" rows={3} value={modalComment} onChange={(e) => setModalComment(e.target.value)} className="erp-input" style={{ resize: "vertical" }} placeholder="در صورت نیاز توضیحات خود را وارد کنید..."></textarea>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>وضعیت گزارش</label>
                  <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="erp-input">
                    <option value="approve">تأیید گزارش</option>
                    <option value="reject">رد کردن گزارش</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px" }}>
                  <button type="submit" className="erp-btn-submit"><Save style={{ width: "18px", height: "18px" }} /> ثبت تغییرات</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mission Modal */}
      {selectedMission && (
        <div className="erp-modal-overlay" onClick={() => setSelectedMission(null)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>بررسی ماموریت</h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{toPersianDate(selectedMission.Commute_Date)}</p>
                </div>
              </div>
              <button type="button" className="erp-btn-close" onClick={() => setSelectedMission(null)}><X /></button>
            </div>
            <div className="erp-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="erp-data-box"><span className="erp-data-label">مبدا</span><span className="erp-data-value">{selectedMission.Origin || "-"}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">مقصد</span><span className="erp-data-value">{selectedMission.Destination || "-"}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">وسیله نقلیه</span><span className="erp-data-value">{translateCommute(selectedMission.Transport_Type)}</span></div>
                <div className="erp-data-box"><span className="erp-data-label">تاریخ</span><span className="erp-data-value">{toPersianDate(selectedMission.Commute_Date)}</span></div>
              </div>
              <form onSubmit={handleMissionSubmit} style={{ marginTop: "24px" }}>
                <input type="hidden" name="commuteId" value={selectedMission.Commute_ID} />
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>ضریب تأیید مدیر</label>
                    <input type="number" name="score" min="0" max="100" value={modalScore} onChange={(e) => setModalScore(e.target.value)} className="erp-input" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>توضیحات مدیر</label>
                    <textarea name="comment" rows={3} value={modalComment} onChange={(e) => setModalComment(e.target.value)} className="erp-input" />
                  </div>
                  <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="erp-input">
                    <option value="approve">تأیید ماموریت</option>
                    <option value="reject">رد ماموریت</option>
                  </select>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="erp-btn-submit"><Save /> ثبت بررسی</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {selectedProject && (
        <div className="erp-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Briefcase style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>بررسی پروژه</h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{selectedProject.PR_Projects?.Project_Name || "-"}</p>
                </div>
              </div>
              <button type="button" className="erp-btn-close" onClick={() => setSelectedProject(null)}><X /></button>
            </div>
            <div className="erp-modal-body">
              <div className="erp-data-box"><span className="erp-data-label">نام پروژه</span><span className="erp-data-value">{selectedProject.PR_Projects?.Project_Name || "-"}</span></div>
              <div style={{ marginTop: "14px" }} className="erp-data-box"><span className="erp-data-label">نقش در پروژه</span><span className="erp-data-value">{selectedProject.Role_In_Project || "نامشخص"}</span></div>
              <form onSubmit={handleProjectSubmit} style={{ marginTop: "24px" }}>
                <input type="hidden" name="assignmentId" value={selectedProject.Assignment_ID} />
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>ضریب تأیید مدیر</label>
                    <input type="number" name="score" min="0" max="100" value={modalScore} onChange={(e) => setModalScore(e.target.value)} className="erp-input" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>توضیحات مدیر</label>
                    <textarea name="comment" rows={3} value={modalComment} onChange={(e) => setModalComment(e.target.value)} className="erp-input" />
                  </div>
                  <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="erp-input">
                    <option value="approve">تأیید پروژه</option>
                    <option value="reject">رد پروژه</option>
                  </select>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="erp-btn-submit"><Save /> ثبت بررسی</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#0f172a", color: "white", padding: "12px 24px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)", zIndex: 100, display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500 }}>
          <CheckCircle style={{ width: "20px", height: "20px", color: "#10b981" }} />
          {toast}
        </div>
      )}
    </div>
  );
}