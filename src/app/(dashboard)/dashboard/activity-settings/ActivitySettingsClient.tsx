"use client";

import { useState } from "react";
import { addWorkTypeAction, deleteWorkTypeAction, addLocationAction, deleteLocationAction } from "@/actions/activitySettings";
import { Plus, Trash2, Briefcase, MapPin, CheckCircle } from "lucide-react";

export default function ActivitySettingsClient({ types, locations }: { types: any[], locations: any[] }) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const cardStyle: React.CSSProperties = { backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", backgroundColor: "#f8fafc", boxSizing: "border-box" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* مدیریت انواع فعالیت */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Briefcase style={{ width: "20px", height: "20px", color: "#ed6e2b" }} />
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>انواع فعالیت‌ها</h2>
          </div>
          
          <form action={addWorkTypeAction} onSubmit={() => showToast("نوع فعالیت اضافه شد")} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <input name="name" required type="text" style={inputStyle} placeholder="نام نوع فعالیت جدید..." />
            <button type="submit" style={{ padding: "10px 16px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}><Plus style={{ width: "16px" }} /></button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {types.map((t: any) => (
              <div key={t.Work_Type_ID} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <span style={{ fontSize: "14px", color: "#334155" }}>{t.Work_Type_Name}</span>
                <form action={deleteWorkTypeAction} onSubmit={() => showToast("حذف شد")}>
                  <input type="hidden" name="id" value={t.Work_Type_ID} />
                  <button type="submit" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 style={{ width: "16px" }} /></button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* مدیریت محله‌های فعالیت */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <MapPin style={{ width: "20px", height: "20px", color: "#ed6e2b" }} />
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>محله‌های فعالیت</h2>
          </div>
          
          <form action={addLocationAction} onSubmit={() => showToast("محل فعالیت اضافه شد")} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <input name="name" required type="text" style={inputStyle} placeholder="نام محل فعالیت جدید..." />
            <button type="submit" style={{ padding: "10px 16px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}><Plus style={{ width: "16px" }} /></button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {locations.map((l: any) => (
              <div key={l.Location_ID} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <span style={{ fontSize: "14px", color: "#334155" }}>{l.Location_Name}</span>
                <form action={deleteLocationAction} onSubmit={() => showToast("حذف شد")}>
                  <input type="hidden" name="id" value={l.Location_ID} />
                  <button type="submit" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 style={{ width: "16px" }} /></button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', animation: 'slideUp 0.3s ease-out' }}>
          <CheckCircle style={{ width: '20px', color: '#10b981' }} />{toast}
        </div>
      )}
    </div>
  );
}