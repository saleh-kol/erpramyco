"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Search, X, UserCircle2 } from "lucide-react";
import { createPersonnelAction, approvePersonnelAction } from "@/actions/personnel";

type PersonnelWithRelations = any;

// تابع ترجمه نوع استخدام
const translateEmploymentType = (type: string) => {
  if (!type) return "-";
  const types: any = {
    Official: "رسمی",
    Contractual: "قراردادی",
    PartTime: "پاره‌وقت",
    Intern: "کارآموز",
  };
  return types[type] || type;
};

export default function PersonnelClient({
  personnel,
  positions,
  units,
  isCEO // <--- این متغیر اضافه شد
}: {
  personnel: PersonnelWithRelations[];
  positions: any[];
  units: any[];
  isCEO: boolean; // <--- نوع آن مشخص شد
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  
  // استیت برای مودال تایید پرسنل
  const [pendingPersonnel, setPendingPersonnel] = useState<any>(null);

  const filteredPersonnel = personnel.filter(
    (p) =>
      p.Full_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Personnel_Code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await createPersonnelAction(formData);
        if (result?.error) setFormError(result.error);
      } catch (e: any) {
        if (!e.message?.includes("NEXT_REDIRECT")) setFormError("خطای ناشناخته‌ای رخ داد.");
        else setIsModalOpen(false);
      }
    });
  };

  // تابع جدید برای تایید یا رد پرسنل
  const handleApproveAction = async (personnelId: number, action: string) => {
    setFormError(null);
    const formData = new FormData();
    formData.append("personnelId", String(personnelId));
    formData.append("action", action);
    
    startTransition(async () => {
      try {
        const result = await approvePersonnelAction(formData);
        if (result?.error) alert(result.error);
      } catch (err: any) {
        if (!err.message?.includes("NEXT_REDIRECT")) {
          alert("خطایی در سرور رخ داد.");
        } else {
          setPendingPersonnel(null); // بستن مودال پس از موفقیت
        }
      }
    });
  };

  return (
    <div className="erp-dashboard-container">
      <style>{`
        .erp-dashboard-container { background-color: #f8fafc; min-height: 100vh; padding: 24px; font-family: inherit; }
        .erp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
        .erp-search-box { position: relative; width: 100%; max-width: 400px; }
        .erp-search-input { width: 100%; padding: 12px 16px 12px 44px; border-radius: 12px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; background-color: white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s; }
        .erp-search-input:focus { border-color: #ed6e2b; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-search-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); width: 20px, height: 20px; color: #94a3b8; }
        .erp-btn-primary { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; font-weight: bold; border: none; border-radius: 12px; cursor: pointer; font-size: 14px; box-shadow: 0 4px 14px rgba(237, 110, 43, 0.3); transition: all 0.2s; }
        .erp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(237, 110, 43, 0.4); }
        .erp-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
        @media (max-width: 1400px) { .erp-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 1100px) { .erp-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 800px) { .erp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .erp-grid { grid-template-columns: 1fr; } }
        .erp-card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; overflow: hidden; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .erp-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px rgba(0,0,0,0.08); border-color: #ffedd5; }
        .erp-card-image { width: 100%; aspect-ratio: 1/1; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; border-bottom: 1px solid #f1f5f9; }
        .erp-card-badge { position: absolute; bottom: 12px; right: 12px; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; backdrop-filter: blur(4px); color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .erp-card-body { padding: 16px; text-align: center; }
        .erp-tag { padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; }
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-box { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-content { padding: 24px; }
        .erp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .erp-form-group { display: flex; flex-direction: column; gap: 8px; }
        .erp-form-label { font-size: 13px; font-weight: 600; color: #475569; }
        .erp-form-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
        .erp-form-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 20px 0; font-size: 16px; font-weight: bold; color: #334155; }
        .erp-section-title::before { content: ''; width: 4px; height: 20px; background: #ed6e2b; border-radius: 2px; }
        .erp-divider { border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 24px; }
        .erp-form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
        .erp-btn-secondary { padding: 12px 28px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; color: #475569; font-weight: 600; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .erp-btn-submit { padding: 12px 36px; border: none; border-radius: 10px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 4px 14px rgba(237, 110, 43, 0.3); display: flex; align-items: center; gap: 8px; }
        .erp-error-box { grid-column: 1 / -1; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; margin-top: 16px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="erp-header">
        <div className="erp-search-box">
          <Search className="erp-search-icon" />
          <input type="text" placeholder="جستجوی پرسنل بر اساس نام یا کد..." className="erp-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setIsModalOpen(true)} className="erp-btn-primary">
          <UserPlus style={{ width: "20px", height: "20px" }} /> افزودن پرسنل جدید
        </button>
      </div>

      <div className="erp-grid">
        {filteredPersonnel.map((p) => (
          <div 
            key={p.Personnel_ID} 
            // اصلاح شد: بررسی دسترسی مدیرعامل قبل از باز کردن مودال
            onClick={() => {
              if (p.IsApproved) {
                router.push(`/dashboard/personnel/${p.Personnel_ID}`);
              } else if (isCEO) {
                setPendingPersonnel(p);
              } else {
                alert("این پرسنل در انتظار تایید مدیرعامل است و در حال حاضر برای شما قابل مشاهده یا ویرایش نیست.");
              }
            }} 
            className="erp-card"
            style={{ opacity: p.IsApproved ? 1 : 0.6 }}
          >
            <div className="erp-card-image">
              {p.Personal_Image_Path ? (
                <img src={p.Personal_Image_Path} alt={p.Full_Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <UserCircle2 style={{ width: "60%", height: "60%", color: "#cbd5e1" }} />
              )}
              <span className="erp-card-badge" style={{ 
                backgroundColor: !p.IsApproved ? "rgba(245, 158, 11, 0.9)" : (p.IsActive ? "rgba(5, 150, 105, 0.9)" : "rgba(239, 68, 68, 0.9)") 
              }}>
                {!p.IsApproved ? "نیاز به تایید مدیرعامل" : (p.IsActive ? "فعال" : "غیرفعال")}
              </span>
            </div>

            <div className="erp-card-body">
              <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "bold", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.Full_Name}</h3>
              <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>{p.Personnel_Code}</p>

              <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                <span className="erp-tag" style={{ backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5" }}>
                  {p.OrganizationalPosition?.Name || "بدون جایگاه"}
                </span>
                <span className="erp-tag" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #dbeafe" }}>
                  {p.Unit?.Name || "بدون واحد"}
                </span>
                <span className="erp-tag" style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                  {translateEmploymentType(p.Employment_Type)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== مودال افزودن پرسنل ===== */}
      {isModalOpen && (
        <div className="erp-modal-overlay" onClick={() => { setIsModalOpen(false); setFormError(null); }}>
          <div className="erp-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ backgroundColor: "#fff7ed", padding: "10px", borderRadius: "12px" }}>
                  <UserPlus style={{ width: "24px", height: "24px", color: "#ed6e2b" }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>فرم ثبت پرسنل جدید</h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>اطلاعات کاربر را با دقت وارد نمایید</p>
                </div>
              </div>
              <button onClick={() => { setIsModalOpen(false); setFormError(null); }} style={{ padding: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", borderRadius: "10px" }}>
                <X style={{ width: "20px", height: "20px", color: "#64748b" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="erp-modal-content">
              <h3 className="erp-section-title">اطلاعات هویتی</h3>
              <div className="erp-form-grid">
                <div className="erp-form-group">
                  <label className="erp-form-label">نام و نام خانوادگی *</label>
                  <input name="fullName" required type="text" className="erp-form-input" placeholder="مثال: علی احمدی" />
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">کد پرسنلی *</label>
                  <input name="personnelCode" required type="text" className="erp-form-input" placeholder="مثال: PR-001" />
                </div>
                
                {/* اصلاح selected به defaultValue */}
                <div className="erp-form-group">
                  <label className="erp-form-label">جایگاه سازمانی *</label>
                  <select name="positionId" required className="erp-form-input" defaultValue="">
                    <option value="" disabled>انتخاب کنید...</option>
                    {positions.map((pos: any) => (
                      <option key={pos.Position_ID} value={pos.Position_ID}>{pos.Name}</option>
                    ))}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">واحد سازمانی *</label>
                  <select name="unitId" required className="erp-form-input" defaultValue="">
                    <option value="" disabled>انتخاب کنید...</option>
                    {units.map((unit: any) => (
                      <option key={unit.Unit_ID} value={unit.Unit_ID}>{unit.Name}</option>
                    ))}
                  </select>
                </div>
                <div className="erp-form-group">
                  <label className="erp-form-label">نوع استخدام *</label>
                  <select name="employmentType" required className="erp-form-input" defaultValue="Official">
                    <option value="Official">رسمی</option>
                    <option value="Contractual">قراردادی</option>
                    <option value="PartTime">پاره‌وقت</option>
                    <option value="Intern">کارآموز</option>
                  </select>
                </div>
              </div>

              <div className="erp-divider">
                <h3 className="erp-section-title">اطلاعات سیستم و ورود</h3>
                <div className="erp-form-grid">
                  <div className="erp-form-group">
                    <label className="erp-form-label">نام کاربری (برای ورود) *</label>
                    <input name="username" required type="text" className="erp-form-input" placeholder="مثال: ali.ahmadi" />
                  </div>
                  <div className="erp-form-group">
                    <label className="erp-form-label">رمز عبور اولیه *</label>
                    <input name="password" required type="text" className="erp-form-input" placeholder="یک رمز امنی" />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="erp-error-box">
                  <X style={{ width: "18px", height: "18px" }} />
                  {formError}
                </div>
              )}

              <div className="erp-form-actions">
                <button type="button" onClick={() => { setIsModalOpen(false); setFormError(null); }} className="erp-btn-secondary">انصراف</button>
                <button type="submit" disabled={isPending} className="erp-btn-submit" style={{ opacity: isPending ? 0.7 : 1 }}>
                  {isPending ? "در حال ثبت..." : "ثبت نهایی پرسنل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== مودال تایید پرسنل در انتظار (فقط برای مدیرعامل - isCEO) ===== */}
      {pendingPersonnel && isCEO && (
        <div className="erp-modal-overlay" onClick={() => setPendingPersonnel(null)}>
          <div className="erp-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ backgroundColor: "#fff7ed", padding: "10px", borderRadius: "12px" }}>
                  <UserPlus style={{ width: "24px", height: "24px", color: "#ed6e2b" }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>بررسی پرسنل جدید</h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>این شخص توسط یکی از مدیران ثبت شده است</p>
                </div>
              </div>
              <button onClick={() => setPendingPersonnel(null)} style={{ padding: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", borderRadius: "10px" }}>
                <X style={{ width: "20px", height: "20px", color: "#64748b" }} />
              </button>
            </div>

            <div className="erp-modal-content">
              <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>{pendingPersonnel.Full_Name}</p>
                <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>کد پرسنلی: {pendingPersonnel.Personnel_Code}</p>
                <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>جایگاه: {pendingPersonnel.OrganizationalPosition?.Name || "نامشخص"}</p>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>واحد: {pendingPersonnel.Unit?.Name || "نامشخص"}</p>
              </div>

              {/* استفاده از onClick به جای form action */}
              <div className="erp-form-actions" style={{ justifyContent: "space-between" }}>
                <button 
                  onClick={() => handleApproveAction(pendingPersonnel.Personnel_ID, "reject")} 
                  className="erp-btn-secondary" 
                  style={{ backgroundColor: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }} 
                  disabled={isPending}
                >
                  رد و حذف درخواست
                </button>
                <button 
                  onClick={() => handleApproveAction(pendingPersonnel.Personnel_ID, "approve")} 
                  className="erp-btn-submit" 
                  disabled={isPending}
                >
                  {isPending ? "در حال پردازش..." : "تایید و فعال‌سازی کاربر"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}