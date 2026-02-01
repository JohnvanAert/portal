import { db } from '@/lib/db';
import { tenders } from '@/lib/schema';
import BidModal from '@/components/BidModal';
import { eq, desc } from 'drizzle-orm';
import { auth } from "@/auth"; // Добавляем импорт auth
import { redirect } from "next/navigation"; // Добавляем импорт редиректа

export default async function VendorPage() {
  // 1. Получаем сессию
  const session = await auth();

  // 2. Если вошел Заказчик — отправляем его в панель управления
  if (session?.user?.role === "admin") {
    redirect("/dashboard");
  }

  // 3. Получаем только активные тендеры
  const availableTenders = await db
    .select()
    .from(tenders)
    .where(eq(tenders.status, 'Активен'))
    .orderBy(desc(tenders.createdAt));

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Витрина закупок
          </h1>
          <p className="text-slate-500 mt-2">
            Здравствуйте, <span className="font-semibold text-slate-700">{session?.user?.name || 'Гость'}</span>! Выберите подходящий лот.
          </p>
        </header>

        <div className="grid gap-6">
          {availableTenders.length === 0 ? (
            <div className="bg-white border-2 border-dashed rounded-3xl p-20 text-center">
              <p className="text-slate-400 font-medium">
                На данный момент активных закупок не найдено.
              </p>
            </div>
          ) : (
            availableTenders.map((t) => (
              <div 
                key={t.id} 
                className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white px-2 py-1 rounded">
                      {t.type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono tracking-tighter">
                      REF-ID: {t.id}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                      {t.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Опубликовано: {t.createdAt ? new Date(t.createdAt).toLocaleDateString('ru-RU') : 'Недавно'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                      Начальная цена
                    </p>
                    <div className="text-2xl font-black text-slate-900">
                      {Number(t.price).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                  
                  {/* Показываем модалку только Поставщикам (vendor) или неавторизованным */}
                  <div className="w-full min-w-[160px]">
                    {session?.user?.role === "vendor" ? (
                      <BidModal tenderId={t.id} tenderTitle={t.title} />
                    ) : (
                      <div className="text-[10px] bg-slate-100 text-slate-500 p-2 rounded-lg text-center font-bold uppercase tracking-tighter">
                        Доступно только поставщикам
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}