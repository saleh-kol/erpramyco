"use client";

import { useState } from "react";
import { savePersonnelPayrollAction } from "@/actions/payrollSettings";
import { Search, Wallet, X, Save, CheckCircle, UserCircle2, AlertCircle } from "lucide-react";

const translateRole = (role: string) => {
  const roles: any = {
    "Factory Manager": "مدیر کارخانه", "Factory_Manager": "مدیر کارخانه",
    "ModirNet": "مدیر نت",
    "Production Supervisor": "سرپرست تولید", "Production_Supervisor": "سرپرست تولید",
    "Repairer": "تعمیرکار", "Operator": "اپراتور",
    "Commerce": "واحد مالی", "Contractor": "پیمانکار"
  };
  return roles[role] || role;
};

const formatRial = (val: any) => {
  if (!val) return "0";
  return Number(val).toLocaleString('fa-IR');
};

export default function PayrollSettingsClient({ personnel }: { personnel: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // استیت برای فیلدهای فرم
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const filteredPersonnel = personnel.filter(p =>
    p.Full_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Personnel_Code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (p: any) => {
    const fin = p.PR_Personnel_Finance?.[0];
    setSelectedPerson(p);
    setFormError(null);
    setFormValues({
      Base_Monthly_Salary: fin?.Base_Monthly_Salary ? String(fin.Base_Monthly_Salary) : "",
      Base_Hourly_Rate: fin?.Base_Hourly_Rate ? String(fin.Base_Hourly_Rate) : "",
      Holiday_Hour_Multiplier: fin?.Holiday_Hour_Multiplier ? String(fin.Holiday_Hour_Multiplier) : "0",
      Friday_Hour_Multiplier: fin?.Friday_Hour_Multiplier ? String(fin.Friday_Hour_Multiplier) : "0",
      Mission_Regular_Multiplier: fin?.Mission_Regular_Multiplier ? String(fin.Mission_Regular_Multiplier) : "0",
      Mission_Friday_Multiplier: fin?.Mission_Friday_Multiplier ? String(fin.Mission_Friday_Multiplier) : "0",
      Mission_Holiday_Multiplier: fin?.Mission_Holiday_Multiplier ? String(fin.Mission_Holiday_Multiplier) : "0",
    });
    setIsModalOpen(true);
  };

  const handleChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // محاسبه مبلغ نهایی برای نمایش زنده
  const calcFinalRate = (percentStr: string) => {
    const percent = parseFloat(percentStr) || 0;
    const base = parseFloat(formValues.Base_Hourly_Rate) || 0;
    if (base === 0) return "۰ ریال";
    const final = base + (base * (percent / 100));
    return `${final.toLocaleString('fa-IR')} ریال`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!formValues.Base_Monthly_Salary || parseFloat(formValues.Base_Monthly_Salary) <= 0) {
      setFormError("⚠️ وارد کردن حقوق پایه الزامی است!");
      return;
    }

    const formData = new FormData();
    formData.append('financeId', selectedPerson?.PR_Personnel_Finance?.[0]?.Finance_ID || "");
    formData.append('personnelId', String(selectedPerson.Personnel_ID));
    
    Object.keys(formValues).forEach(key => {
      formData.append(key, formValues[key]);
    });

    await savePersonnelPayrollAction(formData);
    setIsModalOpen(false);
    setToast("تنظیمات مالی با موفقیت ذخیره شد");
    setTimeout(() => setToast(null), 3000);
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", backgroundColor: "white", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px" };
  const finalBoxStyle: React.CSSProperties = { marginTop: "6px", padding: "8px 12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "12px", color: "#166534", fontWeight: 600 };

  const isBaseValid = parseFloat(formValues.Base_Hourly_Rate) > 0;

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر و جستجو */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>تنظیمات حقوق و دستمزد</h1>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#94a3b8' }} />
          <input type="text" placeholder="جستجوی پرسنل..." style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: 'white' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* کارت‌های پرسنل */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredPersonnel.map((p) => {
          const fin = p.PR_Personnel_Finance?.[0];
          return (
            <div key={p.Personnel_ID} onClick={() => openModal(p)}
              style={{
                backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9',
                padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f1f5f9', flexShrink: 0 }}>
                  {p.Personal_Image_Path ? <img src={p.Personal_Image_Path} alt={p.Full_Name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle2 style={{ width: '100%', height: '100%', color: '#cbd5e1' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>{p.Full_Name}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{translateRole(p.Role)} - {p.Personnel_Code}</p>
                </div>
              </div>

              {/* نمایش خلاصه مالی */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>حقوق پایه</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: fin?.Base_Monthly_Salary ? '#0f172a' : '#ef4444' }}>
                    {fin?.Base_Monthly_Salary ? `${formatRial(fin.Base_Monthly_Salary)} ریال` : 'ثبت نشده ⚠️'}
                  </p>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>نرخ ساعتی</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
                    {fin?.Base_Hourly_Rate ? formatRial(fin.Base_Hourly_Rate) : '0'} ریال
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* پاپ‌آپ تنظیمات مالی */}
      {isModalOpen && selectedPerson && (
        <div className="erp-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                تنظیمات مالی: {selectedPerson.Full_Name}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="erp-modal-body">
              
              {/* بخش حقوق پایه (مهم‌ترین فیلد) */}
              <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '12px', border: '2px solid #ed6e2b', marginBottom: '20px' }}>
                <label style={{ ...labelStyle, color: '#c2410c', fontSize: '14px' }}>
                  💰 حقوق پایه ماهانه (ریال) * [اجباری]
                </label>
                <input 
                  name="Base_Monthly_Salary" 
                  type="number" 
                  min="0" 
                  required 
                  value={formValues.Base_Monthly_Salary || ""}
                  onChange={(e) => handleChange("Base_Monthly_Salary", e.target.value)}
                  style={{ ...inputStyle, border: '2px solid #ed6e2b', fontSize: '16px', fontWeight: 'bold', padding: '12px' }} 
                  placeholder="مثلاً 71000000" 
                />
              </div>

              {/* مبلغ پایه ساعت کارکرد */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>⏱️ مبلغ پایه ساعت کارکرد روز عادی (ریال) *</label>
                <input 
                  name="Base_Hourly_Rate" 
                  type="number" 
                  min="0" 
                  required 
                  value={formValues.Base_Hourly_Rate || ""}
                  onChange={(e) => handleChange("Base_Hourly_Rate", e.target.value)}
                  style={{ ...inputStyle, fontWeight: "bold", fontSize: "16px" }} 
                  placeholder="مثلاً 440000" 
                />
              </div>

              {/* ضرایب ساعتی */}
              <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9", opacity: isBaseValid ? "1" : "0.5", pointerEvents: isBaseValid ? "auto" : "none" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "bold", color: "#334155", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "4px", height: "16px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div>
                  ضرایب ساعت‌های دیگر (بر اساس درصد مبلغ پایه)
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[
                    { name: "Holiday_Hour_Multiplier", label: "درصد تعطیل کاری" },
                    { name: "Friday_Hour_Multiplier", label: "درصد جمعه کاری" },
                    { name: "Mission_Regular_Multiplier", label: "درصد ماموریت روز عادی" },
                    { name: "Mission_Friday_Multiplier", label: "درصد ماموریت روز جمعه" },
                    { name: "Mission_Holiday_Multiplier", label: "درصد ماموریت روز تعطیل" }
                  ].map((item, i) => (
                    <div key={i}>
                      <label style={labelStyle}>{item.label} (%)</label>
                      <input 
                        name={item.name} 
                        type="number" 
                        min="0"
                        value={formValues[item.name] || "0"}
                        onChange={(e) => handleChange(item.name, e.target.value)}
                        style={inputStyle} 
                        placeholder="مثلاً 40" 
                      />
                      <div style={finalBoxStyle}>
                        مبلغ نهایی: {calcFinalRate(formValues[item.name])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* نمایش خطا */}
              {formError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, marginBottom: '16px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle style={{ width: '18px', height: '18px' }} />
                  {formError}
                </div>
              )}

              {/* دکمه ذخیره */}
              <button 
                type="submit" 
                style={{
                  width: '100%', marginTop: '24px', padding: '14px', backgroundColor: '#ed6e2b',
                  color: 'white', border: 'none', borderRadius: '12px',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', boxShadow: '0 4px 14px rgba(237, 110, 43, 0.3)'
                }}>
                <Save style={{ width: '20px', height: '20px' }} /> ذخیره تنظیمات
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', animation: 'slideUp 0.3s ease-out' }}>
          <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
          {toast}
        </div>
      )}
    </div>
  );
}