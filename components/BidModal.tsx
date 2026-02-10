'use client'

import { useState } from 'react'
import { createBid } from '@/app/actions'

interface BidModalProps {
  tenderId: number
  tenderTitle: string
  // Принимаем полный объект данных поставщика
  vendorData: {
    companyName: string
    bin: string
    representative: string
    email?: string
  }
}

export default function BidModal({ tenderId, tenderTitle, vendorData }: BidModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    try {
      await createBid(formData)
      setIsOpen(false)
      alert('Ваше предложение успешно отправлено!')
    } catch (error) {
      alert('Произошла ошибка при отправке отклика')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm"
      >
        Подать предложение
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Отклик на лот</h2>
            <p className="text-sm text-slate-500 mb-6">{tenderTitle}</p>

            <form action={handleSubmit} className="space-y-4">
              {/* Скрытое ID тендера */}
              <input type="hidden" name="tenderId" value={tenderId} />

              {/* БЛОК ИНФОРМАЦИИ О ПОСТАВЩИКЕ (ТОЛЬКО ДЛЯ ЧТЕНИЯ) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Данные организации</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Название компании */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Наименование</label>
                    <input
                      name="vendorName"
                      value={vendorData.companyName}
                      readOnly
                      className="w-full bg-white border border-slate-200 p-2 rounded text-sm text-slate-700 cursor-default outline-none"
                    />
                  </div>

                  {/* БИН */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">БИН/ИИН</label>
                    <input
                      name="vendorBin"
                      value={vendorData.bin}
                      readOnly
                      className="w-full bg-white border border-slate-200 p-2 rounded text-sm text-slate-700 cursor-default outline-none"
                    />
                  </div>

                  {/* Руководитель */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Первый руководитель (ФИО)</label>
                    <input
                      name="representativeName"
                      value={vendorData.representative}
                      readOnly
                      className="w-full bg-white border border-slate-200 p-2 rounded text-sm text-slate-700 cursor-default outline-none"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* ПОЛЯ ДЛЯ ЗАПОЛНЕНИЯ */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Ваше ценовое предложение (₸)
                </label> 
                <input
                  name="offerPrice"
                  required
                  type="number"
                  placeholder="0.00"
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-lg text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Комментарий к предложению</label>
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Укажите сроки поставки или дополнительные условия..."
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-sm"
                />
              </div>

              {/* КНОПКИ УПРАВЛЕНИЯ */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-white font-bold transition-all shadow-md ${
                    isPending ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isPending ? 'Отправка...' : 'Отправить отклик'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}