import { db } from '@/lib/db';
import { tenders, bids } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, User, MessageSquare, Banknote, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import SelectWinnerButton from '@/components/SelectWinnerButton';

export default async function TenderDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> // Важно: в Next.js 15+ это Promise
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  // Исправляем ошибку NaN: дожидаемся получения ID
  const { id } = await params;
  const tenderId = parseInt(id);

  if (isNaN(tenderId)) notFound();

  // Загружаем тендер вместе с откликами
  const tenderData = await db.query.tenders.findFirst({
    where: eq(tenders.id, tenderId),
    with: {
      bids: {
        orderBy: [desc(bids.createdAt)],
      },
    },
  });
  
  if (!tenderData) notFound();

  // Находим лучшую цену
  const prices = tenderData.bids.map(b => Number(b.offerPrice));
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const isTenderClosed = tenderData.status === 'Завершен';
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Шапка с кнопкой назад */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Назад к списку</span>
        </Link>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${tenderData.status === 'Активен' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
            {tenderData.status}
          </span>
        </div>
      </div>

      {/* Карточка тендера */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 mb-10 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 font-bold text-sm uppercase tracking-wider">
              <Tag size={16} />
              {tenderData.type}
            </div>
            <h1 className="text-4xl font-black text-slate-900 leading-tight">
              {tenderData.title}
            </h1>
            <div className="flex items-center gap-4 text-slate-500 text-sm">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                Создан: {tenderData.createdAt?.toLocaleDateString('ru-RU')}
              </div>
              <div className="font-mono bg-slate-100 px-2 py-0.5 rounded">ID: {tenderData.id}</div>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-end min-w-[200px]">
            <span className="text-xs font-bold text-slate-400 uppercase mb-1">Начальная цена</span>
            <span className="text-3xl font-black text-slate-900">
              {Number(tenderData.price).toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>

      {/* Список заявок */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Отклики поставщиков</h2>
          <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">
            Всего: {tenderData.bids.length}
          </span>
        </div>

        <div className="grid gap-4">
          {tenderData.bids.map((bid) => {
            const isBest = Number(bid.offerPrice) === minPrice;

            const isThisBidWinner = tenderData.winnerId === bid.id;
            return (
              <div key={bid.id} className={`bg-white p-6 rounded-2xl border-2 transition-all ${isThisBidWinner ? 'border-green-500 bg-green-50/30' : isBest ? 'border-blue-200' : 'border-slate-100'}`}>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isThisBidWinner ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <User size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900">{bid.vendorName}</h3>
                        {isThisBidWinner && (
                        <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Победитель</span>
                            )}
                        {isBest && !isThisBidWinner && (
                            <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Лучшая цена</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 italic mt-1">
                        {bid.message || "Без комментария"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                   <div className={`text-2xl font-black ${isThisBidWinner ? 'text-green-600' : 'text-slate-900'}`}>
                    {Number(bid.offerPrice).toLocaleString('ru-RU')} ₽
                        </div>
                    <div className="mt-3">
                    <SelectWinnerButton 
                      tenderId={tenderData.id} 
                      bidId={bid.id} 
                      isWinner={isThisBidWinner}
                      isClosed={isTenderClosed}
                    />
                  </div>
                  </div>
                </div>
              </div>
            );
          })}

          {tenderData.bids.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Предложений пока нет.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}