import { db } from '@/lib/db';
import { tenders } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import EditTenderForm from "./EditTenderForm"; // Клиентский компонент формы

export default async function EditTenderPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  const { id } = await params;
  const tenderId = Number(id);

  // Защита: только админ (заказчик) может редактировать
  if (session?.user?.role !== "admin") redirect("/vendor");

  const tender = await db.query.tenders.findFirst({
    where: eq(tenders.id, tenderId),
  });

  if (!tender) notFound();

  return (
    <div className="max-w-3xl mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Редактирование лота</h1>
        <p className="text-slate-500">ID тендера: {tender.id}</p>
      </header>

      <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm">
        <EditTenderForm tender={tender} />
      </div>
    </div>
  );
}