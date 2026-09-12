"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowRight, X } from "lucide-react";
import { updatePersonnelAction } from "@/actions/personnel";

export default function EditPersonnelClient({ personnel, positions, units }: { personnel: any, positions: any[], units: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updatePersonnelAction(formData);
        if (result?.error) {
          setFormError(result.error);
        }
      } catch (e: any) {
        if (!e.message?.includes("NEXT_REDIRECT")) {
          setFormError("خطای ناشناخته‌ای رخ داد.");
        }
      }
    });
  };

  return (
    <div className="erp-dashboard-container">
      <style>{`
        .erp-dashboard-container {
          background-color: #f8fafc;
          min-height: 100vh;
          padding: 24px;
          font-family: inherit;
          display: flex;
          justify-content: center;
        }
        .erp-modal-box {
          background: white;
          border-radius: 24px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          width: 100%;
          max-width: 800px;
          border-top: 4px solid #ed6e2b;
          margin-top: 20px;
        }
        .erp-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky;
          top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0;
        }
        .erp-modal-content { padding: 24px; }
        .erp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .erp-form-group { display: flex; flex-direction: column; gap: 8px; }
        .erp-form-label { font-size: 13px; font-weight: 600; color: #475569; }
        .erp-form-input {
          width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0;
          outline: none; font-size: 14px; font-family: inherit; background-color: #f8fafc;
          transition: all 0.2s; box-sizing: border-box;
        }
        .erp-form-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-section-title {
          display: flex; align-items: center; gap: 8px; margin: 0 0 20px 0;
          font-size: 16px; font-weight: bold; color: #334155;
        }
        .erp-section-title::before { content: ''; width: 4px; height: 20px; background: #ed6e2b; border-radius: 2px; }
        .erp-form-actions { display: flex; justify-content: space-between; gap: 12px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
        .erp-btn-secondary { padding: 12px 28px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; color: #475569; font-weight: 600; cursor: pointer; font-size: 14px; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .erp-btn-submit { padding: 12px 36px; border: none; border-radius: 10px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 4px 14px rgba(237, 110, 43, 0.3); display: flex; align-items: center; gap: 8px; }
        .erp-error-box { grid-column: 1 / -1; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; margin-top: 16px; }
      `}</style>

      <div className="erp-modal-box">
        <div className="erp-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ backgroundColor: "#fff7ed", padding: "10px", borderRadius: "12px" }}>
              <Save style={{ width: "24px", height: "24px", color: "#ed6e2b" }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>ویرایش اطلاعات پرسنل</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>در حال ویرایش: {personnel.Full_Name}</p>
            </div>
          </div>
          <button onClick={() => router.back()} style={{ padding: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", borderRadius: "10px" }}>
            <X style={{ width: "20px", height: "20px", color: "#64748b" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="erp-modal-content">
          <input type="hidden" name="personnelId" value={personnel.Personnel_ID} />

          <h3 className="erp-section-title">اطلاعات هویتی</h3>
          <div className="erp-form-grid">
            <div className="erp-form-group">
              <label className="erp-form-label">نام و نام خانوادگی *</label>
              <input name="fullName" required type="text" className="erp-form-input" defaultValue={personnel.Full_Name} />
            </div>
            <div className="erp-form-group">
              <label className="erp-form-label">کد پرسنلی *</label>
              <input name="personnelCode" required type="text" className="erp-form-input" defaultValue={personnel.Personnel_Code} />
            </div>
            
            <div className="erp-form-group">
              <label className="erp-form-label">جایگاه سازمانی</label>
              <select name="positionId" className="erp-form-input" defaultValue={personnel.Position_ID || ""}>
                <option value="">بدون جایگاه</option>
                {positions.map((pos: any) => (
                  <option key={pos.Position_ID} value={pos.Position_ID} selected={personnel.Position_ID === pos.Position_ID}>
                    {pos.Name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="erp-form-group">
              <label className="erp-form-label">واحد سازمانی</label>
              <select name="unitId" className="erp-form-input" defaultValue={personnel.Unit_ID || ""}>
                <option value="">بدون واحد</option>
                {units.map((unit: any) => (
                  <option key={unit.Unit_ID} value={unit.Unit_ID} selected={personnel.Unit_ID === unit.Unit_ID}>
                    {unit.Name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="erp-form-group">
              <label className="erp-form-label">نوع استخدام *</label>
              <select name="employmentType" required className="erp-form-input" defaultValue={personnel.Employment_Type}>
                <option value="Official">رسمی</option>
                <option value="Contractual">قراردادی</option>
                <option value="PartTime">پاره‌وقت</option>
                <option value="Intern">کارآموز</option>
              </select>
            </div>

            <div className="erp-form-group">
              <label className="erp-form-label">وضعیت کاربری</label>
              <select name="isActive" className="erp-form-input" defaultValue={personnel.IsActive ? "true" : "false"}>
                <option value="true">فعال</option>
                <option value="false">غیرفعال</option>
              </select>
            </div>
          </div>

          {formError && (
            <div className="erp-error-box">
              <X style={{ width: "18px", height: "18px" }} />
              {formError}
            </div>
          )}

          <div className="erp-form-actions">
            <button type="button" onClick={() => router.back()} className="erp-btn-secondary">
              <ArrowRight style={{ width: "18px", height: "18px" }} /> بازگشت
            </button>
            <button type="submit" disabled={isPending} className="erp-btn-submit" style={{ opacity: isPending ? 0.7 : 1 }}>
              {isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}