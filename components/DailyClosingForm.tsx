
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Save, Calendar, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight, Car, Truck } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface DailyClosingFormProps {
  lang: 'en' | 'ar';
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
}

// --- Professional Custom Date Picker ---
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
        className="flex items-center justify-center h-full w-full bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-3xl font-extrabold text-black font-sans">
           {formattedDisplay}
        </span>
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-300 p-5 z-50 w-80 ${isRTL ? 'right-0' : 'left-0'}`}>
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight size={20} className={isRTL ? "" : "rotate-180"} />
            </button>
            <span className="font-bold">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft size={20} className={isRTL ? "" : "rotate-180"} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-500 uppercase">{weekDays.map(d => <span key={d}>{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedStartDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const isSelected = validDate.getDate() === day && validDate.getMonth() === currentMonth.getMonth() && validDate.getFullYear() === currentMonth.getFullYear();
               return (
                <button key={day} onClick={() => handleDayClick(day)} className={`h-9 w-9 rounded-lg text-sm flex items-center justify-center font-bold ${isSelected ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{day}</button>
               );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const DailyClosingForm: React.FC<DailyClosingFormProps> = ({ lang, onSaveDocument, initialData }) => {
  const t = translations[lang].dailyClosing;
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Closing Title State
  const [closingTitle, setClosingTitle] = useState('');

  // Form Values State
  const [values, setValues] = useState<Record<string, string>>({
    sideAtm1: '', sideAtm2: '', sideCash1: '', sideCash2: '', 
    greenTotalAtm: '', greenTotalCash: '',
    carsTourist: '', carsCargo: '',
    // Notes fields
    note1: '', note2: '', note3: '', note4: '', note5: '', note6: '', note7: ''
  });

  // Helper to get Arabic day name
  const getDayName = (dStr: string) => {
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ar-EG', { weekday: 'long' });
  };

  const currentDayName = useMemo(() => getDayName(date), [date]);

  // Auto-set title based on day if empty on initial load
  useEffect(() => {
    if (!initialData && !closingTitle) {
      setClosingTitle(`اغلاق عمل يوم ${currentDayName}`);
    }
  }, [currentDayName]);

  useEffect(() => {
    if (initialData) {
        if (initialData.date) setDate(initialData.date);
        if (initialData.values) setValues(initialData.values);
        if (initialData.closingTitle) setClosingTitle(initialData.closingTitle);
    }
  }, [initialData]);

  // Handle Date Change manually to update title suggestions
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
  };

  const handleChange = (field: string, val: string) => {
    if (/^\d*\.?\d*$/.test(val)) {
        setValues(prev => ({ ...prev, [field]: val }));
    }
  };

  const handleTextChange = (field: string, val: string) => {
    setValues(prev => ({ ...prev, [field]: val }));
  };

  // --- ENTER KEY NAVIGATION ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Get all inputs with class 'closing-input'
      const inputs = Array.from(document.querySelectorAll('.closing-input')) as HTMLInputElement[];
      const index = inputs.indexOf(e.currentTarget);
      if (index > -1 && index < inputs.length - 1) {
        const nextInput = inputs[index + 1];
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const parseNumber = (str: string) => {
      const matches = str.match(/-?[\d,]+(\.\d+)?/);
      if (!matches) return 0;
      return parseFloat(matches[0].replace(/,/g, ''));
  };

  // --- EQUATIONS ---
  // 1. Side Table (Cargo)
  const sideAtm1 = parseFloat(values.sideAtm1) || 0;
  const sideAtm2 = parseFloat(values.sideAtm2) || 0;
  const sideCash1 = parseFloat(values.sideCash1) || 0;
  const sideCash2 = parseFloat(values.sideCash2) || 0;

  const cargoAtm = sideAtm1 + sideAtm2;
  const cargoCash = sideCash1 + sideCash2;

  // 2. Green Rows Inputs (Total ATM / Total CASH)
  const totalAtmInput = parseNumber(values.greenTotalAtm);
  const totalCashInput = parseNumber(values.greenTotalCash);

  // 3. Tourist Calculations (Derived: Total - Cargo)
  const touristAtm = totalAtmInput - cargoAtm;
  const touristCash = totalCashInput - cargoCash;

  // 4. Grand Total (Yellow) - Sum of Green Rows
  const grandTotal = totalAtmInput + totalCashInput;

  // 6. Cars
  const carsT = parseFloat(values.carsTourist) || 0;
  const carsC = parseFloat(values.carsCargo) || 0;
  const totalCars = carsT + carsC;

  const currentDateLabel = useMemo(() => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      return d.toISOString().split('T')[0];
  }, [date]);

  const handlePrint = () => printElement('printable-form');

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'DailyClosingForm',
            title: `Daily Closing - ${currentDateLabel}`,
            date: new Date().toISOString(),
            data: { date, values, closingTitle }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  const confirmClearData = () => {
    setValues({
        sideAtm1: '', sideAtm2: '', sideCash1: '', sideCash2: '',
        greenTotalAtm: '', greenTotalCash: '',
        carsTourist: '', carsCargo: '',
        note1: '', note2: '', note3: '', note4: '', note5: '', note6: '', note7: ''
    });
    setClosingTitle(`اغلاق عمل يوم ${currentDayName}`);
    setShowClearConfirm(false);
  };

  // Input Class Helpers
  const inputBase = "w-full h-full bg-transparent text-center font-bold outline-none border-none p-0 transition-colors closing-input";
  const sideInput = `${inputBase} text-2xl text-black placeholder-gray-300`;
  const noteInput = "w-full h-full bg-transparent text-right font-bold text-xl px-4 outline-none border-none closing-input placeholder-gray-200";
  const mainInput = `${inputBase} text-4xl text-black placeholder-gray-300`; 

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
          {/* Main Container */}
          <div className="flex-1 m-2 p-2 flex flex-col h-full bg-white gap-4">
            
            {/* Top Black Header */}
            <div className="bg-black text-white text-center py-2 font-bold text-3xl border-4 border-black tracking-wide uppercase">
                Qatari Unified Bureau Insurance
            </div>

            <div className="flex w-full gap-4">
                
                {/* --- LEFT SIDE: Side Table + Notes (40%) --- */}
                <div className="w-[40%] flex flex-col h-full">
                    {/* --- SIDE TABLE (Cargo) --- */}
                    <div className="flex flex-col h-fit">
                        {/* Header - Green */}
                        <div className="h-16 bg-[#00b050] text-black font-bold text-3xl flex items-center justify-center border-4 border-black border-b-0">
                            قسم الشحن
                        </div>
                        {/* ATM Row - THICK SEPARATOR */}
                        <div className="flex h-24 border-4 border-black border-b-[8px] border-t-0">
                            <div className="w-[25%] bg-[#10253f] text-white font-bold text-2xl flex items-center justify-center border-r-2 border-black">
                                ATM
                            </div>
                            <div className="w-[25%] border-r-2 border-black p-1.5">
                                {/* Internal Frame */}
                                <div className="w-full h-full border-2 border-black flex items-center justify-center">
                                    <input type="text" value={values.sideAtm1} onChange={(e) => handleChange('sideAtm1', e.target.value)} onKeyDown={handleKeyDown} className={sideInput} placeholder="" />
                                </div>
                            </div>
                            <div className="w-[25%] border-r-2 border-black p-1.5">
                                {/* Internal Frame */}
                                <div className="w-full h-full border-2 border-black flex items-center justify-center">
                                    <input type="text" value={values.sideAtm2} onChange={(e) => handleChange('sideAtm2', e.target.value)} onKeyDown={handleKeyDown} className={sideInput} placeholder="" />
                                </div>
                            </div>
                            <div className="w-[25%] flex flex-col items-center justify-center font-bold text-xl leading-tight">
                                {cargoAtm > 0 ? (
                                    <>
                                        <span className="text-xs">QAR</span>
                                        <span>{cargoAtm}</span>
                                    </>
                                ) : ''}
                            </div>
                        </div>

                        {/* CASH Row */}
                        <div className="flex h-24 border-4 border-black border-t-0">
                            <div className="w-[25%] bg-[#10253f] text-white font-bold text-2xl flex items-center justify-center border-r-2 border-black">
                                CASH
                            </div>
                            <div className="w-[25%] border-r-2 border-black p-1.5">
                                {/* Internal Frame */}
                                <div className="w-full h-full border-2 border-black flex items-center justify-center">
                                    <input type="text" value={values.sideCash1} onChange={(e) => handleChange('sideCash1', e.target.value)} onKeyDown={handleKeyDown} className={sideInput} placeholder="" />
                                </div>
                            </div>
                            <div className="w-[25%] border-r-2 border-black p-1.5">
                                {/* Internal Frame */}
                                <div className="w-full h-full border-2 border-black flex items-center justify-center">
                                    <input type="text" value={values.sideCash2} onChange={(e) => handleChange('sideCash2', e.target.value)} onKeyDown={handleKeyDown} className={sideInput} placeholder="" />
                                </div>
                            </div>
                            <div className="w-[25%] flex flex-col items-center justify-center font-bold text-xl leading-tight">
                                {cargoCash > 0 ? (
                                    <>
                                        <span className="text-xs">QAR</span>
                                        <span>{cargoCash}</span>
                                    </>
                                ) : ''}
                            </div>
                        </div>
                    </div>

                    {/* --- NOTES SECTION --- */}
                    <div className="flex-1 mt-4 border-4 border-black flex flex-col">
                        <div className="h-12 bg-[#1f497d] text-white font-bold text-xl flex items-center justify-center border-b-4 border-black">
                            ملاحظات
                        </div>
                        {/* Note Lines */}
                        {[1, 2, 3, 4, 5, 6, 7].map((num, idx, arr) => (
                            <div key={num} className={`flex-1 border-b-2 border-black ${idx === arr.length - 1 ? 'border-b-0' : ''}`}>
                                <input 
                                    type="text" 
                                    value={values[`note${num}`] || ''} 
                                    onChange={(e) => handleTextChange(`note${num}`, e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={noteInput}
                                    dir="rtl"
                                    placeholder={num === 1 ? '.....' : ''}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- MAIN TABLE - Right (60%) --- */}
                <div className="w-[60%] flex flex-col border-4 border-black h-full">
                    
                    {/* 1. Date & Title Row */}
                    <div className="flex h-16 border-b-4 border-black">
                        <div className="w-1/2 border-r-4 border-black p-0">
                            <ProfessionalDatePicker date={date} onChange={handleDateChange} lang={lang} />
                        </div>
                        <div className="w-1/2 p-0 bg-white relative">
                            {/* Standard HTML Datalist */}
                            <input 
                                list="closingTitles"
                                type="text" 
                                value={closingTitle}
                                onChange={(e) => setClosingTitle(e.target.value)}
                                className="w-full h-full text-center bg-transparent outline-none border-none font-bold text-xl px-2 placeholder-gray-300"
                                dir="rtl"
                                placeholder="اكتب عنوان الإغلاق هنا..."
                            />
                            <datalist id="closingTitles">
                                <option value={`اغلاق عمل يوم ${currentDayName}`} />
                                <option value={`اغلاق مناوبة صباحية يوم ${currentDayName}`} />
                                <option value={`اغلاق مناوبة مسائية يوم ${currentDayName}`} />
                            </datalist>
                        </div>
                    </div>

                    {/* 2. GRAND TOTAL YELLOW */}
                    <div className="h-20 bg-[#ffff00] border-b-4 border-black flex">
                        <div className="w-1/2 flex items-center justify-center text-4xl font-extrabold text-black">
                            <span className="text-xl mr-2 self-center font-bold">QAR</span>
                            {grandTotal > 0 ? grandTotal.toLocaleString() : ''}
                        </div>
                        <div className="w-1/2 flex items-center justify-center text-2xl font-bold text-black uppercase">
                            TOTAL
                        </div>
                    </div>

                    {/* 3. Rows (Tourist ATM) - Derived - THICK SEPARATOR */}
                    <div className="h-20 border-b-[8px] border-black flex">
                        <div className="w-1/2 border-r-4 border-black p-1.5">
                            <div className="w-full h-full border-2 border-black bg-white flex items-center justify-center relative">
                                <span className="absolute left-2 font-bold text-xl text-black">QAR</span>
                                <div className="w-full h-full flex items-center justify-center font-bold text-3xl pl-12 text-black">
                                    {touristAtm !== 0 ? touristAtm.toLocaleString() : ''}
                                </div>
                            </div>
                        </div>
                        <div className="w-1/4 border-r-2 border-black flex items-center justify-center font-bold text-2xl">ATM</div>
                        <div className="w-1/4 flex items-center justify-center font-bold text-2xl">{t.tourist}</div>
                    </div>

                    {/* 4. Rows (Tourist CASH) - Derived */}
                    <div className="h-20 border-b-2 border-black flex">
                        <div className="w-1/2 border-r-4 border-black p-1.5">
                            <div className="w-full h-full border-2 border-black bg-white flex items-center justify-center relative">
                                <span className="absolute left-2 font-bold text-xl text-black">QAR</span>
                                <div className="w-full h-full flex items-center justify-center font-bold text-3xl pl-12 text-black">
                                    {touristCash !== 0 ? touristCash.toLocaleString() : ''}
                                </div>
                            </div>
                        </div>
                        <div className="w-1/4 border-r-2 border-black flex items-center justify-center font-bold text-2xl">CASH</div>
                        <div className="w-1/4 flex items-center justify-center font-bold text-2xl">{t.tourist}</div>
                    </div>

                    {/* 5. Rows (Cargo ATM) - From Side - THICK SEPARATOR */}
                    <div className="h-20 border-b-[8px] border-black flex">
                        <div className="w-1/2 border-r-4 border-black p-1.5">
                            {/* Internal Frame for consistency */}
                            <div className="w-full h-full border-2 border-black bg-white flex items-center justify-center relative">
                                <span className="absolute left-2 font-bold text-xl text-black">QAR</span>
                                <div className="w-full h-full flex items-center justify-center font-bold text-3xl pl-12 text-black">
                                    {cargoAtm !== 0 ? cargoAtm.toLocaleString() : ''}
                                </div>
                            </div>
                        </div>
                        <div className="w-1/4 border-r-2 border-black flex items-center justify-center font-bold text-2xl">ATM</div>
                        <div className="w-1/4 flex items-center justify-center font-bold text-2xl">{t.cargo}</div>
                    </div>

                    {/* 6. Rows (Cargo CASH) - From Side */}
                    <div className="h-20 border-b-4 border-black flex">
                        <div className="w-1/2 border-r-4 border-black p-1.5">
                            {/* Internal Frame for consistency */}
                            <div className="w-full h-full border-2 border-black bg-white flex items-center justify-center relative">
                                <span className="absolute left-2 font-bold text-xl text-black">QAR</span>
                                <div className="w-full h-full flex items-center justify-center font-bold text-3xl pl-12 text-black">
                                    {cargoCash !== 0 ? cargoCash.toLocaleString() : ''}
                                </div>
                            </div>
                        </div>
                        <div className="w-1/4 border-r-2 border-black flex items-center justify-center font-bold text-2xl">CASH</div>
                        <div className="w-1/4 flex items-center justify-center font-bold text-2xl">{t.cargo}</div>
                    </div>

                    {/* 7. Total ATM (Green) - Manual Input - THICK SEPARATOR */}
                    <div className="h-20 border-b-[8px] border-black flex bg-[#d6e3bc]">
                        <div className="w-1/2 border-r-4 border-black p-1.5">
                            <div className="w-full h-full border-2 border-black bg-white flex items-center justify-center relative">
                                <span className="absolute left-2 font-bold text-xl text-black">QAR</span>
                                <input 
                                    type="text" 
                                    value={values.greenTotalAtm} 
                                    onChange={(e) => handleTextChange('greenTotalAtm', e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full h-full bg-transparent text-center font-bold text-3xl outline-none placeholder-gray-400 pl-12 closing-input"
                                    placeholder=""
                                />
                            </div>
                        </div>
                        <div className="w-1/4 border-r-2 border-black flex items-center justify-center font-bold text-2xl">
                            ATM
                        </div>
                        <div className="w-1/4 flex items-center justify-center font-bold text-2xl">إجمالي الــ</div>
                    </div>

                    {/* 8. Total CASH (Green) - Manual Input */}
                    <div className="h-20 border-b-4 border-black flex bg-[#d6e3bc]">
                        <div className="w-1/2 border-r-4 border-black p-1.5">
                            <div className="w-full h-full border-2 border-black bg-white flex items-center justify-center relative">
                                <span className="absolute left-2 font-bold text-xl text-black">QAR</span>
                                <input 
                                    type="text" 
                                    value={values.greenTotalCash} 
                                    onChange={(e) => handleTextChange('greenTotalCash', e.target.value)} 
                                    onKeyDown={handleKeyDown} 
                                    className="w-full h-full bg-transparent text-center font-bold text-3xl outline-none placeholder-gray-400 pl-12 closing-input"
                                    placeholder=""
                                />
                            </div>
                        </div>
                        <div className="w-1/4 border-r-2 border-black flex items-center justify-center font-bold text-2xl">
                            CASH
                        </div>
                        <div className="w-1/4 flex items-center justify-center font-bold text-2xl">إجمالي الــ</div>
                    </div>

                    {/* 9. Cars Tourist */}
                    <div className="h-32 border-b-2 border-black flex">
                        <div className="w-1/2 border-r-4 border-black p-0 relative flex items-center justify-center">
                            <Car className="absolute left-6 text-gray-300 w-16 h-16 opacity-60" strokeWidth={1.5} />
                            <input 
                                type="text" 
                                value={values.carsTourist} 
                                onChange={(e) => handleChange('carsTourist', e.target.value)} 
                                onKeyDown={handleKeyDown} 
                                className="w-full h-full bg-transparent text-center font-bold text-5xl outline-none border-none p-0 transition-colors closing-input z-10" 
                                placeholder="" 
                            />
                        </div>
                        <div className="w-1/2 flex items-center justify-center font-bold text-2xl">{t.carsTourist}</div>
                    </div>

                    {/* 10. Cars Cargo */}
                    <div className="h-32 border-b-2 border-black flex">
                        <div className="w-1/2 border-r-4 border-black p-0 relative flex items-center justify-center">
                            <Truck className="absolute left-6 text-gray-300 w-16 h-16 opacity-60" strokeWidth={1.5} />
                            <input 
                                type="text" 
                                value={values.carsCargo} 
                                onChange={(e) => handleChange('carsCargo', e.target.value)} 
                                onKeyDown={handleKeyDown} 
                                className="w-full h-full bg-transparent text-center font-bold text-5xl outline-none border-none p-0 transition-colors closing-input z-10" 
                                placeholder="" 
                            />
                        </div>
                        <div className="w-1/2 flex items-center justify-center font-bold text-2xl">{t.carsCargo}</div>
                    </div>

                    {/* 11. Total Cars */}
                    <div className="h-32 flex">
                        <div className="w-1/2 border-r-4 border-black flex items-center justify-center font-bold text-5xl">
                            {totalCars > 0 ? totalCars : ''}
                        </div>
                        <div className="w-1/2 flex items-center justify-center font-bold text-2xl">{t.totalCars}</div>
                    </div>

                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyClosingForm;
