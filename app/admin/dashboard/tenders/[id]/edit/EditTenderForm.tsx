"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTender } from "@/app/actions/tenderActions"; // Путь к твоему экшену
import { Save, X } from "lucide-react";

export default function EditTenderForm({ tender }: { tender: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Инициализируем состояние данными из пропсов
  const [formData, setFormData] = useState({
    title: tender.title,
    price: tender.price,
    category: tender.category,
    status: tender.status,
    description: tender.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await updateTender(tender.id, formData);
    
    if (result.success) {
      router.push(`/admin/dashboard/tenders/${tender.id}`);
      router.refresh();
    } else {
      alert("Ошибка при сохранении");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Название лота</label>
        <input
          required
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Цена (₽)</label>
          <input
            type="number"
            required
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Статус</label>
          <select
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="Активен">Активен</option>
            <option value="Завершен">Завершен</option>
            <option value="Архив">Архив</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Категория</label>
        <input
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        />
      </div>

      <div className="pt-6 flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={20} />
          {loading ? "Сохранение..." : "Сохранить изменения"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center"
        >
          <X size={20} />
        </button>
      </div>
    </form>
  );
}