'use client'

import { useState } from 'react'
import { registerWithEDS, parseCertificateData } from '@/app/actions/auth' 
import { signDataWithNCALayer } from '@/lib/ncaService' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RegisterRegularForm from './RegisterRegularForm'

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [edsData, setEdsData] = useState<any>(null) 
  const [manualEmail, setManualEmail] = useState('') 
  const router = useRouter()
  const [mode, setMode] = useState<'eds' | 'manual'>('eds')

  if (mode === 'manual') {
    return <RegisterRegularForm onSwitch={() => setMode('eds')} />
  }

  // 1. Считываем данные из ЭЦП через NCALayer
  async function handleEdsScan() {
    setLoading(true);
    setError(null);

    try {
      const nonce = `auth_${Date.now()}`;
      const signatureXml = await signDataWithNCALayer(nonce);
      
      if (!signatureXml) throw new Error("Подпись не получена от NCALayer");

      const certMatch = signatureXml.match(/<ds:X509Certificate>([\s\S]*?)<\/ds:X509Certificate>/);
      const certificateBase64 = certMatch ? certMatch[1].replace(/\s+/g, '') : null;

      if (!certificateBase64) {
        throw new Error("Не удалось найти данные сертификата в подписи.");
      }

      const result = await parseCertificateData(certificateBase64);
      
      if (result.error || !result.data) {
        throw new Error(result.error || "Ошибка разбора данных сертификата");
      }

      // Сохраняем данные из ключа
      setEdsData({
        fio: result.data.fio,
        iin: result.data.iin,
        bin: result.data.bin,
        orgName: result.data.orgName,
        email: result.data.email,
      });

      // Автоматически подставляем email, если он нашелся в ключе
      if (result.data.email) {
        setManualEmail(result.data.email);
      }

    } catch (err: any) {
      setError(err.message || "Не удалось считать данные ЭЦП");
    } finally {
      setLoading(false);
    }
  }

  // 2. Сабмит формы регистрации
  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const password = formData.get('password') as string
    
    // Валидация почты перед отправкой
    if (!manualEmail || !manualEmail.includes('@')) {
      setError("Введите корректный адрес электронной почты");
      setLoading(false);
      return;
    }
    
    try {
      // ПЕРЕДАЕМ: данные из ЭЦП, пароль и ВВЕДЕННУЮ ПОЧТУ
      const result = await registerWithEDS(
        { ...edsData, role: 'vendor' }, 
        password, 
        manualEmail
      )

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
        <p className="text-slate-500 font-medium text-sm">Регистрация через ЭЦП Ключ</p>
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
            {loading ? 'Обработка данных...' : 'Выбрать сертификат'}
          </button>
          <p className="text-[11px] text-center text-slate-400 px-4">
            Нажмите кнопку и выберите ключ <b>AUTH_RSA</b> или <b>GOST</b>
          </p>
        </div>
      ) : (
        <form action={onSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <p className="text-[10px] font-black uppercase text-blue-600 mb-1">Данные подтверждены:</p>
            <p className="text-sm font-bold text-slate-900 leading-tight">{edsData.fio}</p>
            <p className="text-xs text-slate-500 mt-0.5">{edsData.orgName || 'Физическое лицо'}</p>
          </div>

          {/* ПОЛЕ ВВОДА ПОЧТЫ */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Электронная почта</label>
            <input 
              type="email" 
              required 
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="example@mail.kz"
              className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Придумайте пароль</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300" 
            />
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

      <div className="mt-8 pt-6 border-t border-slate-50 text-center space-y-4">
        <p className="text-slate-500 font-medium text-sm">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
            Войти
          </Link>
        </p>
        <button 
          onClick={() => setMode('manual')}
          type="button"
          className="text-[10px] text-slate-300 hover:text-blue-400 transition-colors uppercase font-bold tracking-widest"
        >
          Проблемы с ЭЦП? Ввести вручную
        </button>
      </div>
    </div>
  )
}