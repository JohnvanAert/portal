'use client'

import { useState } from 'react'
import { registerUser } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    const result = await registerUser(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // Редирект на логин с параметром успеха
      router.push('/login?message=registered')
    }
  }

  return (
    <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-xl shadow-slate-200/60 border border-slate-100">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Создать аккаунт</h1>
        <p className="text-slate-500 font-medium">Добро пожаловать в B-Portal</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Как вас зовут?</label>
          <input 
            name="name" 
            type="text"
            required 
            placeholder="Иван Иванов" 
            className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300 font-medium" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Электронная почта</label>
          <input 
            name="email" 
            type="email" 
            required 
            placeholder="email@example.com" 
            className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300 font-medium" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Пароль</label>
          <input 
            name="password" 
            type="password" 
            required 
            placeholder="••••••••" 
            className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300 font-medium" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Ваша роль</label>
          <select 
            name="role" 
            className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white cursor-pointer font-medium appearance-none"
          >
            <option value="vendor">Поставщик (Ищу тендеры)</option>
            <option value="admin">Заказчик (Создаю тендеры)</option>
          </select>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {loading ? 'Создание профиля...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-50 text-center">
        <p className="text-slate-500 font-medium">
          Уже зарегистрированы?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
            Войти в систему
          </Link>
        </p>
      </div>
    </div>
  )
}