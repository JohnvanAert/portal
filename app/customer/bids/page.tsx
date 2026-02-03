import { db } from '@/lib/db';
import { bids, tenders } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AllBidsPage() {
  const session = await auth();
  if (session?.user?.role !== 'customer') redirect('/');

  // Загружаем заявки вместе с названиями тендеров
  const allBids = await db.select({
    id: bids.id,
    vendor: bids.vendorName,
    price: bids.offerPrice,
    date: bids.createdAt,
    tenderTitle: tenders.title,
    tenderId: tenders.id
  })
  .from(bids)
  .leftJoin(tenders, eq(bids.tenderId, tenders.id))
  .orderBy(desc(bids.createdAt));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black mb-8">Все входящие предложения</h1>
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 text-xs font-bold uppercase text-slate-400">Поставщик</th>
              <th className="p-4 text-xs font-bold uppercase text-slate-400">Тендер</th>
              <th className="p-4 text-xs font-bold uppercase text-slate-400">Цена</th>
              <th className="p-4 text-xs font-bold uppercase text-slate-400">Дата</th>
            </tr>
          </thead>
          <tbody>
            {allBids.map((bid) => (
              <tr key={bid.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-700">{bid.vendor}</td>
                <td className="p-4 text-sm text-blue-600 font-medium">
                  <a href={`/admin/dashboard/tenders/${bid.tenderId}`}>{bid.tenderTitle}</a>
                </td>
                <td className="p-4 font-black text-slate-900">{Number(bid.price).toLocaleString()} ₽</td>
                <td className="p-4 text-xs text-slate-400">
                  {bid.date?.toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}