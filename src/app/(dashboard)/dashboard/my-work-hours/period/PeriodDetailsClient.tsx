"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Calendar,
  Briefcase,
  Navigation,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const toPersianDate = (date: Date | string) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fa-IR");
};

const toPersianTime = (timeStr: Date | string) => {
  if (!timeStr) return "-";
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function PeriodDetailsClient({ data }: { data: any }) {
  const router = useRouter();
  const { reports = [], projects = [], missions = [], summary = {} } = data;

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    marginBottom: "20px",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "12px",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px",
    borderRadius: "8px",
    alignItems: "center",
    marginBottom: "8px",
  };

  /*
   * داده‌های نمودار:
   * هر رکورد reports مربوط به یک روز است و Work_Hours
   * میزان کارکرد همان روز را مشخص می‌کند.
   */
  const dailyChartData = reports.map((r: any) => ({
    date: toPersianDate(r.Report_Date),
    hours: Number(r.Work_Hours || 0),
    checkIn: toPersianTime(r.Check_In),
    checkOut: toPersianTime(r.Check_Out),
  }));

  const maxReportedHours = Math.max(
    10,
    ...dailyChartData.map((item: any) => item.hours),
  );

  // برای اینکه محور نمودار عددهای تمیز داشته باشد
  const chartMax = Math.ceil(maxReportedHours / 2) * 2;
  const chartSteps = Array.from(
    { length: chartMax / 2 + 1 },
    (_, index) => chartMax - index * 2,
  );

  const totalChartHours = dailyChartData.reduce(
    (sum: number, item: any) => sum + item.hours,
    0,
  );

  return (
    <div
      dir="rtl"
      style={{
        backgroundColor: "#f1f5f9",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .work-chart-bar {
          transition:
            height 0.25s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .work-chart-bar:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 18px rgba(237, 110, 43, 0.22) !important;
        }

        .work-chart-scroll {
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .work-chart-scroll::-webkit-scrollbar {
          height: 6px;
        }

        .work-chart-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .work-chart-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>

      {/* عنوان صفحه */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => router.push("/dashboard/my-work-hours")}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "8px",
            cursor: "pointer",
            backgroundColor: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="بازگشت"
        >
          <ArrowRight
            style={{
              width: "20px",
              height: "20px",
              color: "#64748b",
            }}
          />
        </button>

        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: "bold",
            color: "#0f172a",
          }}
        >
          ریز گزارشات: {summary.periodLabel}
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* ستون اصلی */}
        <div>
          {/* =========================
              نمودار کارکرد روزانه
          ========================== */}
          <div style={cardStyle}>
            <div
              style={{
                ...headerStyle,
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    backgroundColor: "#fff7ed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock
                    style={{
                      width: "20px",
                      height: "20px",
                      color: "#ed6e2b",
                    }}
                  />
                </div>

                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#0f172a",
                    }}
                  >
                    نمودار کارکرد روزانه
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      color: "#94a3b8",
                    }}
                  >
                    میزان ساعت کارکرد ثبت‌شده در هر روز
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  textAlign: "center",
                  minWidth: "90px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "#c2410c",
                    marginBottom: "2px",
                  }}
                >
                  مجموع کارکرد
                </div>

                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#ea580c",
                  }}
                >
                  {totalChartHours.toFixed(2)}
                  <span
                    style={{
                      fontSize: "10px",
                      marginRight: "4px",
                      fontWeight: 600,
                    }}
                  >
                    ساعت
                  </span>
                </div>
              </div>
            </div>

            {dailyChartData.length === 0 ? (
              <div
                style={{
                  height: "280px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  fontSize: "13px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                }}
              >
                اطلاعات کارکردی برای نمایش نمودار وجود ندارد
              </div>
            ) : (
              <div className="work-chart-scroll">
                <div
                  style={{
                    position: "relative",
                    height: "320px",
                    minWidth: `${Math.max(620, dailyChartData.length * 72)}px`,
                    padding: "22px 24px 52px 58px",
                    boxSizing: "border-box",
                  }}
                >
                  {/* خطوط و اعداد محور Y */}
                  <div
                    style={{
                      position: "absolute",
                      top: "22px",
                      bottom: "52px",
                      left: "58px",
                      right: "24px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      pointerEvents: "none",
                    }}
                  >
                    {chartSteps.map((value) => (
                      <div
                        key={value}
                        style={{
                          position: "relative",
                          width: "100%",
                          borderTop: "1px dashed #e2e8f0",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            right: "calc(100% + 10px)",
                            top: "-8px",
                            fontSize: "10px",
                            color: "#94a3b8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* خط استاندارد ۸ ساعت */}
                  {chartMax >= 8 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "58px",
                        right: "24px",
                        top: `${
                          22 + ((chartMax - 8) / chartMax) * (320 - 22 - 52)
                        }px`,
                        borderTop: "1px solid #ed6e2b",
                        zIndex: 2,
                        pointerEvents: "none",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "-19px",
                          fontSize: "10px",
                          color: "#c2410c",
                          fontWeight: 700,
                          backgroundColor: "#fff7ed",
                          border: "1px solid #fed7aa",
                          padding: "2px 6px",
                          borderRadius: "5px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        استاندارد ۸ ساعت
                      </span>
                    </div>
                  )}

                  {/* ستون‌ها */}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 3,
                      height: "100%",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-around",
                      gap: "10px",
                    }}
                  >
                    {dailyChartData.map((item: any, index: number) => {
                      const barHeight =
                        item.hours > 0
                          ? Math.max((item.hours / chartMax) * 100, 2)
                          : 0;

                      const isOvertime = item.hours > 8;
                      const isNormal = item.hours >= 8;

                      return (
                        <div
                          key={`${item.date}-${index}`}
                          style={{
                            flex: 1,
                            minWidth: "48px",
                            maxWidth: "72px",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-end",
                          }}
                        >
                          {/* مقدار */}
                          <div
                            style={{
                              height: "22px",
                              fontSize: "11px",
                              fontWeight: 800,
                              color: isOvertime ? "#c2410c" : "#334155",
                              direction: "ltr",
                            }}
                          >
                            {item.hours.toFixed(1)}
                          </div>

                          {/* میله */}
                          <div
                            className="work-chart-bar"
                            style={{
                              width: "28px",
                              height: `${barHeight}%`,
                              minHeight: item.hours > 0 ? "5px" : "0px",
                              background: isOvertime
                                ? "linear-gradient(180deg, #fb923c, #ea580c)"
                                : isNormal
                                  ? "linear-gradient(180deg, #fdba74, #f97316)"
                                  : "linear-gradient(180deg, #93c5fd, #3b82f6)",
                              borderRadius: "8px 8px 3px 3px",
                              boxShadow: isOvertime
                                ? "0 4px 10px rgba(234,88,12,0.16)"
                                : "0 3px 8px rgba(59,130,246,0.12)",
                              cursor: "default",
                            }}
                            title={`${item.date} | ${item.hours.toFixed(
                              2,
                            )} ساعت | ورود: ${item.checkIn} | خروج: ${
                              item.checkOut
                            }`}
                          />

                          {/* تاریخ */}
                          <div
                            style={{
                              height: "35px",
                              marginTop: "10px",
                              fontSize: "10px",
                              color: "#64748b",
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "center",
                            }}
                          >
                            {item.date}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* راهنمای نمودار */}
            {dailyChartData.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "18px",
                  marginTop: "8px",
                  paddingTop: "12px",
                  borderTop: "1px solid #f1f5f9",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "#64748b",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "3px",
                      backgroundColor: "#3b82f6",
                    }}
                  />
                  کمتر از ۸ ساعت
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "#64748b",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "3px",
                      backgroundColor: "#f97316",
                    }}
                  />
                  ۸ ساعت
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "#64748b",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "3px",
                      backgroundColor: "#ea580c",
                    }}
                  />
                  اضافه‌کاری
                </div>
              </div>
            )}
          </div>

          {/* =========================
              جدول کارکرد روزانه + پروژه‌ها و ماموریت‌ها
          ========================== */}
          <div
            className="details-bottom-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
              gap: "20px",
              alignItems: "start",
            }}
          >
            <div style={cardStyle}>
              <div style={headerStyle}>
                <Clock
                  style={{
                    width: "20px",
                    height: "20px",
                    color: "#ed6e2b",
                  }}
                />

                <h2
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#0f172a",
                  }}
                >
                  میزان کارکرد هر روز
                </h2>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "650px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f8fafc",
                        textAlign: "right",
                      }}
                    >
                      <th
                        style={{
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        تاریخ
                      </th>

                      <th
                        style={{
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        ورود
                      </th>

                      <th
                        style={{
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        خروج
                      </th>

                      <th
                        style={{
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        ساعت
                      </th>

                      <th
                        style={{
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        نوع کار
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reports.map((r: any, index: number) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "13px",
                            color: "#334155",
                            fontWeight: 600,
                          }}
                        >
                          {toPersianDate(r.Report_Date)}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            fontSize: "13px",
                            color: "#334155",
                          }}
                        >
                          {toPersianTime(r.Check_In) || "-"}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            fontSize: "13px",
                            color: "#334155",
                          }}
                        >
                          {toPersianTime(r.Check_Out) || "-"}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            fontSize: "13px",
                            color: "#0f172a",
                            fontWeight: "bold",
                          }}
                        >
                          {Number(r.Work_Hours || 0).toFixed(2)}
                        </td>

                        <td
                          style={{
                            padding: "12px",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          {r.PR_Work_Types?.Work_Type_Name || "-"}
                        </td>
                      </tr>
                    ))}

                    {reports.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            color: "#94a3b8",
                          }}
                        >
                          گزارشی در این بازه ثبت نشده است
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =========================
              پروژه‌ها و ماموریت‌ها
          ========================== */}

            <div style={cardStyle}>
              <div style={headerStyle}>
                <Briefcase
                  style={{
                    width: "20px",
                    height: "20px",
                    color: "#ed6e2b",
                  }}
                />

                <h2
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#0f172a",
                  }}
                >
                  پروژه‌ها و ماموریت‌های بازه
                </h2>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <h4
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      marginBottom: "8px",
                    }}
                  >
                    پروژه‌ها
                  </h4>

                  {projects.map((p: any) => (
                    <div
                      key={p.Project_ID}
                      style={{
                        backgroundColor: "#f8fafc",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        marginBottom: "6px",
                        fontSize: "13px",
                        color: "#334155",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Briefcase
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "#3b82f6",
                        }}
                      />
                      {p.Project_Name}
                    </div>
                  ))}

                  {projects.length === 0 && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      پروژه‌ای ندارد
                    </p>
                  )}
                </div>

                <div>
                  <h4
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      marginBottom: "8px",
                    }}
                  >
                    ماموریت‌ها
                  </h4>

                  {missions.map((m: any) => (
                    <div
                      key={m.Commute_ID}
                      style={{
                        backgroundColor: "#f8fafc",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        marginBottom: "6px",
                        fontSize: "12px",
                        color: "#334155",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Navigation
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "#ef4444",
                        }}
                      />
                      {m.Origin} به {m.Destination}
                    </div>
                  ))}

                  {missions.length === 0 && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      ماموریتی ندارد
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            ستون خلاصه
        ========================== */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <CheckCircle
              style={{
                width: "20px",
                height: "20px",
                color: "#ed6e2b",
              }}
            />

            <h2
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "bold",
                color: "#0f172a",
              }}
            >
              گزارش کل کار
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0",
            }}
          >
            <div
              style={{
                ...rowStyle,
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                حداکثر ساعت مجاز:
              </span>

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#0f172a",
                }}
              >
                {summary.maxHours} ساعت
              </span>
            </div>

            <div
              style={{
                ...rowStyle,
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                حداکثر اضافه کاری مجاز:
              </span>

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#0f172a",
                }}
              >
                {summary.maxOvertime} ساعت
              </span>
            </div>

            <div
              style={{
                ...rowStyle,
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#1d4ed8",
                  fontWeight: 600,
                }}
              >
                مجموع ساعت کارکرد:
              </span>

              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "#1e40af",
                }}
              >
                {summary.totalHours} ساعت
              </span>
            </div>

            <div
              style={{
                ...rowStyle,
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#166534",
                  fontWeight: 600,
                }}
              >
                ساعت کارکرد عادی:
              </span>

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#166534",
                }}
              >
                {summary.regularHours} ساعت
              </span>
            </div>

            <div
              style={{
                ...rowStyle,
                backgroundColor: "#fff7ed",
                border: "1px solid #fed7aa",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#c2410c",
                  fontWeight: 600,
                }}
              >
                ساعت اضافه کاری:
              </span>

              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#c2410c",
                }}
              >
                {summary.overtimeHours} ساعت
              </span>
            </div>

            {/* وضعیت حد نصاب */}
            <div
              style={{
                marginTop: "16px",
                padding: "14px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: "bold",
                fontSize: "14px",
                backgroundColor:
                  summary.difference >= 0 ? "#f0fdf4" : "#fef2f2",
                color: summary.difference >= 0 ? "#166534" : "#991b1b",
                border:
                  summary.difference >= 0
                    ? "1px solid #bbf7d0"
                    : "1px solid #fecaca",
              }}
            >
              {summary.difference >= 0 ? (
                <CheckCircle
                  style={{
                    width: "18px",
                    height: "18px",
                  }}
                />
              ) : (
                <AlertCircle
                  style={{
                    width: "18px",
                    height: "18px",
                  }}
                />
              )}

              {summary.difference >= 0
                ? `${summary.difference} ساعت اضافه‌تر از حد نصاب کار کرده‌اید`
                : `${Math.abs(summary.difference)} ساعت کمتر از حد نصاب کار کرده‌اید`}
            </div>

            {/* جمعه و تعطیل کاری */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#fef2f2",
                  borderRadius: "10px",
                  textAlign: "center",
                  border: "1px solid #fecaca",
                }}
              >
                <Calendar
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "#ef4444",
                    margin: "0 auto 6px auto",
                  }}
                />

                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#991b1b",
                    fontWeight: 600,
                  }}
                >
                  جمعه کاری
                </p>

                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#991b1b",
                  }}
                >
                  {summary.fridayHours}
                  <span
                    style={{
                      fontSize: "11px",
                      marginRight: "3px",
                    }}
                  >
                    ساعت
                  </span>
                </p>
              </div>

              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#eff6ff",
                  borderRadius: "10px",
                  textAlign: "center",
                  border: "1px solid #bfdbfe",
                }}
              >
                <Briefcase
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "#3b82f6",
                    margin: "0 auto 6px auto",
                  }}
                />

                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#1d4ed8",
                    fontWeight: 600,
                  }}
                >
                  تعطیل کاری
                </p>

                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#1d4ed8",
                  }}
                >
                  {summary.holidayHours}
                  <span
                    style={{
                      fontSize: "11px",
                      marginRight: "3px",
                    }}
                  >
                    ساعت
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`

        .details-bottom-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1100px) {
          .details-bottom-grid {
            grid-template-columns: minmax(0, 1.5fr) minmax(260px, 1fr) !important;
          }
        }

        @media (max-width: 850px) {
          .details-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 900px) {
          .work-chart-scroll {
            margin-left: -4px;
            margin-right: -4px;
          }
        }

        @media (max-width: 768px) {
          .work-chart-scroll > div {
            min-width: 620px !important;
          }
        }
      `}</style>
    </div>
  );
}
