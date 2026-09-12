import { getRolesAndUnits } from "@/actions/roles";
import RolesClient from "./RolesClient";

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const data = await getRolesAndUnits();
  return <RolesClient positions={data.positions} units={data.units} />;
}