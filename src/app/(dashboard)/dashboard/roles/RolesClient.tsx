"use client";

import { useState, useTransition } from "react";
import { createPositionAction, createUnitAction, deletePositionAction, deleteUnitAction } from "@/actions/roles";
import { Trash2 } from "lucide-react";

export default function RolesClient({ positions, units }: { positions: any[], units: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [posName, setPosName] = useState("");
  const [unitName, setUnitName] = useState("");

  const handleCreatePosition = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", posName);
    
    startTransition(async () => {
      const res = await createPositionAction(formData);
      if (res?.error) alert(res.error);
      else setPosName(""); // پاک کردن اینپوت در صورت موفقیت
    });
  };

  const handleCreateUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", unitName);
    
    startTransition(async () => {
      const res = await createUnitAction(formData);
      if (res?.error) alert(res.error);
      else setUnitName(""); // پاک کردن اینپوت در صورت موفقیت
    });
  };

  const handleDeletePos = (id: number) => {
    const formData = new FormData();
    formData.append("id", String(id));
    startTransition(async () => {
      const res = await deletePositionAction(formData);
      if (res?.error) alert(res.error);
    });
  };

  const handleDeleteUnit = (id: number) => {
    const formData = new FormData();
    formData.append("id", String(id));
    startTransition(async () => {
      const res = await deleteUnitAction(formData);
      if (res?.error) alert(res.error);
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* مدیریت جایگاه‌ها */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-800">تعریف جایگاه سازمانی</h2>
        <form onSubmit={handleCreatePosition} className="flex gap-2 mb-4">
          <input 
            name="name" 
            placeholder="مثلا: مدیر مالی" 
            required 
            className="flex-1 p-2 border rounded-lg"
            value={posName}
            onChange={(e) => setPosName(e.target.value)}
          />
          <button type="submit" disabled={isPending} className="bg-[#ed6e2b] text-white px-4 py-2 rounded-lg disabled:opacity-70">
            {isPending ? '...' : 'افزودن'}
          </button>
        </form>
        <ul className="space-y-2">
          {positions.map((p: any) => (
            <li key={p.Position_ID} className="p-3 bg-slate-50 rounded-lg text-sm flex justify-between items-center border border-slate-100">
              <span className="font-medium text-slate-700">{p.Name}</span>
              <button 
                onClick={() => handleDeletePos(p.Position_ID)} 
                disabled={isPending}
                className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
          {positions.length === 0 && <p className="text-slate-400 text-sm text-center py-4">موردی ثبت نشده است</p>}
        </ul>
      </div>

      {/* مدیریت واحدها */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-800">تعریف واحد سازمانی</h2>
        <form onSubmit={handleCreateUnit} className="flex gap-2 mb-4">
          <input 
            name="name" 
            placeholder="مثلا: واحد تولید" 
            required 
            className="flex-1 p-2 border rounded-lg"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
          />
          <button type="submit" disabled={isPending} className="bg-[#ed6e2b] text-white px-4 py-2 rounded-lg disabled:opacity-70">
            {isPending ? '...' : 'افزودن'}
          </button>
        </form>
        <ul className="space-y-2">
          {units.map((u: any) => (
            <li key={u.Unit_ID} className="p-3 bg-slate-50 rounded-lg text-sm flex justify-between items-center border border-slate-100">
              <span className="font-medium text-slate-700">{u.Name}</span>
              <button 
                onClick={() => handleDeleteUnit(u.Unit_ID)} 
                disabled={isPending}
                className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
          {units.length === 0 && <p className="text-slate-400 text-sm text-center py-4">موردی ثبت نشده است</p>}
        </ul>
      </div>
    </div>
  );
}