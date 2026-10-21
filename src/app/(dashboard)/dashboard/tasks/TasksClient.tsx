"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction, reviewTaskAction } from "@/actions/tasks";
import {
  Search, Plus, Bell, X, Save, CheckCircle, UserCircle2, Users, Check,
  FileText, Clock, MessageSquare, UserCheck, Info,
} from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import {
  TASK_TABS, toPersianDate, formatToLocalISO, translatePriority, getTaskBadge,
} from "@/lib/task/constants";

export default function TasksClient({ tasks, personnel, currentStatus, canReview, subordinateCount }: {
  tasks: any[]; personnel: any[]; currentStatus: string; canReview: boolean; subordinateCount: number;
}) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [personnelSearch, setPersonnelSearch] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [dueDateVal, setDueDateVal] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setIsMounted(true); }, []);

  const showToast = (msg: string, ms = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  const handleTabChange = (status: string) => { router.push(`/dashboard/tasks?status=${status}`); };

  // ✅ تب «در انتظار تایید» فقط برای کسی که صلاحیت بررسی دارد (CEO یا سرپرست)
  const visibleTabs = TASK_TABS.filter((tab) => !tab.reviewerOnly || canReview);

  const filteredTasks = tasks.filter((t: any) =>
    t.Title?.toLowerCase().includes(taskSearch.toLowerCase()) ||
    t.Personnel_AssignedTo?.Full_Name?.toLowerCase().includes(taskSearch.toLowerCase())
  );

  const filteredPersonnel = personnel.filter((p: any) =>
    p.Full_Name?.toLowerCase().includes(personnelSearch.toLowerCase()) ||
    (p.Personnel_Code || "").toLowerCase().includes(personnelSearch.toLowerCase())
  );

  const togglePersonnelSelection = (p: any) => {
    setSelectedPersonnel((prev) => {
      const exists = prev.find((item) => item.Personnel_ID === p.Personnel_ID);
      if (exists) return prev.filter((item) => item.Personnel_ID !== p.Personnel_ID);
      return [...prev, p];
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedPersonnel.length === 0) {
      showToast("خطا: حداقل یک مخاطب انتخاب کنید", 5000);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const dateStr = formatToLocalISO(dueDateVal);
    if (dateStr) formData.append("dueDate", dateStr);
    selectedPersonnel.forEach((p) => formData.append("personnelId", String(p.Personnel_ID)));

    const result: any = await createTaskAction(formData);
    if (result?.error) { showToast(`خطا: ${result.error}`, 5000); return; }

    setIsModalOpen(false);
    setSelectedPersonnel([]);
    setDueDateVal(null);
    showToast("ابلاغیه با موفقیت صادر شد");
    router.refresh();
  };

  const openTaskModal = (task: any) => {
    if (currentStatus === "Submitted" && canReview) setSelectedTask(task);
  };

  const handleReview = (action: string) => {
    if (!selectedTask) return;
    const formData = new FormData();
    formData.append("taskId", String(selectedTask.Task_ID));
    formData.append("action", action);

    startTransition(async () => {
      const res: any = await reviewTaskAction(formData);
      if (res?.error) { showToast(`خطا: ${res.error}`, 5000); return; }
      setSelectedTask(null);
      showToast(action === "approve" ? "ابلاغیه تایید شد" : "ابلاغیه به کارمند بازگشت داده شد");
      router.refresh();
    });
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box", transition: "all 0.2s" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .rmdp-wrapper { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; border-radius: 16px !important; }
        .rmdp-day.rmdp-today span { background: #ed6e2b !important; color: white !important; }
        .rmdp-selected span { background: #ed6e2b !important; color: white !important; }
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-btn-close { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .erp-btn-close:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
        .erp-btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(237, 110, 43, 0.2); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر صفحه و تب‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "20px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
            <Search style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
            <input type="text" placeholder="جستجوی ابلاغیه یا نام کارمند..." className="erp-input" style={{ padding: "12px 40px 12px 16px" }} value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {visibleTabs.map((tab) => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: currentStatus === tab.key ? "#ed6e2b" : "#f1f5f9", color: currentStatus === tab.key ? "white" : "#64748b" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)" }}>
          <Plus style={{ width: "18px", height: "18px" }} /> صدور ابلاغیه
        </button>
      </div>

      {/* ✅ راهنما: مخاطبین مجاز */}
      <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "10px 16px", marginBottom: "16px", fontSize: "12px", color: "#1d4ed8", display: "flex", alignItems: "center", gap: "8px" }}>
        <Info style={{ width: "14px", height: "14px", flexShrink: 0 }} />
        شما فقط به <strong>{subordinateCount > 0 ? `${subordinateCount.toLocaleString("fa-IR")} زیرمجموعه مستقیم` : "زیرمجموعه‌های مستقیم خود"}</strong> ابلاغیه صادر می‌کنید و ابلاغیه‌های تکمیل‌شده آن‌ها برای شما ارسال می‌شود. تعیین زیرمجموعه از «تنظیمات سرپرستی».
      </div>

      {/* جدول ابلاغیه‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", textAlign: "right" }}>
                {["موضوع ابلاغیه", "مخاطب", "مهلت انجام", "اولویت", "وضعیت"].map((h) => (
                  <th key={h} style={{ padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t: any) => {
                const badge = getTaskBadge(t.Status);
                return (
                  <tr key={t.Task_ID} onClick={() => openTaskModal(t)} style={{ borderBottom: "1px solid #f1f5f9", cursor: currentStatus === "Submitted" && canReview ? "pointer" : "default" }}
                    onMouseEnter={(e) => { if (currentStatus === "Submitted" && canReview) e.currentTarget.style.backgroundColor = "#fffbf5"; }}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>
                      {t.Title}
                      {t.Completion_Note && <span title="دارای یادداشت کارمند" style={{ marginRight: "6px" }}>📋</span>}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{t.Personnel_AssignedTo?.Full_Name || "-"}</td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>{toPersianDate(t.Due_Date)}</td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, backgroundColor: t.Priority === "Urgent" ? "#fef2f2" : t.Priority === "High" ? "#fff7ed" : "#f1f5f9", color: t.Priority === "Urgent" ? "#991b1b" : t.Priority === "High" ? "#c2410c" : "#475569" }}>
                        {translatePriority(t.Priority)}
                      </span>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, backgroundColor: badge.bg, color: badge.color }}>
                        {badge.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (<tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>ابلاغیه‌ای یافت نشد</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== مودال بررسی ===== */}
      {selectedTask && (
        <div className="erp-modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="erp-modal-container" style={{ maxWidth: "550px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /> بررسی ابلاغیه
              </h2>
              <button className="erp-btn-close" onClick={() => setSelectedTask(null)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#64748b" }}>عنوان ابلاغیه</p>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>{selectedTask.Title}</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "12px", marginBottom: "16px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#f1f5f9", flexShrink: 0 }}>
                  {selectedTask.Personnel_AssignedTo?.Personal_Image_Path
                    ? <img src={selectedTask.Personnel_AssignedTo.Personal_Image_Path} alt={selectedTask.Personnel_AssignedTo.Full_Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <UserCircle2 style={{ width: "100%", height: "100%", color: "#cbd5e1" }} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <UserCheck style={{ width: "16px", height: "16px", color: "#64748b" }} />
                  <div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{selectedTask.Personnel_AssignedTo?.Full_Name || "نامشخص"}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>کد پرسنلی: {selectedTask.Personnel_AssignedTo?.Personnel_Code || "-"}</p>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>مهلت انجام</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{toPersianDate(selectedTask.Due_Date)}</span>
                </div>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                  <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>اولویت</span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: selectedTask.Priority === "Urgent" ? "#ef4444" : selectedTask.Priority === "High" ? "#c2410c" : "#0f172a" }}>
                    {translatePriority(selectedTask.Priority)}
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>توضیحات ابلاغیه:</p>
                <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{selectedTask.Description || "بدون توضیحات"}</p>
              </div>

              <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <MessageSquare style={{ width: "18px", height: "18px", color: "#ea580c" }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#9a3412" }}>یادداشت کارمند (هنگام تکمیل ابلاغیه)</span>
                </div>
                {selectedTask.Completion_Note ? (
                  <p style={{ margin: 0, fontSize: "14px", color: "#431407", lineHeight: "1.8", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {selectedTask.Completion_Note}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "13px", color: "#9a3412" }}>
                    کارمند هنگام تکمیل ابلاغیه یادداشتی ثبت نکرده است.
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => handleReview("reject")} disabled={isPending}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#991b1b", fontWeight: "bold", cursor: isPending ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isPending ? 0.7 : 1 }}>
                  <X style={{ width: "18px", height: "18px" }} /> رد و بازگشت به کارمند
                </button>
                <button onClick={() => handleReview("approve")} disabled={isPending}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: "#16a34a", color: "white", fontWeight: "bold", cursor: isPending ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isPending ? 0.7 : 1 }}>
                  <Check style={{ width: "18px", height: "18px" }} /> تایید نهایی
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* پاپ‌آپ صدور ابلاغیه */}
      {isModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Bell style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>صدور ابلاغیه جدید</h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>فقط زیرمجموعه‌های مستقیم شما قابل انتخاب هستند</p>
                </div>
              </div>
              <button className="erp-btn-close" onClick={() => setIsModalOpen(false)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>

            <form onSubmit={handleSubmit} className="erp-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>موضوع ابلاغیه *</label>
                <input name="title" required type="text" className="erp-input" placeholder="مثال: آماده‌سازی دستگاه CNC" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>متن ابلاغیه</label>
                <textarea name="description" rows={3} className="erp-input" style={{ resize: "vertical" }} placeholder="شرح وظیفه یا دستورالعمل..."></textarea>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>مهلت انجام</label>
                {isMounted ? <DatePicker value={dueDateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setDueDateVal} format="YYYY/MM/DD" className="erp-input" /> : <input type="text" className="erp-input" disabled />}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>اولویت</label>
                <select name="priority" className="erp-input">
                  <option value="Normal">معمولی</option>
                  <option value="High">زیاد</option>
                  <option value="Urgent">فوری</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>مخاطبین ابلاغیه</label>
                {selectedPersonnel.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                    {selectedPersonnel.map((p) => (
                      <div key={p.Personnel_ID} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#fff7ed", border: "1px solid #fed7aa", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", color: "#c2410c", fontWeight: 600 }}>
                        {p.Full_Name}
                        <button type="button" onClick={() => togglePersonnelSelection(p)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", display: "flex" }}><X style={{ width: "14px", height: "14px" }} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setIsPersonnelModalOpen(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", border: "1px dashed #cbd5e1", borderRadius: "10px", backgroundColor: "#f8fafc", cursor: "pointer", color: "#64748b", fontWeight: 600 }}>
                  <Users style={{ width: "18px", height: "18px" }} /> انتخاب از زیرمجموعه‌های من
                </button>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", paddingTop: "12px" }}>
                <button type="submit" className="erp-btn-submit"><Save style={{ width: "18px", height: "18px" }} /> ثبت ابلاغیه</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* پاپ‌آپ انتخاب کارمند — فقط زیرمجموعه‌ها */}
      {isPersonnelModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsPersonnelModalOpen(false)} style={{ zIndex: 60 }}>
          <div className="erp-modal-container" style={{ maxWidth: "900px" }} onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Users style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>انتخاب مخاطبین</h2>
                  <p style={{ margin: "0", fontSize: "13px", color: "#64748b" }}>{selectedPersonnel.length} نفر انتخاب شده از {personnel.length.toLocaleString("fa-IR")} زیرمجموعه</p>
                </div>
              </div>
              <button className="erp-btn-close" onClick={() => setIsPersonnelModalOpen(false)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>

            <div className="erp-modal-body">
              <div style={{ position: "relative", marginBottom: "24px" }}>
                <Search style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
                <input type="text" className="erp-input" style={{ padding: "12px 40px 12px 16px" }} placeholder="جستجوی پرسنل..." value={personnelSearch} onChange={(e) => setPersonnelSearch(e.target.value)} autoFocus />
              </div>

              {personnel.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "14px" }}>
                  <Users style={{ width: "40px", height: "40px", color: "#cbd5e1", margin: "0 auto 12px", display: "block" }} />
                  شما زیرمجموعه‌ای ندارید — ابتدا از صفحه «تنظیمات سرپرستی» زیرمجموعه تعیین کنید.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", maxHeight: "50vh", overflowY: "auto", padding: "4px" }}>
                  {filteredPersonnel.map((p: any) => {
                    const isSelected = selectedPersonnel.find((item) => item.Personnel_ID === p.Personnel_ID);
                    return (
                      <div key={p.Personnel_ID} onClick={() => togglePersonnelSelection(p)} style={{ backgroundColor: isSelected ? "#fff7ed" : "white", border: `1px solid ${isSelected ? "#ed6e2b" : "#e2e8f0"}`, borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
                        {isSelected && <div style={{ position: "absolute", top: "8px", left: "8px", backgroundColor: "#ed6e2b", borderRadius: "50%", padding: "2px" }}><Check style={{ width: "14px", height: "14px", color: "white" }} /></div>}
                        <div style={{ width: "60px", height: "60px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#f1f5f9" }}>
                          {p.Personal_Image_Path ? <img src={p.Personal_Image_Path} alt={p.Full_Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UserCircle2 style={{ width: "100%", height: "100%", color: "#cbd5e1" }} />}
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{p.Full_Name}</p>
                          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>{p.Personnel_Code}</p>
                        </div>
                        <span style={{ fontSize: "11px", backgroundColor: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "6px", fontWeight: 600, textAlign: "center" }}>
                          {p.OrganizationalPosition?.Name || "بدون جایگاه"} - {p.Unit?.Name || "بدون واحد"}
                        </span>
                      </div>
                    );
                  })}
                  {filteredPersonnel.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#94a3b8", fontSize: "13px", padding: "20px" }}>پرسنلی با این مشخصات یافت نشد</div>
                  )}
                </div>
              )}

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setIsPersonnelModalOpen(false)} className="erp-btn-submit"><CheckCircle style={{ width: "18px", height: "18px" }} /> تایید و بستن</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#0f172a", color: "white", padding: "12px 24px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)", zIndex: 100, display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500, animation: "slideUp 0.3s ease-out" }}>
          <CheckCircle style={{ width: "20px", height: "20px", color: toast.includes("خطا") ? "#f87171" : "#10b981" }} />{toast}
        </div>
      )}
    </div>
  );
}