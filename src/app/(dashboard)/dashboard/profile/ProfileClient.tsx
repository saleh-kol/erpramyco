"use client";

import { useState } from "react";
import { updateMyProfileAction } from "@/actions/profile";
import { UserCircle2, Save, CheckCircle, Camera } from "lucide-react";

export default function ProfileClient({ profile }: { profile: any }) {
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(profile.Personal_Image_Path || null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await updateMyProfileAction(formData);
    
    if (result?.error) {
      setFormError(result.error);
    } else if (result?.success) {
      setToast("پروفایل با موفقیت بروزرسانی شد");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // فشرده‌سازی عکس قبل از نمایش و ارسال
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 500; // حداکثر ۵۰۰x۵۰۰
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) { height *= maxSize / width; width = maxSize; }
          } else {
            if (height > maxSize) { width *= maxSize / height; height = maxSize; }
          }
          
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setImagePreview(compressedDataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box", transition: "all 0.2s" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a", marginBottom: "24px" }}>تکمیل اطلاعات پروفایل</h1>

        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ backgroundColor: "white", borderRadius: "20px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          
          {/* بخش عکس پروفایل */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
            <div style={{ position: "relative", width: "120px", height: "120px", marginBottom: "16px" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", backgroundColor: "#f1f5f9", border: "3px solid #ffedd5" }}>
                {imagePreview ? (
                  <img src={imagePreview} alt="پروفایل" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <UserCircle2 style={{ width: "100%", height: "100%", color: "#cbd5e1" }} />
                )}
              </div>
              <label htmlFor="profileImage" style={{ position: "absolute", bottom: "0", right: "10px", backgroundColor: "#ed6e2b", borderRadius: "50%", padding: "8px", cursor: "pointer", border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <Camera style={{ width: "18px", height: "18px", color: "white" }} />
              </label>
              <input id="profileImage" name="profileImage" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
            </div>
            <p style={{ fontSize: "13px", color: "#64748b" }}>برای تغییر عکس روی آیکون دوربین کلیک کنید</p>
          </div>

          {/* اطلاعات هویتی */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>نام و نام خانوادگی *</label>
              <input name="Full_Name" required type="text" defaultValue={profile.Full_Name} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>کد ملی</label>
              <input name="National_Code" type="text" defaultValue={profile.National_Code || ""} maxLength={10} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>دپارتمان / بخش</label>
              <input name="Department" type="text" defaultValue={profile.Department || ""} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>کد پرسنلی</label>
              <input type="text" value={profile.Personnel_Code} disabled style={{ ...inputStyle, backgroundColor: "#f1f5f9", color: "#94a3b8" }} />
            </div>
          </div>

          {/* اطلاعات بانکی */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "bold", color: "#334155", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "4px", height: "20px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div>
              اطلاعات بانکی
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <label style={labelStyle}>نام بانک</label>
                <input name="Bank_Name" type="text" defaultValue={profile.Bank_Name || ""} style={inputStyle} placeholder="مثلاً ملت" />
              </div>
              <div>
                <label style={labelStyle}>شماره حساب / شبا</label>
                <input name="Bank_Account" type="text" defaultValue={profile.Bank_Account || ""} style={inputStyle} dir="ltr" />
              </div>
            </div>
          </div>

          {/* اطلاعات خانوادگی */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "24px", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "bold", color: "#334155", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "4px", height: "20px", backgroundColor: "#ed6e2b", borderRadius: "2px" }}></div>
              وضعیت تاهل
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <label style={labelStyle}>وضعیت تاهل</label>
                <select name="Marital_Status" style={inputStyle} defaultValue={profile.Marital_Status || "Single"}>
                  <option value="Single">مجرد</option>
                  <option value="Married">متاهل</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>تعداد فرزندان</label>
                <input name="Children_Count" type="number" min="0" defaultValue={profile.Children_Count || 0} style={inputStyle} />
              </div>
            </div>
          </div>

          {formError && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, marginBottom: "20px" }}>
              {formError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" style={{ padding: "14px 36px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(237, 110, 43, 0.3)" }}>
              <Save style={{ width: "20px", height: "20px" }} /> ذخیره تغییرات
            </button>
          </div>

        </form>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', animation: 'slideUp 0.3s ease-out' }}>
          <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />{toast}
        </div>
      )}
    </div>
  );
}