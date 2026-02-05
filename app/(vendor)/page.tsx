import { db } from '@/lib/db';
import { tenders } from '@/lib/schema';
import BidModal from '@/components/BidModal';
import { eq, desc } from 'drizzle-orm';
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, Tag, Calendar } from "lucide-react";

export default async function VendorPage() {
  const session = await auth();

  if (session?.user?.role === "admin") {
    redirect("/dashboard");
  }

  const availableTenders = await db
    .select()
    .from(tenders)
    .where(eq(tenders.status, 'Активен'))
    .orderBy(desc(tenders.createdAt));

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
            availableTenders.map((t) => (
              <Link 
                href={`/vendor/tenders/${t.id}`}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}