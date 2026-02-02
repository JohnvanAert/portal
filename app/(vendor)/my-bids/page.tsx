import { db } from '@/lib/db';
import { bids, tenders } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from "@/auth";
import { ClipboardList, Trophy, Timer, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function MyBidsPage() {
  const session = await auth();
  if (!session?.user) return null;

  // Получаем заявки именно этого поставщика
  const userBids = await db
    .select({
      id: bids.id,
      offerPrice: bids.offerPrice,
      createdAt: bids.createdAt,
      tenderTitle: tenders.title,
      tenderId: tenders.id,
      tenderStatus: tenders.status,
      winnerId: tenders.winnerId,
    })
    .from(bids)
    .leftJoin(tenders, eq(bids.tenderId, tenders.id))
    .where(eq(bids.userId, session.user.id))
    .orderBy(desc(bids.createdAt));

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Мои заявки</h1>
        <p className="text-slate-500 font-medium">Отслеживайте статус ваших предложений и результаты торгов</p>
      </div>

      <div className="grid gap-4">
        {userBids.length === 0 ? (
          <div className="bg-white border-2 border-dashed rounded-[40px] p-20 text-center">
            <ClipboardList className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-medium text-lg">Вы еще не подали ни одной заявки</p>
            <Link href="/" className="inline-block mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all">
              Перейти к закупкам
            </Link>
          </div>
        ) : (
          userBids.map((bid) => {
            const isWinner = bid.winnerId === bid.id;
            const isClosed = bid.tenderStatus === 'Закрыт'; // Убедись, что статус в БД совпадает

            return (
              <div key={bid.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl ${isWinner ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {isWinner ? <Trophy size={24} /> : <ClipboardList size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{bid.tenderTitle}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Подано: {new Date(bid.createdAt!).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Ваше предложение</p>
                    <p className="text-xl font-black text-slate-900">{Number(bid.offerPrice).toLocaleString()} ₸</p>
                  </div>

                  <div className="min-w-[120px]">
                    {isWinner ? (
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-lg border border-emerald-200">
                        Выигран
                      </span>
                    ) : isClosed ? (
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-lg border border-slate-200">
                        Завершен
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100 flex items-center gap-1.5 justify-center">
                        <Timer size={12} className="animate-pulse" /> В работе
                      </span>
                    )}
                  </div>

                  <Link href={`/tenders/${bid.tenderId}`} className="text-slate-300 group-hover:text-blue-600 transition-colors">
                    <ChevronRight size={24} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}