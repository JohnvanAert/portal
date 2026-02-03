'use client'

import { useState } from 'react'
import { registerRegular } from '@/app/actions/auth' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, User, Lock, ArrowRight, ShieldCheck } from 'lucide-react'

export default function RegisterRegularForm({ onSwitch }: { onSwitch: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    try {
      const result = await registerRegular(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/login?message=registered')
      }
    } catch (err: any) {
      setError("Ошибка регистрации: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-xl shadow-slate-200/60 border border-slate-100 animate-in fade-in zoom-in duration-300">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl mb-4">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Регистрация</h1>
        <p className="text-slate-500 font-medium">Создание аккаунта вручную</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 animate-in shake">
          {error}
        </div>
      )}

      <form action={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">ФИО</label>
          <div className="relative">
            <User className="absolute left-4 top-4 text-slate-400" size={18} />
            <input 
              name="name" 
              type="text" 
              required 
              placeholder="Введите полное имя" 
              className="w-full border border-slate-200 p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Email адрес</label>
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-400" size={18} />
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="example@mail.com" 
              className="w-full border border-slate-200 p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">Пароль</label>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full border border-slate-200 p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 mt-4 shadow-slate-200"
        >
          {loading ? 'Создание профиля...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col gap-4 text-center">
        <button 
          onClick={onSwitch} 
          type="button"
          className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors flex items-center justify-center gap-2 group"
        >
          Вернуться к регистрации через ЭЦП 
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
        
        <p className="text-slate-500 font-medium text-sm">
          Уже есть аккаунт? {' '}
          <Link href="/login" className="text-slate-900 font-bold hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}