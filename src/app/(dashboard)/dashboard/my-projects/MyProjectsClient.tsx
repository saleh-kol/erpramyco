"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestProjectCompletionAction } from "@/actions/myProjects";
import { Briefcase, X, CheckCircle, Clock, Calendar, User, Award, AlertTriangle, Crown } from "lucide-react";
import { getTimeFactor, calcMemberBonus } from "@/lib/project/bonus"; // ✅ منطق واحد پاداش

const toPersianDate = (date: Date | string) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fa-IR");
};

export default function MyProjectsClient({
  projects,
  currentStatus,
}: {
  projects: any[];
  currentStatus: string;
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string, ms = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  const handleTabChange = (status: string) =>
    router.push(`/dashboard/my-projects?status=${status}`);

  const openModal = (p: any) => {
    setSelectedProject(p);
    setIsModalOpen(true);
  };

  // ✅ فیکس: خطا → مودال باز بماند + پیام خطا؛ موفقیت → بستن + رفرش
  const handleCompletion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result: any = await requestProjectCompletionAction(formData);
    setIsSubmitting(false);

    if (result?.error) {
      showToast(`خطا: ${result.error}`, 5000);
      return; // مودال باز بماند
    }

    setIsModalOpen(false);
    showToast("درخواست اتمام پروژه برای مدیر ارسال شد");
    router.refresh(); // پروژه از تب Active به تب OnHold منتقل شود
  };

  const getStatusBadge = (status: string) => {
    if (status === "Completed")
      return { bg: "#f0fdf4", color: "#166534", text: "اتمام یافته" };
    if (status === "OnHold")
      return { bg: "#fff7ed", color: "#c2410c", text: "در انتظار تایید اتمام" };
    return { bg: "#eff6ff", color: "#1d4ed8", text: "در حال انجام" };
  };

  return (
    <div
      style={{
        backgroundColor: "#f1f5f9",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "20px 24px",
          marginBottom: "20px",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {/* ✅ تب OnHold اضافه شد — پروژه درخواست‌کرده دیگر محو نمی‌شود */}
        {[
          { key: "Active", label: "در حال انجام" },
          { key: "OnHold", label: "در انتظار تایید اتمام" },
          { key: "Completed", label: "اتمام یافته" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              backgroundColor: currentStatus === t.key ? "#ed6e2b" : "#f1f5f9",
              color: currentStatus === t.key ? "white" : "#64748b",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {projects.map((p: any) => {
          const status = getStatusBadge(p.Status);
          return (
            <div
              key={p.Project_ID}
              onClick={() => openModal(p)}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                border: p.Is_Leader ? "1px solid #fde68a" : "1px solid #e2e8f0",
                padding: "20px",
                cursor: "pointer",
                boxShadow: p.Is_Leader ? "0 2px 8px rgba(217, 119, 6, 0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    background: p.Is_Leader ? "#fef3c7" : "#fff7ed",
                    padding: "8px",
                    borderRadius: "10px",
                  }}
                >
                  {p.Is_Leader ? (
                    <Crown style={{ width: "20px", height: "20px", color: "#d97706" }} />
                  ) : (
                    <Briefcase style={{ width: "20px", height: "20px", color: "#ed6e2b" }} />
                  )}
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: status.bg,
                    color: status.color,
                  }}
                >
                  {status.text}
                </span>
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#0f172a",
                }}
              >
                {p.Project_Name}
              </h3>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                کد: {p.Project_Code} | مهلت: {toPersianDate(p.End_Date)}
              </p>

              {/* بج مسئول پروژه */}
              {p.Is_Leader && (
                <div style={{ 
                  marginTop: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "#fef3c7",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#92400e",
                  border: "1px solid #fde68a"
                }}>
                  <Crown style={{ width: "12px", height: "12px" }} />
                  شما مسئول این پروژه هستید
                </div>
              )}

              {/* نمایش نقش کاربر در کارت */}
              {p.My_Role && (
                <div style={{ 
                  marginTop: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: "#eff6ff",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe"
                }}>
                  <User style={{ width: "12px", height: "12px" }} />
                  {p.My_Role}
                </div>
              )}
            </div>
          );
        })}
        {projects.length === 0 && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "40px",
              textAlign: "center",
              color: "#94a3b8",
              gridColumn: "1 / -1",
            }}
          >
            پروژه‌ای یافت نشد
          </div>
        )}
      </div>

      {/* پاپ‌آپ جزئیات پروژه */}
      {isModalOpen && selectedProject && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              border: selectedProject.Is_Leader ? "4px solid #d97706" : "4px solid #ed6e2b",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {selectedProject.Is_Leader && <Crown style={{ width: "20px", height: "20px", color: "#d97706" }} />}
                {selectedProject.Project_Name}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X style={{ color: "#64748b" }} />
              </button>
            </div>

            {/* بج مسئول پروژه */}
            {selectedProject.Is_Leader && (
              <div
                style={{
                  backgroundColor: "#fef3c7",
                  padding: "14px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  border: "1px solid #fde68a",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px", color: "#92400e", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Crown style={{ width: "16px", height: "16px" }} />
                  👑 شما مسئول این پروژه هستید
                </span>
                <span style={{ fontSize: "11px", color: "#92400e" }}>
                  پایان پروژه فقط توسط شما ثبت می‌شود
                </span>
              </div>
            )}

            {/* نقش کاربر در پروژه */}
            {selectedProject.My_Role && (
              <div
                style={{
                  backgroundColor: "#eff6ff",
                  padding: "14px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px", color: "#1d4ed8", display: "flex", alignItems: "center", gap: "6px" }}>
                  <User style={{ width: "16px", height: "16px" }} />
                  نقش شما در پروژه
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1d4ed8",
                  }}
                >
                  {selectedProject.My_Role}
                </span>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: "#64748b" }}>
                شرح پروژه
              </label>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "14px",
                  color: "#334155",
                  backgroundColor: "#f8fafc",
                  padding: "12px",
                  borderRadius: "10px",
                }}
              >
                {selectedProject.Description || "توضیحاتی ثبت نشده است."}
              </p>
            </div>

            {/* تاریخ‌ها */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  📅 تاریخ شروع
                </span>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {toPersianDate(selectedProject.Start_Date)}
                </p>
              </div>
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  📅 تاریخ پایان
                </span>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {toPersianDate(selectedProject.End_Date)}
                </p>
              </div>
            </div>

            {/* تاریخ طلایی و درصد پاداش */}
            {selectedProject.Golden_Date && (
              <div
                style={{
                  backgroundColor: "#fff7ed",
                  padding: "14px",
                  borderRadius: "10px",
                  marginBottom: "12px",
                  border: "1px solid #fed7aa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#c2410c", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Award style={{ width: "14px", height: "14px" }} />
                    🥇 تاریخ طلایی
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#c2410c",
                    }}
                  >
                    {toPersianDate(selectedProject.Golden_Date)}
                  </span>
                </div>
                {Number(selectedProject.Golden_Bonus_Percent) > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "8px",
                      borderTop: "1px dashed #fed7aa",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>
                      ضریب پاداش طلایی ({selectedProject.Golden_Bonus_Percent}%)
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                      روی دستمزد پایه شما اعمال می‌شود
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* تاریخ دیرکرد و درصد جریمه */}
            {selectedProject.Deadline_Date && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  padding: "14px",
                  borderRadius: "10px",
                  marginBottom: "12px",
                  border: "1px solid #fecaca",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertTriangle style={{ width: "14px", height: "14px" }} />
                    ⏰ تاریخ دیرکرد (حد نهایی)
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#ef4444",
                    }}
                  >
                    {toPersianDate(selectedProject.Deadline_Date)}
                  </span>
                </div>
                {Number(selectedProject.Delay_Penalty_Percent) > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "8px",
                      borderTop: "1px dashed #fecaca",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#991b1b", fontWeight: 600 }}>
                      ضریب جریمه دیرکرد ({selectedProject.Delay_Penalty_Percent}%)
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                      روی دستمزد پایه شما اعمال می‌شود
                    </span>
                  </div>
                )}
                <p style={{ margin: "8px 0 0 0", fontSize: "10px", color: "#ef4444", fontWeight: 600 }}>
                  ⚠️ بعد از این تاریخ پروژه لغو می‌شود و هیچ پاداشی دریافت نخواهید کرد.
                </p>
              </div>
            )}

            {/* بودجه پروژه */}
            <div
              style={{
                backgroundColor: "#fff7ed",
                padding: "14px",
                borderRadius: "10px",
                marginBottom: "12px",
                border: "1px solid #fed7aa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "13px", color: "#c2410c", fontWeight: 600 }}>
                💰 بودجه پایه پروژه
              </span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {Number(selectedProject.Budget || 0).toLocaleString("fa-IR")} ریال
              </span>
            </div>

            {/* ✅ پاداش نهایی — منبع واحد: lib/project/bonus */}
            {(() => {
              const wage = Number(selectedProject.My_Wage || 0);

              // اتمام یافته → پاداش ذخیره‌شده برای «این عضو»
              if (selectedProject.Status === "Completed" && selectedProject.My_Final_Bonus != null) {
                return (
                  <div style={{ backgroundColor: "#f0fdf4", padding: "16px", borderRadius: "10px", marginBottom: "24px", border: "2px solid #16a34a", textAlign: "center" }}>
                    <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>
                      🎉 پاداش نهایی شما از این پروژه
                    </span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "24px", fontWeight: "bold", color: "#166534" }}>
                      {Number(selectedProject.My_Final_Bonus).toLocaleString("fa-IR")} ریال
                    </p>
                    <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                      دستمزد پایه: {wage.toLocaleString("fa-IR")} ریال × ضریب زمانی × ضریب مدیر ({selectedProject.Manager_Score ?? 100}٪)
                    </p>
                  </div>
                );
              }

              // در حال انجام → پیش‌بینی «اگر امروز تحویل داده شود»
              if (selectedProject.Status === "Active" && wage > 0) {
                const factor = getTimeFactor(selectedProject, new Date());
                const preview = calcMemberBonus(wage, factor, selectedProject.Manager_Score ?? 100);
                const color = factor.percent > 0 ? "#16a34a" : factor.percent < 0 ? "#ef4444" : "#1d4ed8";
                return (
                  <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", marginBottom: "24px", border: "1px dashed #cbd5e1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>📊 پیش‌بینی پاداش شما (اگر امروز تحویل شود)</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color }}>{factor.reason}</span>
                    </div>
                    <p style={{ margin: "6px 0 0 0", fontSize: "18px", fontWeight: "bold", color }}>
                      ≈ {preview.toLocaleString("fa-IR")} ریال
                    </p>
                  </div>
                );
              }

              return null;
            })()}

            {/* دکمه‌های وضعیت - فقط مسئول می‌تواند اتمام ثبت کند */}
            {selectedProject.Status === "Active" && (
              selectedProject.Is_Leader ? (
                <form onSubmit={handleCompletion}>
                  <input
                    type="hidden"
                    name="projectId"
                    value={selectedProject.Project_ID}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: isSubmitting ? "#94a3b8" : "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      cursor: isSubmitting ? "wait" : "pointer",
                      fontWeight: "bold",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <CheckCircle style={{ width: "18px", height: "18px" }} /> {isSubmitting ? "در حال ارسال..." : "ثبت اتمام پروژه"}
                  </button>
                </form>
              ) : (
                <div
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#f8fafc",
                    color: "#64748b",
                    borderRadius: "10px",
                    fontSize: "13px",
                    textAlign: "center",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  ثبت اتمام پروژه فقط توسط مسئول پروژه (👑) انجام می‌شود
                </div>
              )
            )}
            {selectedProject.Status === "OnHold" && (
              <div
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#fff7ed",
                  color: "#c2410c",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  border: "1px solid #fed7aa",
                }}
              >
                <Clock style={{ width: "18px", height: "18px" }} /> در انتظار
                تایید اتمام توسط مدیر
              </div>
            )}
            {selectedProject.Status === "Completed" && (
              <div
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#f0fdf4",
                  color: "#166534",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <CheckCircle style={{ width: "18px", height: "18px" }} /> این
                پروژه تکمیل شده است
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#0f172a",
            color: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            boxShadow: "0 10px 15px rgba(0,0,0,0.3)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <CheckCircle
            style={{ width: "20px", height: "20px", color: toast.includes("خطا") ? "#f87171" : "#10b981" }}
          />
          {toast}
        </div>
      )}
    </div>
  );
}