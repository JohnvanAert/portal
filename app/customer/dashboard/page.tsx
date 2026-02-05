import { db } from '@/lib/db';
import { tenders } from '@/lib/schema';
import CreateTenderModal from '@/components/CreateTenderModal';
import { desc } from 'drizzle-orm';
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from 'next/link'; 
import { ChevronRight, MessageSquare, Paperclip, LayoutGrid } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await auth();

  // Проверка роли: теперь используем корректную роль "customer"
  if (session?.user?.role !== "customer") {
    redirect("/login"); 
  }

  const myTenders = await db.query.tenders.findMany({
    orderBy: [desc(tenders.createdAt)],
    with: {
      bids: true, 
    },
  });

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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Лот / Категория</th>
              <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Начальная цена</th>
              <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-400">Статус</th>
              <th className="p-6 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Отклики</th>
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
        
        {myTenders.length === 0 && (
          <div className="p-24 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
              <MessageSquare size={32} />
            </div>
            <p className="text-slate-500 font-bold">У вас пока нет активных лотов</p>
            <p className="text-slate-400 text-sm mt-1">Нажмите «Создать новый лот», чтобы начать закупку</p>
          </div>
        )}
      </div>
    </div>
  );
}