
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Save, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface NotesFormProps {
  lang: 'en' | 'ar';
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
  logoUrl?: string;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// --- Custom Date Picker ---
const ProfessionalDatePicker = ({ 
  date, 
  onChange, 
  lang 
}: { 
  date: string; 
  onChange: (d: string) => void; 
  lang: 'en' | 'ar' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const validDate = useMemo(() => {
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [date]);
  const [currentMonth, setCurrentMonth] = useState(validDate);
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

  useEffect(() => { setCurrentMonth(validDate); }, [validDate.getMonth(), validDate.getFullYear()]);

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(currentMonth);
    selectedDate.setDate(day);
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - (offset*60*1000));
    onChange(localDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const monthNames = lang === 'ar' 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const weekDays = lang === 'ar' 
    ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); 
  const adjustedStartDay = (startDay + 1) % 7; 

  const formattedDisplay = useMemo(() => {
    return validDate.toISOString().split('T')[0];
  }, [validDate]);

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-full w-full bg-transparent hover:bg-black/5 transition-colors font-bold text-lg"
      >
        <span>{formattedDisplay}</span>
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-300 p-5 z-50 w-72 ${isRTL ? 'right-0' : 'left-0'}`}>
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20} className={isRTL ? "" : "rotate-180"} /></button>
            <span className="font-bold">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20} className={isRTL ? "" : "rotate-180"} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-500 uppercase">{weekDays.map(d => <span key={d}>{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedStartDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const isSelected = validDate.getDate() === day && validDate.getMonth() === currentMonth.getMonth() && validDate.getFullYear() === currentMonth.getFullYear();
               return <button key={day} onClick={() => handleDayClick(day)} className={`h-8 w-8 rounded-lg text-sm flex items-center justify-center font-bold ${isSelected ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{day}</button>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface NoteRow {
  id: string;
  diffAtm: string;
  note: string;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const NotesForm: React.FC<NotesFormProps> = ({ lang, onSaveDocument, initialData, logoUrl, onLogoUpload }) => {
  const t = translations[lang].notesForm;
  const isRTL = lang === 'ar';
  
  const [logoSize, setLogoSize] = useState(100);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDay, setSelectedDay] = useState('');
  const [shiftManager, setShiftManager] = useState('');
  const [rows, setRows] = useState<NoteRow[]>(Array(4).fill(null).map(() => ({
    id: generateId(),
    diffAtm: 'QAR 0',
    note: ''
  })));
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const weekDaysList = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  useEffect(() => {
    if (initialData) {
      if (initialData.date) setDate(initialData.date);
      if (initialData.selectedDay) setSelectedDay(initialData.selectedDay);
      if (initialData.rows) setRows(initialData.rows);
      if (initialData.shiftManager) setShiftManager(initialData.shiftManager);
    } else {
       // Initialize day based on current date
       const d = new Date(date);
       if (!isNaN(d.getTime())) {
          setSelectedDay(d.toLocaleDateString('ar-EG', { weekday: 'long' }));
       }
    }
  }, [initialData]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const d = new Date(newDate);
    if (!isNaN(d.getTime())) {
        setSelectedDay(d.toLocaleDateString('ar-EG', { weekday: 'long' }));
    }
  };

  const handleRowChange = (id: string, field: keyof NoteRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, { id: generateId(), diffAtm: 'QAR 0', note: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
       setRows(prev => prev.filter(r => r.id !== id));
    }
  };

  const confirmClearData = () => {
    setRows(Array(4).fill(null).map(() => ({
        id: generateId(),
        diffAtm: 'QAR 0',
        note: ''
    })));
    setShiftManager('');
    setShowClearConfirm(false);
  };

  const handlePrint = () => printElement('printable-form');

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'NotesForm',
            title: `Notes - ${date} (${selectedDay})`,
            date: new Date().toISOString(),
            data: { date, selectedDay, rows, shiftManager }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
             <button onClick={() => setShowClearConfirm(true)} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm text-sm">
                <RotateCcw size={18} />
                <span>{lang === 'ar' ? 'تفريغ' : 'Clear'}</span>
            </button>
            <button onClick={addRow} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all">
                <Plus size={18} />
                <span>{lang === 'ar' ? 'إضافة صف' : 'Add Row'}</span>
            </button>
            <button onClick={handleSaveToArchive} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm text-sm">
                <Save size={18} className="text-indigo-600" />
                <span>{t.saveToArchive}</span>
            </button>
            <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 font-bold transition-all text-sm">
                <Printer size={18} />
                <span>{t.print}</span>
            </button>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{lang === 'ar' ? 'تفريغ البيانات' : 'Clear Data'}</h3>
             <div className="flex gap-3 mt-6">
               <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
               <button onClick={confirmClearData} className="flex-1 px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-xl font-bold">{lang === 'ar' ? 'تفريغ' : 'Clear'}</button>
             </div>
          </div>
        </div>
      )}

      {/* Form Area */}
      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 md:p-8 rounded-2xl overflow-x-auto flex justify-center">
        <div 
          id="printable-form"
          className="bg-white text-black shadow-xl relative box-border"
          style={{ width: '297mm', minHeight: '210mm', fontFamily: "'Arial', sans-serif" }}
          dir="ltr"
        >
          <div className="flex-1 m-2 border-[4px] border-black p-1 flex flex-col h-full bg-white">
            
            {/* Header: Logo & Title Area */}
            <div className="flex justify-between items-start p-2 pb-4">
                <div className="w-1/3">
                     {/* Placeholder for Left Side if needed */}
                </div>
                <div className="w-1/3 text-center pt-4">
                   {/* Centered Content if needed, usually empty in this design */}
                </div>
                <div className="w-1/3 flex justify-end">
                    <div className="relative group inline-block">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px` }} className="object-contain max-h-24" />
                        ) : (
                            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 font-bold cursor-pointer hover:bg-gray-50">
                                <ImageIcon size={20} className="mb-1" />
                                <span>شعار</span>
                            </div>
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded-lg print-hidden">
                            <Upload className="text-white" />
                            <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                        </label>
                    </div>
                    {logoUrl && (
                        <div className="mt-2 w-24 print:hidden absolute top-full right-0 z-10">
                            <input type="range" min="50" max="150" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer" />
                        </div>
                    )}
                </div>
            </div>


            {/* Info Bar */}
            <div className="flex items-stretch border-y-[3px] border-black h-16 bg-[#d9d9d9]">
                {/* Date */}
                <div className="w-1/3 flex items-center justify-center border-r-[3px] border-black p-0">
                    <ProfessionalDatePicker date={date} onChange={handleDateChange} lang={lang} />
                </div>
                {/* Day Dropdown */}
                <div className="w-1/3 flex items-center justify-center border-r-[3px] border-black p-0 bg-white">
                    <select 
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="w-full h-full text-center font-bold text-xl bg-transparent outline-none appearance-none cursor-pointer"
                        dir="rtl"
                    >
                        <option value="">-- اختر --</option>
                        {weekDaysList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                {/* Title */}
                <div className="w-1/3 flex items-center justify-center font-bold text-2xl">
                    ملاحظات عمل يوم
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col">
                {/* Table Header */}
                <div className="bg-[#d9d9d9] border-b-[3px] border-black py-2 text-center font-bold text-xl">
                    {t.tableHeader}
                </div>
                
                {/* Table Rows Container */}
                <div className="flex-1">
                    {rows.map((row, index) => (
                        <div key={row.id} className="flex border-b-[3px] border-black h-32 relative group">
                            
                            {/* 1. DIFF ATM (Yellow) */}
                            <div className="w-[15%] bg-[#ffc000] border-r-[3px] border-black flex flex-col">
                                <div className="border-b-[2px] border-black text-center font-bold text-sm py-1 bg-[#d9d9d9]">
                                    {t.diffAtm}
                                </div>
                                <div className="flex-1 flex items-center justify-center p-2">
                                    <input 
                                        type="text" 
                                        value={row.diffAtm}
                                        onChange={(e) => handleRowChange(row.id, 'diffAtm', e.target.value)}
                                        className="w-full h-full bg-transparent text-center font-bold text-xl outline-none"
                                        placeholder="QAR 0"
                                    />
                                </div>
                            </div>

                            {/* 2. Note (Merged Single Column) */}
                            <div className="w-[75%] border-r-[3px] border-black p-0">
                                <textarea 
                                    value={row.note}
                                    onChange={(e) => handleRowChange(row.id, 'note', e.target.value)}
                                    className="w-full h-full resize-none p-4 text-center font-bold text-xl outline-none border-none"
                                    placeholder={t.inputPlaceholder}
                                    dir="rtl"
                                />
                            </div>

                            {/* 3. Row Number / Doc No */}
                            <div className="w-[10%] flex flex-col">
                                <div className="border-b-[2px] border-black text-center font-bold text-sm py-1 bg-[#d9d9d9]">
                                    {t.docNo}
                                </div>
                                <div className="flex-1 flex items-center justify-center font-bold text-3xl">
                                    {index + 1}
                                </div>
                            </div>

                            {/* Remove Row Button (Hidden on Print) */}
                            <div className="absolute top-1 right-1 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => removeRow(row.id)} className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t-0 border-black mt-auto">
                <div className="flex justify-end items-center gap-4">
                    <input 
                         type="text" 
                         value={shiftManager}
                         onChange={(e) => setShiftManager(e.target.value)}
                         className="border-b-2 border-dotted border-black text-xl font-bold text-center w-64 outline-none"
                         dir="rtl"
                         placeholder="..................................."
                    />
                    <span className="font-bold text-xl">: مسئول الشفت</span>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesForm;
