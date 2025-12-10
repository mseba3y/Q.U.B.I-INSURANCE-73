
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Save, RotateCcw, AlertTriangle, ArrowDown, Eye, EyeOff, Calendar, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface MoneyReceiptFormProps {
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
        <span className="text-2xl font-bold text-black font-sans">
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

const MoneyReceiptForm: React.FC<MoneyReceiptFormProps> = ({ lang, onSaveDocument, initialData }) => {
  const t = translations[lang].moneyReceipt;
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Weekday State
  const [selectedDay, setSelectedDay] = useState('');

  // State for hiding rows
  const [hiddenCurrencies, setHiddenCurrencies] = useState<string[]>([]);

  const [values, setValues] = useState<Record<string, { amount: string, deduction: string }>>({
    'QAR': { amount: '', deduction: '' },
    'SAR': { amount: '', deduction: '' },
    'AED': { amount: '', deduction: '' },
    'OMR': { amount: '', deduction: '' },
    'KWD': { amount: '', deduction: '' },
    'BHD': { amount: '', deduction: '' },
    'USD': { amount: '', deduction: '' },
  });

  const [atmWithdrawal, setAtmWithdrawal] = useState('');

  // Save for later draft key
  const DRAFT_KEY = 'ae_money_receipt_draft';

  // Main Table Rates
  const RATES: Record<string, number> = {
    'QAR': 1,
    'SAR': 0.9,
    'AED': 0.9,
    'OMR': 9,
    'KWD': 10.5,
    'BHD': 9,
    'USD': 0
  };

  // Small Denomination Specific Rates
  const SMALL_RATES: Record<string, number> = {
    'SAR': 0.94,
    'AED': 0.94,
    'OMR': 9.2,
    'KWD': 10.5,
    'BHD': 9.2
  };

  useEffect(() => {
    if (initialData) {
        if (initialData.date) setDate(initialData.date);
        if (initialData.values) setValues(initialData.values);
        if (initialData.atmWithdrawal) setAtmWithdrawal(initialData.atmWithdrawal);
        if (initialData.hiddenCurrencies) setHiddenCurrencies(initialData.hiddenCurrencies);
        if (initialData.selectedDay) setSelectedDay(initialData.selectedDay);
    } else {
        // Load Draft from LocalStorage if available
        try {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.date) setDate(parsed.date);
                if (parsed.values) setValues(parsed.values);
                if (parsed.atmWithdrawal) setAtmWithdrawal(parsed.atmWithdrawal);
                if (parsed.hiddenCurrencies) setHiddenCurrencies(parsed.hiddenCurrencies);
                if (parsed.selectedDay) setSelectedDay(parsed.selectedDay);
            } else {
                const d = new Date(date);
                setSelectedDay(d.toLocaleDateString('ar-EG', { weekday: 'long' }));
            }
        } catch (e) {
            console.error("Failed to load draft", e);
            const d = new Date(date);
            setSelectedDay(d.toLocaleDateString('ar-EG', { weekday: 'long' }));
        }
    }
  }, [initialData]);

  // Update day dropdown when date changes
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const d = new Date(newDate);
    if (!isNaN(d.getTime())) {
        setSelectedDay(d.toLocaleDateString('ar-EG', { weekday: 'long' }));
    }
  };

  const currentDateLabel = useMemo(() => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      return d.toISOString().split('T')[0];
  }, [date]);

  const handleChange = (code: string, field: 'amount' | 'deduction', val: string) => {
    if (/^\d*\.?\d*$/.test(val)) {
        setValues(prev => ({
            ...prev,
            [code]: { ...prev[code], [field]: val }
        }));
    }
  };

  // --- ENTER KEY NAVIGATION LOGIC ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Select all visible inputs with class 'money-input'
      const inputs = Array.from(document.querySelectorAll('.money-input')) as HTMLInputElement[];
      const index = inputs.indexOf(e.currentTarget);
      
      // Focus the next input in the list
      if (index > -1 && index < inputs.length - 1) {
        const nextInput = inputs[index + 1];
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const toggleCurrencyVisibility = (code: string) => {
    setHiddenCurrencies(prev => {
        if (prev.includes(code)) {
            return prev.filter(c => c !== code);
        } else {
            return [...prev, code];
        }
    });
  };

  // --- Logic for Small Denominations (Bottom Table) ---
  const smallDenomData = useMemo(() => {
      let rawTotal = 0;
      const rows = ['SAR', 'AED', 'OMR', 'KWD', 'BHD'].map((code, idx) => {
          const deductionVal = parseFloat(values[code].deduction) || 0;
          const rate = SMALL_RATES[code];
          const qarValRaw = deductionVal * rate;
          rawTotal += qarValRaw;
          
          return {
              id: idx + 1,
              code,
              name: code === 'SAR' ? 'ريال سعودي' : 
                    code === 'AED' ? 'درهم إماراتي' :
                    code === 'OMR' ? 'ريال عماني' :
                    code === 'KWD' ? 'دينار كويتي' : 'دينار بحريني',
              foreignAmount: deductionVal,
              rate: rate,
              qarDisplay: Math.floor(qarValRaw) 
          };
      });
      const totalQAR = Math.round(rawTotal); 
      return { rows, totalQAR };
  }, [values]);


  // --- Logic for Main Table ---
  const calculatedRows = useMemo(() => {
    const rows = Object.keys(values).map(code => {
        const inputAmount = parseFloat(values[code].amount) || 0;
        const deduction = parseFloat(values[code].deduction) || 0;
        const rate = RATES[code];
        
        let netAmount = 0;
        
        if (code === 'QAR') {
            netAmount = inputAmount + smallDenomData.totalQAR;
        } else {
            netAmount = inputAmount - deduction;
        }

        const finalQAR = netAmount * rate;

        return {
            code,
            amount: values[code].amount,
            deduction: values[code].deduction,
            netAmount,
            rate,
            finalQAR,
            isQAR: code === 'QAR'
        };
    });

    return { rows };
  }, [values, smallDenomData.totalQAR]);

  const grandTotalQAR = calculatedRows.rows.reduce((sum, row) => sum + row.finalQAR, 0);
  const atmAmount = parseFloat(atmWithdrawal) || 0;
  const finalGrandTotal = grandTotalQAR + atmAmount;
  
  const handlePrint = () => printElement('printable-form');

  const handleCopyForWord = () => {
    const originalNode = document.getElementById('word-copy-target');
    if (originalNode) {
        const clone = originalNode.cloneNode(true) as HTMLElement;
        
        // Remove Hide Buttons from Clone
        const noCopyEls = clone.querySelectorAll('.no-copy');
        noCopyEls.forEach(el => el.remove());

        // Force styles for Word compatibility
        clone.style.backgroundColor = 'white';
        clone.style.color = 'black';
        clone.style.width = '750px'; 
        
        clone.style.position = 'fixed';
        clone.style.top = '-10000px'; 
        clone.style.left = '-10000px';
        clone.style.zIndex = '-1000';
        
        document.body.appendChild(clone);

        const range = document.createRange();
        range.selectNode(clone);
        const selection = window.getSelection();
        
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    alert(lang === 'ar' ? 'تم نسخ الجدول بنجاح.' : 'Table copied successfully.');
                } else {
                    alert('Copy failed.');
                }
            } catch (err) {
                console.error('Copy error', err);
                alert('Copy failed');
            }
            selection.removeAllRanges();
        }
        document.body.removeChild(clone);
    } else {
        alert('Element not found');
    }
  };

  const handleSaveDraft = () => {
    try {
        const draftData = { date, values, atmWithdrawal, hiddenCurrencies, selectedDay };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        alert(lang === 'ar' ? 'تم حفظ المسودة بنجاح' : 'Draft saved successfully');
    } catch (e) {
        console.error("Failed to save draft", e);
        alert(lang === 'ar' ? 'فشل حفظ المسودة' : 'Failed to save draft');
    }
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'MoneyReceiptForm',
            title: `Money Receipt - ${currentDateLabel}`,
            date: new Date().toISOString(),
            data: { date, values, atmWithdrawal, hiddenCurrencies, selectedDay }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  const confirmClearData = () => {
    const clearedValues: any = {};
    Object.keys(values).forEach(k => clearedValues[k] = { amount: '', deduction: '' });
    setValues(clearedValues);
    setAtmWithdrawal('');
    setHiddenCurrencies([]);
    setShowClearConfirm(false);
  };

  // **IMPORTANT**: This class 'money-input' is essential for handleKeyDown
  const inputClass = "w-full h-full bg-transparent text-center font-bold text-xl outline-none border-none p-0 focus:bg-yellow-50 transition-colors money-input";

  const weekDaysList = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
            <button onClick={handleSaveDraft} className="bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm text-sm">
                <Save size={18} />
                <span>{lang === 'ar' ? 'حفظ مؤقت' : 'Save Draft'}</span>
            </button>

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

      {/* Hidden Rows Restorer */}
      {hiddenCurrencies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <EyeOff size={16} />
                العملات المخفية (اضغط للاستعادة):
            </span>
            {hiddenCurrencies.map(code => (
                <button 
                    key={code} 
                    onClick={() => toggleCurrencyVisibility(code)}
                    className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 hover:bg-amber-100 flex items-center gap-1 transition-colors"
                >
                    <Eye size={12} />
                    {code}
                </button>
            ))}
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
          <div className="flex-1 m-2 border-[4px] border-[#1f497d] p-1 flex flex-col h-full bg-white">
            
            {/* Header */}
            <div className="text-center py-2">
                <h1 className="text-3xl font-extrabold text-black mb-1">ملخص إستلام المبالغ اليومية</h1>
                <h2 className="text-2xl font-bold text-black">منفذ أبو سمرة</h2>
            </div>

            {/* Info Bar */}
            <div className="flex border-[3px] border-[#1f497d] mb-1">
                {/* DATE COLUMN */}
                <div className="w-1/4 border-r-[3px] border-[#1f497d] text-center p-0">
                    <div className="h-12 flex items-center justify-center bg-white border-b border-[#1f497d]">
                        <ProfessionalDatePicker date={date} onChange={handleDateChange} lang={lang} />
                    </div>
                </div>
                {/* DAY COLUMN - DROPDOWN */}
                <div className="w-1/4 border-r-[3px] border-[#1f497d] text-center p-0">
                    <div className="h-12 flex items-center justify-center bg-white border-b border-[#1f497d]">
                        <select 
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            className="w-full h-full text-center font-bold text-2xl bg-white outline-none appearance-none cursor-pointer"
                            dir="rtl"
                        >
                            <option value="">-- اختر --</option>
                            {weekDaysList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
                {/* STATIC COLUMNS */}
                <div className="w-1/4 border-r-[3px] border-[#1f497d] text-center">
                    <div className="bg-white text-black font-bold text-2xl h-12 flex items-center justify-center border-b border-[#1f497d]">
                        عمل يوم
                    </div>
                </div>
                <div className="w-1/4 text-center">
                    <div className="bg-white text-black font-bold text-2xl h-12 flex items-center justify-center border-b border-[#1f497d]">
                        DATE
                    </div>
                </div>
                <div className="w-1/4 text-center border-l-[3px] border-[#1f497d]">
                    <div className="bg-white text-black font-bold text-2xl h-12 flex items-center justify-center border-b border-[#1f497d]">
                        24 ساعة
                    </div>
                </div>
            </div>

            {/* Main Table Header */}
            <div className="flex border-[3px] border-[#1f497d] bg-white text-center text-sm font-bold">
                <div className="w-[16%] py-2 border-r border-[#1f497d]">المبلغ بالقطري</div>
                <div className="w-[10%] py-2 border-r border-[#1f497d]">سعر<br/>التحويل</div>
                <div className="w-[18%] py-2 border-r border-[#1f497d]">المبلغ بعد التصفية</div>
                <div className="w-[18%] py-2 border-r border-[#1f497d]">خصم العملات الخليجية<br/>الفئة اقل من (100)</div>
                <div className="w-[18%] py-2 border-r border-[#1f497d]">إجمالي المبلغ</div>
                <div className="w-[20%] py-2">العملة</div>
            </div>

            {/* Main Table Rows */}
            <div className="border-[3px] border-t-0 border-[#1f497d]">
                {calculatedRows.rows.map((row) => {
                    if (hiddenCurrencies.includes(row.code)) return null;
                    return (
                        <div key={row.code} className="flex border-b border-[#1f497d] h-12 group relative hover:bg-blue-50 transition-colors">
                            <div className="w-[16%] flex items-center justify-center font-bold text-xl border-r border-[#1f497d] bg-white">
                                {row.finalQAR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="w-[10%] flex items-center justify-center font-bold text-xl border-r border-[#1f497d] bg-white">
                                {row.code === 'QAR' ? 'QAR 1' : row.rate}
                            </div>
                            <div className="w-[18%] flex items-center justify-center font-bold text-xl border-r border-[#1f497d] bg-white">
                                {row.code} {row.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {/* Deduction (Input / Display) */}
                            <div className="w-[18%] border-r border-[#1f497d] p-0 relative">
                                {row.isQAR ? (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-xl bg-gray-50">
                                        QAR {smallDenomData.totalQAR.toLocaleString()}
                                    </div>
                                ) : (
                                    <input 
                                        type="text" 
                                        value={row.deduction}
                                        onChange={(e) => handleChange(row.code, 'deduction', e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className={inputClass}
                                        placeholder={row.code + " 0.00"}
                                    />
                                )}
                            </div>
                            {/* Total Amount Input */}
                            <div className="w-[18%] border-r border-[#1f497d] p-0">
                                <input 
                                    type="text" 
                                    value={row.amount}
                                    onChange={(e) => handleChange(row.code, 'amount', e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={inputClass}
                                    placeholder={row.code + " 0.00"}
                                />
                            </div>
                            {/* Currency Name + Hide Button */}
                            <div className="w-[20%] flex items-center justify-center font-bold text-xl bg-white relative group-hover:bg-blue-50">
                                {(() => {
                                    switch(row.code) {
                                        case 'QAR': return 'ريال قطري';
                                        case 'SAR': return 'ريال سعودي';
                                        case 'AED': return 'درهم إماراتي';
                                        case 'OMR': return 'ريال عماني';
                                        case 'KWD': return 'دينار كويتي';
                                        case 'BHD': return 'دينار بحريني';
                                        case 'USD': return 'دولار أمريكي';
                                        default: return row.code;
                                    }
                                })()}
                                {/* Hide Button (Always Visible if not QAR) */}
                                {row.code !== 'QAR' && (
                                    <button 
                                        onClick={() => toggleCurrencyVisibility(row.code)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-all print:hidden"
                                        title="إخفاء هذا الصف"
                                    >
                                        <EyeOff size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Middle Section (Total + Policy) */}
            <div className="flex border-[3px] border-t-0 border-[#1f497d]">
                <div className="w-[16%] bg-gray-500 text-white font-bold text-3xl flex items-center justify-center border-r border-[#1f497d] h-14">
                    {grandTotalQAR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="w-[10%] bg-gray-500 text-white font-bold text-2xl flex items-center justify-center border-r border-[#1f497d]">
                    1
                </div>
                <div className="w-[36%] bg-[#00b050] text-white font-bold text-2xl flex items-center justify-center border-r border-[#1f497d] p-0 relative">
                     <span className="absolute left-4 text-sm opacity-70">QAR</span>
                     {/* ATM Input with Enter key navigation */}
                     <input 
                        type="text" 
                        value={atmWithdrawal} 
                        onChange={(e) => {
                            if (/^\d*\.?\d*$/.test(e.target.value)) setAtmWithdrawal(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full bg-transparent text-center outline-none text-white font-bold placeholder-white/50 text-3xl money-input"
                        placeholder="0"
                     />
                </div>
                <div className="w-[38%] bg-gray-500 text-white font-bold text-xl flex items-center justify-end pr-4">
                    <span className="mr-4 text-white font-bold">( Policy )</span>
                    <span>السحب الآلي</span>
                </div>
            </div>

             {/* New Grand Total Row */}
             <div className="flex border-[3px] border-t-0 border-[#1f497d] bg-[#ffff00]">
                <div className="w-[16%] text-black font-extrabold text-3xl flex items-center justify-center border-r border-[#1f497d] h-14">
                     {finalGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex-1 flex items-center justify-center text-black font-bold text-xl">
                     الاجمالي الكلي = اجمالي المبلغ بالريال القطري + السحب الالي
                </div>
            </div>

            {/* --- NEW BOTTOM BREAKDOWN SECTION WITH WORD COPY SUPPORT --- */}
            <div className="mt-8 relative">
                <div className="absolute top-0 left-0 print:hidden">
                     <button onClick={handleCopyForWord} className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors font-bold border border-blue-200" title="نسخ هذا الجزء فقط للوورد">
                        <Copy size={14} />
                        نسخ هذا الجزء للوورد
                     </button>
                </div>

                <div id="word-copy-target" className="p-4 bg-white" style={{ backgroundColor: 'white', color: 'black' }}>
                    {/* Title & Arrow */}
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '5px', fontFamily: 'Arial, sans-serif' }}>العملات الخليجية الفئة أقل من ( 100 )</h3>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
                            <span style={{ fontSize: '32px', color: '#2563eb', fontWeight: 'bold' }}>&#8595;</span> 
                        </div>
                    </div>

                    {/* Table */}
                    <table style={{ width: '80%', margin: '0 auto', borderCollapse: 'collapse', border: '2px solid black', fontSize: '16px', fontFamily: 'Arial, sans-serif' }} dir="ltr">
                        <tbody>
                            {smallDenomData.rows.map(row => {
                                if (hiddenCurrencies.includes(row.code)) return null;
                                return (
                                    <tr key={row.code} style={{ height: '40px', borderBottom: '1px solid black' }}>
                                        <td style={{ width: '20%', borderRight: '1px solid black', textAlign: 'center', fontWeight: 'bold' }}>QAR {row.qarDisplay}</td>
                                        <td style={{ width: '20%', borderRight: '1px solid black', textAlign: 'center', fontWeight: 'bold' }}>QAR {row.rate.toFixed(4)}</td>
                                        <td style={{ width: '20%', borderRight: '1px solid black', textAlign: 'center', fontWeight: 'bold' }}>{row.code} {row.foreignAmount.toFixed(2)}</td>
                                        <td style={{ width: '20%', borderRight: '1px solid black', textAlign: 'center', fontWeight: 'bold', fontFamily: 'Cairo, sans-serif' }}>{row.name}</td>
                                        {/* ID Column with Flexbox to ensure button visibility */}
                                        <td style={{ width: '20%', borderLeft: '1px solid black', fontWeight: 'bold', height: '40px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '100%', width: '100%' }}>
                                                <span>{row.id}</span>
                                                <button
                                                    onClick={() => toggleCurrencyVisibility(row.code)}
                                                    className="no-copy print:hidden"
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        padding: '2px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#6b7280' // gray-500
                                                    }}
                                                    title="إخفاء"
                                                >
                                                    <EyeOff size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            <tr style={{ height: '45px', borderTop: '2px solid black' }}>
                                <td style={{ backgroundColor: '#ffff00', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', borderRight: '1px solid black' }}>QAR {smallDenomData.totalQAR}</td>
                                <td colSpan={4} style={{ backgroundColor: 'white' }}></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    {/* Footer Strip */}
                    <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse', border: '3px solid #1f497d', fontSize: '16px', fontFamily: 'Arial, sans-serif' }} dir="ltr">
                        <tr style={{ height: '50px' }}>
                            <td style={{ width: '15%', borderRight: '1px solid #1f497d', textAlign: 'center', fontWeight: 'bold' }}>{currentDateLabel}</td>
                            <td style={{ width: '12%', borderRight: '1px solid #1f497d', textAlign: 'center', fontWeight: 'bold', fontFamily: 'Cairo, sans-serif' }}>{selectedDay}</td>
                            <td style={{ width: '30%', borderRight: '1px solid #1f497d', textAlign: 'center', fontWeight: 'bold', fontFamily: 'Cairo, sans-serif' }}>وتضاف للريال القطري لعمل يوم</td>
                            <td style={{ width: '18%', borderRight: '1px solid #1f497d', textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>QAR {smallDenomData.totalQAR}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'Cairo, sans-serif' }}>يخصم من العهدة مبلغ وقدره</td>
                        </tr>
                    </table>

                    {/* Signature */}
                    <div style={{ marginTop: '25px', textAlign: 'left', direction: 'ltr' }}>
                        <span style={{ backgroundColor: '#bfbfbf', padding: '5px 15px', fontWeight: 'bold', fontSize: '1.25rem', fontFamily: 'Cairo, sans-serif', display: 'inline-block' }}>
                            مسئول الشفت / محمد السباعي
                        </span>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyReceiptForm;
