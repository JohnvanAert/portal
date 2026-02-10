import { db } from '@/lib/db';
import { tenders, organizations } from '@/lib/schema';
import BidModal from '@/components/BidModal';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth'; 
import { redirect } from 'next/navigation'; // Импортируем redirect

export default async function VendorPage() {
  // 1. Пытаемся получить сессию
  const session = await auth();

  // 2. ЕСЛИ СЕССИИ НЕТ — СРАЗУ НА ЛОГИН
  // Это предотвратит рендер страницы для неавторизованного юзера
  if (!session) {
    redirect('/login');
  }

  // 1. Получаем данные об организации текущего юзера
  const userOrg = await db.query.organizations.findFirst({
    where: eq(organizations.userId, session.user.id!)
  });

  // 2. Подготавливаем объект, который требует BidModal
  const vendorDataForModal = {
    companyName: userOrg?.name || "Название не указано",
    bin: userOrg?.bin || "БИН не указан",
    representative: session.user.name || "ФИО не указано",
  };

  // 3. Если мы здесь, значит юзер вошел
  const availableTenders = await db
    .select()
    .from(tenders)
    .where(eq(tenders.status, 'Активен'))
    .orderBy(desc(tenders.createdAt));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Витрина закупок</h1>
      
      <div className="grid gap-4">
        {availableTenders.map((t) => (
          <div key={t.id} className="bg-white p-6 rounded-2xl border flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                {t.category} {t.subCategory ? `• ${t.subCategory}` : ''}
              </span>
              <h3 className="text-lg font-bold text-slate-800">{t.title}</h3>
              <p className="text-sm text-slate-500 font-mono">ID: {t.id}</p>
            </div>
            
            <div className="text-right flex flex-col items-end gap-3">
              <div className="text-xl font-black text-slate-900">
                {Number(t.price).toLocaleString('ru-RU')} ₽
              </div>

              {/* Здесь уже не нужен тернарник для гостя, так как гость сюда не попадет */}
              {session.user.role === 'vendor' ? (
                // ПЕРЕДАЕМ vendorData В МОДАЛКУ
                <BidModal 
                  tenderId={t.id} 
                  tenderTitle={t.title} 
                  vendorData={vendorDataForModal} 
                />
              ) : (
                <div className="py-2 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Режим просмотра (Заказчик)
                </div>
              )}
            </div>
          </div>
        ))}

        {availableTenders.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
            <p className="text-slate-400 font-medium">Активных лотов пока нет.</p>
          </div>
        )}
      </div>
    </div>
  );
}