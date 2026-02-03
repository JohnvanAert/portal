import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { updateUserRole } from "@/app/actions/admin";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  
  // Защита страницы: если не админ, отправляем на главную
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db.query.users.findMany({
    with: {
      // если есть связь с организациями, можно подтянуть название компании
      organization: true 
    }
  });

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Админ-панель</h1>
          <p className="text-slate-500 font-medium mt-2">Управление доступом сотрудников холдинга</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 text-xs font-black uppercase text-slate-400">Сотрудник / Организация</th>
              <th className="p-6 text-xs font-black uppercase text-slate-400">Email</th>
              <th className="p-6 text-xs font-black uppercase text-slate-400">Текущая роль</th>
              <th className="p-6 text-xs font-black uppercase text-slate-400">Действие</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user: any) => (
              <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                <td className="p-6">
                  <div className="font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-400">{user.organization?.name || "Личный аккаунт"}</div>
                </td>
                <td className="p-6 text-sm text-slate-600 font-medium">{user.email}</td>
                <td className="p-6">
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {user.role === 'admin' ? 'Заказчик' : 'Поставщик'}
                  </span>
                </td>
                <td className="p-6">
                  <form action={async () => {
                    'use server'
                    const nextRole = user.role === 'admin' ? 'vendor' : 'admin';
                    await updateUserRole(user.id, nextRole);
                  }}>
                    <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                      Назначить {user.role === 'admin' ? 'Поставщиком' : 'Заказчиком'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}