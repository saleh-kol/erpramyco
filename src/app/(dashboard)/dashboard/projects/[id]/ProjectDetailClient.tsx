"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateProjectAction, deleteProjectAction } from "@/actions/projectDetails";
import {
  ArrowRight, Save, CheckCircle, Trash2, AlertTriangle, X, Briefcase, Users, Crown, ChevronDown, ChevronUp, Layers, Award, TrendingUp, UserCircle2, Calendar, Wallet, Info
} from "lucide-react";

const toPersianDate = (date: Date | string) => { if (!date) return "-"; const d = new Date(date); if (isNaN(d.getTime())) return "-"; return d.toLocaleDateString("fa-IR"); };
const translateRole = (role: string) => { return role?.replace(/_/g, ' ') || "-"; };

export default function ProjectDetailClient({ data }: { data: any }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // استیت‌های قابل ویرایش توسط مدیر
  const [openPhaseId, setOpenPhaseId] = useState<number | null>(null);
  const [liveManagerScore, setLiveManagerScore] = useState<number>(data.Manager_Score || 100);
  const [liveStatus, setLiveStatus] = useState<string>(data.Status || "Active");
  const [liveComment, setLiveComment] = useState<string>(data.Manager_Comment || "");

  // تابع محاسبه پاداش نهایی هر فرد (زنده)
  const calculateBonus = (member: any) => {
    const baseWage = Number(member.Personnel_Wage || 0);
    let calculatedBonus = baseWage;
    let reason = "دستمزد پایه";

    // ۱. محاسبه پاداش/جریمه زمانی (فقط اگر مدیر وضعیت را روی اتمام یافته بگذارد)
    if (liveStatus === 'Completed' && data.End_Date) {
      const endDate = new Date(data.End_Date).getTime();
      const goldenDate = data.Golden_Date ? new Date(data.Golden_Date).getTime() : null;
      const deadlineDate = data.Deadline_Date ? new Date(data.Deadline_Date).getTime() : null;

      if (goldenDate && endDate <= goldenDate) {
        const bonusPercent = Number(data.Golden_Bonus_Percent || 0) / 100;
        calculatedBonus = baseWage + (baseWage * bonusPercent);
        reason = `پاداش طلایی (+${data.Golden_Bonus_Percent}%)`;
      } else if (deadlineDate && endDate > deadlineDate) {
        const penaltyPercent = Number(data.Delay_Penalty_Percent || 0) / 100;
        calculatedBonus = baseWage - (baseWage * penaltyPercent);
        reason = `جریمه دیرکرد (-${data.Delay_Penalty_Percent}%)`;
      } else {
        reason = "تحویل در زمان عادی";
      }
    }

    // ۲. اعمال ضریب رضایت مدیر
    const managerScore = Number(liveManagerScore || 100) / 100;
    const finalBonus = calculatedBonus * managerScore;

    return { finalBonus: Math.round(finalBonus), reason: `${reason} × ضریب مدیر (${liveManagerScore}%)` };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('projectId', String(data.Project_ID));
    formData.append('managerScore', String(liveManagerScore));
    formData.append('status', liveStatus);
    formData.append('managerComment', liveComment);

    await updateProjectAction(formData);
    setToast("تغییرات با موفقیت ذخیره شد");
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result: any = await deleteProjectAction(formData);
    if (result?.success) {
      setShowDeleteModal(false); setToast("پروژه با موفقیت حذف شد"); 
      setTimeout(() => { router.push("/dashboard/projects"); }, 2000);
    } else {
      setShowDeleteModal(false); setToast(result?.error || "خطا در حذف پروژه"); setTimeout(() => setToast(null), 5000);
    }
  };

  const cardStyle: React.CSSProperties = { backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
  const headerStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontSize: "16px", fontWeight: "bold", color: "#0f172a" };
  const dataBoxStyle: React.CSSProperties = { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" };
  const valueStyle: React.CSSProperties = { fontSize: "14px", fontWeight: 600, color: "#0f172a" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "white", boxSizing: "border-box", transition: "all 0.2s" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 500px; border-top: 4px solid #ef4444; animation: scaleIn 0.2s ease-out; }
        .erp-input:focus { border-color: #ed6e2b; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(237, 110, 43, 0.2); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر صفحه */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.push("/dashboard/projects")} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px", cursor: "pointer", backgroundColor: "white" }}>
            <ArrowRight style={{ width: "20px", height: "20px", color: "#64748b" }} />
          </button>
          <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Briefcase style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{data.Project_Name}</h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{data.Project_Code} | 👑 مسئول: {data.Project_Leader?.Full_Name || "-"}</p>
          </div>
        </div>
        <button onClick={() => setShowDeleteModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", border: "1px solid #fecaca", cursor: "pointer", fontWeight: "bold", backgroundColor: "#fef2f2", color: "#991b1b" }}>
          <Trash2 style={{ width: "18px", height: "18px" }} /> حذف
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", alignItems: "start" }}>
        
        {/* ستون راست: اطلاعات ثابت پروژه و فازها */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* اطلاعات پایه پروژه (فقط خواندنی) */}
          <div style={cardStyle}>
            <h2 style={{ ...headerStyle, marginBottom: "20px" }}><div style={{ width: "4px", height: "20px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div> اطلاعات پروژه</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div style={dataBoxStyle}><span style={labelStyle}>کد پروژه</span><span style={valueStyle}>{data.Project_Code}</span></div>
              <div style={dataBoxStyle}><span style={labelStyle}>بودجه کل</span><span style={valueStyle}>{Number(data.Budget || 0).toLocaleString('fa-IR')} ریال</span></div>
            </div>
            <div style={{ ...dataBoxStyle, marginBottom: "12px" }}>
              <span style={labelStyle}>شرح پروژه</span>
              <span style={{ ...valueStyle, fontWeight: 400, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{data.Description || "توضیحاتی ثبت نشده است."}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              <div style={dataBoxStyle}><span style={labelStyle}><Calendar style={{ width: "12px", height: "12px", display: "inline", marginLeft: "2px" }} />شروع</span><span style={valueStyle}>{toPersianDate(data.Start_Date)}</span></div>
              <div style={dataBoxStyle}><span style={labelStyle}><Calendar style={{ width: "12px", height: "12px", display: "inline", marginLeft: "2px" }} />پایان</span><span style={valueStyle}>{toPersianDate(data.End_Date)}</span></div>
              <div style={{ ...dataBoxStyle, backgroundColor: "#fffbeb", borderColor: "#fde68a" }}><span style={{ ...labelStyle, color: "#d97706" }}><Award style={{ width: "12px", height: "12px", display: "inline", marginLeft: "2px" }} />طلایی</span><span style={{ ...valueStyle, color: "#92400e" }}>{toPersianDate(data.Golden_Date)}</span></div>
              <div style={{ ...dataBoxStyle, backgroundColor: "#fef2f2", borderColor: "#fecaca" }}><span style={{ ...labelStyle, color: "#ef4444" }}><Calendar style={{ width: "12px", height: "12px", display: "inline", marginLeft: "2px" }} />دیرکرد</span><span style={{ ...valueStyle, color: "#991b1b" }}>{toPersianDate(data.Deadline_Date)}</span></div>
            </div>
          </div>

          {/* فازهای پروژه (آکاردئون) */}
          <div style={cardStyle}>
            <h2 style={headerStyle}><div style={{ width: "4px", height: "20px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div> فازهای پروژه ({data.PR_Project_Phases?.length || 0})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.PR_Project_Phases?.map((phase: any) => {
                const isOpen = openPhaseId === phase.Phase_ID;
                const leader = phase.PR_Phase_Assignments?.find((a: any) => a.Is_Leader)?.Personnel;
                return (
                  <div key={phase.Phase_ID} style={{ border: `1px solid ${isOpen ? "#ed6e2b" : "#e2e8f0"}`, borderRadius: "12px", overflow: "hidden", transition: "all 0.2s" }}>
                    <button type="button" onClick={() => setOpenPhaseId(isOpen ? null : phase.Phase_ID)} style={{ width: "100%", padding: "14px 16px", backgroundColor: isOpen ? "#fff7ed" : "white", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Layers style={{ width: "18px", height: "18px", color: "#ed6e2b" }} />
                        <div>
                          <span style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{phase.Title}</span>
                          <span style={{ fontSize: "12px", color: "#64748b", marginRight: "8px" }}>| {toPersianDate(phase.Start_Date)} تا {toPersianDate(phase.End_Date)}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px", backgroundColor: phase.Status === 'Approved' ? "#dcfce7" : phase.Status === 'Submitted' ? "#eff6ff" : "#f1f5f9", color: phase.Status === 'Approved' ? "#166534" : phase.Status === 'Submitted' ? "#1d4ed8" : "#64748b", fontWeight: "bold" }}>
                          {phase.Status === 'Approved' ? "تایید شده" : phase.Status === 'Submitted' ? "در انتظار تایید" : phase.Status === 'Rejected' ? "رد شده" : "در حال انجام"}
                        </span>
                        {isOpen ? <ChevronUp style={{ width: "18px", height: "18px", color: "#64748b" }} /> : <ChevronDown style={{ width: "18px", height: "18px", color: "#64748b" }} />}
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "16px", borderTop: "1px solid #f1f5f9" }}>
                        {leader && (
                          <div style={{ marginBottom: "12px", backgroundColor: "#fef3c7", padding: "8px 12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Crown style={{ width: "14px", height: "14px", color: "#d97706" }} />
                            <span style={{ fontSize: "13px", fontWeight: "bold", color: "#92400e" }}>مسئول فاز: {leader.Full_Name}</span>
                          </div>
                        )}
                        <p style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", color: "#475569" }}>اعضای این فاز:</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {phase.PR_Phase_Assignments?.map((pa: any) => (
                            <div key={pa.Assignment_ID} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f8fafc", padding: "8px 10px", borderRadius: "8px" }}>
                              <UserCircle2 style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
                              <span style={{ fontSize: "13px", color: "#334155" }}>{pa.Personnel?.Full_Name}</span>
                              {pa.Is_Leader && <span style={{ fontSize: "10px", color: "#d97706", fontWeight: "bold" }}>(مسئول)</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {data.PR_Project_Phases?.length === 0 && <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center" }}>فازی برای این پروژه ثبت نشده است</p>}
            </div>
          </div>
        </div>

        {/* ستون چپ: فرم ارزیابی مدیر و پاداش تیم */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ ...cardStyle, border: "2px solid #ed6e2b" }}>
            <h2 style={headerStyle}><div style={{ width: "4px", height: "20px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div> ارزیابی و تایید مدیرعامل</h2>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>وضعیت پروژه</label>
              <select value={liveStatus} onChange={(e) => setLiveStatus(e.target.value)} className="erp-input" style={inputStyle}>
                <option value="Active">در حال انجام</option>
                <option value="Completed">اتمام یافته</option>
                <option value="OnHold">در انتظار تایید</option>
                <option value="Cancelled">لغو شده</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>ضریب رضایت مدیر (۰ تا ۱۰۰)</label>
              <input type="number" min="0" max="100" value={liveManagerScore} onChange={(e) => setLiveManagerScore(Number(e.target.value))} className="erp-input" style={inputStyle} placeholder="مثلاً 90" />
              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#ef4444" }}>⚠️ هر واحد کاهش، ۱٪ از پاداش تمام اعضا کسر می‌کند.</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>نظر مدیرعامل</label>
              <textarea value={liveComment} onChange={(e) => setLiveComment(e.target.value)} rows={3} className="erp-input" style={{ ...inputStyle, resize: "vertical" }} placeholder="نظر خود را وارد کنید..."></textarea>
            </div>

            <button type="submit" className="erp-btn-submit" style={{ width: "100%", justifyContent: "center" }}>
              <Save style={{ width: "18px", height: "18px" }} /> ثبت نهایی ارزیابی
            </button>
          </div>

          {/* باکس اعضای پروژه و محاسبه پاداش زنده */}
          <div style={cardStyle}>
            <h2 style={headerStyle}><div style={{ width: "4px", height: "20px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div> پاداش تیم (محاسبه زنده)</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.PR_Project_Assignments?.map((pa: any) => {
                const bonus = calculateBonus(pa);
                const isProfit = bonus.finalBonus > Number(pa.Personnel_Wage || 0);
                return (
                  <div key={pa.Assignment_ID} style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <div style={{ background: "#fff7ed", padding: "6px", borderRadius: "8px" }}><Users style={{ width: "16px", height: "16px", color: "#ed6e2b" }} /></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px", color: "#0f172a" }}>{pa.Personnel?.Full_Name}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>پایه: {Number(pa.Personnel_Wage || 0).toLocaleString('fa-IR')} ریال</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "white", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Info style={{ width: "14px", height: "14px", color: "#64748b" }} />
                        <span style={{ fontSize: "10px", color: "#64748b", lineHeight: 1.4 }}>{bonus.reason}</span>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: "bold", color: isProfit ? "#16a34a" : "#ef4444" }}>
                        {bonus.finalBonus.toLocaleString('fa-IR')} ریال
                      </span>
                    </div>
                  </div>
                );
              })}
              {data.PR_Project_Assignments?.length === 0 && <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center" }}>عضوی تعریف نشده است</p>}
            </div>
          </div>
        </div>
      </form>

      {/* مودال تایید حذف */}
      {showDeleteModal && (
        <div className="erp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ backgroundColor: "#fef2f2", padding: "16px", borderRadius: "50%", width: "fit-content", margin: "0 auto 16px auto" }}>
                <AlertTriangle style={{ width: "32px", height: "32px", color: "#ef4444" }} />
              </div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>حذف پروژه</h2>
              <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748b" }}>آیا از حذف این پروژه اطمینان دارید؟ این عملیات قابل بازگشت نیست.</p>
              <form onSubmit={handleDelete} style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <input type="hidden" name="projectId" value={data.Project_ID} />
                <button type="button" onClick={() => setShowDeleteModal(false)} style={{ padding: "10px 24px", backgroundColor: "white", color: "#475569", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>انصراف</button>
                <button type="submit" style={{ padding: "10px 24px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}><Trash2 style={{ width: "16px", height: "16px" }} /> حذف شود</button>
              </form>
            </div>
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