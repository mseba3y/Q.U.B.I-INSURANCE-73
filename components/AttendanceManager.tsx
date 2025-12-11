import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus, AnnualLeaveRequest, Attachment } from '../types';
import { 
  Check, X, Clock, Calendar, Search, Filter, 
  Trash2, UserPlus, Save, 
  Heart, Plane, Briefcase, Slash,
  ChevronLeft, ChevronRight, Edit, Upload, Paperclip, Eye, FileText, Sparkles, XCircle, AlertCircle, CheckCircle, AlertTriangle
} from 'lucide-react';
import { translations } from '../utils/translations';

// --- Helpers ---
const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2);

const StatusIcon = ({ status, size = 18 }: { status?: AttendanceStatus, size?: number }) => {
  const Badge = ({ colorClass, icon }: { colorClass: string, icon: React.ReactNode }) => (
    <div className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-md ${colorClass} text-white transition-all transform hover:scale-105 hover:shadow-lg`}>
      {icon}
    </div>
  );
  switch (status) {
    case AttendanceStatus.PRESENT: return <Badge colorClass="bg-emerald-500 shadow-emerald-500/30" icon={<Check size={size} strokeWidth={3} />} />;
    case AttendanceStatus.DEDUCTION: return <Badge colorClass="bg-rose-600 shadow-rose-600/30" icon={<X size={size} strokeWidth={3} />} />;
    case AttendanceStatus.CASUAL: return <Badge colorClass="bg-orange-500 shadow-orange-500/30" icon={<Slash size={size} strokeWidth={3} />} />;
    case AttendanceStatus.SICK: return <Badge colorClass="bg-pink-600 shadow-pink-600/30" icon={<Heart size={size} fill="currentColor" />} />;
    case AttendanceStatus.VACATION: return <Badge colorClass="bg-sky-500 shadow-sky-500/30" icon={<Plane size={size} />} />;
    case AttendanceStatus.MISSION: return <Badge colorClass="bg-purple-600 shadow-purple-600/30" icon={<Briefcase size={size} />} />;
    case AttendanceStatus.LATE: return <Badge colorClass="bg-amber-500 shadow-amber-500/30" icon={<Clock size={size} strokeWidth={2.5} />} />;
    default: return <div className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 group-hover:border-indigo-300 group-hover:text-indigo-400 transition-all"><div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" /></div>;
  }
};

// --- Custom Date Picker ---
const CustomDatePicker = ({ label, date, onChange, lang }: { label: string; date: string; onChange: (d: string) => void; lang: 'en' | 'ar' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const validDate = !isNaN(new Date(date).getTime()) ? date : new Date().toISOString().split('T')[0];
  const [currentMonth, setCurrentMonth] = useState(new Date(validDate));
  const containerRef = useRef<HTMLDivElement>(null);
  const isRTL = lang === 'ar';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePrevMonth = () => { const newDate = new Date(currentMonth); newDate.setMonth(newDate.getMonth() - 1); setCurrentMonth(newDate); };
  const handleNextMonth = () => { const newDate = new Date(currentMonth); newDate.setMonth(newDate.getMonth() + 1); setCurrentMonth(newDate); };
  const handleDayClick = (day: number) => { const d = new Date(currentMonth); d.setDate(day); const offset = d.getTimezoneOffset(); onChange(new Date(d.getTime() - (offset*60*1000)).toISOString().split('T')[0]); setIsOpen(false); };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); 
  const adjustedStartDay = (startDay + 1) % 7;
  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < adjustedStartDay; i++) days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = new Date(validDate).getDate() === i && new Date(validDate).getMonth() === currentMonth.getMonth();
      days.push(<button key={i} onClick={() => handleDayClick(i)} type="button" className={`h-9 w-9 rounded-lg text-sm flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/30' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{i}</button>);
    }
    return days;
  };

  const monthNames = lang === 'ar' ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays = lang === 'ar' ? ['سبت','أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة'] : ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'];

  return (
    <div className="relative" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-all min-w-[160px] group">
        <Calendar size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mx-auto">{new Date(validDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
      </div>
      {isOpen && (
        <div className={`absolute top-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 z-50 w-80 animate-in zoom-in-95 ${isRTL ? 'right-0' : 'left-0'}`}>
          <div className="flex justify-between items-center mb-4">
            <button onClick={isRTL ? handleNextMonth : handlePrevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
            <span className="font-bold text-slate-800 dark:text-white">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button onClick={isRTL ? handlePrevMonth : handleNextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"><ChevronRight size={20} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">{weekDays.map(d => <span key={d} className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
const AttendanceManager: React.FC<any> = ({ employees, records, annualLeaves, onUpdateRecord, onAddEmployee, onEditEmployee, onRemoveEmployee, onClearRecords, onLoadData, lang, dateRange, setDateRange }) => {
  const t = translations[lang].attendance;
  const isRTL = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const getDaysArray = (start: string, end: string) => {
    const arr = []; const dt = new Date(start); const endDt = new Date(end);
    if (isNaN(dt.getTime()) || isNaN(endDt.getTime()) || dt > endDt) return [new Date()];
    let count = 0;
    while (dt <= endDt && count < 60) { arr.push(new Date(dt)); dt.setDate(dt.getDate() + 1); count++; }
    return arr;
  };
  const dates = useMemo(() => getDaysArray(dateRange.from, dateRange.to), [dateRange.from, dateRange.to]);

  const getRecord = (empId: string, dateStr: string) => records.find(r => r.employeeId === empId && r.date === dateStr);

  const filteredEmployees = useMemo(() => employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())), [employees, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Date Pickers */}
      <div className="flex flex-wrap items-center gap-3">
        <CustomDatePicker label={t.from} date={dateRange.from} onChange={d => setDateRange({...dateRange, from: d})} lang={lang} />
        <CustomDatePicker label={t.to} date={dateRange.to} onChange={d => setDateRange({...dateRange, to: d})} lang={lang} />
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto relative min-h-[500px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="sticky start-0 z-10 bg-slate-50 dark:bg-slate-900 w-12 px-2 py-4 text-center text-slate-400 font-normal">#</th>
              <th className={`sticky z-10 bg-slate-50 dark:bg-slate-900 px-4 py-4 text-start font-bold text-slate-700 dark:text-slate-200 min-w-[220px] border-e border-slate-100 dark:border-slate-800 ${isRTL ? 'right-12' : 'left-12'}`}>الموظف</th>
              {dates.map(date => {
                const dayName = date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
                const dayNum = date.getDate();
                return <th key={date.toISOString()} className="px-2 py-2 text-center text-slate-500 text-xs font-semibold"><div>{dayName}</div><div>{dayNum}</div></th>;
              })}
            </tr>
          </thead>

          <tbody>
            {filteredEmployees.map((emp, idx) => (
              <tr key={emp.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="sticky start-0 z-10 bg-white dark:bg-slate-900 text-center px-2 py-3">{idx + 1}</td>
                <td className={`sticky z-10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-700 dark:text-slate-200 ${isRTL ? 'right-12' : 'left-12'}`}>
                  <div className="flex items-center gap-3">
                    <img src={emp.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.role}</p>
                    </div>
                  </div>
                </td>
                {dates.map(date => {
                  const dateStr = date.toISOString().split('T')[0];
                  const record = getRecord(emp.id, dateStr);
                  return <td key={dateStr} className="px-1 py-2 text-center cursor-pointer"><StatusIcon status={record?.status} /></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceManager;
