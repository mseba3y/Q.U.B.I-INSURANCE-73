import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Employee, AttendanceRecord, AttendanceStatus } from '../types';
import { Users, UserCheck, UserX, Clock, ArrowUpRight } from 'lucide-react';
import { translations } from '../utils/translations';

interface DashboardProps {
  employees: Employee[];
  records: AttendanceRecord[];
  lang: 'en' | 'ar';
}

const COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#64748b']; // Indigo, Red, Amber, Slate

// Helper Component defined outside
const StatCard = ({ title, value, icon, colorClass, subText, percent }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow relative overflow-hidden group">
    {/* Decorative background circle */}
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500 ease-out ${colorClass.replace('bg-', 'bg-')}`}></div>
    
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass} text-white shadow-lg shadow-${colorClass.split('-')[1]}-500/20`}>
        {icon}
      </div>
    </div>
    
    <div className="mt-4 flex items-center gap-2">
       {percent && (
          <span className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
             <ArrowUpRight size={12} className="mr-0.5" /> {percent}%
          </span>
       )}
       <p className="text-xs text-slate-400 dark:text-slate-500">{subText}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ employees, records, lang }) => {
  const t = translations[lang].dashboard;
  const isRTL = lang === 'ar';
  
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === today);
  
  const stats = useMemo(() => {
    const present = todayRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = todayRecords.filter(r => 
      r.status === AttendanceStatus.DEDUCTION || 
      r.status === AttendanceStatus.CASUAL || 
      r.status === AttendanceStatus.SICK || 
      r.status === AttendanceStatus.VACATION
    ).length;
    const late = todayRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const pending = Math.max(0, employees.length - todayRecords.length);
    
    return { present, absent, late, pending };
  }, [todayRecords, employees.length]);

  const weeklyData = useMemo(() => {
    const data = [];
    const days = lang === 'ar' 
      ? ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] 
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    for (const day of days) {
      data.push({
        name: day,
        present: Math.floor(Math.random() * employees.length),
        absent: Math.floor(Math.random() * (employees.length / 4)),
      });
    }
    return data;
  }, [employees.length, lang]);

  const pieData = [
    { name: t.presentToday, value: stats.present },
    { name: t.absentToday, value: stats.absent },
    { name: t.lateArrivals, value: stats.late },
    { name: 'Pending', value: stats.pending },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t.welcome}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-2">
          <Clock size={16} className="text-indigo-500" />
          <span>{today}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t.totalEmployees} 
          value={employees.length} 
          icon={<Users size={24} />} 
          colorClass="bg-indigo-500"
          subText={t.activeStaff}
          percent={12}
        />
        <StatCard 
          title={t.presentToday} 
          value={stats.present} 
          icon={<UserCheck size={24} />} 
          colorClass="bg-emerald-500"
          subText={`${Math.round((stats.present / (employees.length || 1)) * 100)}% ${t.attendanceRate}`}
        />
        <StatCard 
          title={t.absentToday} 
          value={stats.absent} 
          icon={<UserX size={24} />} 
          colorClass="bg-rose-500"
          subText={t.unexcused}
        />
        <StatCard 
          title={t.lateArrivals} 
          value={stats.late} 
          icon={<Clock size={24} />} 
          colorClass="bg-amber-500"
          subText={t.checkins}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.weeklyTrends}</h3>
          </div>
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  orientation={isRTL ? 'right' : 'left'} 
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9', opacity: 0.2}}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    backgroundColor: '#1e293b',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="present" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="absent" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">{t.statusDist}</h3>
          <div className="h-64 flex justify-center items-center" dir="ltr">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#1e293b',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <PieChart size={48} strokeWidth={1} />
                <p className="mt-2 text-sm">{t.noData}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                <div className="w-2.5 h-2.5 rounded-full mx-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="flex-1">{entry.name}</span>
                <span className="font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;