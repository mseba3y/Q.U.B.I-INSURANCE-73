
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus, AnnualLeaveRequest, Attachment } from '../types';
import { 
  Check, X, Clock, Calendar, Search, Filter, 
  Trash2, UserPlus, Save, 
  Heart, Plane, Briefcase, Slash,
  ChevronLeft, ChevronRight, Edit, Upload, Paperclip, Eye, FileText, Sparkles, XCircle, AlertCircle, CheckCircle, AlertTriangle
} from 'lucide-react';
import { translations } from '../utils/translations';

interface AttendanceManagerProps {
  employees: Employee[];
  records: AttendanceRecord[];
  annualLeaves: AnnualLeaveRequest[];
  onUpdateRecord: (record: AttendanceRecord) => void;
  onAddEmployee: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
  onRemoveEmployee: (id: string) => void;
  onClearRecords: () => void;
  onLoadData: (employees: Employee[], records: AttendanceRecord[], annualLeaves: AnnualLeaveRequest[]) => void;
  lang: 'en' | 'ar';
  dateRange: { from: string, to: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ from: string, to: string }>>;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- Helper Components Moved Outside ---

const StatusIcon = ({ status, size = 18 }: { status?: AttendanceStatus, size?: number }) => {
  const Badge = ({ colorClass, icon }: { colorClass: string, icon: React.ReactNode }) => (
    <div className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-md ${colorClass} text-white transition-all transform hover:scale-105 hover:shadow-lg`}>
      {icon}
    </div>
  );

  switch (status) {
    case AttendanceStatus.PRESENT: 
      return <Badge colorClass="bg-emerald-500 shadow-emerald-500/30" icon={<Check size={size} strokeWidth={3} />} />;
    case AttendanceStatus.DEDUCTION: 
      return <Badge colorClass="bg-rose-600 shadow-rose-600/30" icon={<X size={size} strokeWidth={3} />} />;
    case AttendanceStatus.CASUAL: 
      return <Badge colorClass="bg-orange-500 shadow-orange-500/30" icon={<Slash size={size} strokeWidth={3} />} />;
    case AttendanceStatus.SICK: 
      return <Badge colorClass="bg-pink-600 shadow-pink-600/30" icon={<Heart size={size} fill="currentColor" />} />;
    case AttendanceStatus.VACATION: 
      return <Badge colorClass="bg-sky-500 shadow-sky-500/30" icon={<Plane size={size} />} />;
    case AttendanceStatus.MISSION: 
      return <Badge colorClass="bg-purple-600 shadow-purple-600/30" icon={<Briefcase size={size} />} />;
    case AttendanceStatus.LATE: 
      return <Badge colorClass="bg-amber-500 shadow-amber-500/30" icon={<Clock size={size} strokeWidth={2.5} />} />;
    default: 
      return (
        <div className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 group-hover:border-indigo-300 group-hover:text-indigo-400 transition-all">
           <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
        </div>
      );
  }
};

const CustomDatePicker = ({ label, date, onChange, lang }: { label: string; date: string; onChange: (d: string) => void; lang: 'en' | 'ar' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const validDate = !isNaN(new Date(date).getTime()) ? date : new Date().toISOString().split('T')[0];
  const [currentMonth, setCurrentMonth] = useState(new Date(validDate));
  const containerRef = useRef<HTMLDivElement>(null);
  const isRTL = lang === 'ar';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!isNaN(new Date(date).getTime())) {
        setCurrentMonth(new Date(date));
    }
  }, [date]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(currentMonth);
    selectedDate.setDate(day);
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - (offset*60*1000));
    onChange(localDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); 
  const adjustedStartDay = (startDay + 1) % 7; 

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = 
        new Date(validDate).getDate() === i && 
        new Date(validDate).getMonth() === currentMonth.getMonth() && 
        new Date(validDate).getFullYear() === currentMonth.getFullYear();

      days.push(
        <button
          key={i}
          onClick={() => handleDayClick(i)}
          type="button"
          className={`h-9 w-9 rounded-lg text-sm flex items-center justify-center transition-all duration-200
            ${isSelected 
              ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/30' 
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const monthNames = lang === 'ar' 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const weekDays = lang === 'ar' 
  ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
  : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-all hover:shadow-sm min-w-[160px] group"
      >
        <Calendar size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mx-auto">
           {new Date(validDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
        </span>
      </div>

      {isOpen && (
        <div className={`absolute top-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 z-50 w-80 animate-in zoom-in-95 ${isRTL ? 'right-0' : 'left-0'}`}>
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={isRTL ? handleNextMonth : handlePrevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-slate-800 dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button type="button" onClick={isRTL ? handlePrevMonth : handleNextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {weekDays.map(d => (
              <span key={d} className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">{d}</span>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

const AttendanceManager: React.FC<AttendanceManagerProps> = ({ 
  employees, records, annualLeaves, onUpdateRecord, onAddEmployee, onEditEmployee, onRemoveEmployee, onClearRecords, onLoadData, lang,
  dateRange, setDateRange
}) => {
  const t = translations[lang].attendance;
  const isRTL = lang === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [activeCell, setActiveCell] = useState<{empId: string, date: string} | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empFormData, setEmpFormData] = useState({ name: '', role: '', department: '' });
  
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsEmployeeId, setStatsEmployeeId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveCell(null);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysArray = (start: string, end: string) => {
    const arr = [];
    const dt = new Date(start);
    const endDt = new Date(end);
    if (isNaN(dt.getTime()) || isNaN(endDt.getTime()) || dt > endDt) {
      return [new Date()];
    }
    
    let count = 0;
    while (dt <= endDt && count < 60) {
      arr.push(new Date(dt));
      dt.setDate(dt.getDate() + 1);
      count++;
    }
    return arr;
  };

  const dates = useMemo(() => getDaysArray(dateRange.from, dateRange.to), [dateRange.from, dateRange.to]);

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department));
    return Array.from(depts);
  }, [employees]);

  const getRecord = (empId: string, dateStr: string) => {
    return records.find(r => r.employeeId === empId && r.date === dateStr);
  };

  const setStatus = (empId: string, dateStr: string, status: AttendanceStatus) => {
    const existing = getRecord(empId, dateStr);
    const newRecord: AttendanceRecord = {
      ...(existing || { id: generateId(), employeeId: empId, date: dateStr }),
      status: status,
      checkInTime: status === AttendanceStatus.PRESENT ? '09:00' : undefined
    };
    onUpdateRecord(newRecord);
  };

  const handleFileUpload = (empId: string, dateStr: string, e: React.ChangeEvent<HTMLInputElement>) => {
    // Crucial: Stop propagation to prevent popover close
    e.stopPropagation(); 
    e.preventDefault();
    
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(lang === 'ar' ? 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.' : 'File too large. Max 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const attachment: Attachment = {
          id: generateId(),
          name: file.name,
          type: file.type,
          data: base64,
          createdAt: new Date().toISOString()
        };

        const existing = getRecord(empId, dateStr);
        const record = existing || {
          id: generateId(),
          employeeId: empId,
          date: dateStr,
          status: AttendanceStatus.PRESENT,
        };

        const updatedAttachments = record.attachments ? [...record.attachments, attachment] : [attachment];
        
        onUpdateRecord({
          ...record,
          attachments: updatedAttachments
        });
      };
      reader.readAsDataURL(file);
    }
    // Clear input value to allow re-uploading same file if needed
    e.target.value = '';
  };

  // Programmatic trigger for file input to avoid label/click bubbling issues
  const triggerFileUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const deleteAttachment = (empId: string, dateStr: string, attachmentId: string) => {
    const record = getRecord(empId, dateStr);
    if (record && record.attachments) {
      const updatedAttachments = record.attachments.filter(a => a.id !== attachmentId);
      onUpdateRecord({
        ...record,
        attachments: updatedAttachments
      });
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    return employees.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.includes(searchTerm);
      const matchesDept = selectedDept === 'ALL' || e.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, selectedDept]);

  const handleClearDataClick = () => {
    setShowClearConfirm(true);
  };

  const confirmClearData = () => {
    onClearRecords();
    setShowClearConfirm(false);
  };

  const handleSaveData = () => {
    try {
      const data = { employees, records, annualLeaves };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert(t.backupCreated);
    } catch (e) {
      console.error(e);
      alert(lang === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving data');
    }
  };

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.employees && json.records) {
             onLoadData(json.employees, json.records, json.annualLeaves);
             alert(t.restoreSuccess);
          } else {
             alert(t.invalidFile);
          }
        } catch (error) {
          alert(t.errorReading);
        }
      };
      reader.readAsText(file);
    }
  };

  const openAddModal = () => {
    setEditingEmpId(null);
    setEmpFormData({ name: '', role: '', department: '' });
    setShowEmpModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEmpFormData({ name: emp.name, role: emp.role, department: emp.department });
    setShowEmpModal(true);
  };

  const handleEmpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (empFormData.name && empFormData.role && empFormData.department) {
      if (editingEmpId) {
        const originalEmp = employees.find(e => e.id === editingEmpId);
        if (originalEmp) {
          onEditEmployee({
            ...originalEmp,
            name: empFormData.name,
            role: empFormData.role,
            department: empFormData.department
          });
        }
      } else {
        const emp: Employee = {
          id: generateId(),
          name: empFormData.name,
          role: empFormData.role,
          department: empFormData.department,
          joinDate: new Date().toISOString().split('T')[0],
          avatarUrl: `https://picsum.photos/seed/${Math.random()}/200`
        };
        onAddEmployee(emp);
      }
      setShowEmpModal(false);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm(t.confirmRemoveEmp)) {
      onRemoveEmployee(id);
    }
  };

  const calculateStats = (empId: string) => {
    let stats = {
      present: 0,
      deduction: 0,
      casual: 0,
      sick: 0,
      mission: 0,
      late: 0,
      vacation: 0
    };

    const details: { date: string, type: string, status: string }[] = [];

    dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const record = getRecord(empId, dateStr);
      if (record) {
        switch(record.status) {
          case AttendanceStatus.PRESENT: 
            stats.present++; 
            break;
          case AttendanceStatus.LATE: 
            stats.late++; 
            break; 
          case AttendanceStatus.DEDUCTION: 
            stats.deduction++; 
            details.push({ date: dateStr, type: t.statuses.Deduction, status: "لم يتم تقديم سبب" });
            break;
          case AttendanceStatus.CASUAL: 
            stats.casual++; 
            details.push({ date: dateStr, type: t.statuses.Casual, status: "تمت الموافقة" });
            break;
          case AttendanceStatus.SICK: 
            stats.sick++; 
            details.push({ date: dateStr, type: t.statuses.Sick, status: "مرفق شهادة طبية" });
            break;
          case AttendanceStatus.MISSION: 
            stats.mission++; 
            details.push({ date: dateStr, type: t.statuses.Mission, status: "مهمة رسمية" });
            break;
          case AttendanceStatus.VACATION: 
            stats.vacation++; 
            break;
        }
      }
    });
    return { stats, details };
  };

  const openStatsModal = (empId: string) => {
    setStatsEmployeeId(empId);
    setShowStatsModal(true);
    setSearchTerm(''); 
  };

  const statusOptions = [
    { key: AttendanceStatus.PRESENT, label: t.statuses.Present, icon: <Check size={16} className="text-emerald-600" /> },
    { key: AttendanceStatus.DEDUCTION, label: t.statuses.Deduction, icon: <X size={16} className="text-red-600" /> },
    { key: AttendanceStatus.CASUAL, label: t.statuses.Casual, icon: <Slash size={16} className="text-orange-600" /> },
    { key: AttendanceStatus.SICK, label: t.statuses.Sick, icon: <Heart size={16} className="text-rose-600" /> },
    { key: AttendanceStatus.MISSION, label: t.statuses.Mission, icon: <Briefcase size={16} className="text-purple-600" /> },
    { key: AttendanceStatus.LATE, label: t.statuses.Late, icon: <Clock size={16} className="text-amber-600" /> },
    { key: AttendanceStatus.VACATION, label: t.statuses.Vacation, icon: <Plane size={16} className="text-blue-600" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ... Header Controls ... */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto z-20">
          <CustomDatePicker label={t.from} date={dateRange.from} onChange={(d) => setDateRange(prev => ({...prev, from: d}))} lang={lang} />
          <CustomDatePicker label={t.to} date={dateRange.to} onChange={(d) => setDateRange(prev => ({...prev, to: d}))} lang={lang} />
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-end z-10">
             <label className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer" title={t.loadHistory}>
                <Upload size={18} />
                <span className="hidden lg:inline">{t.loadHistory}</span>
                <input type="file" accept=".json" onChange={handleFileLoad} className="hidden" />
             </label>

             <button onClick={handleSaveData} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title={t.saveHistory}>
               <Save size={18} />
               <span className="hidden lg:inline">{t.saveHistory}</span>
             </button>
             
             <button onClick={handleClearDataClick} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-lg shadow-rose-500/20 transition-all" title={t.clearData}>
               <Trash2 size={18} />
               <span className="hidden lg:inline">{t.clearData}</span>
             </button>
             
             <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all">
               <UserPlus size={18} />
               <span className="hidden lg:inline">{t.addEmployee}</span>
             </button>
             
             <div className="relative" ref={filterRef}>
               <button onClick={() => setShowFilterMenu(!showFilterMenu)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border rounded-xl transition-all ${selectedDept !== 'ALL' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                 <Filter size={18} />
                 <span className="hidden lg:inline">{selectedDept !== 'ALL' ? selectedDept : t.filter}</span>
               </button>
               {showFilterMenu && (
                 <div className={`absolute top-full mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-30 ${isRTL ? 'right-0' : 'left-0'}`}>
                   <div className="p-3 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.filterByDept}</div>
                   <button onClick={() => { setSelectedDept('ALL'); setShowFilterMenu(false); }} className="w-full text-start px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">{t.allDepts}</button>
                   {departments.map(dept => (
                     <button key={dept} onClick={() => { setSelectedDept(dept); setShowFilterMenu(false); }} className="w-full text-start px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">{dept}</button>
                   ))}
                 </div>
               )}
             </div>

             <div className="relative" ref={searchContainerRef}>
               <Search className={`absolute top-3 text-slate-400 ${isRTL ? 'right-3.5' : 'left-3.5'}`} size={18} />
               <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setIsSearchFocused(true)} className={`pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl w-full sm:w-48 xl:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isRTL ? 'pr-10 pl-4' : ''}`} />
               {isSearchFocused && searchTerm && filteredEmployees.length > 0 && (
                 <div className={`absolute top-full mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-40 max-h-96 overflow-y-auto ${isRTL ? 'left-0' : 'right-0'}`}>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase">{t.statsTitle}</div>
                    {filteredEmployees.map(emp => (
                        <div key={emp.id} onMouseDown={() => openStatsModal(emp.id)} className="p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors group">
                          <div className="flex items-center gap-3 mb-3">
                            <img src={emp.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                            <div><p className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{emp.name}</p><p className="text-xs text-slate-500">{emp.role}</p></div>
                          </div>
                        </div>
                    ))}
                 </div>
               )}
             </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 border border-slate-200 dark:border-slate-700 p-6 text-center">
             <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-500"><AlertTriangle size={32} /></div>
             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t.clearData}</h3>
             <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{t.confirmClear}</p>
             <div className="flex gap-3">
               <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-4 py-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">{t.cancel}</button>
               <button onClick={confirmClearData} className="flex-1 px-4 py-2.5 text-white bg-rose-600 hover:bg-rose-700 rounded-xl font-bold shadow-lg shadow-rose-600/20 transition-all">{t.clearData}</button>
             </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && statsEmployeeId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
               <div className="flex gap-3">
                  <button onClick={() => handleDeleteEmployee(statsEmployeeId)} className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  <button onClick={() => { /* Edit Logic */ }} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 p-2 rounded-lg transition-colors"><Edit size={18} /></button>
               </div>
               <div className="flex items-center gap-4 text-right">
                  <div><h3 className="font-bold text-2xl text-slate-900 dark:text-white">{employees.find(e => e.id === statsEmployeeId)?.name}</h3><p className="text-slate-500 text-sm">{employees.find(e => e.id === statsEmployeeId)?.role || 'EMP-001'}</p></div>
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">{employees.find(e => e.id === statsEmployeeId)?.name.charAt(0)}</div>
               </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
               {(() => {
                 const { stats, details } = calculateStats(statsEmployeeId);
                 const statItems = [
                   { label: t.statuses.Present, count: `${stats.present} أيام`, color: "text-emerald-600", bg: "bg-white dark:bg-slate-800", icon: <CheckCircle className="text-emerald-500" size={24} /> },
                   { label: t.statuses.Deduction, count: `${stats.deduction} أيام`, color: "text-slate-600", bg: "bg-white dark:bg-slate-800", icon: <XCircle className="text-slate-400" size={24} /> },
                   { label: t.statuses.Sick, count: `${stats.sick} أيام`, color: "text-slate-600", bg: "bg-white dark:bg-slate-800", icon: <Heart className="text-slate-400" size={24} /> },
                   { label: t.statuses.Casual, count: `${stats.casual} أيام`, color: "text-slate-600", bg: "bg-white dark:bg-slate-800", icon: <AlertCircle className="text-slate-400" size={24} /> },
                   { label: t.statuses.Vacation, count: `${stats.vacation} أيام`, color: "text-slate-600", bg: "bg-white dark:bg-slate-800", icon: <Plane className="text-slate-400" size={24} /> },
                   { label: t.statuses.Mission, count: `${stats.mission} أيام`, color: "text-slate-600", bg: "bg-white dark:bg-slate-800", icon: <Briefcase className="text-slate-400" size={24} /> },
                 ];
                 const monthName = new Date(dateRange.to).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

                 return (
                   <div className="space-y-6">
                     <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-xl text-slate-800 dark:text-white">الملخص الشهري</h4><span className="text-slate-400 text-sm">{monthName}</span></div>
                        <div className="grid grid-cols-2 gap-4">
                            {statItems.map((item, idx) => (
                                <div key={idx} className={`${item.bg} p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700`}>
                                    <div className="text-right"><div className={`font-bold ${idx === 0 ? 'text-lg' : 'text-base'} ${idx === 0 ? 'text-slate-800' : 'text-slate-700'}`}>{item.label}</div><div className={`text-sm ${idx === 0 ? 'text-slate-500' : 'text-slate-400'}`}>{item.count}</div></div>
                                    <div>{item.icon}</div>
                                </div>
                            ))}
                        </div>
                     </div>
                     <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold text-xl text-slate-800 dark:text-white mb-4 text-right">تفاصيل الغياب والتحقق بالذكاء الاصطناعي</h4>
                        <div className="space-y-3">
                            {details.length > 0 ? details.map((det, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex gap-2"><button className="text-indigo-500 hover:text-indigo-600"><Sparkles size={18} /></button><button className="text-slate-400 hover:text-slate-600"><Edit size={18} /></button><button className="text-slate-400 hover:text-slate-600"><Upload size={18} /></button></div>
                                    <div className="text-right"><div className="font-bold text-slate-800 dark:text-white text-sm">{det.type} بتاريخ {new Date(det.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</div><div className="text-xs text-slate-400">"{det.status}"</div></div>
                                    <div className="p-2 bg-slate-100 rounded-full"><Heart size={20} className="text-slate-800" /></div>
                                </div>
                            )) : <div className="text-center text-slate-400 py-4 text-sm">لا توجد غيابات مسجلة في هذه الفترة</div>}
                        </div>
                     </div>
                   </div>
                 );
               })()}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
               <button onClick={() => setShowStatsModal(false)} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Add/Edit Modal */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center"><h3 className="font-bold text-xl text-slate-800 dark:text-white">{editingEmpId ? t.editEmployee : t.addEmployee}</h3><button onClick={() => setShowEmpModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button></div>
            <form onSubmit={handleEmpSubmit} className="p-6 space-y-5">
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t.newEmpName}</label><input type="text" required value={empFormData.name} onChange={(e) => setEmpFormData({...empFormData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t.newEmpRole}</label><input type="text" required value={empFormData.role} onChange={(e) => setEmpFormData({...empFormData, role: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t.newEmpDept}</label><input type="text" required value={empFormData.department} onChange={(e) => setEmpFormData({...empFormData, department: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" /></div>
              <div className="flex gap-3 mt-8"><button type="button" onClick={() => setShowEmpModal(false)} className="flex-1 px-4 py-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">{t.cancel}</button><button type="submit" className="flex-1 px-4 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all">{editingEmpId ? t.update : t.save}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Main Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto relative min-h-[500px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="sticky start-0 z-10 bg-slate-50 dark:bg-slate-900 w-12 px-2 py-4 text-center text-slate-400 font-normal">#</th>
              <th className={`sticky z-10 bg-slate-50 dark:bg-slate-900 px-4 py-4 text-start font-bold text-slate-700 dark:text-slate-200 min-w-[220px] border-e border-slate-100 dark:border-slate-800 ${isRTL ? 'right-12' : 'left-12'}`}>{t.employee}</th>
              {dates.map((date, i) => {
                const dayName = date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
                const dayNum = date.getDate();
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <th key={i} className={`px-2 py-4 text-center min-w-[65px] border-e border-slate-100 dark:border-slate-800 last:border-none ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                    <div className="flex flex-col items-center gap-0.5"><span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{dayName}</span><span className={`text-lg font-bold leading-none ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{dayNum}</span></div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.isArray(filteredEmployees) && filteredEmployees.map((emp, idx) => (
              <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="sticky start-0 z-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 px-2 py-3 text-center text-slate-400 text-xs font-mono border-e border-slate-100 dark:border-slate-800"><span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg w-6 h-6 flex items-center justify-center mx-auto text-[10px]">{idx + 1}</span></td>
                <td className={`sticky z-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 px-4 py-3 border-e border-slate-100 dark:border-slate-800 ${isRTL ? 'right-12' : 'left-12'}`}>
                  <div className="flex items-center justify-between group/cell w-full">
                    <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded-lg -ml-1 transition-colors flex-1" onClick={() => openStatsModal(emp.id)}>
                      <img src={emp.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-slate-200 object-cover ring-2 ring-white dark:ring-slate-800" />
                      <div className="min-w-0"><div className="flex items-center gap-2"><p className="font-bold text-slate-800 dark:text-slate-100 truncate hover:text-indigo-600 transition-colors">{emp.name}</p></div><p className="text-xs text-slate-400 truncate">{emp.role}</p></div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(emp)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title={t.editEmployee}><Edit size={16} /></button>
                      <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </td>
                {dates.map((date, dIdx) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const record = getRecord(emp.id, dateStr);
                  const isWeekend = date.getDay() === 5 || date.getDay() === 6;
                  const isActive = activeCell?.empId === emp.id && activeCell?.date === dateStr;
                  const hasAttachment = record?.attachments && record.attachments.length > 0;

                  return (
                    <td key={dIdx} className={`relative p-0 border-e border-slate-100 dark:border-slate-800 last:border-none text-center align-middle ${isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
                      <button onClick={(e) => { e.stopPropagation(); setActiveCell(isActive ? null : { empId: emp.id, date: dateStr }); }} className={`w-full h-16 flex items-center justify-center hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 focus:outline-none transition-all relative ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-inset ring-indigo-400 dark:ring-indigo-500 z-10' : ''}`}>
                         <StatusIcon status={record?.status} />
                         {hasAttachment && <div className="absolute top-1 right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm"><Paperclip size={10} className="text-slate-500" /></div>}
                      </button>

                      {isActive && (
                        <div 
                          ref={popoverRef}
                          onClick={(e) => e.stopPropagation()} 
                          className={`absolute z-50 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-72 py-0 text-start ${dIdx > dates.length - 3 ? (isRTL ? 'left-0' : 'right-0') : (isRTL ? 'right-0' : 'left-0')} top-full animate-in zoom-in-95 overflow-hidden`}
                        >
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.attendance}</span>
                             <button onClick={(e) => { e.stopPropagation(); setActiveCell(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"><X size={14} /></button>
                          </div>

                          <div className="py-2 max-h-60 overflow-y-auto">
                            {statusOptions.map((opt) => (
                                <button key={opt.key} onClick={() => setStatus(emp.id, dateStr, opt.key)} className="w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors font-medium">
                                <div className="w-6 flex justify-center">{opt.icon}</div><span>{opt.label}</span>
                                </button>
                            ))}
                          </div>
                          
                          <div className="border-t border-slate-100 dark:border-slate-700 pt-2 pb-2 bg-slate-50 dark:bg-slate-800/50">
                             <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                <span>{t.attachments}</span><span className="text-[9px] bg-slate-200 dark:bg-slate-700 px-1.5 rounded-full">{record?.attachments?.length || 0}</span>
                             </div>
                             
                             {hasAttachment ? (
                                <div className="px-2 space-y-1 mt-1">
                                   {record?.attachments?.map((att, attIdx) => (
                                       <div key={attIdx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded-lg text-xs shadow-sm border border-slate-100 dark:border-slate-600">
                                           <div className="flex items-center gap-2 overflow-hidden"><FileText size={12} className="text-indigo-500 shrink-0" /><span className="truncate max-w-[120px] font-medium text-slate-700 dark:text-slate-300" title={att.name}>{att.name}</span></div>
                                           <div className="flex gap-1 shrink-0">
                                               <a href={att.data} download={att.name} className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded text-indigo-600" title={t.view} onClick={(e) => e.stopPropagation()}><Eye size={12} /></a>
                                               <button onClick={(e) => { e.stopPropagation(); deleteAttachment(emp.id, dateStr, att.id); }} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-900/50 rounded text-rose-600" title={t.delete}><Trash2 size={12} /></button>
                                           </div>
                                       </div>
                                   ))}
                                </div>
                             ) : <div className="px-3 py-3 text-xs text-slate-400 italic text-center">{t.noAttachments}</div>}
                             
                             {/* Upload Button - Programmatic Trigger */}
                             <button 
                               onClick={triggerFileUpload}
                               className="flex items-center justify-center gap-2 mt-3 mx-3 p-2.5 border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors w-[calc(100%-24px)]"
                             >
                                <Upload size={14} className="text-indigo-500" />
                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{t.uploadFile}</span>
                             </button>
                             <input 
                               ref={fileInputRef}
                               type="file" 
                               className="hidden" 
                               onClick={(e) => { (e.target as HTMLInputElement).value = ''; e.stopPropagation(); }} 
                               onChange={(e) => handleFileUpload(emp.id, dateStr, e)} 
                             />
                          </div>

                          {/* Distinct Save & Close Buttons */}
                          <div className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2 bg-white dark:bg-slate-800">
                             <button 
                                onClick={(e) => { e.stopPropagation(); setActiveCell(null); }} 
                                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                             >
                                إغلاق
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); setActiveCell(null); }} 
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1"
                             >
                                <Save size={14} /> حفظ
                             </button>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filteredEmployees.length === 0 && (<tr><td colSpan={dates.length + 2} className="p-8 text-center text-slate-500 dark:text-slate-400">No employees found matching your criteria.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceManager;
