'use client'

import { signIn } from "next-auth/react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signDataWithNCALayer } from "@/lib/ncaService" // Наш файл взаимодействия с NCALayer
import { parseCertificateData } from "@/app/actions/auth";

function LoginContent() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEdsLoading, setIsEdsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const isRegistered = searchParams.get('message') === 'registered'

  // Хэндлер для входа через ЭЦП
  const handleEdsSignIn = async () => {
  setError(null);
  setIsEdsLoading(true);

  try {
    const nonce = `auth_${Date.now()}`;
    // 1. Получаем подписанный XML от NCALayer
    const response = await signDataWithNCALayer(nonce);
    
    // 2. Регулярным выражением достаем контент сертификата
    const certMatch = response.match(/<ds:X509Certificate>([\s\S]*?)<\/ds:X509Certificate>/);
    if (!certMatch || !certMatch[1]) {
      throw new Error("В ответе NCALayer не обнаружен сертификат");
    }

    const pureCert = certMatch[1].replace(/\s/g, '');

    // 3. Парсим данные сертификата (ФИО, ИИН, Email)
    const certParse = await parseCertificateData(pureCert);

    // Проверяем наличие ИИН (обязательно для входа)
    if (!certParse.success || !certParse.data?.iin) {
      throw new Error(certParse.error || "Не удалось получить ИИН из вашего ключа");
    }

    const { iin, email } = certParse.data;
    console.log("Данные из ключа успешно получены:", { iin, email });

    // 4. Вызываем провайдер авторизации NextAuth
    const res = await signIn("credentials", {
      iin: iin,
      email: email || "", // Email передаем как опциональный параметр
      isEds: "true",
      redirect: false,
    });

    if (res?.error) {
      setError(`Доступ запрещен: ИИН ${iin} не зарегистрирован.`);
    } else {
      router.replace("/");
      router.refresh();
    }
  } catch (err: any) {
    console.error("Ошибка входа по ЭЦП:", err);
    setError(err.message || "Не удалось обработать ключ ЭЦП");
  } finally {
    setIsEdsLoading(false);
  }
};

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

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
  }

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-2xl shadow-blue-100/50 border border-slate-100 animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">B-Portal</h1>
        <p className="text-slate-500 mt-2 font-medium">Авторизация в системе</p>
      </div>

      {isRegistered && !error && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-emerald-100">
          ✨ Регистрация успешна!
        </div>
      )}

      {/* КНОПКА ВХОДА ПО ЭЦП */}
      <button
        onClick={handleEdsSignIn}
        disabled={isEdsLoading || isLoading}
        type="button"
        className="w-full mb-6 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-3"
      >
        {isEdsLoading ? "Считывание ключа..." : "Войти через ЭЦП Ключ"}
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold">ИЛИ ПО ПАРОЛЮ</span></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="email" type="email" placeholder="Email" className="w-full border border-slate-200 p-4 rounded-2xl outline-none focus:border-blue-500" required />
        <input name="password" type="password" placeholder="Пароль" className="w-full border border-slate-200 p-4 rounded-2xl outline-none focus:border-blue-500" required />

        {error && <div className="text-red-600 text-sm font-bold text-center">{error}</div>}

        <button 
          type="submit"
          disabled={isLoading || isEdsLoading}
          className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all"
        >
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-50 text-center">
        <Link href="/register" className="text-blue-600 font-bold hover:underline text-sm">Создать новый аккаунт</Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={<div>Загрузка...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  )
}