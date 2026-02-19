// app/admin/logs/page.tsx
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Activity, LogIn, FilePlus, Send, ShieldAlert, ShieldX, Globe } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/');

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const totalCountResult = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  const totalItems = totalCountResult[0].count;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const logs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit: ITEMS_PER_PAGE,
    offset: offset,
  });

  // Расширенная функция для иконок
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_REGISTERED': return <Activity size={16} className="text-green-600" />;
      case 'USER_LOGIN_EDS': return <LogIn size={16} className="text-blue-600" />;
      case 'LOGIN_ATTEMPT_BLOCKED': return <ShieldX size={16} className="text-red-600" />;
      case 'LOGIN_FAILED': return <ShieldAlert size={16} className="text-orange-600" />;
      case 'TENDER_CREATED': return <FilePlus size={16} className="text-purple-600" />;
      case 'BID_PLACED': return <Send size={16} className="text-orange-600" />;
      default: return <Activity size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="p-10 max-w-5xl mx-auto min-h-screen flex flex-col bg-slate-50/30">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Журнал активности</h1>
        <span className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
          Системный аудит
        </span>
      </div>
      
      <div className="space-y-4 flex-1">
        {logs.map((log) => (
          <div key={log.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-start gap-4 transition-all hover:border-blue-200 hover:shadow-md">
            <div className={`mt-1 p-2 rounded-xl shrink-0 ${
              log.action === 'USER_REGISTERED' ? 'bg-green-50' : 
              log.action === 'USER_LOGIN_EDS' ? 'bg-blue-50' : 
              log.action === 'LOGIN_ATTEMPT_BLOCKED' ? 'bg-red-50' :
              log.action === 'LOGIN_FAILED' ? 'bg-orange-50' :
              log.action === 'TENDER_CREATED' ? 'bg-purple-50' : 'bg-slate-50'
            }`}>
              {getActionIcon(log.action)}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <span className={`font-black uppercase text-[10px] tracking-widest px-2 py-0.5 rounded border ${
                        log.action.includes('BLOCKED') || log.action.includes('FAILED') 
                        ? 'bg-red-50 text-red-700 border-red-100' 
                        : 'bg-slate-50 text-slate-900 border-slate-100'
                    }`}>
                    {log.action.replace(/_/g, ' ')}
                    </span>
                    
                    {/* Вывод IP адреса если он есть в details */}
                    {(log.details as any)?.ip && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50/50 rounded border border-blue-100 text-blue-600">
                            <Globe size={10} />
                            <span className="text-[10px] font-mono font-bold">{(log.details as any).ip}</span>
                        </div>
                    )}
                </div>

                <span className="text-[11px] text-slate-400 font-bold font-mono bg-white px-2 py-0.5 rounded-md border border-slate-50">
                  {log.createdAt 
                    ? new Date(log.createdAt).toLocaleString('ru-RK') 
                    : 'Дата не указана'}
                </span>
              </div>
              
              <div className="mt-3 text-sm text-slate-600 font-medium leading-relaxed">
                {/* 1. Регистрация */}
                {log.action === 'USER_REGISTERED' && (
                  <p>
                    Новый пользователь <span className="text-slate-900 font-bold underline decoration-green-200 underline-offset-4">{(log.details as any)?.fio}</span> зарегистрирован. 
                    БИН: <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">{(log.details as any)?.bin || 'индивидуальный'}</span>
                  </p>
                )}

                {/* 2. Вход через ЭЦП */}
                {log.action === 'USER_LOGIN_EDS' && (
                  <p>
                    Успешная авторизация через <span className="font-bold text-slate-900">ЭЦП</span>. 
                    ИИН: <span className="font-mono text-slate-500 italic">{(log.details as any)?.iin || 'не указан'}</span>
                  </p>
                )}

                {/* 3. Блокировка */}
                {log.action === 'LOGIN_ATTEMPT_BLOCKED' && (
                  <div className="space-y-1">
                    <p className="text-red-600 font-bold">Попытка входа заблокированного аккаунта</p>
                    <p className="text-xs text-slate-500">
                        Метод: <span className="font-bold uppercase">{(log.details as any)?.method}</span> 
                        { (log.details as any)?.email && ` | Email: ${(log.details as any)?.email}` }
                    </p>
                  </div>
                )}

                {/* 4. Неверный пароль */}
                {log.action === 'LOGIN_FAILED' && (
                  <p>
                    Неудачный вход: <span className="text-orange-600 font-bold">неверный пароль</span> для ID: <span className="font-mono bg-slate-100 px-1 rounded">{log.userId}</span>
                  </p>
                )}

                {/* 5. Создание тендера */}
                {log.action === 'TENDER_CREATED' && (
                  <p>
                    Опубликован новый лот: <span className="text-purple-600 font-bold italic">"{(log.details as any)?.title}"</span> 
                    <span className="ml-2 text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded">ID: {log.targetId}</span>
                  </p>
                )}

                {/* 6. Подача заявки */}
                {log.action === 'BID_PLACED' && (
                  <p>
                    Поставщик <span className="text-slate-900 font-bold">{(log.details as any)?.vendor}</span> подал отклик на сумму 
                    <span className="mx-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-lg font-black italic">{(log.details as any)?.amount} ₸</span> 
                    по лоту #{log.targetId}
                  </p>
                )}
                
                {/* Резервный вариант */}
                {!['USER_REGISTERED', 'USER_LOGIN_EDS', 'TENDER_CREATED', 'BID_PLACED', 'LOGIN_ATTEMPT_BLOCKED', 'LOGIN_FAILED'].includes(log.action) && (
                  <p className="text-slate-400 italic">Системное событие над объектом ID: {log.targetId || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100 shadow-inner">
             <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Журнал пуст</p>
          </div>
        )}
      </div>

      {/* ПАНЕЛЬ ПАГИНАЦИИ */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href={`?page=${currentPage - 1}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-xs uppercase tracking-tighter transition-all ${
              currentPage <= 1 
                ? "pointer-events-none opacity-30 bg-slate-50 text-slate-300" 
                : "hover:bg-white hover:shadow-lg bg-white border-slate-200 text-slate-900 active:scale-95"
            }`}
          >
            <ChevronLeft size={16} /> Назад
          </Link>

          <div className="flex items-center gap-1 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm px-5">
            <span className="text-xs font-black text-slate-900 italic">Стр. {currentPage}</span>
            <span className="text-xs font-bold text-slate-300 italic px-1">/</span>
            <span className="text-xs font-bold text-slate-400 italic">{totalPages}</span>
          </div>

          <Link
            href={`?page=${currentPage + 1}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-xs uppercase tracking-tighter transition-all ${
              currentPage >= totalPages 
                ? "pointer-events-none opacity-30 bg-slate-50 text-slate-300" 
                : "hover:bg-white hover:shadow-lg bg-white border-slate-200 text-slate-900 active:scale-95"
            }`}
          >
            Вперед <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}