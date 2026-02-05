import { db } from '@/lib/db';
import { tenders, bids } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, User, MessageSquare, Calendar, Tag, Paperclip, ShieldCheck, FileSpreadsheet, Layers } from 'lucide-react';
import Link from 'next/link';
import SelectWinnerButton from '@/components/SelectWinnerButton';

export default async function TenderDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  if (session?.user?.role !== "customer") redirect("/");

  const { id } = await params;
  const tenderId = parseInt(id);

  if (isNaN(tenderId)) notFound();

  const tenderData = await db.query.tenders.findFirst({
    where: eq(tenders.id, tenderId),
    with: {
      bids: {
        orderBy: [desc(bids.createdAt)],
      },
    },
  });
  
  if (!tenderData) notFound();

  const prices = tenderData.bids.map(b => Number(b.offerPrice));
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const isTenderClosed = tenderData.status === 'Завершен';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/customer/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold">Назад в панель</span>
        </Link>
        <div className="flex gap-2">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${tenderData.status === 'Активен' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {tenderData.status}
          </span>
        </div>
      </div>

      {/* Основная информация о лоте */}
      <div className="bg-white rounded-[32px] border border-slate-200 p-8 mb-10 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-6 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-lg">
                <Tag size={14} />
                {tenderData.category}
              </div>
              {tenderData.subCategory && (
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  {tenderData.subCategory}
                </div>
              )}
              {tenderData.workType && (
                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                  {tenderData.workType}
                </div>
              )}
            </div>

            <h1 className="text-4xl font-black text-slate-900 leading-tight">
              {tenderData.title}
            </h1>

            {/* БЛОК ФАЙЛОВ */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {tenderData.attachmentUrl && (
                <a href={tenderData.attachmentUrl} target="_blank" className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-100 transition-colors border border-emerald-100">
                  <FileSpreadsheet size={16} />
                  СМЕТА: {tenderData.attachmentName || "Загрузить"}
                </a>
              )}
              {tenderData.volumeUrl && (
                <a href={tenderData.volumeUrl} target="_blank" className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-100 transition-colors border border-blue-100">
                  <Layers size={16} />
                  ОБЪЕМЫ: {tenderData.volumeName || "Загрузить"}
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-500 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                Создан: {tenderData.createdAt?.toLocaleDateString('ru-RU')}
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-xl font-mono text-xs text-slate-600">
                ID: {tenderData.id}
              </div>
            </div>

            {/* Блок требований */}
            {tenderData.requirements && Array.isArray(tenderData.requirements) && (
              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Требования к поставщику</p>
                <div className="flex flex-wrap gap-2">
                  {tenderData.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[24px] text-white flex flex-col justify-center items-end min-w-[280px] shadow-xl shadow-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Начальная цена</span>
            <span className="text-4xl font-black italic">
              {Number(tenderData.price).toLocaleString('ru-RU')} ₸
            </span>
          </div>
        </div>
      </div>

      {/* Список заявок */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-slate-900">Отклики поставщиков</h2>
          <div className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
            Получено: {tenderData.bids.length}
          </div>
        </div>

        <div className="grid gap-4">
          {tenderData.bids.map((bid) => {
            const isBest = Number(bid.offerPrice) === minPrice;
            const isThisBidWinner = tenderData.winnerId === bid.id;
            
            return (
              <div key={bid.id} className={`bg-white p-8 rounded-[24px] border-2 transition-all duration-300 ${isThisBidWinner ? 'border-emerald-500 bg-emerald-50/10 shadow-lg shadow-emerald-100/50' : isBest ? 'border-blue-100 bg-blue-50/5' : 'border-slate-50'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-inner ${isThisBidWinner ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <User size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-black text-xl text-slate-900">{bid.vendorName}</h3>
                        {isThisBidWinner && (
                          <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest animate-pulse">Победитель</span>
                        )}
                        {isBest && !isThisBidWinner && (
                          <span className="bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest">Лучшая цена</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-sm font-medium italic">
                        &ldquo;{bid.message || "Без комментария"}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ценовое предложение</p>
                      <div className={`text-3xl font-black ${isThisBidWinner ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {Number(bid.offerPrice).toLocaleString('ru-RU')} ₸
                      </div>
                    </div>
                    
                    <SelectWinnerButton 
                      tenderId={tenderData.id} 
                      bidId={bid.id} 
                      isWinner={isThisBidWinner}
                      isClosed={isTenderClosed}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {tenderData.bids.length === 0 && (
            <div className="text-center py-24 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
              <MessageSquare size={56} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-black text-lg">Пока нет предложений</p>
              <p className="text-slate-400 text-sm mt-1">Ожидайте откликов от поставщиков на витрине</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}