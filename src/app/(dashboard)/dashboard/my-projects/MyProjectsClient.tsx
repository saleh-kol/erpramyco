"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestProjectCompletionAction } from "@/actions/myProjects";
import { Briefcase, X, CheckCircle, Clock, Calendar, User, Award, AlertTriangle, Crown } from "lucide-react";

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

  const handleTabChange = (status: string) =>
    router.push(`/dashboard/my-projects?status=${status}`);
  const openModal = (p: any) => {
    setSelectedProject(p);
    setIsModalOpen(true);
  };

  const handleCompletion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await requestProjectCompletionAction(formData);
    
    if (result?.error) {
      setToast(result.error);
    } else {
      setToast("درخواست اتمام پروژه برای مدیر ارسال شد");
    }
    setIsModalOpen(false);
    setTimeout(() => setToast(null), 3000);
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
        }}
      >
        <button
          onClick={() => handleTabChange("Active")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            backgroundColor: currentStatus === "Active" ? "#ed6e2b" : "#f1f5f9",
            color: currentStatus === "Active" ? "white" : "#64748b",
          }}
        >
          در حال انجام
        </button>
        <button
          onClick={() => handleTabChange("Completed")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            backgroundColor:
              currentStatus === "Completed" ? "#ed6e2b" : "#f1f5f9",
            color: currentStatus === "Completed" ? "white" : "#64748b",
          }}
        >
          اتمام یافته
        </button>
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
                      پاداش تحویل زودتر ({selectedProject.Golden_Bonus_Percent}%):
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "#166534" }}>
                      +{((Number(selectedProject.Budget) * Number(selectedProject.Golden_Bonus_Percent)) / 100).toLocaleString("fa-IR")} ریال
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
                      جریمه دیرکرد ({selectedProject.Delay_Penalty_Percent}%):
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "#991b1b" }}>
                      -{((Number(selectedProject.Budget) * Number(selectedProject.Delay_Penalty_Percent)) / 100).toLocaleString("fa-IR")} ریال
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

            {/* پاداش نهایی (بعد از تکمیل) */}
            {selectedProject.Final_Bonus != null && selectedProject.Status === "Completed" && (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "24px",
                  border: "2px solid #16a34a",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>
                  🎉 مبلغ نهایی دریافتی شما
                </span>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#166534",
                  }}
                >
                  {Number(selectedProject.Final_Bonus).toLocaleString("fa-IR")} ریال
                </p>
              </div>
            )}

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
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <CheckCircle style={{ width: "18px", height: "18px" }} /> ثبت
                    اتمام پروژه
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
            style={{ width: "20px", height: "20px", color: "#10b981" }}
          />
          {toast}
        </div>
      )}
    </div>
  );
}