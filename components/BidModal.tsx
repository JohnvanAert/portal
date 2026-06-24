'use client'

import { useState, useRef } from 'react'
import { createBid } from '@/app/actions'
import { FileText, Upload, X, Paperclip } from 'lucide-react'

interface BidModalProps {
  tenderId: number
  tenderTitle: string
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    
    // Добавляем файлы в FormData вручную, если нужно
    // Обычно Next.js Server Actions подхватывают файлы из формы автоматически по имени input,
    // но если мы управляем списком вручную, делаем так:
    formData.delete('documents') // Очищаем старые, если были
    selectedFiles.forEach((file) => {
      formData.append('documents', file)
    })

    try {
      await createBid(formData)
      setIsOpen(false)
      setSelectedFiles([])
      alert('Ваше предложение и документы успешно отправлены!')
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
        className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
      >
        <Paperclip size={18} />
        Подать предложение
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-xl w-full p-8 animate-in fade-in zoom-in duration-200 max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Отклик на лот</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">{tenderTitle}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={24} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-6">
              <input type="hidden" name="tenderId" value={tenderId} />

              {/* ДАННЫЕ ОРГАНИЗАЦИИ */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Данные организации</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Наименование</label>
                    <div className="text-sm font-bold text-slate-700 bg-white border border-slate-200 p-2.5 rounded-xl">{vendorData.companyName}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">БИН/ИИН</label>
                    <div className="text-sm font-bold text-slate-700 bg-white border border-slate-200 p-2.5 rounded-xl">{vendorData.bin}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Руководитель</label>
                    <div className="text-sm font-bold text-slate-700 bg-white border border-slate-200 p-2.5 rounded-xl truncate">{vendorData.representative}</div>
                  </div>
                </div>
              </div>

              {/* ЦЕНА И КОММЕНТАРИЙ */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ваше ценовое предложение (₸)</label> 
                  <input
                    name="offerPrice"
                    required
                    type="number"
                    placeholder="Введите сумму..."
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-black text-2xl text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Квалификационные документы</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all group text-center"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.jpg,.png"
                    />
                    <Upload className="mx-auto text-slate-300 group-hover:text-emerald-500 mb-2" size={32} />
                    <p className="text-xs font-bold text-slate-500">Нажмите для загрузки лицензий и справок</p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, JPG (макс. 10МБ)</p>
                  </div>

                  {/* СПИСОК ВЫБРАННЫХ ФАЙЛОВ */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-900 truncate max-w-[200px]">{file.name}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-emerald-400 hover:text-red-500 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Комментарий к предложению</label>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Сроки выполнения, гарантии и др..."
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all resize-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* КНОПКИ */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-6 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`flex-[2] px-6 py-4 rounded-2xl text-white font-black transition-all shadow-lg ${
                    isPending ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                  }`}
                >
                  {isPending ? 'Отправка данных...' : 'Подтвердить и отправить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}