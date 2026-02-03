'use client'

import { useState } from 'react'
import { registerWithEDS, parseCertificateData } from '@/app/actions/auth' 
import { signDataWithNCALayer } from '@/lib/ncaService' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [edsData, setEdsData] = useState<any>(null) 
  const router = useRouter()

  // 1. Считываем реальные данные из ЭЦП
  async function handleEdsScan() {
    console.log("🚀 Нажата кнопка сканирования ЭЦП");
    setLoading(true);
    setError(null);

    try {
      const nonce = `auth_${Date.now()}`;
      const signatureXml = await signDataWithNCALayer(nonce);
      
      if (!signatureXml) throw new Error("Подпись не получена от NCALayer");

      console.log("📝 Извлекаем сертификат из XML...");

      /** * ИСПРАВЛЕНИЕ РЕГУЛЯРКИ:
       * Используем [\s\S]*? вместо флага /s для совместимости с TS и старыми браузерами.
       * .replace(/\s+/g, '') — критически важно для удаления переносов строк \r\n,
       * которые NCALayer добавляет в XML и которые ломают парсинг на бэкенде.
       */
      const certMatch = signatureXml.match(/<ds:X509Certificate>([\s\S]*?)<\/ds:X509Certificate>/);
      const certificateBase64 = certMatch ? certMatch[1].replace(/\s+/g, '') : null;

      if (!certificateBase64) {
        console.error("❌ Тег <ds:X509Certificate> не найден в ответе");
        throw new Error("Не удалось найти данные сертификата в подписи. Убедитесь, что используете верный ключ.");
      }

      console.log("⚙️ Отправка очищенного сертификата на сервер...");
      
      // Отправляем чистый Base64 (без XML-тегов и пробелов)
      const result = await parseCertificateData(certificateBase64);
      
      if (result.error || !result.data) {
        console.error("❌ Сервер не смог разобрать сертификат:", result.error);
        throw new Error(result.error || "Ошибка разбора данных сертификата");
      }

      setEdsData({
        fio: result.data.fio,
        iin: result.data.iin, // <--- ОБЯЗАТЕЛЬНО ДОБАВЬТЕ ЭТУ СТРОКУ
        bin: result.data.bin,
        orgName: result.data.orgName,
        email: result.data.email,
      });
      
      console.log("🎉 Данные получены:", result.data.fio);

    } catch (err: any) {
      console.error("🚨 ОШИБКА:", err);
      setError(err.message || "Не удалось считать данные ЭЦП");
    } finally {
      setLoading(false);
    }
  }

  // 2. Отправляем форму в базу данных
  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const password = formData.get('password') as string
    
    try {
      // Роль по умолчанию 'vendor'
      const result = await registerWithEDS({ ...edsData, role: 'vendor' }, password)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.push('/login?message=registered')
      }
    } catch (err: any) {
      setError("Ошибка при сохранении: " + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-xl shadow-slate-200/60 border border-slate-100 animate-in fade-in zoom-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Создать аккаунт</h1>
        <p className="text-slate-500 font-medium">Регистрация через ЭЦП Ключ</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 animate-in shake duration-300">
          {error}
        </div>
      )}

      {!edsData ? (
        <div className="space-y-4">
          <button 
            onClick={handleEdsScan}
            disabled={loading}
            type="button"
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Обработка данных...' : 'Считать данные ЭЦП'}
          </button>
          <p className="text-[11px] text-center text-slate-400 px-4">
            Нажмите кнопку и выберите ключ <b>AUTH_RSA</b> или <b>GOST</b> в NCALayer
          </p>
        </div>
      ) : (
        <form action={onSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <p className="text-[10px] font-black uppercase text-blue-600 mb-1">Данные подтверждены:</p>
            <p className="text-sm font-bold text-slate-900">{edsData.fio}</p>
            <p className="text-xs text-slate-500">{edsData.orgName}</p>
            {edsData.bin && <p className="text-[10px] text-slate-400 mt-1 font-mono">БИН: {edsData.bin}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Придумайте пароль для входа</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300" 
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed">
              Вы регистрируетесь как <b>Поставщик</b>. Статус будет проверен администратором.
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {loading ? 'Создание профиля...' : 'Завершить регистрацию'}
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-slate-50 text-center">
        <p className="text-slate-500 font-medium text-sm">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}