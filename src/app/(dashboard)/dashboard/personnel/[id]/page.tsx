import { getPersonnelDetails } from "@/actions/personnelDetails";
import { getWorkTypesAndLocations } from "@/actions/activitySettings";
import PersonnelDetailClient from "./PersonnelDetailClient";

export const dynamic = "force-dynamic";

export default async function PersonnelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { id } = await params;
  const { start, end } = await searchParams;

  const [data, workTypeData] = await Promise.all([
    getPersonnelDetails(id, start, end),
    getWorkTypesAndLocations(),
  ]);

  if (!data) return <div style={{ padding: "24px" }}>پرسنل یافت نشد</div>;

  return (
    <PersonnelDetailClient
      data={data}
      searchParams={{ start: start || "", end: end || "" }}
      workTypes={workTypeData.types}
    />
  );
}