import { db } from '@/lib/db';
import { tenders, bids } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { 
  ArrowLeft, User, MessageSquare, 
  Calendar, Tag, FileText, Download, 
  ShieldCheck, Briefcase 
} from 'lucide-react';
import Link from 'next/link';
import SelectWinnerButton from '@/components/SelectWinnerButton';

export default async function TenderDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

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

  // Парсим требования, если они хранятся как JSON-строка
  const requirements = typeof tenderData.requirements === 'string' 
    ? JSON.parse(tenderData.requirements) 
    : (tenderData.requirements || []);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Назад к списку</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link 
            href={`/admin/dashboard/tenders/${tenderId}/edit`}
            className="bg-white border border-slate-200 text-slate-600 hover:text-green-600 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            Редактировать лот
          </Link>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${tenderData.status === 'Активен' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
            {tenderData.status}
          </span>
        </div>
      </div>

      {/* Основная информация */}
      <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest">
                <Tag size={14} />
                {tenderData.category} {tenderData.subCategory ? `/ ${tenderData.subCategory}` : ''}
              </div>
              <h1 className="text-4xl font-black text-slate-900 leading-tight">
                {tenderData.title}
              </h1>
              <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {tenderData.createdAt?.toLocaleDateString('ru-RU')}
                </div>
                <div className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">ID: {tenderData.id}</div>
              </div>
            </div>

            {/* Блок с файлами */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* СМЕТА */}
            {tenderData.attachmentUrl && (
              <a 
                href={tenderData.attachmentUrl} 
                target="_blank"
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-green-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">
                      {tenderData.attachmentName || "Смета проекта"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold">Скачать файл</p>
                  </div>
                </div>
                <Download size={18} className="text-slate-300 group-hover:text-green-600" />
              </a>
            )}

            {/* ОБЪЕМЫ */}
            {tenderData.volumeUrl && (
              <a 
                href={tenderData.volumeUrl} 
                target="_blank"
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">
                      {tenderData.volumeName || "Объемы работ"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold">Скачать файл</p>
                  </div>
                </div>
                <Download size={18} className="text-slate-300 group-hover:text-blue-600" />
              </a>
            )}
          </div>
          </div>

          {/* Боковая панель с ценой и требованиями */}
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-[24px] text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Бюджет лота</p>
              <p className="text-3xl font-black italic">
                {Number(tenderData.price).toLocaleString('ru-RU')} ₸
              </p>
            </div>

            <div className="bg-green-50/50 p-6 rounded-[24px] border border-green-100">
              <div className="flex items-center gap-2 mb-4 text-green-700 font-black text-xs uppercase tracking-widest">
                <ShieldCheck size={16} />
                Требования
              </div>
              <ul className="space-y-3">
                {requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-bold text-slate-600 leading-relaxed">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Список заявок (без изменений, но с улучшенными отступами) */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Отклики поставщиков</h2>
          <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">
            {tenderData.bids.length} заявок
          </span>
        </div>

        <div className="grid gap-4">
          {tenderData.bids.map((bid) => {
            const isBest = Number(bid.offerPrice) === minPrice;
            const isThisBidWinner = tenderData.winnerId === bid.id;
            
            return (
              <div key={bid.id} className={`bg-white p-6 rounded-[24px] border-2 transition-all ${isThisBidWinner ? 'border-green-500 bg-green-50/30 shadow-lg' : isBest ? 'border-blue-200' : 'border-slate-100'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isThisBidWinner ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <User size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900">{bid.vendorName}</h3>
                        {isThisBidWinner && (
                          <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Победитель</span>
                        )}
                        {isBest && !isThisBidWinner && (
                          <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Лучшая цена</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 italic mt-1 max-w-md line-clamp-2">
                        «{bid.message || "Без комментария"}»
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-black ${isThisBidWinner ? 'text-green-600' : 'text-slate-900'}`}>
                      {Number(bid.offerPrice).toLocaleString('ru-RU')} ₸
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
            <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-200">
              <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">Предложений пока нет. Ожидайте откликов.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}