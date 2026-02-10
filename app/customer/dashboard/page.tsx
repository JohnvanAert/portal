// app/customer/dashboard/page.tsx

import { db } from '@/lib/db';
import { tenders } from '@/lib/schema';
import CreateTenderModal from '@/components/CreateTenderModal';
import { desc, sql } from 'drizzle-orm'; // Добавь sql для подсчета
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from 'next/link'; 
import { ChevronRight, MessageSquare, Paperclip, LayoutGrid, ChevronLeft } from 'lucide-react';

// Добавляем типизацию для searchParams
export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "customer") redirect("/login");

  // 1. Настройка пагинации
  const { page: pageParam } = await searchParams;
  const currentPage = Number(pageParam) || 1;
  const ITEMS_PER_PAGE = 5; // Для теста поставь 5, потом можно 10
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // 2. Получаем данные с лимитом и оффсетом
  const myTenders = await db.query.tenders.findMany({
    orderBy: [desc(tenders.createdAt)],
    limit: ITEMS_PER_PAGE,
    offset: offset,
    with: {
      bids: true, 
    },
  });

  // 3. Считаем общее количество тендеров
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(tenders);
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Панель Заказчика</h1>
          <p className="text-slate-500 font-medium mt-1">Управление вашими закупками и лотами</p>
        </div>
        <CreateTenderModal />
      </div>

      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
        {/* Твоя существующая таблица без изменений ... */}
        <table className="w-full text-left border-collapse">
            {/* ... содержимое thead и tbody как в твоем коде ... */}
            <tbody>
              {myTenders.map((t) => (
                <tr key={t.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                  {/* ... ячейки td как в твоем коде ... */}
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

        {/* ШАБЛОН ПАГИНАЦИИ ВНИЗУ ТАБЛИЦЫ */}
        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Страница {currentPage} из {totalPages}
            </p>
            
            <div className="flex gap-2">
              <Link
                href={`?page=${currentPage - 1}`}
                className={`p-2 rounded-xl border transition-all ${
                  currentPage <= 1 
                    ? 'pointer-events-none opacity-30 bg-transparent' 
                    : 'bg-white hover:border-blue-500 text-slate-600'
                }`}
              >
                <ChevronLeft size={20} />
              </Link>

              <Link
                href={`?page=${currentPage + 1}`}
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
             <p className="text-slate-500 font-bold">Пусто</p>
          </div>
        )}
      </div>
    </div>
  );
}