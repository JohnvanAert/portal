// app/page.tsx

import { db } from '@/lib/db';
import { tenders } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm'; // Добавлен sql
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, Tag, Calendar, ChevronLeft, ChevronRight } from "lucide-react"; // Добавлены иконки

export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user?.role === "admin") redirect("/admin/dashboard");
  if (session.user?.role === "customer") redirect("/customer/dashboard");

  // --- ЛОГИКА ПАГИНАЦИИ ---
  const { page: pageParam } = await searchParams;
  const currentPage = Number(pageParam) || 1;
  const ITEMS_PER_PAGE = 5; // Количество карточек на одной странице
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // 1. Получаем тендеры с лимитом
  const availableTenders = await db
    .select()
    .from(tenders)
    .where(eq(tenders.status, 'Активен'))
    .orderBy(desc(tenders.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  // 2. Считаем общее кол-во активных тендеров для кнопок
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tenders)
    .where(eq(tenders.status, 'Активен'));
    
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
  // --- КОНЕЦ ЛОГИКИ ---

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Витрина закупок
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Здравствуйте, <span className="text-blue-600">{session?.user?.name || 'Гость'}</span>! Выберите лот для участия.
            </p>
          </div>
        </header>

        <div className="grid gap-6">
          {availableTenders.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
              <p className="text-slate-400 font-bold uppercase tracking-widest">Активных лотов не найдено</p>
            </div>
          ) : (
            <>
              {availableTenders.map((t) => (
                <Link 
                  href={`/tenders/${t.id}`} // Исправил путь на более надежный
                  key={t.id} 
                  className="group bg-white p-8 rounded-[32px] border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white px-3 py-1 rounded-lg">
                        {t.category || 'Общее'}
                      </span>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                        ID: {t.id}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                        {t.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-slate-400 text-xs font-bold">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString('ru-RU') : 'Недавно'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag size={14} />
                          {t.workType || 'Поставка'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">
                        Бюджет лота
                      </p>
                      <div className="text-3xl font-black text-slate-900 italic">
                        {Number(t.price).toLocaleString('ru-RU')} ₸
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      Смотреть детали <Eye size={18} />
                    </div>
                  </div>
                </Link>
              ))}

              {/* ПАНЕЛЬ УПРАВЛЕНИЯ СТРАНИЦАМИ */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-between bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">
                    Страница {currentPage} из {totalPages}
                  </p>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`?page=${currentPage - 1}`}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                        currentPage <= 1 
                          ? 'pointer-events-none opacity-20' 
                          : 'hover:bg-slate-50 hover:border-blue-300 text-slate-600'
                      }`}
                    >
                      <ChevronLeft size={16} /> Назад
                    </Link>

                    <Link
                      href={`?page=${currentPage + 1}`}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                        currentPage >= totalPages 
                          ? 'pointer-events-none opacity-20' 
                          : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Вперед <ChevronRight size={16} />
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