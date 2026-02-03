import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AuditLogsPage() {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/');

  // Получаем последние 50 действий на портале
  const logs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit: 50,
  });

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black mb-8">Журнал активности</h1>
      
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className={`mt-1 w-2 h-2 rounded-full ${
              log.action === 'USER_REGISTERED' ? 'bg-green-500' : 'bg-blue-500'
            }`} />
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-black text-slate-900 uppercase text-xs tracking-wider">
                  {log.action.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                {log.createdAt 
                    ? new Date(log.createdAt).toLocaleString('ru-RK') 
                    : 'Дата не указана'}
                </span>
              </div>
              
              <div className="mt-2 text-sm text-slate-600">
                {log.action === 'USER_REGISTERED' ? (
                  <p>Новый пользователь <b>{(log.details as any)?.fio}</b> зарегистрирован. БИН: {(log.details as any)?.bin || 'нет'}</p>
                ) : (
                  <p>Действие над ID: {log.targetId}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}