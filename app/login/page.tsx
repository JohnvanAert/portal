'use client'

import { signIn } from "next-auth/react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

// Выносим контент в отдельный компонент для работы с useSearchParams
function LoginContent() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Проверяем, пришел ли пользователь после успешной регистрации
  const isRegistered = searchParams.get('message') === 'registered'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Неверный логин или пароль")
        setIsLoading(false)
      } else {
        router.replace("/")
        router.refresh()
      }
    } catch (err) {
      setError("Произошла непредвиденная ошибка")
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-blue-600 tracking-tighter uppercase">B-Portal</h1>
        <p className="text-slate-500 mt-2 font-medium">Вход в систему управления</p>
      </div>

      {/* Сообщение об успешной регистрации */}
      {isRegistered && !error && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-emerald-100 animate-bounce-short">
          ✨ Регистрация успешна! Теперь вы можете войти в свой аккаунт.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Email</label>
          <input 
            name="email" 
            type="email" 
            placeholder="admin@pro.ru"
            className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Пароль</label>
          <input 
            name="password" 
            type="password" 
            placeholder="••••••"
            className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            required 
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={isLoading}
          className={`w-full text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-100 ${
            isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Загрузка...' : 'Войти в систему'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-50 text-center">
        <p className="text-slate-500 font-medium text-sm">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-blue-600 font-bold hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}

// Главный компонент оборачиваем в Suspense, так как используем useSearchParams
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={<div className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Загрузка...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  )
}