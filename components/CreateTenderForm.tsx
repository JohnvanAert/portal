'use client'

import { useState } from 'react'

export default function CreateTenderForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    category: '',
    subCategory: '',
    workType: '',
    details: '',
    requirements: ['Справка об отсутствии налоговой задолженности', 'Отсутствие кредитной задолженности']
  })

  // Логика автоматического формирования требований
  const updateRequirements = (type: string) => {
    let reqs = [...formData.requirements]
    if (type === 'СМР' && !reqs.includes('Лицензия на СМР I-категории')) {
      reqs.push('Лицензия на СМР I-категории')
    }
    setFormData({ ...formData, subCategory: type, requirements: reqs })
  }

  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-black mb-6">Новая закупка</h2>

      {/* Шаг 1: Категория */}
      <div className="space-y-4">
        <label className="block text-sm font-bold text-slate-700">Тип тендера</label>
        <select 
          className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200"
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        >
          <option value="">Выберите категорию...</option>
          <option value="construction">Строительство</option>
          <option value="it">IT услуги</option>
        </select>
      </div>

      {/* Шаг 2: Ветвление для Строительства */}
      {formData.category === 'construction' && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
          <label className="block text-sm font-bold text-slate-700">Подкатегория</label>
          <div className="flex gap-4">
            <button 
              onClick={() => updateRequirements('ПСД')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${formData.subCategory === 'ПSД' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
            >
              ПСД
            </button>
            <button 
              onClick={() => updateRequirements('СМР')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${formData.subCategory === 'СМР' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
            >
              СМР
            </button>
          </div>
        </div>
      )}

      {/* Шаг 3: Выбор Поставки или Работы (если СМР) */}
      {formData.subCategory === 'СМР' && (
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-slate-700">Тип СМР</label>
          <select 
            className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200"
            onChange={(e) => setFormData({...formData, workType: e.target.value})}
          >
            <option value="">Выберите тип...</option>
            <option value="works">Работы</option>
            <option value="supply">Поставка материалов</option>
          </select>
        </div>
      )}

      {/* Автоматические требования */}
      <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
        <h4 className="text-xs font-black uppercase text-blue-600 mb-4 tracking-widest">Требования к подрядчику:</h4>
        <ul className="space-y-2">
          {formData.requirements.map((req, i) => (
            <li key={i} className="flex items-center gap-2 text-sm font-medium text-blue-800">
              <div className="h-1.5 w-1.5 bg-blue-400 rounded-full" />
              {req}
            </li>
          ))}
        </ul>
      </div>
      
      <button className="w-full mt-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
        Опубликовать тендер
      </button>
    </div>
  )
}