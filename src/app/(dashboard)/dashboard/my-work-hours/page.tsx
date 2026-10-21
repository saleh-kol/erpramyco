import { getMyMonthlyWorkHours } from "@/actions/workHours";
import MyWorkHoursClient from "./MyWorkHoursClient";

export default async function MyWorkHoursPage() {
  const data = await getMyMonthlyWorkHours();

  if (!data) {
    return (
      <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
        <div style={{ backgroundColor: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          برای نمایش ساعات کارکرد، وارد شوید و حساب شما به پروفایل پرسنلی متصل باشد.
        </div>
      </div>
    );
  }

  return <MyWorkHoursClient data={data} />;
}