// app/(vendor)/vendor/page.tsx

import { db } from '@/lib/db';
import { tenders } from '@/lib/schema';
import { eq, desc, sql, and, ilike, ne } from 'drizzle-orm'; // Добавлен ne (not equal)
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, Tag, Calendar, ChevronLeft, ChevronRight, Search, CheckCircle2, Clock } from "lucide-react";

export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    query?: string;
    category?: string;
    tab?: string; // Добавляем параметр таба
  }>;
}) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user?.role === "admin") redirect("/admin/dashboard");
  if (session.user?.role === "customer") redirect("/customer/dashboard");

  // --- ЛОГИКА ФИЛЬТРАЦИИ ---
  const sp = await searchParams;
  const currentPage = Number(sp.page) || 1;
  const query = sp.query || "";
  const categoryFilter = sp.category || "";
  const activeTab = sp.tab || "active"; // По умолчанию показываем активные
  
  const ITEMS_PER_PAGE = 5;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Формируем условия
  const filters = [];
  
  // Логика переключения статусов
  if (activeTab === "active") {
    filters.push(eq(tenders.status, 'Активен'));
  } else {
    filters.push(eq(tenders.status, 'Завершен'));
  }
  
  if (query) {
    filters.push(ilike(tenders.title, `%${query}%`));
  }
  
  if (categoryFilter) {
    filters.push(eq(tenders.category, categoryFilter));
  }

  const whereCondition = and(...filters);

  // 1. Получаем тендеры
  const availableTenders = await db
    .select()
    .from(tenders)
    .where(whereCondition)
    .orderBy(desc(tenders.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  // 2. Считаем количество
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tenders)
    .where(whereCondition);
    
  const count = totalResult.count;
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Витрина закупок
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Доступные лоты и архив завершенных закупок
            </p>
          </div>
        </header>

        {/* ТАБЫ ПЕРЕКЛЮЧЕНИЯ */}
        <div className="flex gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
          <Link 
            href={{ query: { ...sp, tab: 'active', page: 1 } }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === 'active' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock size={16} /> Активные
          </Link>
          <Link 
            href={{ query: { ...sp, tab: 'closed', page: 1 } }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === 'closed' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircle2 size={16} /> Завершенные
          </Link>
        </div>

        {/* ПАНЕЛЬ ПОИСКА */}
        <div className="mb-8 flex flex-wrap gap-4 items-center bg-white p-4 rounded-[28px] border border-slate-200 shadow-sm">
          <form className="flex-1 flex gap-4 items-center">
            {/* Скрытое поле, чтобы при поиске не терять активный таб */}
            <input type="hidden" name="tab" value={activeTab} />
            
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                name="query"
                defaultValue={query}
                placeholder="Поиск по названию..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <select 
              name="category" 
              defaultValue={categoryFilter}
              className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-600"
            >
              <option value="">Все категории</option>
              <option value="СТРОИТЕЛЬСТВО • СМР">Строительство</option>
              <option value="УСЛУГИ">Услуги</option>
              <option value="ТОВАРЫ">Товары</option>
            </select>

            <button type="submit" className={`px-8 py-3 rounded-2xl text-sm font-black transition-all shadow-lg ${
              activeTab === 'active' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100' : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-200'
            }`}>
              Найти
            </button>
          </form>
        </div>

        <div className="grid gap-6">
          {availableTenders.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
              <p className="text-slate-400 font-bold uppercase tracking-widest">
                {activeTab === 'active' ? 'Нет активных лотов' : 'Архив пуст'}
              </p>
            </div>
          ) : (
            <>
              {availableTenders.map((t) => (
                <Link 
                  href={`/tenders/${t.id}`}
                  key={t.id} 
                  className={`group bg-white p-8 rounded-[32px] border flex justify-between items-center shadow-sm transition-all duration-300 ${
                    activeTab === 'active' 
                      ? 'hover:shadow-xl hover:border-blue-200 border-slate-200' 
                      : 'opacity-80 grayscale-[0.5] hover:grayscale-0 border-slate-100'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg text-white ${
                        activeTab === 'active' ? 'bg-blue-600' : 'bg-slate-400'
                      }`}>
                        {t.category || 'Общее'}
                      </span>
                      {activeTab === 'closed' && (
                         <span className="text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-3 py-1 rounded-lg">
                           Завершен
                         </span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className={`text-2xl font-black transition-colors ${
                        activeTab === 'active' ? 'text-slate-800 group-hover:text-blue-600' : 'text-slate-500'
                      }`}>
                        {t.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">
                        Бюджет лота
                      </p>
                      <div className={`text-3xl font-black italic ${
                        activeTab === 'active' ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {Number(t.price).toLocaleString('ru-RU')} ₸
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-transform ${
                      activeTab === 'active' ? 'text-blue-600 group-hover:translate-x-1' : 'text-slate-400'
                    }`}>
                      {activeTab === 'active' ? 'Смотреть детали' : 'Просмотр архива'} <Eye size={18} />
                    </div>
                  </div>
                </Link>
              ))}

              {/* ПАГИНАЦИЯ */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-between bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">
                    Страница {currentPage} из {totalPages}
                  </p>
                  
                  <div className="flex gap-2">
                    <Link
                      href={{ query: { ...sp, page: Math.max(1, currentPage - 1) } }}
                      className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                        currentPage <= 1 
                          ? 'pointer-events-none opacity-20' 
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <ChevronLeft size={16} />
                    </Link>

                    <Link
                      href={{ query: { ...sp, page: Math.min(totalPages, currentPage + 1) } }}
                      className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                        currentPage >= totalPages 
                          ? 'pointer-events-none opacity-20' 
                          : 'bg-slate-900 border-slate-900 text-white'
                      }`}
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}