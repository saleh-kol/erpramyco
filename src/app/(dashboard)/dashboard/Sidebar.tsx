"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Settings, Cog, Navigation, Clock, Calendar, 
  ClipboardCheck, Bell, ChevronDown, UserCircle2, Menu, Briefcase, Wallet, ShieldCheck
} from "lucide-react";

// لیست صفحاتی که فقط مدیرعامل باید ببیند
const CEO_ALLOWED_ROUTES = [
  "/dashboard", "/dashboard/profile", "/dashboard/projects", "/dashboard/missions",
  "/dashboard/tasks", "/dashboard/personnel", "/dashboard/leave-approvals",
  "/dashboard/activity-settings", "/dashboard/hours-settings",
  "/dashboard/roles", "/dashboard/access-management"
];

type MenuItem = {
  title: string;
  href?: string;
  icon: any;
  children?: { title: string; href: string; icon: any }[];
};

const menuItems: MenuItem[] = [
  { title: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
  { title: "پروفایل من", href: "/dashboard/profile", icon: UserCircle2 },
  { title: "مدیریت پروژه‌ها", href: "/dashboard/projects", icon: Briefcase },
  { title: "مدیریت ماموریت‌ها", href: "/dashboard/missions", icon: Navigation },
  { title: "صدور ابلاغیه", href: "/dashboard/tasks", icon: Bell },
  { title: "پرسنل", href: "/dashboard/personnel", icon: Users },
  { title: "درخواست کارکنان", href: "/dashboard/leave-approvals", icon: ClipboardCheck },
  { title: "تنظیمات حقوق و دستمزد", href: "/dashboard/payroll-settings", icon: Wallet },
  
  // منوهای مخصوص کاربران عادی
  { title: "ثبت فعالیت", href: "/dashboard/attendance", icon: Clock },
  { title: "مرخصی‌ها", href: "/dashboard/leave", icon: Calendar },
  { title: "پروژه‌های من", href: "/dashboard/my-projects", icon: Briefcase },
  { title: "ماموریت‌های من", href: "/dashboard/my-missions", icon: Navigation },
  { title: "ابلاغیه‌های من", href: "/dashboard/my-tasks", icon: Bell },
  { title: "تقویم کاری", href: "/dashboard/calendar", icon: Calendar },
  { title: "گزارش کارکرد من", href: "/dashboard/my-work-hours", icon: Clock },

  // منوی کشویی تنظیمات (شامل مدیریت دسترسی)
  {
    title: "تنظیمات",
    icon: Settings,
    children: [
      { title: "تنظیمات فعالیت‌ها", href: "/dashboard/activity-settings", icon: Cog },
      { title: "تنظیمات ساعات کاری", href: "/dashboard/hours-settings", icon: Clock },
      { title: "تعریف نقش‌ها", href: "/dashboard/roles", icon: Settings },
      { title: "مدیریت دسترسی پرسنل", href: "/dashboard/access-management", icon: ShieldCheck },
    ]
  }
];

export default function Sidebar({ userPosition, allowedRoutes, isCEO }: { userPosition: string, allowedRoutes: string[], isCEO: boolean }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  // تعیین مسیرهای مجاز بر اساس اینکه کاربر مدیرعامل است یا کاربر عادی
  const activeRoutes = isCEO ? CEO_ALLOWED_ROUTES : allowedRoutes;

  const visibleMenus = menuItems.filter((item) => {
    if (item.href) return activeRoutes.includes(item.href);
    if (item.children) return item.children.some(child => activeRoutes.includes(child.href));
    return false;
  });

  const isChildActive = (children: any[]) => children.some((child) => pathname === child.href);
  const isActive = (item: MenuItem) => item.href ? pathname === item.href : (item.children ? isChildActive(item.children) : false);
  const isMenuOpen = (item: MenuItem) => item.children ? (openMenu === item.title || isChildActive(item.children)) : false;

  return (
    <>
      <button className="mobile-menu-btn" onClick={(e) => { e.stopPropagation(); setIsMobileOpen(true); }}>
        <Menu style={{ width: "24px", height: "24px" }} />
      </button>
      <div className={`mobile-overlay ${isMobileOpen ? "show" : ""}`} onClick={() => setIsMobileOpen(false)} />
      
      <aside className={`sidebar ${isMobileOpen ? "open" : ""}`}>
        <div style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src="/logo.png" alt="Logo" style={{ width: "40px", height: "40px", borderRadius: "12px", objectFit: "cover" }} />
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: "#ed6e2b" }}>ERP RAMYCO</h1>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>{userPosition}</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
          {visibleMenus.map((item, index) => {
            const active = isActive(item);
            const Icon = item.icon;

            if (item.children) {
              const isOpen = isMenuOpen(item);
              return (
                <div key={index} style={{ marginBottom: "4px" }}>
                  <button onClick={() => setOpenMenu(isOpen ? null : item.title)} style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 12px", borderRadius: "8px", border: "none", fontSize: "14px", fontWeight: 500, color: active ? "#ffffff" : "#94a3b8", backgroundColor: active ? "#ed6e2b" : "transparent", cursor: "pointer", textAlign: "right", fontFamily: "inherit" }}>
                    <Icon style={{ width: "20px", height: "20px", color: active ? "#ffffff" : "#64748b" }} />
                    <span style={{ flex: 1, textAlign: "right" }}>{item.title}</span>
                    <ChevronDown style={{ width: "16px", height: "16px", color: active ? "#ffffff" : "#64748b", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                  </button>
                  <div style={{ maxHeight: isOpen ? "300px" : "0", overflow: "hidden", transition: "max-height 0.3s ease" }}>
                    <div style={{ padding: "4px 0" }}>
                      {item.children.map((child, cIndex) => {
                        // فقط_child هایی را نشان بده که در activeRoutes هستند
                        if (!activeRoutes.includes(child.href)) return null;
                        
                        const ChildIcon = child.icon;
                        const childActive = pathname === child.href;
                        return (
                          <Link key={cIndex} href={child.href} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", margin: "2px 8px", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: 500, color: childActive ? "#ed6e2b" : "#94a3b8", backgroundColor: childActive ? "rgba(237, 110, 43, 0.1)" : "transparent", borderRight: childActive ? "2px solid #ed6e2b" : "2px solid transparent" }}>
                            <ChildIcon style={{ width: "16px", height: "16px", color: childActive ? "#ed6e2b" : "#64748b" }} />
                            <span>{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link key={index} href={item.href!} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", marginBottom: "4px", textDecoration: "none", fontSize: "14px", fontWeight: 500, color: active ? "#ffffff" : "#94a3b8", backgroundColor: active ? "#ed6e2b" : "transparent", transition: "all 0.2s" }}>
                <Icon style={{ width: "20px", height: "20px", color: active ? "#ffffff" : "#64748b" }} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "16px", borderTop: "1px solid #1e293b" }}>
          <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", margin: 0 }}>ERP Ramyco v2.7.9</p>
        </div>
      </aside>
    </>
  );
}