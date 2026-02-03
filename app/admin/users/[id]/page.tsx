import { db } from "@/lib/db";
import { users, organizations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { updateUserRole } from "@/app/actions/admin"; // Ваш экшен со сменой роли

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, params.id),
    with: { organization: true }
  });

  if (!user) return <div>Пользователь не найден</div>;

  return (
    <div className="max-w-2xl bg-white p-8 rounded-[32px] border shadow-sm">
      <h2 className="text-2xl font-black mb-6">Редактирование: {user.name}</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-slate-50 rounded-2xl">
          <p className="text-xs font-bold text-slate-400">ДАННЫЕ ЭЦП</p>
          <p className="font-bold">{user.name}</p>
          <p className="text-sm">{user.email}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl">
          <p className="text-xs font-bold text-slate-400">ОРГАНИЗАЦИЯ</p>
          <p className="font-bold">{(user as any).organization?.name}</p>
          <p className="text-sm">БИН: {(user as any).organization?.bin}</p>
        </div>
      </div>

      <form action={async (formData) => {
        'use server'
        const role = formData.get("role") as any;
        await updateUserRole(user.id, role);
      }}>
        <label className="block text-sm font-bold mb-2">Назначить роль в системе:</label>
        <select name="role" 
        // Добавляем || "" чтобы убрать ошибку типизации null
        defaultValue={user.role || ""} 
        className="w-full p-4 border rounded-2xl mb-6 bg-white outline-none"
        >
        <option value="vendor">Поставщик (Только просмотр/участие)</option>
        <option value="admin">Заказчик (Создание тендеров)</option>
        <option value="superadmin">Супервайзер (Полный доступ)</option>
        </select>
        
        <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700">
          Сохранить изменения
        </button>
      </form>
    </div>
  );
}