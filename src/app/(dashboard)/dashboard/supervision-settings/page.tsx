import { getSupervisionData } from "@/actions/supervision";
import SupervisionSettingsClient from "./SupervisionSettingsClient";

export const dynamic = "force-dynamic";

export default async function SupervisionSettingsPage() {
  const data = await getSupervisionData();
  return <SupervisionSettingsClient data={data} />;
}