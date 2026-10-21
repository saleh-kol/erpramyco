"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createMyMissionAction, completeMyMissionAction, saveMissionReportAction,
  uploadMissionAttachmentAction, deleteMissionAttachmentAction,
} from "@/actions/myMissions";
import {
  Navigation, Plus, X, Save, CheckCircle, Check, Clock, AlertCircle,
  Paperclip, Trash2, Upload, FileImage, FileSpreadsheet, FileText, File as FileIcon,
} from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import {
  MY_MISSION_TABS, toPersianDate, formatAmount, translateCommuteType,
  formatToLocalISO, getMissionBadge, COMMUTE_TYPE_OPTIONS, BadgeConfig,
  MISSION_ATTACHMENT, formatFileSize, getAttachmentIconType,
} from "@/lib/mission/constants";

// آیکون‌های نشان وضعیت (نگاشت بر اساس کلید badge)
const BADGE_ICONS: Record<string, React.ReactNode> = {
  check: <Check style={{ width: "14px", height: "14px" }} />,
  clock: <Clock style={{ width: "14px", height: "14px" }} />,
  x:     <X style={{ width: "14px", height: "14px" }} />,
  alert: <AlertCircle style={{ width: "14px", height: "14px" }} />,
};

export default function MyMissionsClient({ missions, currentStatus }: { missions: any[]; currentStatus: string }) {
  const router = useRouter();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [dateVal, setDateVal] = useState<any>(null);

  // ✅ استیت‌های پیوست
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // ---------- Toast ----------
  const showToast = (msg: string, ms = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  // ---------- فیلتر تب‌ها ----------
  const handleTabChange = (status: string) => router.push(`/dashboard/my-missions?status=${status}`);

  // ✅ ریست استیت‌های فایل هنگام باز کردن مودال
  const openDetails = (m: any) => {
    setSelectedMission(m);
    setSelectedFile(null);
    setFileError(null);
    setIsDetailsModalOpen(true);
  };

  // ---------- اکشن‌ها ----------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const dateStr = formatToLocalISO(dateVal);
    if (dateStr) formData.append("commuteDate", dateStr);

    const result = await createMyMissionAction(formData);
    if (result?.error) setFormError(result.error);
    else if (result?.success) {
      setIsAddModalOpen(false);
      setDateVal(null);
      showToast("درخواست ماموریت ثبت شد و در انتظار تایید مدیر است");
    }
  };

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await completeMyMissionAction(formData);
    if (result?.success) {
      setIsDetailsModalOpen(false);
      showToast("ماموریت با موفقیت تکمیل شد");
    } else if (result?.error) {
      showToast(`خطا: ${result.error}`, 5000);
    }
  };

  // ---------- ثبت یادداشت برای مدیر ----------
  const handleSaveReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const reportText = (formData.get("missionReport") as string)?.trim();

    const result = await saveMissionReportAction(formData);
    if (result?.success) {
      setSelectedMission((prev: any) => prev ? { ...prev, Mission_Report: reportText } : prev);
      showToast("یادداشت شما برای مدیر ثبت شد");
      router.refresh();
    } else if (result?.error) {
      showToast(`خطا: ${result.error}`, 5000);
    }
  };

  // ============================================================
  //  ✅ پیوست‌ها: اعتبارسنجی انتخاب + آپلود + حذف
  // ============================================================

  // اعتبارسنجی فوری هنگام انتخاب (UX — اعتبارسنجی اصلی سمت سرور است)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileError(null);
    setSelectedFile(null);
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!MISSION_ATTACHMENT.ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`فرمت «.${ext || "نامشخص"}» مجاز نیست — فرمت‌های مجاز: ${MISSION_ATTACHMENT.ALLOWED_LABEL}`);
      e.target.value = "";
      return;
    }
    if (file.size > MISSION_ATTACHMENT.MAX_SIZE_BYTES) {
      setFileError(`حجم فایل ${formatFileSize(file.size)} است — حداکثر مجاز: ${MISSION_ATTACHMENT.MAX_SIZE_LABEL}`);
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadAttachment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) { setFileError("لطفاً ابتدا یک فایل انتخاب کنید"); return; }
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    const result = await uploadMissionAttachmentAction(formData);
    setIsUploading(false);

    if (result?.error) { setFileError(result.error); return; }
    if (result?.success && result.attachment) {
      // آپدیت فوری لیست بدون بستن مودال
      setSelectedMission((prev: any) => prev
        ? { ...prev, Mission_Attachments: [...(prev.Mission_Attachments || []), result.attachment] }
        : prev);
      setSelectedFile(null);
      setFileError(null);
      showToast("پیوست با موفقیت آپلود شد");
      router.refresh();
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    const formData = new FormData();
    formData.append("attachmentId", String(attachmentId));
    const result = await deleteMissionAttachmentAction(formData);
    if (result?.error) { showToast(`خطا: ${result.error}`, 5000); return; }
    setSelectedMission((prev: any) => prev
      ? { ...prev, Mission_Attachments: (prev.Mission_Attachments || []).filter((a: any) => a.Attachment_ID !== attachmentId) }
      : prev);
    showToast("پیوست حذف شد");
    router.refresh();
  };

  // ---------- استایل‌ها ----------
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box", transition: "all 0.2s" };
  const dateInputStyle: React.CSSProperties = { ...inputStyle, padding: "10px", textAlign: "center", boxShadow: "none", backgroundColor: "white" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: white; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-data-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
        .erp-row-hover:hover { background-color: #fffbf5 !important; cursor: pointer; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر + تب‌ها + دکمه ثبت */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "20px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>ماموریت‌های من</h1>
        </div>

        {/* تب‌ها از config مرکزی رندر می‌شوند */}
        <div style={{ display: "flex", gap: "8px", backgroundColor: "#f8fafc", padding: "4px", borderRadius: "12px" }}>
          {MY_MISSION_TABS.map((tab) => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: currentStatus === tab.key ? tab.activeColor : "transparent", color: currentStatus === tab.key ? "white" : "#64748b", transition: "all 0.2s" }}>
              {tab.label}
            </button>
          ))}
        </div>

        <button onClick={() => setIsAddModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)", fontSize: "14px", transition: "all 0.2s" }}>
          <Plus style={{ width: "18px", height: "18px" }} /> ثبت ماموریت جدید
        </button>
      </div>

      {/* جدول ماموریت‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", textAlign: "right", borderBottom: "2px solid #e2e8f0" }}>
                {["تاریخ", "مسیر", "مبلغ", "وضعیت"].map((h) => (
                  <th key={h} style={{ padding: "14px 16px", fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {missions.map((m: any) => {
                const badge: BadgeConfig = getMissionBadge(m); // نمای کارمند
                return (
                  <tr key={m.Commute_ID} className="erp-row-hover" onClick={() => openDetails(m)} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.2s" }}>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#334155", fontWeight: 600 }}>{toPersianDate(m.Commute_Date)}</td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#475569" }}>
                      {m.Origin} به {m.Destination}
                      {/* 👇 نشانگر کوچک: ماموریت‌هایی که گزارش یا پیوست دارند */}
                      {(m.Mission_Report || (m.Mission_Attachments?.length > 0)) && (
                        <span title="دارای گزارش/پیوست" style={{ marginRight: "6px" }}>📋</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>{formatAmount(m.Amount)} ریال</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
                        {BADGE_ICONS[badge.icon]} {badge.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {missions.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>ماموریتی در این بخش ثبت نشده است</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== مودال جزئیات ===== */}
      {isDetailsModalOpen && selectedMission && (() => {
        // قابل ویرایش فقط قبل از اتمام (Pending / InProgress)
        const canEditMission = selectedMission.Status === "Pending" || selectedMission.Status === "InProgress";
        const attachments = selectedMission.Mission_Attachments || [];

        return (
          <div className="erp-modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
            <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="erp-modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ background: "#fff7ed", padding: "8px", borderRadius: "10px" }}><Navigation style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>جزئیات ماموریت</h2>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}><X style={{ color: "#64748b", width: "20px", height: "20px" }} /></button>
              </div>
              <div className="erp-modal-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  {[
                    { label: "تاریخ", value: toPersianDate(selectedMission.Commute_Date) },
                    { label: "نوع وسیله", value: translateCommuteType(selectedMission.Commute_Type) },
                    { label: "مبدا", value: selectedMission.Origin },
                    { label: "مقصد", value: selectedMission.Destination },
                    { label: "مدت زمان", value: selectedMission.Commute_Duration ? `${Number(selectedMission.Commute_Duration).toFixed(2)} ساعت` : "-" },
                    { label: "مسافت", value: `${selectedMission.Distance_KM || 0} کیلومتر` },
                    { label: "مبلغ (ریال)", value: formatAmount(selectedMission.Amount) },
                    { label: "شماره رسید", value: selectedMission.Receipt_Number || "-" },
                  ].map((f) => (
                    <div key={f.label} className="erp-data-box">
                      <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>{f.label}</span>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{f.value}</span>
                    </div>
                  ))}
                </div>

                <div className="erp-data-box" style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>توضیحات</span>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>{selectedMission.Description || "توضیحاتی ثبت نشده است."}</p>
                </div>

                {/* ===== یادداشت / گزارش برای مدیر ===== */}
                {canEditMission ? (
                  <form onSubmit={handleSaveReport} style={{ marginBottom: "16px" }}>
                    <input type="hidden" name="commuteId" value={selectedMission.Commute_ID} />
                    <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "12px", padding: "14px" }}>
                      <label style={{ fontSize: "12px", color: "#c2410c", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                        یادداشت / گزارش برای مدیر
                      </label>
                      <textarea
                        name="missionReport"
                        rows={3}
                        required
                        defaultValue={selectedMission.Mission_Report || ""}
                        placeholder="گزارش ماموریت خود را برای مدیر بنویسید..."
                        className="erp-input"
                        style={{ resize: "vertical", backgroundColor: "white" }}
                      />
                      <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#9a3412" }}>
                        این یادداشت برای مدیر نمایش داده می‌شود و تا قبل از اتمام ماموریت قابل ویرایش است.
                      </p>
                      <button type="submit" style={{ marginTop: "10px", padding: "8px 16px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Save style={{ width: "14px", height: "14px" }} /> ثبت یادداشت
                      </button>
                    </div>
                  </form>
                ) : selectedMission.Mission_Report ? (
                  <div style={{ backgroundColor: "#fff7ed", padding: "12px", borderRadius: "10px", border: "1px solid #fed7aa", marginBottom: "16px" }}>
                    <span style={{ fontSize: "12px", color: "#c2410c", fontWeight: "600", display: "block", marginBottom: "6px" }}>گزارش ماموریت (ارسال شده به مدیر)</span>
                    <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{selectedMission.Mission_Report}</p>
                  </div>
                ) : null}

                {/* ===== پیوست‌ها ===== */}
                <div style={{ backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <Paperclip style={{ width: "16px", height: "16px", color: "#475569" }} />
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>پیوست‌ها</span>
                  </div>
                  {/* راهنمای فرمت و حجم — برای کاربر */}
                  <p style={{ margin: "0 0 12px 0", fontSize: "11px", color: "#64748b" }}>
                    📎 فرمت‌های مجاز: <strong>{MISSION_ATTACHMENT.ALLOWED_LABEL}</strong> — حداکثر حجم: <strong>{MISSION_ATTACHMENT.MAX_SIZE_LABEL}</strong>
                  </p>

                  {/* لیست پیوست‌های موجود */}
                  {attachments.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                      {attachments.map((att: any) => {
                        const iconType = getAttachmentIconType(att.File_Name);
                        const Icon = iconType === "image" ? FileImage : iconType === "excel" ? FileSpreadsheet : iconType === "word" ? FileText : FileIcon;
                        const iconColor = iconType === "word" ? "#1d4ed8" : iconType === "file" ? "#64748b" : "#16a34a";
                        return (
                          <div key={att.Attachment_ID} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 12px", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                              <Icon style={{ width: "18px", height: "18px", color: iconColor, flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px" }}>{att.File_Name}</p>
                                <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{formatFileSize(att.File_Size)}</p>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                              <a href={att.File_Path} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 10px", backgroundColor: "#eff6ff", color: "#1d4ed8", borderRadius: "6px", fontSize: "11px", fontWeight: "600", textDecoration: "none" }}>مشاهده</a>
                              {canEditMission && (
                                <button type="button" onClick={() => handleDeleteAttachment(att.Attachment_ID)} style={{ padding: "5px 8px", backgroundColor: "#fef2f2", color: "#991b1b", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                  <Trash2 style={{ width: "13px", height: "13px" }} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* فرم آپلود — فقط قبل از اتمام ماموریت */}
                  {canEditMission ? (
                    <form onSubmit={handleUploadAttachment}>
                      <input type="hidden" name="commuteId" value={selectedMission.Commute_ID} />
                      <div style={{ display: "flex", gap: "8px", alignItems: "stretch", flexWrap: "wrap" }}>
                        <label style={{ flex: 1, minWidth: "200px", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", fontSize: "12px", color: selectedFile ? "#0f172a" : "#94a3b8" }}>
                          <Upload style={{ width: "15px", height: "15px", color: "#ed6e2b", flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFile ? selectedFile.name : "انتخاب فایل..."}</span>
                          <input type="file" name="attachment" accept={MISSION_ATTACHMENT.ACCEPT_ATTR} onChange={handleFileSelect} style={{ display: "none" }} />
                        </label>
                        <button type="submit" disabled={isUploading || !selectedFile} style={{ padding: "8px 18px", backgroundColor: selectedFile && !isUploading ? "#ed6e2b" : "#e2e8f0", color: selectedFile && !isUploading ? "white" : "#94a3b8", border: "none", borderRadius: "10px", cursor: selectedFile && !isUploading ? "pointer" : "not-allowed", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Upload style={{ width: "14px", height: "14px" }} /> {isUploading ? "در حال آپلود..." : "آپلود"}
                        </button>
                      </div>
                      {fileError && <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#991b1b", fontWeight: 600 }}>⚠️ {fileError}</p>}
                    </form>
                  ) : (
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>🔒 پس از اتمام ماموریت، امکان افزودن یا حذف پیوست وجود ندارد</p>
                  )}
                </div>

                {selectedMission.Manager_Comment && (
                  <div style={{ backgroundColor: "#eff6ff", padding: "12px", borderRadius: "10px", border: "1px solid #bfdbfe", marginBottom: "20px" }}>
                    <span style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: "600", display: "block", marginBottom: "6px" }}>نظر مدیر</span>
                    <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>{selectedMission.Manager_Comment}</p>
                  </div>
                )}

                {/* دکمه اتمام فقط در وضعیت InProgress — قانون شماره ۳ چرخه (دست نخورده) */}
                {selectedMission.Status === "InProgress" && (
                  <form onSubmit={handleComplete}>
                    <input type="hidden" name="commuteId" value={selectedMission.Commute_ID} />
                    <button type="submit" style={{ width: "100%", padding: "12px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 6px rgba(22,163,74,0.2)", transition: "all 0.2s" }}>
                      <Check style={{ width: "18px", height: "18px" }} /> اتمام ماموریت
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== مودال ثبت ماموریت جدید ===== */}
      {isAddModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>ثبت ماموریت جدید</h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>درخواست شما پس از تایید مدیر فعال می‌شود</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}><X style={{ color: "#64748b", width: "20px", height: "20px" }} /></button>
            </div>
            <form onSubmit={handleSubmit} className="erp-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>تاریخ ماموریت *</label>
                {isMounted ? <DatePicker value={dateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" className="erp-input" disabled />}
              </div>
              <div>
                <label style={labelStyle}>مدت زمان (ساعت) *</label>
                <input name="commuteDuration" required type="number" min="0" step="0.5" className="erp-input" placeholder="مثلاً 2.5" />
              </div>
              <div>
                <label style={labelStyle}>نوع وسیله نقلیه *</label>
                <select name="commuteType" required className="erp-input">
                  {COMMUTE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>مبلغ هزینه (ریال) *</label>
                <input name="amount" required type="number" min="0" className="erp-input" placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>مبدا *</label>
                <input name="origin" required type="text" className="erp-input" placeholder="مبدا حرکت" />
              </div>
              <div>
                <label style={labelStyle}>مقصد *</label>
                <input name="destination" required type="text" className="erp-input" placeholder="مقصد حرکت" />
              </div>
              <div>
                <label style={labelStyle}>مسافت (کیلومتر)</label>
                <input name="distanceKm" type="number" min="0" className="erp-input" placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>شماره رسید</label>
                <input name="receiptNumber" type="text" className="erp-input" placeholder="شماره فاکتور/رسید" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>توضیحات</label>
                <textarea name="description" rows={2} className="erp-input" style={{ resize: "vertical" }} placeholder="در صورت نیاز توضیحات وارد کنید..."></textarea>
              </div>
              {/* یادداشت برای مدیر — اختیاری */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>یادداشت برای مدیر (گزارش ماموریت)</label>
                <textarea name="missionReport" rows={2} className="erp-input" style={{ resize: "vertical", backgroundColor: "#fff7ed", borderColor: "#fed7aa" }} placeholder="یادداشتی برای مدیر — در گزارش ماموریت نمایش داده می‌شود..."></textarea>
              </div>
              {/* راهنما: پیوست پس از ثبت از مودال جزئیات اضافه می‌شود */}
              <div style={{ gridColumn: "1 / -1", backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px" }}>
                <Paperclip style={{ width: "14px", height: "14px", flexShrink: 0 }} />
                پس از ثبت، از طریق جزئیات ماموریت می‌توانید گزارش و پیوست (فرمت‌های {MISSION_ATTACHMENT.ALLOWED_LABEL} — حداکثر {MISSION_ATTACHMENT.MAX_SIZE_LABEL}) اضافه کنید.
              </div>

              {formError && (
                <div style={{ gridColumn: "1 / -1", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600 }}>{formError}</div>
              )}

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", paddingTop: "12px", borderTop: "1px solid #f1f5f9", marginTop: "8px" }}>
                <button type="submit" style={{ padding: "12px 28px", backgroundColor: "#ed6e2b", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)" }}><Save style={{ width: "18px", height: "18px" }} /> ثبت درخواست</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#0f172a", color: toast.includes("خطا") ? "#f87171" : "white", padding: "12px 24px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)", zIndex: 100, display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500, animation: "slideUp 0.3s ease-out" }}>
          {!toast.includes("خطا") && <CheckCircle style={{ width: "20px", height: "20px", color: "#10b981" }} />}{toast}
        </div>
      )}
    </div>
  );
}