"use client";

import { useState } from "react";
import { savePersonnelPayrollAction } from "@/actions/payrollSettings";
import {
  Search, X, Save, CheckCircle, UserCircle2, AlertCircle,
  Briefcase, Building2, BadgeCheck, CalendarDays
} from "lucide-react";

// ✅ نوع استخدام (سیستم جدید — نقش‌های قدیمی حذف شدند؛ Role فقط CEO/User است)
const translateEmploymentType = (type: string | null) => {
  const types: any = {
    "Official": "رسمی",
    "Contractual": "قراردادی",
    "PartTime": "پاره‌وقت",
    "Intern": "کارآموز"
  };
  return (type && types[type]) || "نامشخص";
};

const employmentColors: any = {
  "Official":    { color: "#166534", backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  "Contractual": { color: "#1e40af", backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  "PartTime":    { color: "#854d0e", backgroundColor: "#fefce8", borderColor: "#fde68a" },
  "Intern":      { color: "#6b21a8", backgroundColor: "#faf5ff", borderColor: "#e9d5ff" }
};

const formatRial = (val: any) => {
  if (!val) return "0";
  return Math.round(Number(val)).toLocaleString('fa-IR');
};

// ✅ مدل ساعتی: چون کارکرد پرسنل ساعتی شمرده می‌شود، ورودی فرم «مبنای ساعتی» است
// در دیتابیس همچنان Base_Monthly_Salary (ماهانه = ساعتی × ۱۹۲) ذخیره می‌شود
// کارکرد استاندارد ماهانه: ۱۹۲ ساعت (۲۴ روز کاری × ۸ ساعت)
const HOURS_PER_MONTH = 192;
// مبنای روزانه طبق عرف محاسبات قانونی: ماهانه ÷ ۳۰ (ساعتی × ۶.۴)

// این تابع فقط برای نمایش ساعتی روی کارت (از ماهانه ذخیره‌شده) است
const toHourlyBase = (monthly: any) => {
  const m = Number(monthly) || 0;
  return m > 0 ? Math.round(m / HOURS_PER_MONTH) : 0;
};

// مجموع مزایای ثابت ماهانه (سنوات روزانه × ۳۰ هم اضافه می‌شود)
const getMonthlyBenefits = (fin: any) => {
  if (!fin) return 0;
  const n = (v: any) => Number(v) || 0;
  return n(fin.Housing_Allowance) + n(fin.Child_Allowance) +
         n(fin.Household_Allowance) + n(fin.Other_Benefits) +
         n(fin.Seniority_Daily_Base) * 30;
};

export default function PayrollSettingsClient({ personnel }: { personnel: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const filteredPersonnel = personnel.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.Full_Name?.toLowerCase().includes(term) ||
      String(p.Personnel_Code).toLowerCase().includes(term) ||
      p.OrganizationalPosition?.Name?.toLowerCase().includes(term) ||
      p.Unit?.Name?.toLowerCase().includes(term)
    );
  });

  const openModal = (p: any) => {
    const fin = p.PR_Personnel_Finance?.[0];
    setSelectedPerson(p);
    setFormError(null);
    setFormValues({
      Base_Hourly_Wage:     fin?.Base_Monthly_Salary   ? String(Math.round(Number(fin.Base_Monthly_Salary) / HOURS_PER_MONTH)) : "",
      Housing_Allowance:    fin?.Housing_Allowance     ? String(fin.Housing_Allowance) : "",
      Child_Allowance:      fin?.Child_Allowance       ? String(fin.Child_Allowance) : "",
      Seniority_Daily_Base: fin?.Seniority_Daily_Base  ? String(fin.Seniority_Daily_Base) : "",
      Household_Allowance:  fin?.Household_Allowance   ? String(fin.Household_Allowance) : "",
      Other_Benefits:       fin?.Other_Benefits        ? String(fin.Other_Benefits) : "",
      Holiday_Hour_Multiplier: fin?.Holiday_Hour_Multiplier != null ? String(fin.Holiday_Hour_Multiplier) : "0",
      Friday_Hour_Multiplier:  fin?.Friday_Hour_Multiplier  != null ? String(fin.Friday_Hour_Multiplier) : "0",
      // درصد اضافه‌کاری از ضریب ذخیره‌شده به دست می‌آید (1.40 → 40) — پیش‌فرض قانون کار ۴۰٪
      Overtime_Percent:        fin?.Overtime_Multiplier     != null ? String(Math.round((Number(fin.Overtime_Multiplier) - 1) * 1000) / 10) : "40",
    });
    setIsModalOpen(true);
  };

  const handleChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // مبنای ساعتی مستقیماً از ورودی کاربر خوانده می‌شود
  const hourlyBase = parseFloat(formValues.Base_Hourly_Wage) || 0;
  const isBaseValid = hourlyBase > 0;
  const monthlyEquivalent = hourlyBase * HOURS_PER_MONTH;
  // معادل روزانه = ماهانه ÷ ۳۰ = ساعتی × ۶.۴ (برای سنوات/بیمه/مزد روزهای عادی)
  const dailyEquivalent = hourlyBase * HOURS_PER_MONTH / 30;

  // مزد هر ساعت تعطیل کاری / جمعه کاری / اضافه‌کاری = مبنای ساعتی × (۱ + درصد)
  const calcHourlyPay = (percentStr: string) => {
    const percent = parseFloat(percentStr) || 0;
    if (!isBaseValid) return "۰ ریال";
    const final = hourlyBase * (1 + percent / 100);
    return `${Math.round(final).toLocaleString('fa-IR')} ریال`;
  };

  // معادل ماهانه پایه سنوات (پایه روزانه × ۳۰)
  const seniorityMonthly = (parseFloat(formValues.Seniority_Daily_Base) || 0) * 30;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const hourly = parseFloat(formValues.Base_Hourly_Wage) || 0;
    if (hourly <= 0) {
      setFormError("⚠️ وارد کردن مبنای ساعتی الزامی است!");
      return;
    }

    const formData = new FormData();
    formData.append('financeId', selectedPerson?.PR_Personnel_Finance?.[0]?.Finance_ID || "");
    formData.append('personnelId', String(selectedPerson.Personnel_ID));

    // ✅ مزد ثابت ماهانه = مبنای ساعتی × ۱۹۲ ساعت (کارکرد استاندارد ماه)
    formData.append('Base_Monthly_Salary', String(Math.round(hourly * HOURS_PER_MONTH)));

    // ✅ درصد اضافه‌کاری → ضریب (40٪ → 1.40) برای ستون Overtime_Multiplier
    const overtimePercent = parseFloat(formValues.Overtime_Percent) || 0;
    const overtimeMultiplier = Math.round((1 + overtimePercent / 100) * 100) / 100;
    formData.append('Overtime_Multiplier', String(overtimeMultiplier));

    [
      'Housing_Allowance', 'Child_Allowance', 'Seniority_Daily_Base',
      'Household_Allowance', 'Other_Benefits',
      'Holiday_Hour_Multiplier', 'Friday_Hour_Multiplier'
    ].forEach(key => formData.append(key, formValues[key] || "0"));

    await savePersonnelPayrollAction(formData);
    setIsModalOpen(false);
    setToast("تنظیمات مالی با موفقیت ذخیره شد");
    setTimeout(() => setToast(null), 3000);
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", backgroundColor: "white", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px" };
  const finalBoxStyle: React.CSSProperties = { marginTop: "6px", padding: "8px 12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "12px", color: "#166534", fontWeight: 600 };
  const sectionTitleStyle: React.CSSProperties = { margin: "0 0 16px 0", fontSize: "14px", fontWeight: "bold", color: "#334155", display: "flex", alignItems: "center", gap: "8px" };
  const badgeStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#475569" };

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
          <input type="text" placeholder="جستجوی پرسنل، جایگاه یا واحد..." style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: 'white' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* کارت‌های پرسنل */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredPersonnel.map((p) => {
          const fin = p.PR_Personnel_Finance?.[0];
          const empColor = employmentColors[p.Employment_Type] || { color: "#64748b", backgroundColor: "#f8fafc", borderColor: "#e2e8f0" };
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
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>کد پرسنلی: {p.Personnel_Code}</p>
                </div>
              </div>

              {/* جایگاه سازمانی / واحد سازمانی / نوع استخدام */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                <span style={badgeStyle}>
                  <Briefcase style={{ width: '12px', height: '12px' }} />
                  {p.OrganizationalPosition?.Name || 'جایگاه تعیین نشده'}
                </span>
                <span style={badgeStyle}>
                  <Building2 style={{ width: '12px', height: '12px' }} />
                  {p.Unit?.Name || 'واحد تعیین نشده'}
                </span>
                <span style={{ ...badgeStyle, color: empColor.color, backgroundColor: empColor.backgroundColor, borderColor: empColor.borderColor }}>
                  <BadgeCheck style={{ width: '12px', height: '12px' }} />
                  {translateEmploymentType(p.Employment_Type)}
                </span>
              </div>

              {/* نمایش خلاصه مالی */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>مبنای ساعتی (مزد ثابت)</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: fin?.Base_Monthly_Salary ? '#0f172a' : '#ef4444' }}>
                      {fin?.Base_Monthly_Salary ? `${formatRial(toHourlyBase(fin.Base_Monthly_Salary))} ریال` : 'ثبت نشده ⚠️'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>مزد ثابت ماهانه (×۱۹۲)</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
                      {fin?.Base_Monthly_Salary ? `${formatRial(fin.Base_Monthly_Salary)} ریال` : '—'}
                    </p>
                  </div>
                </div>
                <div style={{ marginTop: '10px', padding: '6px 10px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarDays style={{ width: '13px', height: '13px' }} />
                  مجموع مزایای ماهانه: {formatRial(getMonthlyBenefits(fin))} ریال
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
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                  تنظیمات مالی: {selectedPerson.Full_Name}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  {selectedPerson.OrganizationalPosition?.Name || 'بدون جایگاه'} • {selectedPerson.Unit?.Name || 'بدون واحد'} • {translateEmploymentType(selectedPerson.Employment_Type)}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="erp-modal-body">

              {/* مبنای ساعتی (ورودی اصلی) */}
              <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '12px', border: '2px solid #ed6e2b', marginBottom: '20px' }}>
                <label style={{ ...labelStyle, color: '#c2410c', fontSize: '14px' }}>
                  💰 مبنای ساعتی / مزد ثابت ساعتی (ریال) * [اجباری]
                </label>
                <input
                  name="Base_Hourly_Wage"
                  type="number"
                  min="0"
                  required
                  value={formValues.Base_Hourly_Wage || ""}
                  onChange={(e) => handleChange("Base_Hourly_Wage", e.target.value)}
                  style={{ ...inputStyle, border: '2px solid #ed6e2b', fontSize: '16px', fontWeight: 'bold', padding: '12px' }}
                  placeholder="مثلاً 322727"
                />
                <div style={{ marginTop: '10px', padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '13px', color: '#166534', fontWeight: 700, textAlign: 'center' }}>
                  ✅ مزد ثابت ماهانه (ساعتی × ۱۹۲ ساعت کارکرد): {isBaseValid ? `${monthlyEquivalent.toLocaleString('fa-IR')} ریال` : '—'}
                  <br />
                  مبنای روزانه (ماهانه ÷ ۳۰): {isBaseValid ? `${Math.round(dailyEquivalent).toLocaleString('fa-IR')} ریال` : '—'}
                </div>
              </div>

              {/* پایه سنوات روزانه */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>📅 پایه سنوات روزانه (ریال)</label>
                <input
                  name="Seniority_Daily_Base"
                  type="number"
                  min="0"
                  value={formValues.Seniority_Daily_Base || ""}
                  onChange={(e) => handleChange("Seniority_Daily_Base", e.target.value)}
                  style={{ ...inputStyle, fontWeight: "bold" }}
                  placeholder="مثلاً 70000"
                />
                <div style={finalBoxStyle}>
                  معادل ماهانه: {seniorityMonthly > 0 ? `${seniorityMonthly.toLocaleString('fa-IR')} ریال` : '۰ ریال'} (پایه روزانه × ۳۰)
                </div>
              </div>

              {/* کمک‌های ماهانه */}
              <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9", marginBottom: "20px" }}>
                <h3 style={sectionTitleStyle}>
                  <div style={{ width: "4px", height: "16px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div>
                  کمک‌های ماهانه (ریال)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[
                    { name: "Housing_Allowance", label: "🏠 حق مسکن ماهیانه" },
                    { name: "Child_Allowance", label: "👶 حق اولاد ماهیانه" },
                    { name: "Household_Allowance", label: "🛒 کمک هزینه اقلام مصرفی خانوار" },
                    { name: "Other_Benefits", label: "➕ سایر مزایا" }
                  ].map((item, i) => (
                    <div key={i}>
                      <label style={labelStyle}>{item.label}</label>
                      <input
                        name={item.name}
                        type="number"
                        min="0"
                        value={formValues[item.name] || ""}
                        onChange={(e) => handleChange(item.name, e.target.value)}
                        style={inputStyle}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* مزد تعطیل کاری، جمعه کاری و اضافه کاری (درصد اضافه بر مبنای ساعتی) */}
              <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9", opacity: isBaseValid ? "1" : "0.5", pointerEvents: isBaseValid ? "auto" : "none" }}>
                <h3 style={sectionTitleStyle}>
                  <div style={{ width: "4px", height: "16px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div>
                  مزد تعطیل کاری، جمعه کاری و اضافه کاری (درصد اضافه بر مبنای ساعتی)
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[
                    { name: "Holiday_Hour_Multiplier", label: "درصد مزد تعطیل کاری" },
                    { name: "Friday_Hour_Multiplier", label: "درصد مزد جمعه کاری" },
                    { name: "Overtime_Percent", label: "درصد اضافه کاری" }
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
                        مزد هر ساعت: {calcHourlyPay(formValues[item.name])}
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
