"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, ChevronRight, ChevronLeft, Bell, Navigation, Plus, Pencil, Trash2,
  Check, Circle, Clock, X, StickyNote, CheckCircle2, AlertCircle,
} from "lucide-react";
import {
  createAgendaItemAction, updateAgendaItemAction, toggleAgendaDoneAction, deleteAgendaItemAction,
} from "@/actions/agenda";
import { translatePriority } from "@/lib/task/constants";
import { getMissionBadge } from "@/lib/mission/constants";

const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
const fa = (n: number | string) => Number(n).toLocaleString("fa-IR");

// ✅ نمایش ساعت: ارقام فارسی + حفظ ":" (بدون AM/PM)
const toFaDigits = (s: string) => s.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const faTime = (t?: string | null) => (t ? toFaDigits(t) : "");

const PRIORITY_UI: Record<string, { color: string; bg: string }> = {
  Low: { color: "#64748b", bg: "#f1f5f9" },
  Normal: { color: "#1d4ed8", bg: "#eff6ff" },
  High: { color: "#d97706", bg: "#fffbeb" },
  Urgent: { color: "#dc2626", bg: "#fef2f2" },
};

// ✅ ظاهر رویدادهای پروژه
const PROJECT_EVENT_UI: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  start:    { icon: "🚀", label: "شروع پروژه",  color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
  end:      { icon: "🏁", label: "پایان پروژه",  color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
  golden:   { icon: "⭐", label: "تاریخ طلایی", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  deadline: { icon: "⏰", label: "مهلت پروژه",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

// ============================================================
//  ✅ ورود دستی ساعت ۲۴ ساعته — کاربر تایپ می‌کند، ":" خودکار اضافه می‌شود
//  تایپ "0830" → "08:30" | فقط ارقام مجاز | بازه ۰۰:۰۰ تا ۲۳:۵۹
// ============================================================
function TimeSelect({ value, onChange, title }: { value: string; onChange: (v: string) => void; title: string }) {
  const [error, setError] = useState(false);

  const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;

  const handleChange = (raw: string) => {
    // فقط ارقام — هر کاراکتر دیگر حذف می‌شود
    const digits = raw.replace(/[^\d]/g, "").slice(0, 4);

    if (digits.length <= 2) {
      // هنوز دو رقم کامل نشده — بدون ":" نشان بده
      onChange(digits);
      setError(false);
      return;
    }

    const hh = digits.slice(0, 2);
    const mm = digits.slice(2);
    const formatted = `${hh}:${mm}`;

    // اعتبارسنجی زنده: ساعت > 23 یا دقیقه > 59 → خطا
    if (Number(hh) > 23 || Number(mm) > 59) {
      setError(true);
    } else {
      setError(false);
    }
    onChange(formatted);
  };

  const handleBlur = () => {
    // خروج از فیلد: اگر ناقص/نامعتبر بود → پاک کن
    if (value && !timeRe.test(value)) {
      onChange("");
      setError(false);
    }
  };

  return (
    <div title={title} style={{ flex: 1, minWidth: 0 }}>
      <input
        type="text"
        inputMode="numeric"
        dir="ltr"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="00:00"
        maxLength={5}
        className="erp-input"
        style={{
          textAlign: "center",
          backgroundColor: error ? "#fef2f2" : "white",
          borderColor: error ? "#fca5a5" : undefined,
          padding: "8px 6px",
          fontSize: "13px",
        }}
      />
    </div>
  );
}
export default function AgendaCalendarClient({ data }: { data: any }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // فرم
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState("Normal");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const showToast = (msg: string, ms = 3000) => { setToast(msg); setTimeout(() => setToast(null), ms); };

  const selectedDay = selectedDate ? data.days.find((d: any) => d.dateISO === selectedDate) : null;

  const nav = (delta: number) => {
    let m = data.jMonth + delta, y = data.jYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    router.push(`/dashboard/my-agenda?year=${y}&month=${m}`);
  };

  const resetForm = () => {
    setEditingId(null); setFormTitle(""); setFormDesc("");
    setFormPriority("Normal"); setFormStart(""); setFormEnd(""); setPendingDeleteId(null);
  };

  const startEdit = (item: any) => {
    setEditingId(item.Agenda_ID);
    setFormTitle(item.Title || "");
    setFormDesc(item.Description || "");
    setFormPriority(item.Priority || "Normal");
    setFormStart(item.Start_Time || "");
    setFormEnd(item.End_Time || "");
    setPendingDeleteId(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDate) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("eventDate", selectedDate);
    fd.append("title", formTitle);
    fd.append("description", formDesc);
    fd.append("priority", formPriority);
    fd.append("startTime", formStart);
    fd.append("endTime", formEnd);
    if (editingId) fd.append("agendaId", String(editingId));

    const result: any = editingId ? await updateAgendaItemAction(fd) : await createAgendaItemAction(fd);
    setSubmitting(false);

    if (result?.error) { showToast(`خطا: ${result.error}`, 5000); return; }
    showToast(editingId ? "آیتم ویرایش شد" : "برنامه جدید ثبت شد");
    resetForm();
    router.refresh();
  };

  const handleToggle = async (agendaId: number) => {
    const fd = new FormData();
    fd.append("agendaId", String(agendaId));
    const result: any = await toggleAgendaDoneAction(fd);
    if (result?.error) { showToast(`خطا: ${result.error}`, 5000); return; }
    router.refresh();
  };

  const handleDelete = async (agendaId: number) => {
    if (pendingDeleteId !== agendaId) { setPendingDeleteId(agendaId); setTimeout(() => setPendingDeleteId(null), 3000); return; }
    const fd = new FormData();
    fd.append("agendaId", String(agendaId));
    const result: any = await deleteAgendaItemAction(fd);
    setPendingDeleteId(null);
    if (result?.error) { showToast(`خطا: ${result.error}`, 5000); return; }
    showToast("آیتم حذف شد");
    if (editingId === agendaId) resetForm();
    router.refresh();
  };

  const cardStyle: React.CSSProperties = { backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };

  // پیش‌نمایش خانه تقویم — رویدادهای پروژه اولویت دارند (مستقل از تعداد بقیه)
  const buildPreview = (d: any) => {
    const items: any[] = [];
    const CAP = 3;
    d.projectEvents.forEach((pe: any) => { if (items.length < CAP) items.push({ type: "project", key: `p${pe.Project_ID}${pe.Kind}`, data: pe }); });
    d.agenda.forEach((a: any) => { if (items.length < CAP) items.push({ type: "agenda", key: `a${a.Agenda_ID}`, data: a }); });
    d.tasks.forEach((t: any) => { if (items.length < CAP) items.push({ type: "task", key: `t${t.Task_ID}`, data: t }); });
    d.missions.forEach((m: any) => { if (items.length < CAP) items.push({ type: "mission", key: `m${m.Commute_ID}`, data: m }); });
    const total = d.projectEvents.length + d.agenda.length + d.tasks.length + d.missions.length;
    return { items, extra: total - items.length };
  };

  return (
    <div dir="rtl" style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .agenda-cell { border: 1px solid #eef2f7; border-radius: 12px; padding: 8px; min-height: 118px; cursor: pointer; transition: all 0.15s; background: white; overflow: hidden; }
        .agenda-cell:hover { border-color: #ed6e2b; box-shadow: 0 4px 12px rgba(237,110,43,0.12); }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .erp-input { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: #f8fafc; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237,110,43,0.1); }
      `}</style>

      {/* هدر + ناوبری ماه */}
      <div style={{ ...cardStyle, padding: "16px 24px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", padding: "10px", borderRadius: "12px" }}>
            <CalendarDays style={{ width: "24px", height: "24px", color: "white" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>برنامه‌ریزی من</h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{data.monthLabel}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => nav(-1)} style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", display: "flex" }}><ChevronRight style={{ width: "18px", height: "18px", color: "#475569" }} /></button>
          <button onClick={() => router.push("/dashboard/my-agenda")} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", backgroundColor: "#ed6e2b", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>امروز</button>
          <button onClick={() => nav(1)} style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", display: "flex" }}><ChevronLeft style={{ width: "18px", height: "18px", color: "#475569" }} /></button>
        </div>
      </div>

      {/* آمار ماه */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        {[
          { label: "برنامه‌های من", value: data.stats.agendaCount, color: "#ed6e2b", bg: "#fff7ed" },
          { label: "انجام‌شده", value: data.stats.doneCount, color: "#16a34a", bg: "#f0fdf4" },
          { label: "ابلاغیه‌ها", value: data.stats.taskCount, color: "#1d4ed8", bg: "#eff6ff" },
          { label: "ماموریت‌ها", value: data.stats.missionCount, color: "#ef4444", bg: "#fef2f2" },
          { label: "رویداد پروژه", value: data.stats.projectEventCount, color: "#b45309", bg: "#fffbeb" },
        ].map((s) => (
          <div key={s.label} style={{ ...cardStyle, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: "20px", fontWeight: "bold", color: s.color, backgroundColor: s.bg, padding: "2px 12px", borderRadius: "10px" }}>{fa(s.value)}</span>
          </div>
        ))}
      </div>

      {/* تقویم */}
      <div style={{ ...cardStyle, padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "6px" }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ textAlign: "center", padding: "8px 4px", fontSize: "13px", fontWeight: 700, color: i === 6 ? "#dc2626" : "#475569", backgroundColor: i === 6 ? "#fef2f2" : "#f8fafc", borderRadius: "8px" }}>{w}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
          {Array.from({ length: data.offset }).map((_, i) => <div key={`empty${i}`} />)}
          {data.days.map((d: any) => {
            const preview = buildPreview(d);
            const dayBg = d.isHoliday ? "#fff5f5" : d.isFriday ? "#fef8f8" : "white";
            return (
              <div key={d.dateISO} className="agenda-cell" onClick={() => { setSelectedDate(d.dateISO); resetForm(); }} style={{ backgroundColor: dayBg, border: d.isToday ? "2px solid #ed6e2b" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: d.isToday ? "white" : ((d.isFriday || d.isHoliday) ? "#dc2626" : "#0f172a"), backgroundColor: d.isToday ? "#ed6e2b" : "transparent", padding: d.isToday ? "0 8px" : 0, borderRadius: "8px" }}>
                    {fa(d.jDay)}
                  </span>
                  {d.isToday && <span style={{ fontSize: "9px", fontWeight: 700, color: "#ed6e2b" }}>امروز</span>}
                </div>
                {d.isHoliday && d.holidayDesc && (
                  <div style={{ fontSize: "9px", color: "#dc2626", backgroundColor: "#fef2f2", borderRadius: "6px", padding: "2px 6px", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.holidayDesc}</div>
                )}

                {/* پیش‌نمایش آیتم‌ها */}
                {preview.items.map((it: any) => (
                  <div key={it.key} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", padding: "2px 4px", borderRadius: "5px", marginBottom: "2px", backgroundColor: it.type === "agenda" ? "#fff7ed" : it.type === "task" ? "#eff6ff" : it.type === "mission" ? "#fef2f2" : "#fffbeb" }}>
                    {it.type === "agenda" ? (
                      <>
                        {it.data.Is_Done
                          ? <Check style={{ width: "9px", height: "9px", color: "#16a34a", flexShrink: 0 }} />
                          : <StickyNote style={{ width: "9px", height: "9px", color: "#ed6e2b", flexShrink: 0 }} />}
                        <span style={{ color: it.data.Is_Done ? "#94a3b8" : "#334155", textDecoration: it.data.Is_Done ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.data.Title}</span>
                      </>
                    ) : it.type === "task" ? (
                      <><Bell style={{ width: "9px", height: "9px", color: "#1d4ed8", flexShrink: 0 }} /><span style={{ color: "#1e40af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.data.Title}</span></>
                    ) : it.type === "mission" ? (
                      <><Navigation style={{ width: "9px", height: "9px", color: "#ef4444", flexShrink: 0 }} /><span style={{ color: "#991b1b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.data.Origin} ← {it.data.Destination}</span></>
                    ) : (
                      // ✅ رویداد پروژه
                      (() => {
                        const ui = PROJECT_EVENT_UI[it.data.Kind];
                        const isOverdue = it.data.Kind === "deadline" && it.data.Overdue_Days;
                        return (
                          <span style={{ display: "flex", alignItems: "center", gap: "3px", color: ui.color, whiteSpace: "nowrap", overflow: "hidden" }}>
                            <span style={{ flexShrink: 0 }}>{ui.icon}</span>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: isOverdue ? 700 : 500 }}>
                              {isOverdue ? `دیرکرد ${fa(it.data.Overdue_Days)} روزه` : it.data.Project_Name}
                            </span>
                          </span>
                        );
                      })()
                    )}
                  </div>
                ))}
                {preview.extra > 0 && <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700 }}>+ {fa(preview.extra)} مورد دیگر</div>}
              </div>
            );
          })}
        </div>

        {/* راهنما */}
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", fontSize: "11px", color: "#64748b" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><StickyNote style={{ width: "12px", height: "12px", color: "#ed6e2b" }} /> برنامه شخصی</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Bell style={{ width: "12px", height: "12px", color: "#1d4ed8" }} /> ابلاغیه</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Navigation style={{ width: "12px", height: "12px", color: "#ef4444" }} /> ماموریت</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>🚀 شروع | 🏁 پایان | ⭐ طلایی | ⏰ مهلت/دیرکرد</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", display: "inline-block" }} /> تعطیل / جمعه</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "3px", border: "2px solid #ed6e2b", display: "inline-block" }} /> امروز</span>
        </div>
      </div>

      {/* ===== مودال روز ===== */}
      {selectedDay && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", animation: "fadeIn 0.15s ease-out" }} onClick={() => { setSelectedDate(null); resetForm(); }}>
          <div style={{ backgroundColor: "white", borderRadius: "20px", width: "100%", maxWidth: "620px", maxHeight: "calc(100vh - 32px)", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>

            {/* هدر مودال */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "white", zIndex: 2, borderRadius: "20px 20px 0 0" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CalendarDays style={{ width: "20px", height: "20px", color: "#ed6e2b" }} />
                  {WEEKDAYS[(new Date(selectedDay.dateISO).getDay() + 1) % 7]} {fa(selectedDay.jDay)} {data.monthLabel}
                </h2>
                {selectedDay.isHoliday && selectedDay.holidayDesc && <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#dc2626", fontWeight: 600 }}>🎉 {selectedDay.holidayDesc}</p>}
              </div>
              <button onClick={() => { setSelectedDate(null); resetForm(); }} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b", padding: "4px" }}><X style={{ width: "22px", height: "22px" }} /></button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {/* ---- رویدادهای پروژه (شروع/پایان/طلایی/مهلت) ---- */}
              {selectedDay.projectEvents.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <CalendarDays style={{ width: "16px", height: "16px", color: "#b45309" }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>رویدادهای پروژه‌ها</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedDay.projectEvents.map((pe: any, idx: number) => {
                      const ui = PROJECT_EVENT_UI[pe.Kind] || PROJECT_EVENT_UI.deadline;
                      const isOverdue = pe.Kind === "deadline" && pe.Overdue_Days;
                      return (
                        <div key={`${pe.Project_ID}-${pe.Kind}-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "10px 12px", backgroundColor: ui.bg, border: `1px solid ${ui.border}`, borderRadius: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                            <span style={{ fontSize: "16px", flexShrink: 0 }}>{ui.icon}</span>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: ui.color }}>
                                {isOverdue ? `دیرکرد ${fa(pe.Overdue_Days)} روزه` : ui.label}
                              </p>
                              <p style={{ margin: "2px 0 0 0", fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pe.Project_Name}</p>
                            </div>
                          </div>
                          {isOverdue && (
                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "8px", backgroundColor: "#dc2626", color: "white", flexShrink: 0, whiteSpace: "nowrap" }}>
                              ⚠️ نیاز به پیگیری
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ---- برنامه‌های شخصی ---- */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <StickyNote style={{ width: "16px", height: "16px", color: "#ed6e2b" }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>برنامه‌های من</span>
                  {selectedDay.agenda.length > 0 && <span style={{ fontSize: "11px", backgroundColor: "#fff7ed", color: "#c2410c", padding: "1px 8px", borderRadius: "10px", fontWeight: 700 }}>{fa(selectedDay.agenda.length)}</span>}
                </div>

                {selectedDay.agenda.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                    {selectedDay.agenda.map((a: any) => {
                      const pUI = PRIORITY_UI[a.Priority] || PRIORITY_UI.Normal;
                      return (
                        <div key={a.Agenda_ID} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", backgroundColor: a.Is_Done ? "#f8fafc" : "#fffdf9", border: "1px solid #f1f5f9", borderRadius: "10px" }}>
                          <button onClick={() => handleToggle(a.Agenda_ID)} title={a.Is_Done ? "برگشت به انجام‌نشده" : "انجام شد"} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "2px", display: "flex" }}>
                            {a.Is_Done ? <CheckCircle2 style={{ width: "20px", height: "20px", color: "#16a34a" }} /> : <Circle style={{ width: "20px", height: "20px", color: "#cbd5e1" }} />}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: a.Is_Done ? "#94a3b8" : "#0f172a", textDecoration: a.Is_Done ? "line-through" : "none" }}>
                              {a.Title}
                              {(a.Start_Time || a.End_Time) && (
                                <span style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", marginRight: "8px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                  <Clock style={{ width: "11px", height: "11px" }} />
                                  {/* ✅ نمایش صحیح ۲۴ ساعته با ارقام فارسی */}
                                  {a.Start_Time ? faTime(a.Start_Time) : ""}{a.End_Time ? ` تا ${faTime(a.End_Time)}` : ""}
                                </span>
                              )}
                            </p>
                            {a.Description && <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b", whiteSpace: "pre-wrap" }}>{a.Description}</p>}
                          </div>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", color: pUI.color, backgroundColor: pUI.bg, flexShrink: 0 }}>{translatePriority(a.Priority)}</span>
                          <button onClick={() => startEdit(a)} title="ویرایش" style={{ border: "none", background: "transparent", cursor: "pointer", padding: "4px", display: "flex" }}><Pencil style={{ width: "15px", height: "15px", color: "#64748b" }} /></button>
                          <button onClick={() => handleDelete(a.Agenda_ID)} title="حذف" style={{ border: "none", background: "transparent", cursor: "pointer", padding: "4px", display: "flex", color: pendingDeleteId === a.Agenda_ID ? "#dc2626" : "#94a3b8", fontWeight: pendingDeleteId === a.Agenda_ID ? "bold" : "normal", fontSize: pendingDeleteId === a.Agenda_ID ? "10px" : "12px", alignItems: "center", gap: "2px" }}>
                            {pendingDeleteId === a.Agenda_ID ? "تایید؟" : <Trash2 style={{ width: "15px", height: "15px" }} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#94a3b8" }}>هنوز برنامه‌ای برای این روز ثبت نکرده‌اید.</p>
                )}

                {/* فرم ثبت/ویرایش */}
                <form onSubmit={handleSave} style={{ backgroundColor: editingId ? "#f8fafc" : "#fff7ed", border: `1px solid ${editingId ? "#e2e8f0" : "#fed7aa"}`, borderRadius: "12px", padding: "14px" }}>
                  {editingId && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706" }}>✏️ در حال ویرایش</span>
                      <button type="button" onClick={resetForm} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "12px", color: "#64748b" }}>انصراف</button>
                    </div>
                  )}
                  <input type="text" className="erp-input" placeholder="عنوان برنامه *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required style={{ marginBottom: "10px" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px", marginBottom: "10px" }}>
                    <select className="erp-input" value={formPriority} onChange={(e) => setFormPriority(e.target.value)}>
                      <option value="Low">اولویت: کم</option>
                      <option value="Normal">اولویت: معمولی</option>
                      <option value="High">اولویت: زیاد</option>
                      <option value="Urgent">اولویت: فوری</option>
                    </select>
                    {/* ✅ ساعت ۲۴ ساعته: ۰۰:۰۰ تا ۲۳:۵۹ — بدون AM/PM */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, flexShrink: 0 }}>از</span>
                      <TimeSelect value={formStart} onChange={setFormStart} title="ساعت شروع (۲۴ ساعته)" />
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, flexShrink: 0 }}>تا</span>
                      <TimeSelect value={formEnd} onChange={setFormEnd} title="ساعت پایان (۲۴ ساعته)" />
                    </div>
                  </div>
                  <textarea className="erp-input" rows={2} placeholder="شرح (اختیاری)..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} style={{ resize: "vertical", marginBottom: "10px" }}></textarea>
                  <button type="submit" disabled={submitting} style={{ width: "100%", padding: "10px", backgroundColor: submitting ? "#cbd5e1" : "#ed6e2b", color: "white", border: "none", borderRadius: "10px", cursor: submitting ? "wait" : "pointer", fontWeight: "bold", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Plus style={{ width: "16px", height: "16px" }} /> {editingId ? "ذخیره ویرایش" : "افزودن به برنامه روز"}
                  </button>
                </form>
              </div>

              {/* ---- ابلاغیه‌های این روز ---- */}
              {selectedDay.tasks.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <Bell style={{ width: "16px", height: "16px", color: "#1d4ed8" }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>ابلاغیه‌های این روز</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedDay.tasks.map((t: any) => (
                      <div key={t.Task_ID} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "10px 12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                          {t.Status === "Approved" ? <CheckCircle2 style={{ width: "16px", height: "16px", color: "#16a34a", flexShrink: 0 }} /> : <Bell style={{ width: "16px", height: "16px", color: "#1d4ed8", flexShrink: 0 }} />}
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.Title}</span>
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", backgroundColor: t.Status === "Approved" ? "#f0fdf4" : t.Status === "Submitted" ? "#eff6ff" : "#fff7ed", color: t.Status === "Approved" ? "#166534" : t.Status === "Submitted" ? "#1d4ed8" : "#c2410c", flexShrink: 0 }}>
                          {t.Status === "Approved" ? "تایید شده" : t.Status === "Submitted" ? "در انتظار تایید" : "در حال انجام"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- ماموریت‌های این روز ---- */}
              {selectedDay.missions.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <Navigation style={{ width: "16px", height: "16px", color: "#ef4444" }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>ماموریت‌های این روز</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedDay.missions.map((m: any) => {
                      const badge = getMissionBadge(m);
                      return (
                        <div key={m.Commute_ID} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "10px 12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                            <Navigation style={{ width: "15px", height: "15px", color: "#ef4444", flexShrink: 0 }} />
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.Origin} ← {m.Destination}</span>
                          </div>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", backgroundColor: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* حالت خالی کامل */}
              {selectedDay.agenda.length === 0 && selectedDay.tasks.length === 0 && selectedDay.missions.length === 0 && selectedDay.projectEvents.length === 0 && (
                <div style={{ textAlign: "center", padding: "16px 0 4px", color: "#94a3b8", fontSize: "13px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <AlertCircle style={{ width: "28px", height: "28px", color: "#cbd5e1" }} />
                  این روز فقط شامل برنامه‌های شخصی شماست — اولین برنامه را از فرم بالا اضافه کنید.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#0f172a", color: "white", padding: "12px 24px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)", zIndex: 100, display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500, animation: "slideUp 0.3s ease-out" }}>
          {toast.includes("خطا") ? <X style={{ width: "18px", height: "18px", color: "#f87171" }} /> : <Check style={{ width: "18px", height: "18px", color: "#10b981" }} />}
          {toast}
        </div>
      )}
    </div>
  );
}