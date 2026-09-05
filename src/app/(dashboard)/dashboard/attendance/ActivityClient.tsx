"use client";

import { useState } from "react";
import { createManualActivityAction } from "@/actions/activity";
import { Play, UserCircle2, X, Save, CheckCircle, Calendar, Clock } from "lucide-react";

const toPersianTime = (timeStr: Date | string) => {
  if (!timeStr) return "-";
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
};

export default function ActivityClient({ user, activeActivity, types, locations, projects, tasks, missions }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [category, setCategory] = useState("job");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('category', category);

    const result = await createManualActivityAction(formData);
    if (result?.error) {
      setFormError(result.error);
    } else if (result?.success) {
      setIsModalOpen(false);
      setToast("فعالیت با موفقیت ثبت شد");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const todayStr = new Date().toLocaleDateString('fa-IR');

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "calc(100vh - 128px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 550px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "40px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", maxWidth: "450px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", border: "3px solid #ffedd5" }}>
          {user.image ? <img src={user.image} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle2 style={{ width: "50px", height: "50px", color: "#cbd5e1" }} />}
        </div>
        
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold", color: "#0f172a" }}>{user.name}</h1>
        <p style={{ margin: "6px 0 24px 0", fontSize: "13px", color: "#64748b" }}>ثبت فعالیت روزانه ({todayStr})</p>

        {activeActivity ? (
          <div style={{ backgroundColor: "#f0fdf4", padding: "16px", borderRadius: "12px", border: "1px solid #bbf7d0", marginBottom: "24px", textAlign: "right" }}>
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#166534", fontWeight: 600 }}>فعالیت ثبت شده امروز (در حال انجام):</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#0f172a" }}>
              <Clock style={{ width: "16px", height: "16px", color: "#16a34a" }} />
              ورود: {toPersianTime(activeActivity.Check_In)} - خروج: {activeActivity.Check_Out ? toPersianTime(activeActivity.Check_Out) : "ثبت نشده"}
            </div>
          </div>
        ) : null}

        <button onClick={() => setIsModalOpen(true)} style={{ width: "100%", padding: "14px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", boxShadow: "0 4px 6px rgba(237,110,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <Play style={{ width: "20px", height: "20px" }} /> ثبت فعالیت جدید
        </button>
      </div>

      {/* پاپ‌آپ ثبت فعالیت دستی */}
      {isModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>ثبت فعالیت برای امروز</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X style={{ color: "#64748b" }} /></button>
            </div>
            <form onSubmit={handleSubmit} className="erp-modal-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* تاریخ و ساعت‌ها */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>تاریخ</label>
                  <input type="text" value={todayStr} disabled className="erp-input" style={{ textAlign: "center", backgroundColor: "#f1f5f9" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>ساعت ورود *</label>
                  <input 
                    name="checkIn" 
                    type="text" 
                    required 
                    pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]" 
                    title="ساعت را به صورت ۲۴ ساعته وارد کنید. مثال: 14:30 یا 08:15"
                    className="erp-input" 
                    style={{ textAlign: "center", direction: "ltr" }} 
                    placeholder="14:30" 
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>ساعت خروج *</label>
                  <input 
                    name="checkOut" 
                    type="text" 
                    required 
                    pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]" 
                    title="ساعت را به صورت ۲۴ ساعته وارد کنید. مثال: 18:45 یا 09:05"
                    className="erp-input" 
                    style={{ textAlign: "center", direction: "ltr" }} 
                    placeholder="18:45" 
                  />
                </div>
              </div>

              {/* شرح انجام فعالیت */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>شرح انجام فعالیت *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px", border: `1px solid ${category === 'job' ? '#ed6e2b' : '#e2e8f0'}`, borderRadius: "10px", cursor: "pointer", fontSize: "13px", backgroundColor: category === 'job' ? '#fff7ed' : 'white' }}>
                    <input type="radio" name="categoryRadio" value="job" checked={category === 'job'} onChange={() => setCategory('job')} style={{ display: "none" }} /> شرح وظیفه
                  </label>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px", border: `1px solid ${category === 'task' ? '#ed6e2b' : '#e2e8f0'}`, borderRadius: "10px", cursor: tasks.length > 0 ? 'pointer' : 'not-allowed', fontSize: "13px", backgroundColor: category === 'task' ? '#fff7ed' : 'white', opacity: tasks.length > 0 ? 1 : 0.5 }}>
                      <input type="radio" value="task" disabled={tasks.length === 0} checked={category === 'task'} onChange={() => setCategory('task')} style={{ display: "none" }} /> دستور مدیر
                    </label>
                    {tasks.length === 0 && <p style={{ fontSize: "10px", color: "#ef4444", margin: "4px 0 0 4px" }}>ابلاغیه ندارید</p>}
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px", border: `1px solid ${category === 'mission' ? '#ed6e2b' : '#e2e8f0'}`, borderRadius: "10px", cursor: missions.length > 0 ? 'pointer' : 'not-allowed', fontSize: "13px", backgroundColor: category === 'mission' ? '#fff7ed' : 'white', opacity: missions.length > 0 ? 1 : 0.5 }}>
                      <input type="radio" value="mission" disabled={missions.length === 0} checked={category === 'mission'} onChange={() => setCategory('mission')} style={{ display: "none" }} /> ماموریت
                    </label>
                    {missions.length === 0 && <p style={{ fontSize: "10px", color: "#ef4444", margin: "4px 0 0 4px" }}>ماموریتی ندارید</p>}
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px", border: `1px solid ${category === 'project' ? '#ed6e2b' : '#e2e8f0'}`, borderRadius: "10px", cursor: projects.length > 0 ? 'pointer' : 'not-allowed', fontSize: "13px", backgroundColor: category === 'project' ? '#fff7ed' : 'white', opacity: projects.length > 0 ? 1 : 0.5 }}>
                      <input type="radio" value="project" disabled={projects.length === 0} checked={category === 'project'} onChange={() => setCategory('project')} style={{ display: "none" }} /> پروژه
                    </label>
                    {projects.length === 0 && <p style={{ fontSize: "10px", color: "#ef4444", margin: "4px 0 0 4px" }}>پروژه‌ای ندارید</p>}
                  </div>
                </div>
              </div>

              {category === 'project' && projects.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>انتخاب پروژه *</label>
                  <select name="projectId" required className="erp-input">
                    {projects.map((p: any) => <option key={p.Project_ID} value={p.Project_ID}>{p.Project_Name}</option>)}
                  </select>
                </div>
              )}

              {category === 'task' && tasks.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>انتخاب ابلاغیه *</label>
                  <select name="taskId" required className="erp-input">
                    {tasks.map((t: any) => <option key={t.Task_ID} value={t.Task_ID}>{t.Title}</option>)}
                  </select>
                </div>
              )}

              {category === 'mission' && missions.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>انتخاب ماموریت *</label>
                  <select name="missionId" required className="erp-input">
                    {missions.map((m: any) => <option key={m.Commute_ID} value={m.Commute_ID}>{m.Destination}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>نوع فعالیت *</label>
                <select name="workTypeId" required className="erp-input">
                  {types.map((t: any) => <option key={t.Work_Type_ID} value={t.Work_Type_ID}>{t.Work_Type_Name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>محل فعالیت *</label>
                <select name="locationId" required className="erp-input">
                  {locations.map((l: any) => <option key={l.Location_ID} value={l.Location_ID}>{l.Location_Name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>ضریب سختی کار (۱ تا ۱۰) *</label>
                <input name="difficulty" type="number" min="1" max="10" required defaultValue="5" className="erp-input" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>شرح کار انجام شده *</label>
                <textarea name="description" rows={2} required className="erp-input" style={{ resize: "vertical" }} placeholder="توضیحاتی در مورد فعالیت خود وارد کنید..."></textarea>
              </div>

              {formError && (
                <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600 }}>{formError}</div>
              )}

              <button type="submit" style={{ padding: "14px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                <Save style={{ width: "18px", height: "18px" }} /> ثبت فعالیت
              </button>
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