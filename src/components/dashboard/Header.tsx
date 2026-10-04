'use client'

import { LogOut, Bell, Megaphone, X, FileText } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getLatestAnnouncementForUser, markAnnouncementAsRead } from '@/actions/announcements'

const toPersianTimeAgo = (date: Date | string) => {
  if (!date) return "";
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
  if (diff < 60) return `${diff} دقیقه پیش`;
  if (diff < 1440) return `${Math.floor(diff / 60)} ساعت پیش`;
  return `${Math.floor(diff / 1440)} روز پیش`;
};

export default function Header({ userName, userImage }: { userName: string, userImage?: string | null }) {
  const router = useRouter();
  const [showNotif, setShowNotif] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [visibleNotifs, setVisibleNotifs] = useState<any[]>([]);
  
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const isInitialMount = useRef(true);

  // ۱. خواندن نوتیف‌های خوانده شده از LocalStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('readNotifs') || '[]');
    setReadIds(stored);
  }, []);

  // ۲. چک کردن نوتیف‌ها هر ۱۰ ثانیه
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        
        const visible = data.filter((n: any) => !readIds.includes(String(n.id)));
        
        if (visible.length > visibleNotifs.length && !isInitialMount.current) {
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("مرورگر اجازه پخش صدا را نداد"));
          }
        }
        
        setVisibleNotifs(visible);
        
        if (isInitialMount.current) {
          isInitialMount.current = false;
        }
      } catch (error) {
        console.error("Error fetching notifications", error);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);

    return () => clearInterval(interval);
  }, [readIds, visibleNotifs.length]);

  // ۳. دریافت آخرین اطلاعیه مدیر
  useEffect(() => {
    const fetchAnnouncement = async () => {
      const latest = await getLatestAnnouncementForUser();
      if (latest) {
        // بررسی اینکه آیا این اطلاعیه قبلاً در local storage خوانده شده یا خیر
        const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        if (!readAnnouncements.includes(latest.id)) {
          latest.isRead = false;
          // اگر اطلاعیه جدید بود و کاربر برای اولین بار آن را می‌بیند، صدا پخش شود
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("مرورگر اجازه پخش صدا را نداد"));
          }
        } else {
          latest.isRead = true;
        }
        setAnnouncement(latest);
      } else {
        setAnnouncement(null);
      }
    };
    fetchAnnouncement();
    // چک کردن هر ۳۰ ثانیه برای اطلاعیه جدید
    const interval = setInterval(fetchAnnouncement, 30000);
    return () => clearInterval(interval);
  }, []);

  // ۴. هندلر کلیک روی نوتیف
  const handleNotifClick = (id: number, link: string) => {
    const newReadIds = [...readIds, String(id)];
    localStorage.setItem('readNotifs', JSON.stringify(newReadIds));
    setReadIds(newReadIds);
    setVisibleNotifs(prev => prev.filter(n => n.id !== id));
    setShowNotif(false);
    router.push(link);
  };

  // ۵. هندلر کلیک روی اطلاعیه
  const handleAnnouncementClick = async () => {
    setShowAnnouncement(!showAnnouncement);
    if (announcement && !announcement.isRead) {
      await markAnnouncementAsRead(announcement.id);
      // به‌روزرسانی local storage
      const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
      readAnnouncements.push(announcement.id);
      localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
      // به‌روزرسانی state
      setAnnouncement({ ...announcement, isRead: true });
    }
  };

  // ۶. هندلر خروج
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error("خطا در خروج", error);
      router.push('/');
    }
  };

  return (
    <header style={{
      height: '80px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 24px',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      paddingRight: '80px'
    }}>
      
      {/* استایل موبایل */}
      <style>{`
        @media (max-width: 768px) {
          .header-content {
            gap: 12px !important;
          }
          .user-text {
            display: none !important;
          }
        }
      `}</style>

      {/* فایل صوتی مخفی */}
      <audio ref={audioRef} src="/notif-sound.mp3" preload="auto"></audio>

      <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        
        {/* بخش زنگوله (اعلان‌های سیستمی) */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setShowNotif(!showNotif); setShowAnnouncement(false); }} style={{ position: 'relative', padding: '8px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <Bell style={{ width: '24px', height: '24px', color: visibleNotifs.length > 0 ? '#ed6e2b' : '#475569' }} />
            {visibleNotifs.length > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>
            )}
          </button>

          {showNotif && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowNotif(false)} />
              
              <div style={{ 
                position: 'absolute', 
                left: '0', 
                top: '50px', 
                width: '320px', 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', 
                border: '2px solid #ed6e2b', 
                zIndex: 50, 
                overflow: 'hidden' 
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>اعلان‌های سیستمی</h3>
                  <span style={{ fontSize: '11px', backgroundColor: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>{visibleNotifs.length} جدید</span>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {visibleNotifs.length === 0 ? (
                    <p style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>اعلان جدیدی وجود ندارد</p>
                  ) : (
                    visibleNotifs.map((n: any) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotifClick(n.id, n.link)} 
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.type === 'approved' ? '#16a34a' : n.type === 'rejected' ? '#ef4444' : '#ed6e2b', marginTop: '6px' }}></div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: 500 }}>{n.text}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>{toPersianTimeAgo(n.time)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* بخش اطلاعیه‌های مدیر (آیکون بلندگو) */}
        <div style={{ position: 'relative' }}>
          <button onClick={handleAnnouncementClick} style={{ position: 'relative', padding: '8px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <Megaphone style={{ width: '24px', height: '24px', color: announcement && !announcement.isRead ? '#ed6e2b' : '#475569' }} />
            {announcement && !announcement.isRead && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>
            )}
          </button>

          {showAnnouncement && announcement && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowAnnouncement(false)} />
              
              <div style={{ 
                position: 'absolute', 
                left: '0', 
                top: '50px', 
                width: '340px', 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', 
                border: '2px solid #3b82f6', 
                zIndex: 50, 
                overflow: 'hidden' 
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>اطلاعیه مدیر</h3>
                  <button onClick={() => setShowAnnouncement(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
                </div>
                
                <div style={{ padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{announcement.title}</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>{announcement.content}</p>
                  
                  {announcement.fileUrl && (
                    <a href={announcement.fileUrl} download style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', color: '#3b82f6', fontSize: '14px', textDecoration: 'none' }}>
                      <FileText size={16} /> دانلود فایل پیوست
                    </a>
                  )}
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px' }}>{new Date(announcement.createdAt).toLocaleDateString('fa-IR')}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0' }}></div>

        {/* کاربر */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-text" style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{userName}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>کاربر فعال</p>
          </div>
          
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#0f172a',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {userImage ? (
              <img src={userImage} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                {userName.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* خروج */}
        <button 
          onClick={handleLogout}
          style={{ padding: '8px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#ef4444' }}
          title="خروج از سیستم"
        >
          <LogOut style={{ width: '20px', height: '20px' }} />
        </button>
      </div>
    </header>
  )
}