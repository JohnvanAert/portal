'use client'

import { updateProfile } from "@/app/actions/user"
import { User, Building2, IdCard, Mail, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"


export default function ProfileForm({ userData }: { userData: any }) {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await updateProfile(formData);

      if (result?.success) {
        // Обновляем сессию (теперь auth.ts понимает этот вызов)
        if (update) {
          await update({
            ...session,
            user: {
              ...session?.user,
              name: formData.get('name') as string,
            },
          });
        }

        setMessage({ type: 'success', text: 'Данные успешно обновлены!' });
        
        // Мягкое обновление серверных компонентов без перезагрузки всей страницы
        router.refresh(); 
      } else {
        setMessage({ type: 'error', text: result?.error || 'Произошла ошибка' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при сохранении' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {message && (
        <div className={`p-4 rounded-2xl border font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          {message.type === 'success' && <CheckCircle2 size={18} />}
          {message.text}
        </div>
      )}

      {/* Секция: Личные данные */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <User size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Личная информация</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">ФИО</label>
            <input 
              name="name"
              defaultValue={userData.name || ''}
              className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
            <div className="w-full border border-slate-100 bg-slate-50 p-4 rounded-2xl text-slate-400 flex items-center gap-3 font-medium cursor-not-allowed">
              <Mail size={18} />
              {userData.email}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">ИИН</label>
            <div className="relative">
              <IdCard className="absolute left-4 top-4 text-slate-400" size={20} />
              <input 
                name="iin"
                defaultValue={userData.iin || ''}
                placeholder="12-значный номер"
                className="w-full border border-slate-200 pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Секция: Организация */}
      {userData.role === 'vendor' && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Building2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Данные организации</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Название компании</label>
              <input 
                name="orgName"
                defaultValue={userData.organization?.name || ''}
                className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">БИН</label>
              <input 
                name="bin"
                defaultValue={userData.organization?.bin || ''}
                className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button 
          type="submit"
          disabled={loading}
          className="bg-slate-900 text-white font-black px-12 py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </form>
  )
}