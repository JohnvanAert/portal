'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, MessageSquare, Clock, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { markAllBidsAsRead, markWinnerBidsAsRead } from '@/app/actions/markBidsAsRead'

interface NotificationBellProps {
  initialBids: any[]
  userRole?: string
  userName?: string
}

export default function NotificationBell({ initialBids, userRole, userName }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Функция для открытия меню и пометки как "прочитано"
  const handleToggle = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    // Если мы открываем меню и есть новые уведомления
    if (nextState && initialBids.length > 0) {
      try {
        if (userRole === 'admin') {
          await markAllBidsAsRead();
        } else if (userRole === 'vendor' && userName) {
          await markWinnerBidsAsRead(userName);
        }
        router.refresh(); // Обновляем данные на сервере, чтобы счетчик обнулился
      } catch (error) {
        console.error("Ошибка при обновлении статуса прочитанного:", error);
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={handleToggle} 
        className={`p-2 rounded-full transition-colors relative ${isOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}
      >
        <Bell size={20}/>
        {initialBids.length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
            {initialBids.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="font-bold text-sm">Уведомления</span>
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
                {initialBids.length > 0 ? `Новые: ${initialBids.length}` : 'Просмотрено'}
            </span>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {initialBids.length > 0 ? (
              initialBids.map((bid) => (
                <Link 
                  key={bid.id} 
                  // Если админ — ведем в детали тендера, если поставщик — на главную/страницу тендера
                  href={userRole === 'admin' ? `/admin/dashboard/tenders/${bid.tenderId}` : `/`}
                  onClick={() => setIsOpen(false)}
                  className={`block p-4 hover:bg-blue-50/50 transition-colors border-b border-slate-50 last:border-0 ${bid.type === 'winner' ? 'bg-green-50/30' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      bid.type === 'winner' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {bid.type === 'winner' ? <Trophy size={14} /> : <MessageSquare size={14} />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs leading-tight">
                        {bid.type === 'winner' ? (
                          <>
                            <span className="font-bold text-slate-900">Поздравляем!</span> Вы выиграли тендер: 
                            <span className="font-medium text-green-600"> {bid.tenderTitle}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-slate-900">{bid.vendorName}</span> подал заявку на 
                            <span className="font-medium text-blue-600"> {bid.tenderTitle}</span>
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Clock size={10} />
                        {bid.createdAt ? new Date(bid.createdAt).toLocaleDateString('ru-RU') : 'Недавно'}
                        <span className="font-bold text-slate-900 ml-auto">{Number(bid.price).toLocaleString()} ₽</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 text-sm">Нет новых уведомлений</div>
            )}
          </div>
          
          {userRole === 'admin' && (
            <Link 
              href="/admin/bids" 
              onClick={() => setIsOpen(false)}
              className="block p-3 text-center text-xs font-bold text-slate-500 hover:text-blue-600 bg-slate-50 border-t border-slate-100 transition-colors"
            >
              Смотреть все заявки
            </Link>
          )}
        </div>
      )}
    </div>
  )
}