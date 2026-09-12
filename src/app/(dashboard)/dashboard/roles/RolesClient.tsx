"use client";

import { useState } from "react";
import { createPositionAction, createUnitAction } from "@/actions/roles";

export default function RolesClient({ positions, units }: { positions: any[], units: any[] }) {
  const [loading, setLoading] = useState('');

  const handleSubmit = async (formData: FormData, type: 'position' | 'unit') => {
    setLoading(type);
    const action = type === 'position' ? createPositionAction : createUnitAction;
    const res = await action(formData);
    if (res?.error) alert(res.error);
    setLoading('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* مدیریت جایگاه‌ها */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-800">تعریف جایگاه سازمانی</h2>
        <form action={(e) => handleSubmit(e, 'position')} className="flex gap-2 mb-4">
          <input name="name" placeholder="مثلا: مدیر مالی" required className="flex-1 p-2 border rounded-lg" />
          <button type="submit" disabled={loading === 'position'} className="bg-[#ed6e2b] text-white px-4 py-2 rounded-lg">
            {loading === 'position' ? '...' : 'افزودن'}
          </button>
        </form>
        <ul className="space-y-2">
          {positions.map((p: any) => (
            <li key={p.Position_ID} className="p-2 bg-slate-100 rounded-lg text-sm">{p.Name}</li>
          ))}
        </ul>
      </div>

      {/* مدیریت واحدها */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-800">تعریف واحد سازمانی</h2>
        <form action={(e) => handleSubmit(e, 'unit')} className="flex gap-2 mb-4">
          <input name="name" placeholder="مثلا: واحد تولید" required className="flex-1 p-2 border rounded-lg" />
          <button type="submit" disabled={loading === 'unit'} className="bg-[#ed6e2b] text-white px-4 py-2 rounded-lg">
            {loading === 'unit' ? '...' : 'افزودن'}
          </button>
        </form>
        <ul className="space-y-2">
          {units.map((u: any) => (
            <li key={u.Unit_ID} className="p-2 bg-slate-100 rounded-lg text-sm">{u.Name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}