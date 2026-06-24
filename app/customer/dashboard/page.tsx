// app/customer/dashboard/page.tsx

import { db } from '@/lib/db';
import { tenders } from '@/lib/schema';
import CreateTenderModal from '@/components/CreateTenderModal';
import { desc, sql, ilike, or, and, eq } from 'drizzle-orm';
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from 'next/link'; 
import { ChevronRight, MessageSquare, Paperclip, LayoutGrid, ChevronLeft, Search } from 'lucide-react';

export default async function CustomerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string; 
    query?: string; 
    category?: string; 
    status?: string 
  }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "customer") redirect("/login");

  // 1. Разворачиваем параметры поиска
  const sp = await searchParams;
  const currentPage = Number(sp.page) || 1;
  const query = sp.query || "";
  const categoryFilter = sp.category || "";
  const statusFilter = sp.status || "";

  const ITEMS_PER_PAGE = 5;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // 2. Формируем фильтры для БД
  const filters = [];
  
  // Поиск по названию
  if (query) {
    filters.push(ilike(tenders.title, `%${query}%`));
  }
  
  // Фильтр по категории
  if (categoryFilter) {
    filters.push(eq(tenders.category, categoryFilter));
  }

  // Фильтр по статусу
  if (statusFilter) {
    filters.push(eq(tenders.status, statusFilter));
  }

  const whereCondition = filters.length > 0 ? and(...filters) : undefined;

  // 3. Получаем данные с учетом фильтров
  const myTenders = await db.query.tenders.findMany({
    where: whereCondition,
    orderBy: [desc(tenders.createdAt)],
    limit: ITEMS_PER_PAGE,
    offset: offset,
    with: {
      bids: true, 
    },
  });

  // 4. Считаем общее количество с учетом тех же фильтров
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tenders)
    .where(whereCondition);
    
  const count = totalResult.count;
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Панель Заказчика</h1>
          <p className="text-slate-500 font-medium mt-1">Управление закупками ({count})</p>
        </div>
        <CreateTenderModal />
      </div>

      {/* ПАНЕЛЬ ПОИСКА И ФИЛЬТРОВ */}
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <form className="flex-1 flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              name="query"
              defaultValue={query}
              placeholder="Поиск по названию тендера..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <select 
            name="category" 
            defaultValue={categoryFilter}
            className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все категории</option>
            <option value="СТРОИТЕЛЬСТВО • СМР">Строительство</option>
            <option value="УСЛУГИ">Услуги</option>
            <option value="ТОВАРЫ">Товары</option>
          </select>

          <select 
            name="status" 
            defaultValue={statusFilter}
            className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все статусы</option>
            <option value="Активен">Активен</option>
            <option value="Черновик">Черновик</option>
            <option value="Завершен">Завершен</option>
          </select>

          <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all">
            Найти
          </button>
          
          {(query || categoryFilter || statusFilter) && (
            <Link href="/customer/dashboard" className="text-sm font-bold text-slate-400 hover:text-slate-600 px-2">
              Сброс
            </Link>
          )}
        </form>
      </div>

      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Тендер</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Бюджет</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Статус</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Отклики</th>
                <th className="p-6"></th>
              </tr>
            </thead>
            <tbody>
              {myTenders.map((t) => (
                <tr key={t.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                   <td className="p-6">
                    <Link href={`/customer/dashboard/tenders/${t.id}`} className="block">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {t.title}
                        </span>
                        {t.attachmentUrl && <Paperclip size={14} className="text-slate-300" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight text-slate-400">
                        <LayoutGrid size={10} />
                        {t.category} {t.subCategory && `• ${t.subCategory}`}
                      </div>
                    </Link>
                  </td>
                  <td className="p-6">
                    <span className="font-black text-slate-900">
                      {Number(t.price).toLocaleString('ru-RU')} ₸
                    </span>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      t.status === 'Активен' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center">
                      <Link href={`/customer/dashboard/tenders/${t.id}`}>
                        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white px-4 py-1.5 rounded-xl font-black text-xs transition-all">
                          <MessageSquare size={14} />
                          {t.bids.length}
                        </div>
                      </Link>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <Link href={`/customer/dashboard/tenders/${t.id}`}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent group-hover:bg-white group-hover:shadow-md transition-all">
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600" />
                      </div>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>

        {/* ПАГИНАЦИЯ (учитывает фильтры через ...sp) */}
        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Страница {currentPage} из {totalPages}
            </p>
            
            <div className="flex gap-2">
              <Link
                href={{ query: { ...sp, page: Math.max(1, currentPage - 1) } }}
                className={`p-2 rounded-xl border transition-all ${
                  currentPage <= 1 
                    ? 'pointer-events-none opacity-30 bg-transparent' 
                    : 'bg-white hover:border-blue-500 text-slate-600'
                }`}
              >
                <ChevronLeft size={20} />
              </Link>

              <Link
                href={{ query: { ...sp, page: Math.min(totalPages, currentPage + 1) } }}
                className={`p-2 rounded-xl border transition-all ${
                  currentPage >= totalPages 
                    ? 'pointer-events-none opacity-30 bg-transparent' 
                    : 'bg-white hover:border-blue-500 text-slate-600'
                }`}
              >
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        )}

        {myTenders.length === 0 && (
          <div className="p-24 text-center">
             <MessageSquare size={32} className="mx-auto text-slate-200 mb-6" />
             <p className="text-slate-500 font-bold">Ничего не найдено</p>
             {(query || categoryFilter || statusFilter) && (
               <p className="text-slate-400 text-sm mt-2">Попробуйте изменить параметры поиска</p>
             )}
          </div>
        )}
      </div>
    </div>
  );
}