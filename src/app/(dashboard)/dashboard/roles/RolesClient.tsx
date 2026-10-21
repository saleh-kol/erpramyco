"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPositionAction, createUnitAction, deletePositionAction, deleteUnitAction,
  updatePositionAction, updateUnitAction,
} from "@/actions/roles";
import { Trash2, Pencil, X, Check } from "lucide-react";

export default function RolesClient({ positions, units }: { positions: any[]; units: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [posName, setPosName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // ✅ ویرایش درجالین — یک آیتم در هر لحظه برای هر ستون
  const [editingPosId, setEditingPosId] = useState<number | null>(null);
  const [editingPosName, setEditingPosName] = useState("");
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [editingUnitName, setEditingUnitName] = useState("");

  const showToast = (msg: string, ms = 3500) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  // ---------- ایجاد ----------
  const handleCreatePosition = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", posName);

    startTransition(async () => {
      const res = await createPositionAction(formData);
      if (res?.error) showToast(`خطا: ${res.error}`);
      else {
        setPosName("");
        showToast("جایگاه جدید اضافه شد");
        router.refresh();
      }
    });
  };

  const handleCreateUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", unitName);

    startTransition(async () => {
      const res = await createUnitAction(formData);
      if (res?.error) showToast(`خطا: ${res.error}`);
      else {
        setUnitName("");
        showToast("واحد جدید اضافه شد");
        router.refresh();
      }
    });
  };

  // ---------- ویرایش ----------
  const startEditPos = (p: any) => {
    setEditingPosId(p.Position_ID);
    setEditingPosName(p.Name);
  };

  const handleUpdatePosition = async () => {
    if (!editingPosName.trim()) { showToast("خطا: نام جایگاه نمی‌تواند خالی باشد"); return; }
    const formData = new FormData();
    formData.append("id", String(editingPosId));
    formData.append("name", editingPosName);

    startTransition(async () => {
      const res = await updatePositionAction(formData);
      if (res?.error) showToast(`خطا: ${res.error}`);
      else {
        setEditingPosId(null);
        showToast("جایگاه ویرایش شد");
        router.refresh();
      }
    });
  };

  const startEditUnit = (u: any) => {
    setEditingUnitId(u.Unit_ID);
    setEditingUnitName(u.Name);
  };

  const handleUpdateUnit = async () => {
    if (!editingUnitName.trim()) { showToast("خطا: نام واحد نمی‌تواند خالی باشد"); return; }
    const formData = new FormData();
    formData.append("id", String(editingUnitId));
    formData.append("name", editingUnitName);

    startTransition(async () => {
      const res = await updateUnitAction(formData);
      if (res?.error) showToast(`خطا: ${res.error}`);
      else {
        setEditingUnitId(null);
        showToast("واحد ویرایش شد");
        router.refresh();
      }
    });
  };

  // ---------- حذف ----------
  const handleDeletePos = (id: number) => {
    const formData = new FormData();
    formData.append("id", String(id));
    startTransition(async () => {
      const res = await deletePositionAction(formData);
      if (res?.error) showToast(`خطا: ${res.error}`);
      else {
        showToast("جایگاه حذف شد");
        router.refresh();
      }
    });
  };

  const handleDeleteUnit = (id: number) => {
    const formData = new FormData();
    formData.append("id", String(id));
    startTransition(async () => {
      const res = await deleteUnitAction(formData);
      if (res?.error) showToast(`خطا: ${res.error}`);
      else {
        showToast("واحد حذف شد");
        router.refresh();
      }
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
            <li key={p.Position_ID} className="p-3 bg-slate-50 rounded-lg text-sm flex justify-between items-center border border-slate-100 gap-2">
              {editingPosId === p.Position_ID ? (
                // ✅ حالت ویرایش
                <div className="flex-1 flex gap-2">
                  <input
                    autoFocus
                    value={editingPosName}
                    onChange={(e) => setEditingPosName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUpdatePosition(); if (e.key === "Escape") setEditingPosId(null); }}
                    className="flex-1 p-1.5 border border-orange-300 rounded-lg focus:outline-none focus:border-[#ed6e2b]"
                  />
                  <button
                    type="button"
                    onClick={handleUpdatePosition}
                    disabled={isPending}
                    title="ذخیره"
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPosId(null)}
                    title="انصراف"
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // حالت نمایش
                <>
                  <span className="font-medium text-slate-700">{p.Name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEditPos(p)}
                      disabled={isPending}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#ed6e2b] hover:bg-orange-50 disabled:opacity-50 transition-colors"
                      title="ویرایش"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePos(p.Position_ID)}
                      disabled={isPending}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
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
            <li key={u.Unit_ID} className="p-3 bg-slate-50 rounded-lg text-sm flex justify-between items-center border border-slate-100 gap-2">
              {editingUnitId === u.Unit_ID ? (
                // ✅ حالت ویرایش
                <div className="flex-1 flex gap-2">
                  <input
                    autoFocus
                    value={editingUnitName}
                    onChange={(e) => setEditingUnitName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUpdateUnit(); if (e.key === "Escape") setEditingUnitId(null); }}
                    className="flex-1 p-1.5 border border-orange-300 rounded-lg focus:outline-none focus:border-[#ed6e2b]"
                  />
                  <button
                    type="button"
                    onClick={handleUpdateUnit}
                    disabled={isPending}
                    title="ذخیره"
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUnitId(null)}
                    title="انصراف"
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // حالت نمایش
                <>
                  <span className="font-medium text-slate-700">{u.Name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEditUnit(u)}
                      disabled={isPending}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#ed6e2b] hover:bg-orange-50 disabled:opacity-50 transition-colors"
                      title="ویرایش"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUnit(u.Unit_ID)}
                      disabled={isPending}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {units.length === 0 && <p className="text-slate-400 text-sm text-center py-4">موردی ثبت نشده است</p>}
        </ul>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast.includes("خطا") ? <X className="h-5 w-5 text-red-400" /> : <Check className="h-5 w-5 text-emerald-400" />}
          {toast}
        </div>
      )}
    </div>
  );
}