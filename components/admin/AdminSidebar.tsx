'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { name: 'Пользователи', href: '/admin/users', icon: '👥' },
  { name: 'Журнал событий', href: '/admin/logs', icon: '📜' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 bg-slate-900 min-h-screen p-8 flex flex-col sticky top-0">
      <div className="mb-12">
        <h2 className="text-white text-2xl font-black italic tracking-tighter">B-PORTAL</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Admin Control</p>
        </div>
      </div>
      
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="pt-6 border-t border-slate-800">
         <Link href="/api/auth/signout" className="flex items-center gap-3 p-4 text-red-400 text-xs font-bold hover:bg-red-500/10 rounded-2xl transition-all">
            🚪 Выйти из системы
         </Link>
      </div>
    </aside>
  )
}