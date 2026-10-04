"use client";

import { useState, useEffect } from "react";
import { createAnnouncementAction, getAllAnnouncements, updateAnnouncementAction, deleteAnnouncementAction } from "@/actions/announcements";
import { Save, Upload, CheckCircle, Edit3, FileText, Trash2 } from "lucide-react";

export default function AnnouncementsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{url: string, type: string} | null>(null);
  const [uploading, setUploading] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{title: string, content: string, fileUrl?: string, fileType?: string}>({ title: "", content: "" });

  useEffect(() => {
    refreshAnnouncements();
  }, []);

  const refreshAnnouncements = async () => {
    const data = await getAllAnnouncements();
    setAnnouncements(data);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/announcements/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setUploading(false);
      
      if (data.error) {
        setToast(data.error);
        setTimeout(() => setToast(null), 5000);
      } else {
        if (isEdit) {
          setEditData(prev => ({ ...prev, fileUrl: data.url, fileType: data.type }));
        } else {
          setFileInfo({ url: data.url, type: data.type });
        }
      }
    } catch (error) {
      setUploading(false);
      setToast("خطا در ارتباط با سرور برای آپلود.");
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    if (fileInfo) {
      formData.append('fileUrl', fileInfo.url);
      formData.append('fileType', fileInfo.type);
    }

    const result = await createAnnouncementAction(formData);
    if (result?.success) {
      setToast("اطلاعیه با موفقیت صادر شد.");
      (e.target as HTMLFormElement).reset();
      setFileInfo(null);
      refreshAnnouncements();
    }
    setIsLoading(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleEditClick = (ann: any) => {
    setEditingId(ann.id);
    setEditData({ title: ann.title, content: ann.content, fileUrl: ann.fileUrl, fileType: ann.fileType });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ title: "", content: "" });
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('id', String(editingId));
    if (editData.fileUrl) formData.append('fileUrl', editData.fileUrl);
    if (editData.fileType) formData.append('fileType', editData.fileType);

    const result = await updateAnnouncementAction(formData);
    if (result?.success) {
      setToast("اطلاعیه با موفقیت ویرایش شد.");
      setEditingId(null);
      refreshAnnouncements();
    }
    setIsLoading(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("آیا از حذف این اطلاعیه مطمئن هستید؟")) {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('id', String(id));
      
      const result = await deleteAnnouncementAction(formData);
      if (result?.success) {
        setToast("اطلاعیه حذف شد.");
        refreshAnnouncements();
      }
      setIsLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>مدیریت اطلاعیه‌ها</h1>
      
      {/* فرم صدور اطلاعیه جدید */}
      <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#0f172a" }}>صدور اطلاعیه جدید</h2>
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>عنوان اطلاعیه *</label>
            <input name="title" required type="text" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} />
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>متن اطلاعیه *</label>
            <textarea name="content" required rows={5} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", resize: "vertical" }}></textarea>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>پیوست فایل (اختیاری - حداکثر ۲ مگابایت)</label>
            <input type="file" accept=".pdf,.xlsx,.docx,.png,.jpg" onChange={(e) => handleFileChange(e)} style={{ display: "none" }} id="fileUpload" />
            <button type="button" onClick={() => document.getElementById('fileUpload')?.click()} style={{ padding: "10px 16px", backgroundColor: "#f1f5f9", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <Upload size={16} /> انتخاب فایل
            </button>
            {uploading && <p style={{ color: "#3b82f6", fontSize: "12px", marginTop: "8px" }}>در حال آپلود...</p>}
            {fileInfo && <p style={{ color: "#16a34a", fontSize: "12px", marginTop: "8px" }}>فایل با موفقیت آپلود شد.</p>}
          </div>

          <button type="submit" disabled={isLoading || uploading} style={{ backgroundColor: "#ed6e2b", color: "white", padding: "12px 24px", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <Save size={18} /> ثبت و ارسال اطلاعیه
          </button>
        </form>
      </div>

      {/* لیست اطلاعیه‌های قبلی */}
      <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#0f172a" }}>اطلاعیه‌های صادر شده</h2>
        
        {announcements.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px" }}>هنوز اطلاعیه‌ای صادر نشده است.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {announcements.map((ann) => (
              <div key={ann.id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                {editingId === ann.id ? (
                  // حالت ویرایش
                  <form onSubmit={handleUpdate}>
                    <div style={{ marginBottom: "12px" }}>
                      <input 
                        type="text" 
                        value={editData.title} 
                        onChange={(e) => setEditData({...editData, title: e.target.value})} 
                        required 
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} 
                      />
                    </div>
                    <textarea 
                      value={editData.content} 
                      onChange={(e) => setEditData({...editData, content: e.target.value})} 
                      rows={4} 
                      required 
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", resize: "vertical", marginBottom: "12px" }} 
                    />
                    <div style={{ marginBottom: "12px" }}>
                      <input type="file" onChange={(e) => handleFileChange(e, true)} style={{ display: "none" }} id={`editUpload-${ann.id}`} />
                      <button type="button" onClick={() => document.getElementById(`editUpload-${ann.id}`)?.click()} style={{ padding: "6px 12px", backgroundColor: "#f1f5f9", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                        تغییر فایل
                      </button>
                      {editData.fileUrl && <span style={{ marginLeft: "8px", fontSize: "12px", color: "#3b82f6" }}>فایل فعلی: <a href={editData.fileUrl} target="_blank">مشاهده</a></span>}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" disabled={isLoading} style={{ padding: "8px 16px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>ذخیره</button>
                      <button type="button" onClick={handleCancelEdit} style={{ padding: "8px 16px", backgroundColor: "#94a3b8", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>انصراف</button>
                    </div>
                  </form>
                ) : (
                  // حالت نمایش
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>{ann.title}</h3>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleEditClick(ann)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#3b82f6" }}>
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(ann.id)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#ef4444" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>{ann.content}</p>
                    {ann.fileUrl && (
                      <a href={ann.fileUrl} download style={{ display: "flex", alignItems: "center", gap: "4px", color: "#3b82f6", fontSize: "14px", textDecoration: "none", marginBottom: "8px" }}>
                        <FileText size={16} /> دانلود فایل پیوست
                      </a>
                    )}
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{new Date(ann.createdAt).toLocaleDateString('fa-IR')}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", backgroundColor: "#0f172a", color: "white", padding: "12px 24px", borderRadius: "12px", display: "flex", alignItems: "center", gap: 8, zIndex: 100 }}>
          <CheckCircle size={20} color="#10b981" /> {toast}
        </div>
      )}
    </div>
  );
}