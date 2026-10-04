"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateMissionAction, deleteMissionAction } from "@/actions/missions";
import {
  ArrowRight, Save, CheckCircle, Trash2, AlertTriangle, Navigation, UserCircle2, Info, Clock, X
} from "lucide-react";

const toPersianDate = (date: Date | string) => { if (!date) return "-"; const d = new Date(date); if (isNaN(d.getTime())) return "-"; return d.toLocaleDateString("fa-IR"); };
const translateCommuteType = (type: string) => { 
  const types: any = { "CompanyVehicle": "وسیله نقلیه شرکت", "PersonalVehicle": "وسیله نقلیه شخصی", "PublicTransport": "حمل و نقل عمومی", "Taxi": "تاکسی", "Other": "سایر" }; 
  return types[type] || type || "-"; 
};

export default function MissionDetailClient({ data }: { data: any }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // استیت برای محاسبه زنده ضریب مدیر
  const [liveManagerScore, setLiveManagerScore] = useState<number>(data.Manager_Score || 100);
  
  // استیت جدید برای ۳ حالت ارزیابی
  const [reviewAction, setReviewAction] = useState<string>(
    data.Is_Approved ? 'Approved' : (data.Status === 'Rejected' ? 'Rejected' : 'NeedsRevision')
  );

  useEffect(() => {
    setReviewAction(data.Is_Approved ? 'Approved' : (data.Status === 'Rejected' ? 'Rejected' : 'NeedsRevision'));
  }, [data.Is_Approved, data.Status]);

  // تابع محاسبه مبلغ نهایی پرداختی
  const calculateFinalAmount = () => {
    const baseAmount = Number(data.Amount || 0);
    const score = Number(liveManagerScore || 100) / 100;
    const finalAmount = Math.round(baseAmount * score);
    return { finalAmount, reason: `مبلغ پایه × ضریب مدیر (${liveManagerScore}%)` };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('reviewAction', reviewAction);
    formData.append('managerScore', String(liveManagerScore));
    
    await updateMissionAction(formData);
    setToast("تغییرات ماموریت با موفقیت ذخیره شد");
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result: any = await deleteMissionAction(formData);
    
    if (result?.success) {
      setShowDeleteModal(false);
      setToast("ماموریت با موفقیت حذف شد");
      setTimeout(() => { router.push("/dashboard/missions"); }, 2000);
    } else {
      setToast(result?.error || "خطا در حذف ماموریت");
      setTimeout(() => setToast(null), 5000);
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box", transition: "all 0.2s" };
  const disabledStyle: React.CSSProperties = { ...inputStyle, backgroundColor: "#f1f5f9", color: "#64748b", cursor: "not-allowed" };
  const cardStyle: React.CSSProperties = { backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
  const headerStyle: React.CSSProperties = { margin: "0 0 20px 0", fontSize: "16px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 500px; border-top: 4px solid #ef4444; animation: scaleIn 0.2s ease-out; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: white; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(237, 110, 43, 0.2); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر صفحه */}
      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.push("/dashboard/missions")} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px", cursor: "pointer", backgroundColor: "white" }}>
            <ArrowRight style={{ width: "20px", height: "20px", color: "#64748b" }} />
          </button>
          <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{data.Origin || "-"} به {data.Destination || "-"}</h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>تاریخ ماموریت: {toPersianDate(data.Commute_Date)}</p>
          </div>
        </div>
        <button onClick={() => setShowDeleteModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", border: "1px solid #fecaca", cursor: "pointer", fontWeight: "bold", backgroundColor: "#fef2f2", color: "#991b1b" }}>
          <Trash2 style={{ width: "18px", height: "18px" }} /> حذف ماموریت
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", alignItems: "start" }}>
        
        {/* ستون راست: اطلاعات ماموریت */}
        <div style={cardStyle}>
          <h2 style={headerStyle}><div style={{ width: "4px", height: "20px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div> اطلاعات ماموریت</h2>
          
          {/* اصلاح شد: فیلدهای مبدا و مقصد قابل ویرایش هستند */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>مبدا</label>
              <input name="origin" defaultValue={data.Origin || ""} type="text" className="erp-input" style={inputStyle} placeholder="مبدا حرکت" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>مقصد</label>
              <input name="destination" defaultValue={data.Destination || ""} type="text" className="erp-input" style={inputStyle} placeholder="مقصد حرکت" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>مدت زمان (ساعت)</label>
              <input type="text" className="erp-input" style={disabledStyle} value={data.Commute_Duration ? `${Number(data.Commute_Duration).toFixed(2)} ساعت` : "-"} disabled />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>نوع وسیله نقلیه</label>
              <input type="text" className="erp-input" style={disabledStyle} value={translateCommuteType(data.Commute_Type)} disabled />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>مبلغ هزینه پایه (ریال)</label>
              <input name="amount" defaultValue={data.Amount || 0} type="number" min="0" className="erp-input" style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>شماره رسید</label>
              <input name="receiptNumber" defaultValue={data.Receipt_Number || ""} type="text" className="erp-input" style={inputStyle} placeholder="شماره فاکتور/رسید" />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>توضیحات</label>
            <textarea name="description" rows={4} defaultValue={data.Description || ""} className="erp-input" style={{ ...inputStyle, resize: "vertical" }}></textarea>
          </div>
        </div>

        {/* ستون چپ: پرسنل، ارزیابی مدیر و محاسبه پاداش */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* باکس اطلاعات پرسنل */}
          <div style={cardStyle}>
            <h2 style={headerStyle}><div style={{ width: "4px", height: "20px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div> پرسنل مربوطه</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#f1f5f9", flexShrink: 0 }}>
                {data.Personnel?.Personal_Image_Path ? <img src={data.Personnel.Personal_Image_Path} alt={data.Personnel.Full_Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle2 style={{ width: "100%", height: "100%", color: "#cbd5e1" }} />}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px", color: "#0f172a" }}>{data.Personnel?.Full_Name || "نامشخص"}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{data.Personnel?.Personnel_Code || "-"} | {data.Personnel?.OrganizationalPosition?.Name || "بدون جایگاه"}</p>
              </div>
            </div>
          </div>

          {/* باکس ارزیابی و تایید مدیر */}
          <div style={{ ...cardStyle, border: "2px solid #ed6e2b" }}>
            <h2 style={headerStyle}><div style={{ width: "4px", height: "20px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div> ارزیابی و تایید مدیر</h2>
            <input type="hidden" name="commuteId" defaultValue={data.Commute_ID || ""} />

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>ضریب رضایت مدیر (۰ تا ۱۰۰)</label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={liveManagerScore} 
                onChange={(e) => setLiveManagerScore(Number(e.target.value))} 
                className="erp-input" 
                style={inputStyle}
                placeholder="مثلاً 90" 
              />
              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#ef4444" }}>⚠️ هر واحد کاهش، ۱٪ از مبلغ پرداختی کسر می‌شود.</p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>نظر مدیر</label>
              <textarea name="managerComment" rows={3} defaultValue={data.Manager_Comment || ""} className="erp-input" style={{ ...inputStyle, resize: "vertical" }} placeholder="نظر خود را وارد کنید..."></textarea>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>وضعیت ارزیابی ماموریت</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {/* دکمه تایید */}
                <button 
                  type="button" 
                  onClick={() => setReviewAction('Approved')} 
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${reviewAction === 'Approved' ? "#16a34a" : "#e2e8f0"}`, backgroundColor: reviewAction === 'Approved' ? "#f0fdf4" : "white", color: reviewAction === 'Approved' ? "#166534" : "#64748b", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                >
                  <CheckCircle style={{ width: "16px", height: "16px" }} /> تایید
                </button>
                {/* دکمه نیاز به بازنگری */}
                <button 
                  type="button" 
                  onClick={() => setReviewAction('NeedsRevision')} 
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${reviewAction === 'NeedsRevision' ? "#f59e0b" : "#e2e8f0"}`, backgroundColor: reviewAction === 'NeedsRevision' ? "#fffbeb" : "white", color: reviewAction === 'NeedsRevision' ? "#d97706" : "#64748b", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                >
                  <Clock style={{ width: "16px", height: "16px" }} /> بازنگری
                </button>
                {/* دکمه رد */}
                <button 
                  type="button" 
                  onClick={() => setReviewAction('Rejected')} 
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `1px solid ${reviewAction === 'Rejected' ? "#ef4444" : "#e2e8f0"}`, backgroundColor: reviewAction === 'Rejected' ? "#fef2f2" : "white", color: reviewAction === 'Rejected' ? "#991b1b" : "#64748b", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                >
                  <X style={{ width: "16px", height: "16px" }} /> رد
                </button>
              </div>
            </div>

            <button type="submit" className="erp-btn-submit" style={{ width: "100%", justifyContent: "center" }}>
              <Save style={{ width: "18px", height: "18px" }} /> ثبت نهایی ارزیابی
            </button>
          </div>

          {/* باکس محاسبه زنده مبلغ پرداختی */}
          <div style={cardStyle}>
            <h2 style={headerStyle}><div style={{ width: "4px", height: "20px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div> محاسبه مبلغ پرداختی</h2>
            {(() => {
              const calc = calculateFinalAmount();
              const baseAmount = Number(data.Amount || 0);
              const isProfit = calc.finalAmount >= baseAmount;
              return (
                <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>مبلغ پایه ثبت شده:</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>{baseAmount.toLocaleString('fa-IR')} ریال</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "white", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", marginTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Info style={{ width: "14px", height: "14px", color: "#64748b" }} />
                      <span style={{ fontSize: "11px", color: "#64748b" }}>{calc.reason}</span>
                    </div>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: isProfit ? "#16a34a" : "#ef4444" }}>
                      {calc.finalAmount.toLocaleString('fa-IR')} ریال
                    </span>
                  </div>
                </div>
              );
            })()}
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
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>حذف ماموریت</h2>
              <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748b" }}>آیا از حذف این ماموریت اطمینان دارید؟ این عملیات قابل بازگشت نیست.</p>
              <form onSubmit={handleDelete} style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <input type="hidden" name="commuteId" defaultValue={data.Commute_ID || ""} />
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