import { db } from "@/lib/db";
import { users, organizations } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Building2, Mail, User, Hash } from "lucide-react";

export default async function VendorsPage() {
  // Получаем всех пользователей с ролью 'vendor' и их организации
  const allVendors = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      orgName: organizations.name,
      bin: organizations.bin,
    })
    .from(users)
    .leftJoin(organizations, eq(users.id, organizations.userId))
    .where(eq(users.role, 'vendor'))
    .orderBy(desc(users.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Поставщики</h1>
        <p className="text-slate-500 font-medium">Управление зарегистрированными компаниями</p>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Компания / БИН</th>
              <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Представитель</th>
              <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Контакты</th>
              <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {allVendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{vendor.orgName || 'Не указано'}</div>
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Hash size={12} /> {vendor.bin || '---'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <User size={16} className="text-slate-400" />
                    {vendor.name}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2 text-blue-600 font-medium hover:underline cursor-pointer">
                    <Mail size={16} />
                    {vendor.email}
                  </div>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    Активен
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {allVendors.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-medium">
            Поставщиков пока нет
          </div>
        )}
      </div>
    </div>
  );
}