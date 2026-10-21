import { getMyAgendaMonth } from "@/actions/agenda";
import AgendaCalendarClient from "./AgendaCalendarClient";

export const dynamic = "force-dynamic";

export default async function MyAgendaPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const { year, month } = await searchParams;
  const jYear = year ? parseInt(year) : undefined;
  const jMonth = month !== undefined && month !== "" ? parseInt(month) : undefined;

  const data = await getMyAgendaMonth(jYear, jMonth);

  if (!data) return <div style={{ padding: 24 }}>دسترسی نامعتبر — دوباره وارد شوید.</div>;

  return <AgendaCalendarClient data={data} />;
}