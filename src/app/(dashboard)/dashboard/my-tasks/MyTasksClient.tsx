"use client";

import { useState } from "react";
import { completeTaskAction } from "@/actions/tasks";
import { Bell, Search, X, CheckCircle, Calendar, Flag, Check } from "lucide-react";

const toPersianDate = (date: Date | string) => { if (!date) return "-"; const d = new Date(date); if (isNaN(d.getTime())) return "-"; return d.toLocaleDateString("fa-IR"); };
const translatePriority = (p: string) => { const s: any = { "Low": "کم", "Normal": "معمولی", "High": "زیاد", "Urgent": "فوری" }; return s[p] || p; };

export default function MyTasksClient({ tasks }: { tasks: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filteredTasks = tasks.filter(t => 
    t.Title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await completeTaskAction(formData);
    setSelectedTask(null);
    setToast("ابلاغیه با موفقیت انجام شد و به مدیر اطلاع داده شد");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 600px; overflow: hidden; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
        .erp-modal-body { padding: 24px; }
        .erp-input { width: 100%; padding: 12px 40px 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: white; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر و جستجو */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "20px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", padding: "10px", borderRadius: "12px" }}><Bell style={{ width: "24px", height: "24px", color: "white" }} /></div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>ابلاغیه‌های من</h1>
        </div>
        <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
          <Search style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
          <input type="text" placeholder="جستجوی ابلاغیه..." className="erp-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* لیست ابلاغیه‌ها */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredTasks.map((t: any) => (
          <div 
            key={t.Task_ID} 
            onClick={() => setSelectedTask(t)} 
            style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#fed7aa"; e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)"; }}
          >
            <div style={{ background: t.Status === 'Done' ? "#f0fdf4" : "#fff7ed", padding: "12px", borderRadius: "12px" }}>
              {t.Status === 'Done' ? <CheckCircle style={{ width: "24px", height: "24px", color: "#16a34a" }} /> : <Bell style={{ width: "24px", height: "24px", color: "#ed6e2b" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>{t.Title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                  <Calendar style={{ width: "14px", height: "14px" }} /> مهلت: {toPersianDate(t.Due_Date)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: t.Priority === 'Urgent' ? "#ef4444" : t.Priority === 'High' ? "#c2410c" : "#64748b" }}>
                  <Flag style={{ width: "14px", height: "14px" }} /> {translatePriority(t.Priority)}
                </span>
              </div>
            </div>
            <span style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, backgroundColor: t.Status === 'Done' ? "#dcfce7" : "#ffedd5", color: t.Status === 'Done' ? "#166534" : "#c2410c" }}>
              {t.Status === 'Done' ? 'انجام شده' : 'در انتظار انجام'}
            </span>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            هیچ ابلاغیه‌ای برای شما ثبت نشده است
          </div>
        )}
      </div>

      {/* پاپ‌آپ جزئیات ابلاغیه */}
      {selectedTask && (
        <div className="erp-modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>جزئیات ابلاغیه</h2>
              <button onClick={() => setSelectedTask(null)} style={{ padding: "4px", border: "none", background: "transparent", cursor: "pointer" }}><X style={{ color: "#64748b" }} /></button>
            </div>
            
            <div className="erp-modal-body">
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>موضوع</label>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>{selectedTask.Title}</h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>مهلت انجام</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{toPersianDate(selectedTask.Due_Date)}</span>
                </div>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>اولویت</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: selectedTask.Priority === 'Urgent' ? "#ef4444" : selectedTask.Priority === 'High' ? "#c2410c" : "#0f172a" }}>{translatePriority(selectedTask.Priority)}</span>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>متن ابلاغیه</label>
                <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: 1.6, backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px" }}>{selectedTask.Description || "توضیحات اضافه‌ای ثبت نشده است."}</p>
              </div>

              {selectedTask.Status !== 'Done' ? (
                <form onSubmit={handleComplete}>
                  <input type="hidden" name="taskId" value={selectedTask.Task_ID} />
                  <button type="submit" style={{ width: "100%", padding: "14px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 6px rgba(22,163,74,0.2)" }}>
                    <Check style={{ width: "20px", height: "20px" }} /> انجام شد و اعلام به مدیر
                  </button>
                </form>
              ) : (
                <div style={{ width: "100%", padding: "14px", backgroundColor: "#f0fdf4", color: "#166534", borderRadius: "12px", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", border: "1px solid #bbf7d0" }}>
                  <CheckCircle style={{ width: "20px", height: "20px" }} /> این ابلاغیه انجام شده است
                </div>
              )}
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