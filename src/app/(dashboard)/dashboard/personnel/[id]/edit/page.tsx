import { getPersonnelForEdit } from "@/actions/personnel";
import { getRolesAndUnits } from "@/actions/roles";
import EditPersonnelClient from "./EditPersonnelClient";

export const dynamic = 'force-dynamic';

export default async function EditPersonnelPage({ params }: { params: Promise<{ id: string }> }) {
  // حتماً باید await شود!
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const personnel = await getPersonnelForEdit(id);
  const { positions, units } = await getRolesAndUnits();

  if (!personnel) return <div>پرسنل یافت نشد.</div>;

  return <EditPersonnelClient personnel={personnel} positions={positions} units={units} />;
}