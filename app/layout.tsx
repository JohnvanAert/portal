import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Search, 
  UserCircle, 
  LogOut, 
  ClipboardList 
} from 'lucide-react';
import { auth, signOut } from "@/auth";
import Link from "next/link";
import { desc, eq, and, sql } from 'drizzle-orm';
import { bids, tenders } from '@/lib/schema';
import { db } from '@/lib/db';
import NotificationBell from '@/components/NotificationBell';
import { Providers } from "@/components/Providers"

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "B-Portal | Система закупок",
  description: "Витрина тендеров компании",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  // 1. Условие для скрытия сайдбара на страницах входа/регистрации
  // Если сессии нет, показываем только контент (формы логина/регистрации)
  if (!session) {
    return (
      <html lang="ru">
        <body className={`${geist.className} antialiased bg-slate-50 text-slate-900`}>
          <Providers> {/* Оборачиваем здесь */}
            {children}
          </Providers>
        </body>
      </html>
    );
  }

  // 2. Логика уведомлений через ID пользователя (более надежно)
  let notifications: any[] = [];

  if (session.user.role === 'admin') {
    notifications = await db.select({
      id: bids.id,
      vendorName: bids.vendorName,
      tenderTitle: tenders.title,
      price: bids.offerPrice,
      createdAt: bids.createdAt,
      tenderId: tenders.id,
      isRead: bids.isRead,
      type: sql<string>`'new_bid'`.as('type') 
    })
    .from(bids)
    .leftJoin(tenders, eq(bids.tenderId, tenders.id))
    .where(eq(bids.isRead, false))
    .orderBy(desc(bids.createdAt))
    .limit(5);

  } else if (session.user.role === 'vendor') {
    notifications = await db.select({
      id: bids.id,
      vendorName: bids.vendorName,
      tenderTitle: tenders.title,
      price: bids.offerPrice,
      createdAt: bids.createdAt,
      tenderId: tenders.id,
      isRead: bids.isWinnerRead,
      type: sql<string>`'winner'`.as('type')
    })
    .from(bids)
    .leftJoin(tenders, eq(bids.tenderId, tenders.id))
    .where(and(
      eq(tenders.winnerId, bids.id),
      eq(bids.userId, session.user.id), // Поиск по ID, а не по имени
      eq(bids.isWinnerRead, false)
    ))
    .limit(5);
  }

  return (
    <html lang="ru">
      <body className={`${geist.className} antialiased bg-gray-50 text-slate-900`}>
        <Providers>
        <div className="flex h-screen overflow-hidden">
          {/* Сайдбар */}
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-8 font-black text-2xl text-blue-600 tracking-tighter">
              B-PORTAL
            </div>
            
            <nav className="flex-1 px-4 space-y-1">
              {session.user.role === 'admin' && (
                <>
                  <Link href="/admin/dashboard">
                    <NavItem icon={<LayoutDashboard size={20}/>} label="Дашборд" />
                  </Link>
                  <Link href="/admin/bids">
                    <div className="relative group">
                      <NavItem icon={<ClipboardList size={20}/>} label="Заявки" />
                      {notifications.some(n => n.type === 'new_bid') && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 bg-blue-500 rounded-full ring-4 ring-blue-50"></span>
                      )}
                    </div>
                  </Link>
                </>
              )}

              <Link href="/">
                <NavItem icon={<ShoppingCart size={20}/>} label="Витрина закупок" />
              </Link>
              
              <Link href="/admin/vendors">
                <NavItem 
                  icon={<Users size={20}/>} 
                  label="Поставщики" 
                  active={false} // Можешь добавить логику проверки текущего пути
                />
              </Link>
            </nav>

            <div className="p-4 border-t border-slate-100">
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm">
                  <LogOut size={20} />
                  Выйти
                </button>
              </form>
            </div>
          </aside>

          {/* Основная область */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
              <div className="relative w-96">
                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Поиск по закупкам..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
                />
              </div>
              
              <div className="flex items-center gap-6">
                <NotificationBell 
                  initialBids={notifications} 
                  userRole={session.user.role} 
                  userName={session.user.name ?? undefined} 
                />
                
                <Link href="/profile" className="flex items-center gap-3 pl-6 border-l border-slate-100 hover:opacity-80 transition-opacity">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-900">{session.user.name}</span>
                    <span className="text-[10px] text-blue-500 uppercase font-black tracking-widest">
                      {session.user.role === 'admin' ? 'Заказчик' : 'Поставщик'}
                    </span>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <UserCircle size={24} />
                  </div>
                </Link>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
              {children}
            </main>
          </div>
        </div>
        </Providers>
      </body>
    </html>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}>
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}