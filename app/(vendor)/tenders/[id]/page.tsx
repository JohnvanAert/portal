import { db } from '@/lib/db';
import { tenders, bids } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from "@/auth";
import { 
  Calendar, 
  Tag, 
  Wallet, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TenderDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  
  // 1. В Next.js 15 params — это Promise, его нужно распаковать
  const { id } = await params;
  const tenderId = Number(id);

  if (isNaN(tenderId)) notFound();

  // 2. Получаем данные тендера. 
  // Используем select, чтобы явно исключить description, если колонки еще нет в БД
  const tenderResult = await db
    .select({
      id: tenders.id,
      title: tenders.title,
      price: tenders.price,
      type: tenders.type,
      status: tenders.status,
      winnerId: tenders.winnerId,
      createdAt: tenders.createdAt,
    })
    .from(tenders)
    .where(eq(tenders.id, tenderId))
    .limit(1);

  const tender = tenderResult[0];

  if (!tender) notFound();

  // 3. Ищем заявку текущего пользователя для этого тендера
  const myBid = session?.user?.id ? await db.query.bids.findFirst({
    where: (bids, { eq, and }) => and(
      eq(bids.tenderId, tenderId),
      eq(bids.userId, session.user.id)
    )
  }) : null;

  const isWinner = myBid && tender.winnerId === myBid.id;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link 
        href="/my-bids" 
        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-8 transition-colors font-medium text-sm"
      >
        <ArrowLeft size={16} /> Назад к списку
      </Link>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Шапка с индикатором победы */}
        {isWinner && (
          <div className="bg-emerald-500 p-4 text-white flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs">
            <CheckCircle2 size={18} /> Вы победили в этом тендере
          </div>
        )}

        <div className="p-10">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                {tender.type}
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {tender.title}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Начальная цена</p>
              <p className="text-3xl font-black text-slate-900">
                {Number(tender.price).toLocaleString()} ₸
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 py-8 border-y border-slate-50">
            <DetailItem 
              icon={<Calendar size={20} />} 
              label="Дата публикации" 
              value={tender.createdAt ? new Date(tender.createdAt).toLocaleDateString('ru-RU') : '---'} 
            />
            <DetailItem 
              icon={<Tag size={20} />} 
              label="ID закупки" 
              value={String(tender.id).slice(0, 12)} 
            />
            <DetailItem 
              icon={<AlertCircle size={20} />} 
              label="Статус" 
              value={tender.status ?? 'Активен'} 
            />
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Техническое описание</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              {/* Используем приведение к any, чтобы TS не ругался на отсутствие поля в схеме */}
              {(tender as any).description || "Описание лота не предоставлено заказчиком."}
            </p>
          </div>

          {/* Информация о ставке поставщика */}
          {myBid && (
            <div className="mt-12 p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600">
                  <Wallet size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Ваше предложение</h3>
                  <p className="text-sm text-slate-500 font-medium">Подано {new Date(myBid.createdAt!).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
              <div className="text-2xl font-black text-blue-600">
                {Number(myBid.offerPrice).toLocaleString()} ₸
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-300">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}