"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewLeaveRequestAction } from "@/actions/leave";
import { reviewProjectCompletionAction } from "@/actions/myProjects";
import { reviewMissionRequestAction } from "@/actions/myMissions";
import {
  Search,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  UserCircle2,
  Briefcase,
  Calendar,
  Navigation,
  Crown,
} from "lucide-react";

const toPersianDate = (date: Date | string) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fa-IR");
};

export default function LeaveApprovalsClient({
  requests,
  currentStatus,
  projects,
  missions,
}: {
  requests: any[];
  currentStatus: string;
  projects: any[];
  missions: any[];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"leaves" | "projects" | "missions">("leaves");

  const handleTabChange = (status: string) => {
    router.push(`/dashboard/leave-approvals?status=${status}`);
  };

  const handleLeaveAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await reviewLeaveRequestAction(formData);
    if (result?.success) {
      setToast("وضعیت درخواست مرخصی تغییر کرد");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleProjectAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result: any = await reviewProjectCompletionAction(formData);
    if (result?.success) {
      setToast(result?.message || "وضعیت درخواست پروژه تغییر کرد");
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleMissionAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result: any = await reviewMissionRequestAction(formData);
    if (result?.success) {
      setToast("وضعیت درخواست ماموریت تغییر کرد");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Approved" || status === "Completed")
      return { bg: "#f0fdf4", color: "#166534", icon: <Check style={{ width: "14px", height: "14px" }} />, text: "تایید شده" };
    if (status === "Rejected" || status === "Active")
      return { bg: "#fef2f2", color: "#991b1b", icon: <XCircle style={{ width: "14px", height: "14px" }} />, text: "رد شده" };
    return { bg: "#fff7ed", color: "#c2410c", icon: <Clock style={{ width: "14px", height: "14px" }} />, text: "در انتظار تایید" };
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.Personnel_PR_Leave_Requests_Personnel_IDToPersonnel?.Full_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.PR_Leave_Types?.Leave_Type_Name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.Project_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.PR_Project_Assignments[0]?.Personnel?.Full_Name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredMissions = missions.filter(
    (m) =>
      m.Personnel?.Full_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.Origin?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: "14px",
    backgroundColor: "#f8fafc",
    boxSizing: "border-box",
  };

  const btnApprove: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "4px", padding: "8px 16px",
    backgroundColor: "#16a34a", color: "white", border: "none",
    borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px",
  };

  const btnReject: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "4px", padding: "8px 16px",
    backgroundColor: "#ef4444", color: "white", border: "none",
    borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px",
  };

  const thStyle: React.CSSProperties = {
    padding: "16px", fontSize: "13px", fontWeight: 700, color: "#64748b",
  };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>

      {/* تب‌های اصلی (مرخصی / پروژه / ماموریت) */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "12px 16px", marginBottom: "20px", display: "flex", gap: "12px" }}>
        <button
          onClick={() => setActiveTab("leaves")}
          style={{
            flex: 1, padding: "12px", borderRadius: "10px",
            border: `1px solid ${activeTab === "leaves" ? "#ed6e2b" : "#e2e8f0"}`,
            backgroundColor: activeTab === "leaves" ? "#fff7ed" : "white",
            color: activeTab === "leaves" ? "#c2410c" : "#64748b",
            fontWeight: "bold", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px", cursor: "pointer",
          }}
        >
          <Calendar style={{ width: "18px", height: "18px" }} /> مرخصی
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          style={{
            flex: 1, padding: "12px", borderRadius: "10px",
            border: `1px solid ${activeTab === "projects" ? "#ed6e2b" : "#e2e8f0"}`,
            backgroundColor: activeTab === "projects" ? "#fff7ed" : "white",
            color: activeTab === "projects" ? "#c2410c" : "#64748b",
            fontWeight: "bold", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px", cursor: "pointer",
          }}
        >
          <Briefcase style={{ width: "18px", height: "18px" }} /> پروژه
          {projects.length > 0 && currentStatus === "Pending" && (
            <span style={{ backgroundColor: "#ef4444", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px" }}>
              {projects.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("missions")}
          style={{
            flex: 1, padding: "12px", borderRadius: "10px",
            border: `1px solid ${activeTab === "missions" ? "#ed6e2b" : "#e2e8f0"}`,
            backgroundColor: activeTab === "missions" ? "#fff7ed" : "white",
            color: activeTab === "missions" ? "#c2410c" : "#64748b",
            fontWeight: "bold", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px", cursor: "pointer",
          }}
        >
          <Navigation style={{ width: "18px", height: "18px" }} /> ماموریت
          {missions.length > 0 && currentStatus === "Pending" && (
            <span style={{ backgroundColor: "#ef4444", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px" }}>
              {missions.length}
            </span>
          )}
        </button>
      </div>

      {/* جستجو */}
      <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "16px 24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <Search style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="جستجوی نام کارمند، نوع درخواست یا پروژه..."
            style={{ ...inputStyle, padding: "12px 40px 12px 16px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* تب‌های وضعیت */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          onClick={() => handleTabChange("Pending")}
          style={{
            padding: "10px 20px", borderRadius: "10px", border: "none",
            cursor: "pointer", fontWeight: "bold",
            backgroundColor: currentStatus === "Pending" ? "#ed6e2b" : "white",
            color: currentStatus === "Pending" ? "white" : "#64748b",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          در انتظار
        </button>
        <button
          onClick={() => handleTabChange("Approved")}
          style={{
            padding: "10px 20px", borderRadius: "10px", border: "none",
            cursor: "pointer", fontWeight: "bold",
            backgroundColor: currentStatus === "Approved" ? "#16a34a" : "white",
            color: currentStatus === "Approved" ? "white" : "#64748b",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          تایید شده
        </button>
        <button
          onClick={() => handleTabChange("Rejected")}
          style={{
            padding: "10px 20px", borderRadius: "10px", border: "none",
            cursor: "pointer", fontWeight: "bold",
            backgroundColor: currentStatus === "Rejected" ? "#ef4444" : "white",
            color: currentStatus === "Rejected" ? "white" : "#64748b",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          رد شده
        </button>
      </div>

      {/* جدول درخواست‌های مرخصی */}
      {activeTab === "leaves" && (
        <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", textAlign: "right" }}>
                <th style={thStyle}>کارمند</th>
                <th style={thStyle}>نوع مرخصی</th>
                <th style={thStyle}>از تاریخ</th>
                <th style={thStyle}>روز</th>
                <th style={thStyle}>وضعیت</th>
                {currentStatus === "Pending" && <th style={thStyle}>عملیات</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r: any) => {
                const status = getStatusBadge(r.Status);
                return (
                  <tr key={r.Leave_ID} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#0f172a", fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <UserCircle2 style={{ width: "24px", height: "24px", color: "#cbd5e1" }} />
                        {r.Personnel_PR_Leave_Requests_Personnel_IDToPersonnel?.Full_Name || "-"}
                      </div>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>
                      {r.PR_Leave_Types?.Leave_Type_Name || "-"}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>
                      {toPersianDate(r.Start_Date)}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>
                      {r.Days_Count || 1} روز
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, backgroundColor: status.bg, color: status.color }}>
                        {status.icon}
                        {status.text}
                      </span>
                    </td>
                    {currentStatus === "Pending" && (
                      <td style={{ padding: "16px", fontSize: "14px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <form onSubmit={handleLeaveAction}>
                            <input type="hidden" name="leaveId" value={r.Leave_ID} />
                            <input type="hidden" name="action" value="approve" />
                            <button type="submit" style={btnApprove}>
                              <Check style={{ width: "14px", height: "14px" }} /> تایید
                            </button>
                          </form>
                          <form onSubmit={handleLeaveAction}>
                            <input type="hidden" name="leaveId" value={r.Leave_ID} />
                            <input type="hidden" name="action" value="reject" />
                            <button type="submit" style={btnReject}>
                              <X style={{ width: "14px", height: "14px" }} /> رد
                            </button>
                          </form>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                    درخواستی یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* جدول درخواست‌های اتمام پروژه */}
      {activeTab === "projects" && (
        <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", textAlign: "right" }}>
                <th style={thStyle}>نام پروژه</th>
                <th style={thStyle}>👑 مسئول پروژه</th>
                <th style={thStyle}>تاریخ طلایی</th>
                <th style={thStyle}>تاریخ پایان</th>
                <th style={thStyle}>پاداش محاسبه شده</th>
                {currentStatus === "Pending" && <th style={thStyle}>عملیات</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p: any) => (
                <tr key={p.Project_ID} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                    {p.Project_Name}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#92400e", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Crown style={{ width: "14px", height: "14px", color: "#d97706" }} />
                      {p.Project_Leader?.Full_Name || "-"}
                    </div>
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#c2410c" }}>
                    {toPersianDate(p.Golden_Date)}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>
                    {toPersianDate(p.End_Date)}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    {p.Final_Bonus != null ? (
                      <span style={{ fontWeight: "bold", color: "#166534" }}>
                        {Number(p.Final_Bonus).toLocaleString("fa-IR")} ریال
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                        پس از تایید محاسبه می‌شود
                      </span>
                    )}
                  </td>
                  {currentStatus === "Pending" && (
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <form onSubmit={handleProjectAction}>
                          <input type="hidden" name="projectId" value={p.Project_ID} />
                          <input type="hidden" name="action" value="approve" />
                          <button type="submit" style={btnApprove}>
                            <Check style={{ width: "14px" }} /> تایید
                          </button>
                        </form>
                        <form onSubmit={handleProjectAction}>
                          <input type="hidden" name="projectId" value={p.Project_ID} />
                          <input type="hidden" name="action" value="reject" />
                          <button type="submit" style={btnReject}>
                            <X style={{ width: "14px" }} /> رد
                          </button>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                    درخواستی یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* جدول درخواست‌های ماموریت */}
      {activeTab === "missions" && (
        <div style={{ backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", textAlign: "right" }}>
                <th style={thStyle}>کارمند</th>
                <th style={thStyle}>مسیر</th>
                <th style={thStyle}>تاریخ</th>
                <th style={thStyle}>مبلغ</th>
                {currentStatus === "Pending" && <th style={thStyle}>عملیات</th>}
              </tr>
            </thead>
            <tbody>
              {filteredMissions.map((m: any) => (
                <tr key={m.Commute_ID} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <UserCircle2 style={{ width: "24px", height: "24px", color: "#cbd5e1" }} />
                      {m.Personnel?.Full_Name || "-"}
                    </div>
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>
                    {m.Origin} به {m.Destination}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>
                    {toPersianDate(m.Commute_Date)}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#334155" }}>
                    {Number(m.Amount || 0).toLocaleString("fa-IR")} ریال
                  </td>
                  {currentStatus === "Pending" && (
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <form onSubmit={handleMissionAction}>
                          <input type="hidden" name="commuteId" value={m.Commute_ID} />
                          <input type="hidden" name="action" value="approve" />
                          <button type="submit" style={btnApprove}>
                            <Check style={{ width: "14px" }} /> تایید
                          </button>
                        </form>
                        <form onSubmit={handleMissionAction}>
                          <input type="hidden" name="commuteId" value={m.Commute_ID} />
                          <input type="hidden" name="action" value="reject" />
                          <button type="submit" style={btnReject}>
                            <X style={{ width: "14px" }} /> رد
                          </button>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredMissions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                    درخواستی یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
          <CheckCircle style={{ width: "20px", height: "20px", color: "#10b981" }} />
          {toast}
        </div>
      )}
    </div>
  );
}