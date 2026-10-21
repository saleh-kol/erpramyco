"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfileAction } from "@/actions/profile";
import { changePasswordAction, getMyAccountInfo } from "@/actions/account";
import {
  UserCircle2, Save, CheckCircle, Camera, AlertCircle, KeyRound, User as UserIcon, X, ShieldCheck,
} from "lucide-react";

export default function ProfileClient({ profile }: { profile: any }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(profile.Personal_Image_Path || null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [hasNewImage, setHasNewImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- حساب کاربری ----------
  const [account, setAccount] = useState<any>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    getMyAccountInfo().then(setAccount);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ---------- عکس (فشرده‌سازی واقعی) ----------
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["png", "jpg", "jpeg", "webp"].includes(ext)) {
      setFormError("فرمت مجاز نیست — فقط PNG، JPG و WebP");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("حجم عکس بیش از حد بزرگ است (حداکثر ۵ مگابایت)");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) { height *= maxSize / width; width = maxSize; }
        } else {
          if (height > maxSize) { width *= maxSize / height; height = maxSize; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCompressedBlob(blob);
              setHasNewImage(true);
              setImagePreview(URL.createObjectURL(blob));
            }
          },
          "image/jpeg",
          0.8
        );
        setFormError(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPwError(null);
    setPwSuccess(false);
  };

  // ---------- submit پروفایل ----------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      const formData = new FormData(e.currentTarget);

      if (hasNewImage && compressedBlob) {
        const imgFd = new FormData();
        imgFd.append("file", new File([compressedBlob], "profile.jpg", { type: "image/jpeg" }));

        const upRes = await fetch("/api/upload/profile", { method: "POST", body: imgFd });

        if (!upRes.ok) {
          let serverMsg = `خطای سرور (کد ${upRes.status})`;
          try {
            const ct = upRes.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
              const j = await upRes.json();
              if (j?.error) serverMsg = j.error;
            } else if (upRes.status === 404) {
              serverMsg = "مسیر آپلود یافت نشد — مسیر API را چک کنید";
            }
          } catch { /* پیام پیش‌فرض */ }
          setFormError(serverMsg);
          setIsSaving(false);
          return;
        }

        const ct = upRes.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          setFormError("پاسخ سرور JSON نبود — احتمالاً middleware مسیر API را ریدایرکت کرده");
          setIsSaving(false);
          return;
        }
        const upData = await upRes.json();
        if (!upData?.path) {
          setFormError(upData?.error || "مسیر عکس از سرور برگشت داده نشد");
          setIsSaving(false);
          return;
        }
        formData.append("imagePath", upData.path);
      }

      const result = await updateMyProfileAction(formData);

      if (result?.error) {
        setFormError(result.error);
        setIsSaving(false);
        return;
      }

      setHasNewImage(false);
      setCompressedBlob(null);
      setIsSaving(false);
      showToast("پروفایل با موفقیت بروزرسانی شد");
      router.refresh();
    } catch (err: any) {
      setFormError(err?.message || "خطای نامشخص در ذخیره");
      setIsSaving(false);
    }
  };

  // ---------- submit تغییر رمز ----------
  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwError(null);
    setIsChangingPw(true);

    const formData = new FormData(e.currentTarget);
    const result = await changePasswordAction(formData);
    setIsChangingPw(false);

    if (result?.error) {
      setPwError(result.error);
      return;
    }

    setPwSuccess(true);
    (e.target as HTMLFormElement).reset?.();
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box", transition: "all 0.2s" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: white; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
      `}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a", marginBottom: "24px" }}>تکمیل اطلاعات پروفایل</h1>

        {/* ✅ بلوک حساب کاربری */}
        <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "12px" }}>
              <ShieldCheck style={{ width: "22px", height: "22px", color: "#1d4ed8" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
                <UserIcon style={{ width: "13px", height: "13px" }} /> نام کاربری
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "15px", fontWeight: "bold", color: "#0f172a", direction: "ltr", textAlign: "right" }}>
                {account?.Username || "..."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", border: "1px solid #fed7aa", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: "#fff7ed", color: "#c2410c", transition: "all 0.2s" }}
          >
            <KeyRound style={{ width: "16px", height: "16px" }} /> تغییر رمز عبور
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ backgroundColor: "white", borderRadius: "20px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

          {/* بخش عکس پروفایل — دست نخورده */}
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
              <input ref={fileInputRef} id="profileImage" type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleImageChange} />
            </div>
            <p style={{ fontSize: "13px", color: "#64748b" }}>
              برای تغییر عکس روی آیکون دوربین کلیک کنید
              {hasNewImage && <span style={{ color: "#16a34a", fontWeight: 700 }}> — عکس جدید آماده ذخیره است ✓</span>}
            </p>
          </div>

          {/* اطلاعات هویتی — دست نخورده */}
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

          {/* اطلاعات بانکی — دست نخورده */}
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

          {/* وضعیت تاهل — دست نخورده */}
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
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle style={{ width: "18px", height: "18px", flexShrink: 0 }} />{formError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={isSaving} style={{ padding: "14px 36px", backgroundColor: isSaving ? "#94a3b8" : "#ed6e2b", color: "white", border: "none", borderRadius: "12px", cursor: isSaving ? "wait" : "pointer", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(237, 110, 43, 0.3)" }}>
              <Save style={{ width: "20px", height: "20px" }} /> {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>

        </form>
      </div>

      {/* ===== مودال تغییر رمز عبور ===== */}
      {isPasswordModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(6px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", animation: "fadeIn 0.15s ease-out" }}
          onClick={closePasswordModal}
        >
          <div
            style={{ backgroundColor: "white", borderRadius: "20px", width: "100%", maxWidth: "440px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "3px solid #ed6e2b", animation: "scaleIn 0.15s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#fff7ed", padding: "9px", borderRadius: "12px" }}>
                  <KeyRound style={{ width: "20px", height: "20px", color: "#ed6e2b" }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "bold", color: "#0f172a" }}>تغییر رمز عبور</h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                    {account?.Username ? `نام کاربری: ${account.Username}` : ""}
                  </p>
                </div>
              </div>
              <button onClick={closePasswordModal} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "4px" }}>
                <X style={{ width: "20px", height: "20px", color: "#64748b" }} />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* حالت موفقیت */}
              {pwSuccess ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ backgroundColor: "#f0fdf4", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <CheckCircle style={{ width: "36px", height: "36px", color: "#16a34a" }} />
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold", color: "#166534" }}>
                    رمز عبور با موفقیت تغییر کرد
                  </h3>
                  <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#64748b" }}>
                    از این پس برای ورود از رمز جدید استفاده کنید. نشست فعلی شما همچنان معتبر است.
                  </p>
                  <button
                    onClick={closePasswordModal}
                    style={{ padding: "10px 28px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
                  >
                    متوجه شدم
                  </button>
                </div>
              ) : (
                /* فرم تغییر رمز */
                <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                      رمز عبور فعلی *
                    </label>
                    <input type="password" name="currentPassword" required autoFocus className="erp-input" placeholder="رمز فعلی خود را وارد کنید" />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                      رمز عبور جدید *
                    </label>
                    <input type="password" name="newPassword" required minLength={6} className="erp-input" placeholder="حداقل ۶ کاراکتر" />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                      تکرار رمز عبور جدید *
                    </label>
                    <input type="password" name="confirmPassword" required minLength={6} className="erp-input" placeholder="تکرار رمز جدید" />
                  </div>

                  {/* راهنما */}
                  <div style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: "10px", padding: "10px 14px", fontSize: "11px", color: "#64748b", lineHeight: 1.7 }}>
                    🔒 برای تأیید هویت، رمز فعلی الزامی است. رمز جدید حداقل ۶ کاراکتر باشد و با تکرارش یکسان باشد.
                  </div>

                  {pwError && (
                    <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />{pwError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                    <button
                      type="button"
                      onClick={closePasswordModal}
                      style={{ flex: 1, padding: "12px", backgroundColor: "white", color: "#475569", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={isChangingPw}
                      style={{ flex: 1.5, padding: "12px", backgroundColor: isChangingPw ? "#94a3b8" : "#ed6e2b", color: "white", border: "none", borderRadius: "10px", cursor: isChangingPw ? "wait" : "pointer", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <KeyRound style={{ width: "16px", height: "16px" }} /> {isChangingPw ? "در حال تغییر..." : "تغییر رمز"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#0f172a", color: "white", padding: "12px 24px", borderRadius: "12px", boxShadow: "0 10px 15px rgba(0,0,0,0.3)", zIndex: 100, display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", animation: "slideUp 0.3s ease-out" }}>
          <CheckCircle style={{ width: "20px", height: "20px", color: toast.includes("خطا") ? "#f87171" : "#10b981" }} />{toast}
        </div>
      )}
    </div>
  );
}