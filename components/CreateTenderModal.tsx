'use client'

import { useState } from 'react'
import { createTender } from '@/app/actions' // Путь к нашему новому экшену с Drizzle

export default function CreateTenderModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md"
      >
        Создать новый лот
      </button>

      {/* Модальное окно */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Новая закупка</h2>
            
            <form 
              action={async (formData) => {
                setIsPending(true)
                try {
                  await createTender(formData)
                  setIsOpen(false)
                } catch (error) {
                  alert("Ошибка при сохранении")
                } finally {
                  setIsPending(false)
                }
              }} 
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название объекта</label>
                <input
                  name="title"
                  placeholder="Например: Поставка офисной мебели"
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Начальная цена (₽)</label>
                <input
                  name="price"
                  type="text"
                  placeholder="500 000"
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Способ закупки</label>
                <select
                  name="type"
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Тендер">Тендер</option>
                  <option value="Запрос котировок">Запрос котировок</option>
                  <option value="Аукцион">Электронный аукцион</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`px-6 py-2 rounded-lg text-white font-medium ${
                    isPending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isPending ? 'Публикация...' : 'Опубликовать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}