import { getAdminStats, getRegistrationStats } from "@/app/actions/admin";
import RegistrationChart from "@/components/admin/RegistrationChart";

export default async function AdminDashboard() {
  const stats = await getAdminStats();
  const chartData = await getRegistrationStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Панель управления</h1>
        <p className="text-slate-500 font-medium mt-2">Аналитика активности холдинга</p>
      </div>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Всего" value={stats.totalUsers} icon="👥" />
        <StatCard title="Поставщики" value={stats.vendors} color="text-blue-600" icon="📦" />
        <StatCard title="Заказчики" value={stats.admins} color="text-purple-600" icon="🏢" />
        <StatCard title="Организации" value={stats.totalOrgs} icon="📑" />
      </div>

      {/* График и доп. инфо */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900">Динамика регистраций</h3>
          <p className="text-sm text-slate-400 font-medium">Количество новых пользователей за неделю</p>
          <RegistrationChart data={chartData} />
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] text-white flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4">Быстрые действия</h3>
            <div className="space-y-3">
              <button className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-sm font-bold transition-all text-left">
                📥 Экспорт списка в Excel
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-sm font-bold transition-all text-left">
                📝 Настроить БИН-фильтры
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-6 uppercase tracking-widest text-center">
            System status: Operational
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "text-slate-900", icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}