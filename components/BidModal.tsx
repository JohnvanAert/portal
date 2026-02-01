'use client'

import { useState } from 'react'
import { createBid } from '@/app/actions'

interface BidModalProps {
  tenderId: number
  tenderTitle: string
}

export default function BidModal({ tenderId, tenderTitle }: BidModalProps) {
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Отклик на лот</h2>
            <p className="text-sm text-slate-500 mb-6">{tenderTitle}</p>

            <form action={handleSubmit} className="space-y-4">
              {/* Скрытое поле для ID тендера */}
              <input type="hidden" name="tenderId" value={tenderId} />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Наименование вашей компании</label>
                <input
                  name="vendorName"
                  required
                  placeholder="ТОО 'Поставщик'"
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ваше ценовое предложение (₽)</label>
                <input
                  name="offerPrice"
                  required
                  type="text"
                  placeholder="Введите сумму"
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Комментарий к предложению</label>
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Укажите сроки поставки или другие детали..."
                  className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                />
              </div>

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
                  className={`flex-1 px-4 py-2.5 rounded-lg text-white font-bold transition-all ${
                    isPending ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isPending ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}