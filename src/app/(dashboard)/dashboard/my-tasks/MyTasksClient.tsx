"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeTaskAction } from "@/actions/tasks";
import {
  Bell, Search, X, CheckCircle, Calendar, Flag, Check, Clock, MessageSquare, UserCheck,
} from "lucide-react";
import { TASK_TABS, toPersianDate, translatePriority, getTaskBadge } from "@/lib/task/constants";

// آیکون‌های وضعیت برای لیست (نگاشت بر اساس وضعیت دیتابیس)
const STATUS_ICONS: Record<string, React.ReactNode> = {
  Approved:  <CheckCircle style={{ width: "24px", height: "24px", color: "#16a34a" }} />,
  Submitted: <Clock style={{ width: "24px", height: "24px", color: "#1d4ed8" }} />,
  Pending:   <Bell style={{ width: "24px", height: "24px", color: "#ed6e2b" }} />,
};

export default function MyTasksClient({
  tasks,
  currentStatus,
}: {
  tasks: any[];
  currentStatus: string;
}) {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ---------- Toast ----------
  const showToast = (msg: string, ms = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  const filteredTasks = tasks.filter((t: any) =>
    t.Title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTabChange = (status: string) => {
    router.push(`/dashboard/my-tasks?status=${status}`);
  };

  // ---------- تکمیل ابلاغیه (Pending → Submitted) ----------
  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result: any = await completeTaskAction(formData);

      if (result?.error) {
        showToast(`خطا: ${result.error}`, 5000);
        return;
      }

      setSelectedTask(null);
      showToast("انجام ابلاغیه ثبت شد و برای تایید سرپرست ارسال گردید"); // ✅ فیکس متن
      router.refresh();
    });
  };

  return (
    <div
      style={{
        backgroundColor: "#f1f5f9",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <style>{`
        .erp-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.2s ease-out;
          overflow-y: auto;
        }

        .erp-modal-container {
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          width: 100%;
          max-width: 600px;
          max-height: calc(100vh - 32px);
          overflow-y: auto;
          border-top: 4px solid #ed6e2b;
          animation: scaleIn 0.2s ease-out;
        }

        .erp-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          position: sticky;
          top: 0;
          background: white;
          z-index: 2;
        }

        .erp-modal-body {
          padding: 24px;
        }

        .erp-input {
          width: 100%;
          padding: 12px 40px 12px 16px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          outline: none;
          font-size: 14px;
          font-family: inherit;
          background-color: white;
          box-sizing: border-box;
        }

        .erp-input:focus {
          border-color: #ed6e2b;
          box-shadow: 0 0 0 3px rgba(237, 110, 43, 0.1);
        }

        .completion-note-box {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .completion-note-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .completion-note-text {
          margin: 0;
          font-size: 14px;
          color: #431407;
          line-height: 1.8;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {/* هدر، جستجو و تب‌ها */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "20px 24px",
          marginBottom: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #ed6e2b 0%, #ea580c 100%)",
              padding: "10px",
              borderRadius: "12px",
            }}
          >
            <Bell style={{ width: "24px", height: "24px", color: "white" }} />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "bold",
              color: "#0f172a",
            }}
          >
            ابلاغیه‌های من
          </h1>
        </div>

        {/* تب‌ها از config مرکزی رندر می‌شوند */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {TASK_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                backgroundColor: currentStatus === tab.key ? "#ed6e2b" : "#f1f5f9",
                color: currentStatus === tab.key ? "white" : "#64748b",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "300px",
          }}
        >
          <Search
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "20px",
              height: "20px",
              color: "#94a3b8",
            }}
          />

          <input
            type="text"
            placeholder="جستجوی ابلاغیه..."
            className="erp-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* لیست ابلاغیه‌ها */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {filteredTasks.map((t: any) => {
          const icon = STATUS_ICONS[t.Status] || STATUS_ICONS.Pending;
          const badge = getTaskBadge(t.Status);

          return (
            <div
              key={t.Task_ID}
              onClick={() => setSelectedTask(t)}
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#fed7aa";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
              }}
            >
              <div
                style={{
                  background: badge.bg,
                  padding: "12px",
                  borderRadius: "12px",
                }}
              >
                {icon}
              </div>

              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#0f172a",
                  }}
                >
                  {t.Title}
                  {t.Completion_Note && (
                    <span title="دارای یادداشت ثبت شده" style={{ marginRight: "6px" }}>📋</span>
                  )}
                </h3>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "6px",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    <Calendar style={{ width: "14px", height: "14px" }} />
                    مهلت: {toPersianDate(t.Due_Date)}
                  </span>

                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color:
                        t.Priority === "Urgent"
                          ? "#ef4444"
                          : t.Priority === "High"
                          ? "#c2410c"
                          : "#64748b",
                    }}
                  >
                    <Flag style={{ width: "14px", height: "14px" }} />
                    {translatePriority(t.Priority)}
                  </span>
                </div>
              </div>

              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: badge.bg,
                  color: badge.color,
                }}
              >
                {badge.text}
              </span>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              padding: "40px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            هیچ ابلاغیه‌ای در این بخش وجود ندارد
          </div>
        )}
      </div>

      {/* پاپ‌آپ جزئیات ابلاغیه */}
      {selectedTask && (
        <div
          className="erp-modal-overlay"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="erp-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="erp-modal-header">
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#0f172a",
                }}
              >
                جزئیات ابلاغیه
              </h2>

              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  padding: "4px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <X style={{ color: "#64748b" }} />
              </button>
            </div>

            <div className="erp-modal-body">
              {/* موضوع */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#64748b",
                    marginBottom: "4px",
                  }}
                >
                  موضوع
                </label>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#0f172a",
                  }}
                >
                  {selectedTask.Title}
                </h3>
              </div>

              {/* مهلت و اولویت */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "12px",
                    borderRadius: "10px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    مهلت انجام
                  </span>

                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {toPersianDate(selectedTask.Due_Date)}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "12px",
                    borderRadius: "10px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    اولویت
                  </span>

                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color:
                        selectedTask.Priority === "Urgent"
                          ? "#ef4444"
                          : selectedTask.Priority === "High"
                          ? "#c2410c"
                          : "#0f172a",
                    }}
                  >
                    {translatePriority(selectedTask.Priority)}
                  </span>
                </div>
              </div>

              {/* متن ابلاغیه */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#64748b",
                    marginBottom: "4px",
                  }}
                >
                  متن ابلاغیه
                </label>

                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#334155",
                    lineHeight: 1.8,
                    backgroundColor: "#f8fafc",
                    padding: "16px",
                    borderRadius: "10px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {selectedTask.Description || "توضیحات اضافه‌ای ثبت نشده است."}
                </p>
              </div>

              {/* یادداشت تکمیل ابلاغیه توسط کاربر */}
              {/* فقط وقتی وضعیت Pending نیست، باکس نمایشی نشان بده */}
              {selectedTask.Status !== "Pending" && (
                <div className="completion-note-box">
                  <div className="completion-note-header">
                    <MessageSquare
                      style={{
                        width: "18px",
                        height: "18px",
                        color: "#ea580c",
                      }}
                    />

                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#9a3412",
                      }}
                    >
                      یادداشت کاربر
                    </span>
                  </div>

                  {selectedTask.Completion_Note ? (
                    <p className="completion-note-text">
                      {selectedTask.Completion_Note}
                    </p>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#9a3412",
                      }}
                    >
                      کاربر هنگام تکمیل ابلاغیه یادداشتی ثبت نکرده است.
                    </p>
                  )}
                </div>
              )}

              {/* وضعیت ابلاغیه */}
              {selectedTask.Status === "Pending" ? (
                <form
                  onSubmit={handleComplete}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <input
                    type="hidden"
                    name="taskId"
                    value={selectedTask.Task_ID}
                  />

                  {/* فیلد یادداشت کارمند */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#475569",
                        marginBottom: "8px",
                      }}
                    >
                      یادداشت برای سرپرست (اختیاری)
                    </label>

                    <textarea
                      name="note"
                      rows={3}
                      defaultValue={selectedTask.Completion_Note || ""}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        outline: "none",
                        fontSize: "14px",
                        resize: "vertical",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                      }}
                      placeholder="در صورت نیاز به توضیح بیشتر برای سرپرست..."
                    ></textarea>

                    {/* راهنما وقتی ابلاغیه قبلاً رد شده و یادداشت قدیمی دارد */}
                    {selectedTask.Completion_Note && (
                      <p
                        style={{
                          margin: "6px 0 0 0",
                          fontSize: "11px",
                          color: "#d97706",
                        }}
                      >
                        ⚠️ این ابلاغیه قبلاً توسط سرپرست بازگشت داده شده — یادداشت قبلی قابل ویرایش است.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    style={{
                      width: "100%",
                      padding: "14px",
                      backgroundColor: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      cursor: isPending ? "wait" : "pointer",
                      fontWeight: "bold",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 6px rgba(22,163,74,0.2)",
                      opacity: isPending ? 0.7 : 1,
                    }}
                  >
                    <Check style={{ width: "20px", height: "20px" }} />
                    {isPending ? "در حال ارسال..." : "انجام شد و ارسال برای تایید"}
                  </button>
                </form>
              ) : selectedTask.Status === "Submitted" ? (
                <div
                  style={{
                    width: "100%",
                    padding: "14px",
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    border: "1px solid #bfdbfe",
                    boxSizing: "border-box",
                  }}
                >
                  <Clock style={{ width: "20px", height: "20px" }} />
                  {/* ✅ فیکس: سرپرست مستقیم — نه همیشه مدیرعامل */}
                  در انتظار بررسی و تایید سرپرست
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    padding: "14px",
                    backgroundColor: "#f0fdf4",
                    color: "#166534",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    border: "1px solid #bbf7d0",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle style={{ width: "20px", height: "20px" }} />
                    این ابلاغیه تکمیل و تایید شده است
                  </div>
                  {/* ✅ جدید: نمایش تاییدکننده و تاریخ */}
                  {selectedTask.Reviewer?.Full_Name && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#15803d" }}>
                      <UserCheck style={{ width: "12px", height: "12px" }} />
                      تاییدکننده: {selectedTask.Reviewer.Full_Name}
                      {selectedTask.Reviewed_At && ` | ${toPersianDate(selectedTask.Reviewed_At)}`}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 500,
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <CheckCircle
            style={{
              width: "20px",
              height: "20px",
              color: toast.includes("خطا") ? "#f87171" : "#10b981",
            }}
          />
          {toast}
        </div>
      )}
    </div>
  );
}