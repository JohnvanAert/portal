import { db } from '@/lib/db';
import { tenders, users } from '@/lib/schema';
import CreateTenderModal from '@/components/CreateTenderModal';
import { desc, sql, eq } from 'drizzle-orm'; // Добавлен sql
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { ChevronRight, MessageSquare, ChevronLeft } from 'lucide-react';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/login"); 
  }


  
  // --- ЛОГИКА ПАГИНАЦИИ ---
  const { page: pageParam } = await searchParams;
  const currentPage = Number(pageParam) || 1;
  const ITEMS_PER_PAGE = 8; 
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Получаем тендеры с лимитом и связями (bids)
  const myTenders = await db.query.tenders.findMany({
    orderBy: [desc(tenders.createdAt)],
    limit: ITEMS_PER_PAGE,
    offset: offset,
    with: {
      bids: true,
    },
  });

  // Считаем общее количество всех тендеров в системе
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(tenders);
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
  // --- КОНЕЦ ЛОГИКИ ---

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Панель Администратора</h1>
          <p className="text-slate-500 font-medium">Добро пожаловать, <span className="text-green-600">{session.user?.name}</span>!</p>
        </div>
        <CreateTenderModal />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-5 font-bold text-xs uppercase tracking-widest text-slate-400">Название лота</th>
              <th className="p-5 font-bold text-xs uppercase tracking-widest text-slate-400">Начальная цена</th>
              <th className="p-5 font-bold text-xs uppercase tracking-widest text-slate-400">Статус</th>
              <th className="p-5 font-bold text-xs uppercase tracking-widest text-slate-400 text-center">Отклики</th>
              <th className="p-5"></th>
            </tr>
          </thead>
          <tbody>
            {myTenders.map((t) => (
              <tr key={t.id} className="group border-b border-slate-50 hover:bg-green-50/30 transition-all cursor-pointer">
                <td className="p-5">
                  <Link href={`/admin/dashboard/tenders/${t.id}`} className="block">
                    <span className="font-bold text-slate-800 group-hover:text-green-600 transition-colors">
                      {t.title}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {t.id}</div>
                  </Link>
                </td>
                <td className="p-5 font-bold text-slate-900 italic">
                  {Number(t.price).toLocaleString('ru-RU')} ₸
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    t.status === 'Активен' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-5 text-center">
                  <Link href={`/admin/dashboard/tenders/${t.id}`}>
                    <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 group-hover:bg-green-600 group-hover:text-white px-3 py-1 rounded-lg font-black transition-all">
                      <MessageSquare size={14} />
                      {t.bids.length}
                    </div>
                  </Link>
                </td>
                <td className="p-5 text-right">
                  <Link href={`/admin/dashboard/tenders/${t.id}`}>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* БЛОК ПАГИНАЦИИ */}
        {totalPages > 1 && (
          <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Страница {currentPage} из {totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                href={`?page=${currentPage - 1}`}
                className={`p-2 rounded-xl border bg-white transition-all ${
                  currentPage <= 1 ? 'pointer-events-none opacity-30' : 'hover:border-green-500 text-slate-600 shadow-sm'
                }`}
              >
                <ChevronLeft size={20} />
              </Link>
              <Link
                href={`?page=${currentPage + 1}`}
                className={`p-2 rounded-xl border bg-white transition-all ${
                  currentPage >= totalPages ? 'pointer-events-none opacity-30' : 'hover:border-green-500 text-slate-600 shadow-sm'
                }`}
              >
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        )}

        {myTenders.length === 0 && (
          <div className="p-20 text-center">
            <div className="text-slate-200 mb-4 flex justify-center">
              <MessageSquare size={48} />
            </div>
            <p className="text-slate-400 font-medium tracking-tight">В системе пока нет созданных лотов.</p>
          </div>
        )}
      </div>
    </div>
  );
}