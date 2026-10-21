"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMissionAction } from "@/actions/missions";
import { reviewMissionRequestAction } from "@/actions/myMissions"; // اکشن تایید/رد سریع
import { Search, Plus, Navigation, X, Save, CheckCircle, Check, Info } from "lucide-react";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

// 👇 به‌جای توابع تکراری محلی، از منبع واحد حقیقت
import {
  MANAGER_MISSION_TABS,
  toPersianDate,
  formatAmount,
  translateCommuteType,
  formatToLocalISO,
  COMMUTE_TYPE_OPTIONS_MANAGER,
} from "@/lib/mission/constants";

export default function MissionsClient({ missions, personnel, currentStatus, canReview, subordinateCount, isCEO }: {
  missions: any[]; personnel: any[]; currentStatus: string; canReview: boolean; subordinateCount: number; isCEO: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [missionSearch, setMissionSearch] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null);
  const [showPersonnelList, setShowPersonnelList] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [dateVal, setDateVal] = useState<any>(null);

  useEffect(() => { setIsMounted(true); }, []);

  // ---------- Toast ----------
  const showToast = (msg: string, ms = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  // ---------- فیلتر تب‌ها ----------
  const handleTabChange = (status: string) => { router.push(`/dashboard/missions?status=${status}`); };

  // 👇 Map پرسنل: جستجوی O(1) به‌جای find داخل حلقه در هر رندر
  const personnelMap = useMemo(
    () => new Map(personnel.map((p: any) => [p.Personnel_ID, p])),
    [personnel]
  );

  // ---------- فیلتر جدول ماموریت‌ها ----------
  const filteredMissions = useMemo(() => {
    const q = missionSearch.trim().toLowerCase();
    if (!q) return missions;
    return missions.filter((m: any) => {
      const personName = (personnelMap.get(m.Personnel_ID)?.Full_Name || "").toLowerCase();
      return (
        personName.includes(q) ||
        m.Origin?.toLowerCase().includes(q) ||
        m.Destination?.toLowerCase().includes(q)
      );
    });
  }, [missions, missionSearch, personnelMap]);

  // ---------- فیلتر لیست پرسنل (با گارد null) ----------
  const filteredPersonnel = personnel.filter((p: any) =>
    p.Full_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.Personnel_Code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectPersonnel = (p: any) => {
    setSelectedPersonnel(p);
    setSearchTerm(p.Full_Name);
    setShowPersonnelList(false);
  };

  // 🔧 باگ: قبلاً اگر بعد از انتخاب، متن را ویرایش می‌کردی، personnelId قدیمی submit می‌شد
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowPersonnelList(true);
    if (!selectedPersonnel || value !== selectedPersonnel.Full_Name) {
      setSelectedPersonnel(null);
    }
  };

  // ---------- ثبت ماموریت جدید ----------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 🔧 گارد سمت کلاینت (گارد اصلی همان سرور است)
    if (!selectedPersonnel) {
      showToast("خطا: لطفاً یک پرسنل از لیست انتخاب کنید", 5000);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const dateStr = formatToLocalISO(dateVal);
    if (dateStr) formData.append("commuteDate", dateStr);
    formData.append("personnelId", String(selectedPersonnel.Personnel_ID));

    const result = await createMissionAction(formData);

    if (result?.error) {
      showToast(`خطا: ${result.error}`, 5000);
      return;
    }

    setIsModalOpen(false);
    setSelectedPersonnel(null);
    setSearchTerm("");
    setDateVal(null);
    showToast("ماموریت با موفقیت ثبت شد");
    router.refresh(); // 👇 اطمینان از آپدیت جدول
  };

  // ---------- تایید/رد سریع از جدول ----------
  const handleQuickReview = async (e: React.MouseEvent, commuteId: number, action: string) => {
    e.stopPropagation(); // جلوگیری از باز شدن صفحه جزئیات هنگام کلیک روی دکمه
    startTransition(async () => {
      const formData = new FormData();
      formData.append("commuteId", String(commuteId));
      formData.append("action", action);

      const result: any = await reviewMissionRequestAction(formData);

      // 🔧 هندل خطا (قبلاً نتیجه چک نمی‌شد)
      if (result?.error) {
        showToast(`خطا: ${result.error}`, 5000);
        return;
      }

      showToast(action === "approve" ? "ماموریت تایید شد و به 'در حال انجام' منتقل شد" : "ماموریت رد شد");
      router.refresh(); // رفرش صفحه برای آپدیت جدول
    });
  };

  // ---------- استایل‌ها ----------
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#f8fafc", boxSizing: "border-box", transition: "all 0.2s" };
  const dateInputStyle: React.CSSProperties = { ...inputStyle, padding: "10px", textAlign: "center", boxShadow: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`
        .rmdp-wrapper { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0 !important; border-radius: 16px !important; }
        .rmdp-day.rmdp-today span { background: #ed6e2b !important; color: white !important; }
        .rmdp-selected span { background: #ed6e2b !important; color: white !important; }
        .erp-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn 0.2s ease-out; }
        .erp-modal-container { background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 850px; max-height: 90vh; overflow-y: auto; border-top: 4px solid #ed6e2b; animation: scaleIn 0.2s ease-out; }
        .erp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 10; border-radius: 20px 20px 0 0; }
        .erp-modal-body { padding: 24px; }
        .erp-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; outline: none; font-size: 14px; font-family: inherit; background-color: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
        .erp-input:focus { border-color: #ed6e2b; background-color: white; box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1); }
        .erp-btn-close { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .erp-btn-close:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
        .erp-btn-submit { display: flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(237, 110, 43, 0.2); transition: all 0.2s; }
        .erp-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 12px -1px rgba(237, 110, 43, 0.3); }
        .erp-row-hover:hover { background-color: #fffbf5 !important; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* هدر صفحه، جستجو و تب‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "20px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
            <Search style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
            <input type="text" placeholder="جستجوی ماموریت..." className="erp-input" style={{ paddingRight: "40px" }} value={missionSearch} onChange={(e) => setMissionSearch(e.target.value)} />
          </div>
          {/* 👇 تب‌ها از config مرکزی — برچسب و رنگ دقیقاً مثل قبل */}
          <div style={{ display: "flex", gap: "8px", backgroundColor: "#f8fafc", padding: "4px", borderRadius: "12px" }}>
            {MANAGER_MISSION_TABS.map((tab) => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: currentStatus === tab.key ? tab.activeColor : "transparent", color: currentStatus === tab.key ? "white" : "#64748b", transition: "all 0.2s" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px -1px rgba(237, 110, 43, 0.2)", fontSize: "14px", transition: "all 0.2s" }}>
          <Plus style={{ width: "18px", height: "18px" }} /> ثبت ماموریت جدید
        </button>
      </div>

      {/* ✅ راهنمای سلسله‌مراتب */}
      <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "10px 16px", marginBottom: "16px", fontSize: "12px", color: "#1d4ed8", display: "flex", alignItems: "center", gap: "8px" }}>
        <Info style={{ width: "14px", height: "14px", flexShrink: 0 }} />
        {isCEO
          ? "به‌عنوان مدیرعامل: فقط ثبت ماموریت برای زیرمجموعه‌های مستقیم — درخواست‌های کارکنان بدون سرپرست به شما می‌رسد."
          : subordinateCount > 0
            ? `شما ${subordinateCount.toLocaleString("fa-IR")} زیرمجموعه مستقیم دارید — ثبت ماموریت، تایید و ارزیابی فقط برای همین‌ها.`
            : "شما زیرمجموعه‌ای ندارید — از «تنظیمات سرپرستی» زیرمجموعه تعیین کنید."}
      </div>

      {/* جدول ماموریت‌ها */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", textAlign: "right", borderBottom: "2px solid #e2e8f0" }}>
                {["تاریخ", "مدت زمان", "پرسنل", "مسیر", "نوع وسیله", "هزینه (ریال)", "ضریب رضایت مدیر", "عملیات"].map((h) => (
                  <th key={h} style={{ padding: "14px 16px", fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMissions.map((m: any) => {
                const person = personnelMap.get(m.Personnel_ID); // 👇 O(1)
                return (
                  <tr key={m.Commute_ID} className="erp-row-hover" onClick={() => router.push(`/dashboard/missions/${m.Commute_ID}`)} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background-color 0.2s" }}>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#334155", fontWeight: 500 }}>{toPersianDate(m.Commute_Date)}</td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#0f172a", fontWeight: 600, fontFamily: "monospace", backgroundColor: "#f8fafc" }}>
                      {m.Commute_Duration ? `${Number(m.Commute_Duration).toFixed(2)} ساعت` : "-"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>
                      {person?.Full_Name || "نامشخص"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#475569" }}>{m.Origin} به {m.Destination}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#475569" }}>{translateCommuteType(m.Commute_Type)}</td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>{formatAmount(m.Amount)}</td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: "bold" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, backgroundColor: m.Manager_Score ? "#eef2ff" : "#f1f5f9", color: m.Manager_Score ? "#4338ca" : "#64748b" }}>
                        {m.Manager_Score ? `${m.Manager_Score}%` : "ثبت نشده"}
                      </span>
                    </td>
                    {/* ✅ دکمه‌های تایید/رد سریع — فقط Pending + فقط اگر صلاحیت بررسی داشته باشد */}
                    <td style={{ padding: "14px 16px" }}>
                      {m.Status === "Pending" && canReview && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={(e) => handleQuickReview(e, m.Commute_ID, 'approve')} disabled={isPending}
                            style={{ padding: "6px 12px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: isPending ? "wait" : "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold", opacity: isPending ? 0.6 : 1 }}>
                            <Check style={{ width: "14px", height: "14px" }} /> تایید
                          </button>
                          <button onClick={(e) => handleQuickReview(e, m.Commute_ID, 'reject')} disabled={isPending}
                            style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: isPending ? "wait" : "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold", opacity: isPending ? 0.6 : 1 }}>
                            <X style={{ width: "14px", height: "14px" }} /> رد
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredMissions.length === 0 && (
                <tr><td colSpan={8} style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>ماموریتی یافت نشد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* پاپ‌آپ افزودن ماموریت */}
      {isModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="erp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "#fff7ed", padding: "10px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "#ed6e2b" }} /></div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>ثبت ماموریت جدید</h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>فقط زیرمجموعه‌های مستقیم شما قابل انتخاب هستند</p>
                </div>
              </div>
              <button className="erp-btn-close" onClick={() => setIsModalOpen(false)}><X style={{ width: "20px", height: "20px" }} /></button>
            </div>

            <form onSubmit={handleSubmit} className="erp-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

              {/* جستجوی کارمند */}
              <div style={{ gridColumn: "1 / -1", position: "relative" }}>
                <label style={labelStyle}>انتخاب پرسنل *</label>
                <div style={{ position: "relative" }}>
                  <Search style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8", zIndex: 1 }} />
                  <input type="text" className="erp-input" style={{ paddingRight: "40px", position: "relative", zIndex: 2 }} placeholder="نام یا کد کارمند را جستجو کنید..." value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} onFocus={() => setShowPersonnelList(true)} required />
                </div>
                {showPersonnelList && searchTerm && !selectedPersonnel && (
                  <>
                    {/* 👇 لایه شفاف: کلیک بیرون لیست، آن را می‌بندد (قبلاً هیچ‌جا بسته نمی‌شد) */}
                    <div style={{ position: "fixed", inset: 0, zIndex: 15 }} onClick={() => setShowPersonnelList(false)} />
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", maxHeight: "200px", overflowY: "auto", zIndex: 20, marginTop: "4px" }}>
                      {filteredPersonnel.map((p: any) => (
                        <div key={p.Personnel_ID} onClick={() => selectPersonnel(p)} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff7ed"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}>
                          <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>{p.Full_Name}</span>
                          <span style={{ fontSize: "12px", color: "#64748b", marginRight: "8px" }}>{p.Personnel_Code} - {p.OrganizationalPosition?.Name || "بدون جایگاه"}</span>
                        </div>
                      ))}
                      {filteredPersonnel.length === 0 && (
                        <div style={{ padding: "12px 16px", fontSize: "13px", color: "#94a3b8" }}>
                          {personnel.length === 0 ? "شما زیرمجموعه‌ای ندارید — از «تنظیمات سرپرستی» تعیین کنید" : "پرسنلی با این مشخصات یافت نشد"}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label style={labelStyle}>تاریخ ماموریت *</label>
                {isMounted ? <DatePicker value={dateVal} calendar={persian} locale={persian_fa} calendarPosition="bottom-right" onChange={setDateVal} format="YYYY/MM/DD" style={dateInputStyle} /> : <input type="text" className="erp-input" disabled />}
              </div>
              <div>
                <label style={labelStyle}>مدت زمان ماموریت (ساعت) *</label>
                <input name="commuteDuration" required type="number" min="0" step="0.5" className="erp-input" placeholder="مثلاً 2.5" />
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748b" }}>می توانید اعشار وارد کنید (مثلاً 1.5)</p>
              </div>

              <div>
                <label style={labelStyle}>نوع وسیله نقلیه *</label>
                <select name="commuteType" required className="erp-input">
                  {/* 👇 نسخه کامل شامل «سایر» — دقیقاً مثل قبل */}
                  {COMMUTE_TYPE_OPTIONS_MANAGER.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
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

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", paddingTop: "12px", borderTop: "1px solid #f1f5f9", marginTop: "8px" }}>
                <button type="submit" className="erp-btn-submit"><Save style={{ width: "18px", height: "18px" }} /> ثبت ماموریت</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: toast.includes('خطا') ? '#f87171' : 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, animation: 'slideUp 0.3s ease-out' }}>
          {!toast.includes('خطا') && <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />}
          {toast}
        </div>
      )}
    </div>
  );
}