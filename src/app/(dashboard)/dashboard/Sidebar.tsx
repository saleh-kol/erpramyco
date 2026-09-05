"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  Cog,
  Navigation,
  Clock,
  Calendar,
  ClipboardCheck,
  Bell,
  ChevronDown,
  UserCircle2,
  Menu,
  Briefcase,
  Wallet,
} from "lucide-react";

const ALL_ROLES = [
  "سرپرست",
  "مدیر کارخانه",
  "مدیر نت",
  "تعمیرکار",
  "اپراتور",
  "واحد مالی",
  "پیمانکار",
];

type MenuItem = {
  title: string;
  href?: string;
  icon: any;
  roles: string[];
  children?: { title: string; href: string; icon: any }[];
};

const menuItems: MenuItem[] = [
  {
    title: "داشبورد",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    title: "پروفایل من",
    href: "/dashboard/profile",
    icon: UserCircle2,
    roles: ALL_ROLES,
  },
  {
    title: "ثبت فعالیت",
    href: "/dashboard/attendance",
    icon: Clock,
    roles: ["مدیر نت", "سرپرست", "تعمیرکار", "اپراتور"],
  },
  {
    title: "مرخصی‌ها",
    href: "/dashboard/leave",
    icon: Calendar,
    roles: ["مدیر نت", "سرپرست", "تعمیرکار", "اپراتور"],
  },
  {
    title: "پروژه‌های من",
    href: "/dashboard/my-projects",
    icon: Briefcase,
    roles: ["مدیر نت", "سرپرست", "تعمیرکار", "اپراتور"],
  },
  {
    title: "ماموریت‌های من",
    href: "/dashboard/my-missions",
    icon: Navigation,
    roles: ["مدیر نت", "سرپرست", "تعمیرکار", "اپراتور"],
  },
  {
    title: "ابلاغیه‌های من",
    href: "/dashboard/my-tasks",
    icon: Bell,
    roles: ["مدیر نت", "سرپرست", "تعمیرکار", "اپراتور", "واحد مالی"],
  },
  {
    title: "مدیریت پروژه‌ها",
    href: "/dashboard/projects",
    icon: Briefcase,
    roles: ["مدیر کارخانه"],
  },
  {
    title: "مدیریت ماموریت‌ها",
    href: "/dashboard/missions",
    icon: Navigation,
    roles: ["مدیر کارخانه"],
  },
  {
    title: "صدور ابلاغیه",
    href: "/dashboard/tasks",
    icon: Bell,
    roles: ["مدیر کارخانه"],
  },
  {
    title: "پرسنل",
    href: "/dashboard/personnel",
    icon: Users,
    roles: ["مدیر کارخانه", "مدیر نت", "واحد مالی"],
  },
  {
    title: "درخواست کارکنان",
    href: "/dashboard/leave-approvals",
    icon: ClipboardCheck,
    roles: ["مدیر کارخانه"],
  },
  {
    title: "تقویم کاری",
    href: "/dashboard/calendar",
    icon: Calendar,
    roles: ["واحد مالی"],
  },
  {
    title: "تنظیمات حقوق و دستمزد",
    href: "/dashboard/payroll-settings",
    icon: Wallet,
    roles: ["واحد مالی"],
  },
  {
    title: "تنظیمات",
    icon: Settings,
    roles: ["مدیر کارخانه"],
    children: [
      {
        title: "تنظیمات فعالیت‌ها",
        href: "/dashboard/activity-settings",
        icon: Cog,
      },
      {
        title: "تنظیمات ساعات کاری",
        href: "/dashboard/hours-settings",
        icon: Clock,
      },
    ],
  },
  {
    title: "گزارش کارکرد من",
    href: "/dashboard/my-work-hours",
    icon: Clock,
    roles: ["مدیر نت", "سرپرست", "تعمیرکار", "اپراتور"],
  },
];

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const visibleMenus = menuItems.filter((item) =>
    item.roles.includes(userRole),
  );

  const isChildActive = (children: any[]) =>
    children.some((child) => pathname === child.href);

  const isActive = (item: MenuItem) => {
    if (item.href) return pathname === item.href;
    if (item.children) return isChildActive(item.children);
    return false;
  };

  const isMenuOpen = (item: MenuItem) => {
    if (!item.children) return false;
    return openMenu === item.title || isChildActive(item.children);
  };

  return (
    <>
      {/* دکمه همبرگری */}
      <button
        className="mobile-menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          setIsMobileOpen(true);
        }}
      >
        <Menu style={{ width: "24px", height: "24px" }} />
      </button>

      {/* لایه تاریک */}
      <div
        className={`mobile-overlay ${isMobileOpen ? "show" : ""}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* سایدبار (کلاس‌ها از globals.css خوانده می‌شود) */}
      <aside className={`sidebar ${isMobileOpen ? "open" : ""}`}>
        {/* لوگو */}
        <div
          style={{
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "#ed6e2b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cog style={{ width: "24px", height: "24px", color: "white" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
                ERP RAMYCO
              </h1>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                {userRole}
              </p>
            </div>
          </div>
        </div>

        {/* منوها */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
          {visibleMenus.map((item, index) => {
            const active = isActive(item);
            const Icon = item.icon;

            if (item.children) {
              const isOpen = isMenuOpen(item);
              return (
                <div key={index} style={{ marginBottom: "4px" }}>
                  <button
                    onClick={() => setOpenMenu(isOpen ? null : item.title)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: active ? "#ffffff" : "#94a3b8",
                      backgroundColor: active ? "#ed6e2b" : "transparent",
                      cursor: "pointer",
                      textAlign: "right",
                      fontFamily: "inherit",
                    }}
                  >
                    <Icon
                      style={{
                        width: "20px",
                        height: "20px",
                        color: active ? "#ffffff" : "#64748b",
                      }}
                    />
                    <span style={{ flex: 1, textAlign: "right" }}>
                      {item.title}
                    </span>
                    <ChevronDown
                      style={{
                        width: "16px",
                        height: "16px",
                        color: active ? "#ffffff" : "#64748b",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>

                  <div
                    style={{
                      maxHeight: isOpen ? "200px" : "0",
                      overflow: "hidden",
                      transition: "max-height 0.3s ease",
                    }}
                  >
                    <div style={{ padding: "4px 0" }}>
                      {item.children.map((child, cIndex) => {
                        const ChildIcon = child.icon;
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={cIndex}
                            href={child.href}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "8px 12px",
                              margin: "2px 8px",
                              borderRadius: "6px",
                              textDecoration: "none",
                              fontSize: "13px",
                              fontWeight: 500,
                              color: childActive ? "#ed6e2b" : "#94a3b8",
                              backgroundColor: childActive
                                ? "rgba(237, 110, 43, 0.1)"
                                : "transparent",
                              borderRight: childActive
                                ? "2px solid #ed6e2b"
                                : "2px solid transparent",
                            }}
                          >
                            <ChildIcon
                              style={{
                                width: "16px",
                                height: "16px",
                                color: childActive ? "#ed6e2b" : "#64748b",
                              }}
                            />
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
              <Link
                key={index}
                href={item.href!}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  marginBottom: "4px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: active ? "#ffffff" : "#94a3b8",
                  backgroundColor: active ? "#ed6e2b" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                <Icon
                  style={{
                    width: "20px",
                    height: "20px",
                    color: active ? "#ffffff" : "#64748b",
                  }}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* فوتر */}
        <div style={{ padding: "16px", borderTop: "1px solid #1e293b" }}>
          <p
            style={{
              fontSize: "12px",
              color: "#64748b",
              textAlign: "center",
              margin: 0,
            }}
          >
            ERP Ramyco v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}
