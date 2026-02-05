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
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Info
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BidModal from '@/components/BidModal';

export default async function TenderDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  if (!session) redirect('/login');
  
  const { id } = await params;
  const tenderId = Number(id);
  if (isNaN(tenderId)) notFound();

  const tender = await db.query.tenders.findFirst({
    where: eq(tenders.id, tenderId),
  });

  if (!tender) notFound();

  const myBid = await db.query.bids.findFirst({
    where: (bids, { eq, and }) => and(
      eq(bids.tenderId, tenderId),
      eq(bids.userId, session.user.id!)
    )
  });

  const isWinner = myBid && tender.winnerId === myBid.id;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <Link 
        href="/vendor" 
        className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-8 transition-colors font-bold text-sm group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Назад к витрине
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            {isWinner && (
              <div className="bg-emerald-500 p-4 text-white flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs">
                <CheckCircle2 size={18} /> Вы выбраны победителем
              </div>
            )}

            <div className="p-10">
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {tender.category}
                  </span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">ID: {tender.id}</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {tender.title}
                </h1>
              </div>

              {/* Файлы */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {tender.attachmentUrl && (
                  <a href={tender.attachmentUrl} target="_blank" className="flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-50 bg-emerald-50/20 hover:bg-emerald-50 transition-colors group">
                    <div className="bg-emerald-500 p-3 rounded-xl text-white shadow-lg shadow-emerald-200">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Смета проекта</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{tender.attachmentName || 'Excel файл'}</p>
                    </div>
                  </a>
                )}
                {tender.volumeUrl && (
                  <a href={tender.volumeUrl} target="_blank" className="flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-50 bg-blue-50/20 hover:bg-blue-50 transition-colors group">
                    <div className="bg-blue-500 p-3 rounded-xl text-white shadow-lg shadow-blue-200">
                      <Layers size={24} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Ведомость объемов</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{tender.volumeName || 'Документация'}</p>
                    </div>
                  </a>
                )}
              </div>

              {/* Требования */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-emerald-500" /> Требования к участнику
                </h3>
                <div className="grid gap-2">
                  {tender.requirements?.map((req, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 text-sm">
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> {req}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Сайдбар с ценой и действием */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-xl shadow-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Начальная цена</p>
            <p className="text-4xl font-black mb-8 italic italic">
              {Number(tender.price).toLocaleString()} ₸
            </p>
            
            {!myBid ? (
              <BidModal tenderId={tender.id} tenderTitle={tender.title} />
            ) : (
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Заявка подана</p>
                <p className="text-2xl font-black">{Number(myBid.offerPrice).toLocaleString()} ₸</p>
              </div>
            )}
          </div>

          <div className="bg-blue-600 rounded-[40px] p-8 text-white">
            <div className="flex gap-3 mb-4">
              <Info className="shrink-0" />
              <p className="text-sm font-bold leading-relaxed">
                Подавая заявку, вы подтверждаете наличие всех необходимых лицензий и ресурсов для выполнения работ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}