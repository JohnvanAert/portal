'use client'

import { User, Building2, IdCard, Mail } from "lucide-react"

export default function ProfileForm({ userData }: { userData: any }) {
  // Вспомогательный компонент для отображения "замороженного" поля
  const ReadOnlyField = ({ label, value, icon: Icon, colorClass = "blue" }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-500 ml-1">{label}</label>
      <div className="w-full border border-slate-100 bg-slate-50/50 p-4 rounded-2xl flex items-center gap-3 font-semibold text-slate-700 shadow-sm">
        {Icon && <Icon size={18} className={`text-${colorClass}-500`} />}
        {value || '—'}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Секция: Личные данные */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <User size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Личная информация</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ReadOnlyField 
            label="ФИО" 
            value={userData.name} 
            icon={User} 
          />
          <ReadOnlyField 
            label="Email" 
            value={userData.email} 
            icon={Mail} 
          />
          <ReadOnlyField 
            label="ИИН" 
            value={userData.iin} 
            icon={IdCard} 
          />
        </div>
      </div>

      {/* Секция: Организация */}
      {userData.role === 'vendor' && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Building2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Данные организации</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ReadOnlyField 
              label="Название компании" 
              value={userData.organization?.name} 
              icon={Building2} 
              colorClass="emerald"
            />
            <ReadOnlyField 
              label="БИН" 
              value={userData.organization?.bin} 
              icon={IdCard} 
              colorClass="emerald"
            />
          </div>
        </div>
      )}

      <p className="text-center text-slate-400 text-sm font-medium">
        Данные профиля синхронизированы с вашим ЭЦП ключом и недоступны для ручного изменения.
      </p>
    </div>
  )
}