'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTender } from '@/app/actions'
import { Plus, X, ShieldCheck, FileSpreadsheet, Paperclip } from 'lucide-react'

export default function CreateTenderModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  // Файлы
  const [smetaFile, setSmetaFile] = useState<File | null>(null)
  const [volumeFile, setVolumeFile] = useState<File | null>(null)

  // Данные формы
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: '',
    subCategory: '',
    workType: '',
    requirements: ['Справка об отсутствии налоговой задолженности', 'Отсутствие кредитной задолженности']
  })

  const updateSubCategory = (type: string) => {
    let reqs = ['Справка об отсутствии налоговой задолженности', 'Отсутствие кредитной задолженности']
    if (type === 'СМР') {
      reqs.push('Лицензия на СМР I-категории', 'Опыт работы в строительстве от 3-х лет')
    }
    if (type === 'ПСД') {
      reqs.push('Допуск СРО на проектирование')
    }
    setFormData({ ...formData, subCategory: type, requirements: reqs })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    const data = new FormData()
    data.append('title', formData.title)
    data.append('price', formData.price)
    data.append('category', formData.category)
    data.append('subCategory', formData.subCategory)
    data.append('workType', formData.workType)
    data.append('requirements', JSON.stringify(formData.requirements))
    
    // Прикрепляем файлы к FormData
    if (smetaFile) data.append('smetaFile', smetaFile)
    if (volumeFile) data.append('volumeFile', volumeFile)

    try {
      await createTender(data)
      setIsOpen(false)
      // Сброс всего
      setSmetaFile(null)
      setVolumeFile(null)
      setFormData({
        title: '', price: '', category: '', subCategory: '', workType: '',
        requirements: ['Справка об отсутствии налоговой задолженности', 'Отсутствие кредитной задолженности']
      })
      router.refresh()
    } catch (error) {
      alert("Ошибка при сохранении")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
      >
        <Plus size={20} />
        Создать новый лот
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black mb-8 text-slate-900">Новая закупка</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Название лота</label>
                  <input
                    required
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                    placeholder="Напр: Строительство ТЦ"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Бюджет (₸)</label>
                  <input
                    required
                    type="number"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 font-black text-xl outline-none text-blue-600"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Направление</label>
                <select 
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 font-bold outline-none appearance-none"
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  value={formData.category}
                >
                  <option value="">Выберите категорию...</option>
                  <option value="Строительство">Строительство</option>
                  <option value="IT услуги">IT услуги / Техника</option>
                  <option value="Поставка">Поставка товаров</option>
                </select>
              </div>

              {formData.category === 'Строительство' && (
                <div className="flex gap-3">
                  {['ПСД', 'СМР'].map((type) => (
                    <button 
                      key={type}
                      type="button"
                      onClick={() => updateSubCategory(type)}
                      className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${formData.subCategory === type ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}

              {/* ЗАГРУЗКА ФАЙЛОВ */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Смета</label>
                  <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${smetaFile ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <FileSpreadsheet className={smetaFile ? 'text-blue-600' : 'text-slate-300'} size={24} />
                    <span className="text-[9px] font-bold mt-2 text-slate-500 text-center line-clamp-1">
                      {smetaFile ? smetaFile.name : 'Excel файл'}
                    </span>
                    <input type="file" className="hidden" accept=".xlsx,.xls" onChange={(e) => setSmetaFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Объемы</label>
                  <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${volumeFile ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <Paperclip className={volumeFile ? 'text-blue-600' : 'text-slate-300'} size={24} />
                    <span className="text-[9px] font-bold mt-2 text-slate-500 text-center line-clamp-1">
                      {volumeFile ? volumeFile.name : 'PDF / DOC'}
                    </span>
                    <input type="file" className="hidden" onChange={(e) => setVolumeFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              <div className="p-5 bg-blue-50 rounded-[24px] border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                   <ShieldCheck size={16} className="text-blue-600" />
                   <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Требования:</h4>
                </div>
                <ul className="space-y-2">
                  {formData.requirements.map((req, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-blue-800">
                      <div className="h-1 w-1 bg-blue-400 rounded-full" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                type="submit"
                disabled={isPending}
                className="w-full py-5 bg-blue-600 text-white rounded-[20px] font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:bg-blue-300 uppercase tracking-widest text-xs"
              >
                {isPending ? 'Загрузка файлов...' : 'Опубликовать тендер'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}