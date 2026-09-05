"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { savePersonnelHoursAction } from "@/actions/hoursSettings";
import { Search, Clock, X, Save, CheckCircle, UserCircle2, AlertCircle } from "lucide-react";

const translateRole = (role: string) => { const roles: any = { "Factory Manager": "مدیر کارخانه", "ModirNet": "مدیر نت", "Production Supervisor": "سرپرست تولید", "Repairer": "تعمیرکار", "Operator": "اپراتور", "Commerce": "بازرگانی", "Contractor": "پیمانکار" }; return roles[role] || role; };

export default function HoursSettingsClient({ personnel }: { personnel: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredPersonnel = personnel.filter(p => 
    p.Full_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Personnel_Code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (p: any) => {
    setSelectedPerson(p);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    
    // اعتبارسنجی: چک کردن اینکه همه فیلدها پر شده باشند
    const fields = ["Week1_Max_Hours", "Week1_Max_Overtime", "Week2_Max_Hours", "Week2_Max_Overtime", "Week3_Max_Hours", "Week3_Max_Overtime", "Week4_Max_Hours", "Week4_Max_Overtime", "MonthEnd_Max_Hours", "MonthEnd_Max_Overtime", "Max_Friday_Hours_Month", "Max_Holiday_Hours_Month"];
    let isValid = true;
    fields.forEach(f => {
      const val = formData.get(f);
      if (val === "" || val === null) isValid = false;
    });

    if (!isValid) {
      setFormError("لطفاً تمام فیلدها را پر کنید. هیچ فیلدی نمی‌تواند خالی باشد.");
      return;
    }

    await savePersonnelHoursAction(formData);
    setIsModalOpen(false);
    setToast("تنظیمات ساعات کاری با موفقیت ذخیره شد");
    setTimeout(() => setToast(null), 3000);
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", backgroundColor: "white", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px" };

  // استخراج اطلاعات مالی فرد انتخاب شده
  const finance = selectedPerson?.PR_Personnel_Finance[0];

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر و جستجو */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#94a3b8' }} />
          <input type="text" placeholder="جستجوی پرسنل..." style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: 'white' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* کارت‌های پرسنل */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {filteredPersonnel.map((p) => (
          <div key={p.Personnel_ID} onClick={() => openModal(p)} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.05)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
              {p.Personal_Image_Path ? <img src={p.Personal_Image_Path} alt={p.Full_Name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle2 style={{ width: '100%', height: '100%', color: '#cbd5e1' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>{p.Full_Name}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{translateRole(p.Role)}</p>
            </div>
            <Clock style={{ width: '20px', height: '20px', color: '#ed6e2b' }} />
          </div>
        ))}
      </div>

      {/* پاپ‌آپ تنظیمات ساعات */}
      {isModalOpen && selectedPerson && (
        <div className="erp-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>تنظیم ساعات کاری: {selectedPerson.Full_Name}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}><X style={{ color: '#64748b' }} /></button>
            </div>

            <form onSubmit={handleSubmit} className="erp-modal-body">
              <input type="hidden" name="financeId" value={finance?.Finance_ID || ""} />
              <input type="hidden" name="personnelId" value={selectedPerson.Personnel_ID} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {[
                  { week: "Week1", label: "هفته اول" },
                  { week: "Week2", label: "هفته دوم" },
                  { week: "Week3", label: "هفته سوم" },
                  { week: "Week4", label: "هفته چهارم" },
                  { week: "MonthEnd", label: "روزهای آخر ماه" }
                ].map((w, i) => (
                  <div key={i} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>{w.label}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>حداکثر ساعت کار مجاز *</label>
                        <input name={`${w.week}_Max_Hours`} type="number" required step="0.01" defaultValue={finance?.[`${w.week}_Max_Hours`] ?? 0} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>حداکثر ساعت اضافه کاری *</label>
                        <input name={`${w.week}_Max_Overtime`} type="number" required step="0.01" defaultValue={finance?.[`${w.week}_Max_Overtime`] ?? 0} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '12px', border: '1px solid #fed7aa' }}>
                  <label style={labelStyle}>حداکثر ساعت مجاز جمعه کاری در ماه *</label>
                  <input name="Max_Friday_Hours_Month" type="number" required step="0.01" defaultValue={finance?.Max_Friday_Hours_Month ?? 0} style={inputStyle} />
                </div>
                <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '12px', border: '1px solid #fed7aa' }}>
                  <label style={labelStyle}>حداکثر ساعت مجاز تعطیل کاری در ماه *</label>
                  <input name="Max_Holiday_Hours_Month" type="number" required step="0.01" defaultValue={finance?.Max_Holiday_Hours_Month ?? 0} style={inputStyle} />
                </div>
              </div>

              {formError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle style={{ width: '18px', height: '18px' }} /> {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" style={{ padding: '12px 36px', backgroundColor: '#ed6e2b', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(237, 110, 43, 0.3)' }}>
                  <Save style={{ width: '20px', height: '20px' }} /> ذخیره تنظیمات
                </button>
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