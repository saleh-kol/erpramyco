'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Wallet, 
  Settings, 
  Cog, 
  Boxes, 
  ClipboardList 
} from 'lucide-react'

const ALL_ROLES = ['Production Supervisor', 'Factory Manager', 'ModirNet', 'Repairer', 'Operator', 'Commerce', 'Contractor'];

const menuItems = [
  { title: 'داشبورد', href: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
  { title: 'پرسنل', href: '/dashboard/personnel', icon: Users, roles: ALL_ROLES },
  { title: 'ماشین‌آلات', href: '/dashboard/machines', icon: Cog, roles: ALL_ROLES },
  { title: 'درخواست تعمیر', href: '/dashboard/workorders', icon: Wrench, roles: ALL_ROLES },
  { title: 'انبار قطعات', href: '/dashboard/spare-parts', icon: Boxes, roles: ALL_ROLES },
  { title: 'گزارشات روزانه', href: '/dashboard/daily-reports', icon: ClipboardList, roles: ALL_ROLES },
  { title: 'حقوق و دستمزد', href: '/dashboard/payroll', icon: Wallet, roles: ALL_ROLES },
  { title: 'تنظیمات', href: '/dashboard/settings', icon: Settings, roles: ALL_ROLES },
]

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()
  const visibleMenus = menuItems.filter(item => item.roles.includes(userRole))

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 bg-slate-900 text-white border-l border-slate-800 flex flex-col">
      {/* لوگو بخش بالا */}
      <div className="h-20 flex items-center justify-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#ed6e2b] flex items-center justify-center">
            <Cog className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">ERP RAMYCO</h1>
            <p className="text-xs text-slate-400">{userRole}</p>
          </div>
        </div>
      </div>

      {/* منوها */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visibleMenus.length > 0 ? (
          visibleMenus.map((item, index) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-[#ed6e2b] text-white shadow-lg shadow-[#ed6e2b]/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#ed6e2b]'}`} />
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            )
          })
        ) : (
          <div className="text-center text-slate-500 text-sm p-4">
            منویی برای نمایش وجود ندارد
          </div>
        )}
      </nav>

      {/* فوتر سایدبار */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">© ۱۴۰۳ ERP Ramyco</p>
      </div>
    </aside>
  )
}