
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Upload, Image as ImageIcon, Save, Calendar, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface CashFormProps {
  lang: 'en' | 'ar';
  logoUrl?: string;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
}

// Currency configurations (Sorted High to Low: 500 -> 1)
const CURRENCIES = [
  { code: 'QAR', name: 'ريال قطري', denoms: [500, 200, 100, 50, 20, 10, 5, 1] },
  { code: 'SAR', name: 'ريال سعودي', denoms: [500, 200, 100, 50, 20, 10, 5, 1] },
  { code: 'AED', name: 'درهم إماراتي', denoms: [1000, 500, 200, 100, 50, 20, 10, 5] },
  { code: 'KWD', name: 'دينار كويتي', denoms: [20, 10, 5, 1, 0.5, 0.25] },
  { code: 'BHD', name: 'دينار بحريني', denoms: [20, 10, 5, 1, 0.5] },
  { code: 'OMR', name: 'ريال عماني', denoms: [50, 20, 10, 5, 1, 0.5, 0.1] }
];

// Exchange Rates
const EXCHANGE_RATES: Record<string, number> = {
  'QAR': 1.00,
  'SAR': 0.90,
  'AED': 0.90,
  'OMR': 9.00,
  'KWD': 10.50,
  'BHD': 9.00
};

// Helper function to calculate total for a currency
const calculateCurrencyTotal = (currencyCode: string, counts: Record<string, Record<string, string>>) => {
  const currCounts = counts[currencyCode];
  if (!currCounts) return 0;
  
  let total = 0;
  Object.entries(currCounts).forEach(([denomStr, countStr]) => {
    const denom = parseFloat(String(denomStr));
    const count = parseInt(String(countStr)) || 0;
    total += denom * count;
  });
  return total;
};

// --- Extracted Component for Performance ---
const CurrencyTable = ({ 
  currency, 
  counts, 
  onCountChange,
  t 
}: { 
  currency: typeof CURRENCIES[0], 
  counts: Record<string, Record<string, string>>, 
  onCountChange: (code: string, denom: number, val: string) => void,
  t: any
}) => {
  const total = calculateCurrencyTotal(currency.code, counts);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('.cash-count-input')) as HTMLInputElement[];
      const index = inputs.indexOf(e.currentTarget);
      if (index > -1 && index < inputs.length - 1) {
        const nextInput = inputs[index + 1];
        nextInput.focus();
        nextInput.select();
      }
    }
  };
  
  return (
    <div className="border-[3px] border-black flex flex-col h-full bg-white text-center shadow-sm">
      {/* Header - Green */}
      <div className="bg-[#c6e0b4] py-2 font-bold text-xl border-b-2 border-black">
        {currency.name}
      </div>
      
      {/* Subheader - Blue */}
      <div className="bg-[#1f497d] text-white flex border-b-2 border-black text-sm font-bold">
        <div className="flex-1 py-1 border-r border-white">{currency.code}</div>
        <div className="flex-1 py-1 border-r border-white">COUNT {currency.code}</div>
        <div className="w-16 py-1">{t.denom}</div>
      </div>

      {/* Rows */}
      <div className="flex-1">
        {currency.denoms.map((denom, idx) => {
          const countStr = counts[currency.code]?.[String(denom)] || "";
          const count = parseInt(countStr) || 0;
          const value = count * denom;
          
          return (
            <div key={denom} className={`flex border-b border-black last:border-b-0 text-sm font-bold ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex-1 py-1 border-r border-black flex items-center justify-center">
                {value > 0 ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : "0"}
              </div>
              <div className="flex-1 p-0 border-r border-black bg-blue-50/30 relative">
                <input 
                  type="text" 
                  value={countStr}
                  onChange={(e) => onCountChange(currency.code, denom, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full text-center bg-transparent outline-none font-bold text-black absolute inset-0 cash-count-input"
                />
              </div>
              <div className="w-16 py-1 bg-[#1f497d] text-white">
                {denom}
              </div>
            </div>
          );
        })}
        {/* Fill empty space if needed */}
        {currency.denoms.length < 8 && (
           <div className="flex-1 bg-white"></div>
        )}
      </div>

      {/* Total - Yellow */}
      <div className="flex border-t-[3px] border-black font-bold text-lg">
        <div className="flex-1 py-2 text-left pl-2 text-base">
           {currency.code} {total.toLocaleString(undefined, { maximumFractionDigits: 3 })}
        </div>
        <div className="flex-1 py-2 bg-gray-200 border-l border-black text-right pr-2 text-base">
           {currency.code} 0
        </div>
        <div className="w-16 py-2 bg-[#ffc000] border-l border-black text-xs flex items-center justify-center">
           TOTAL
        </div>
      </div>
    </div>
  );
};

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

  useEffect(() => {
    setCurrentMonth(validDate);
  }, [validDate.getMonth(), validDate.getFullYear()]);

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
      const dayName = validDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
      const day = String(validDate.getDate()).padStart(2, '0');
      const month = String(validDate.getMonth() + 1).padStart(2, '0');
      const year = validDate.getFullYear();
      return `${dayName} ${day}/${month}/${year}`;
  }, [validDate, lang]);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 hover:bg-white dark:hover:bg-slate-700 transition-all hover:shadow-md min-w-[240px] group text-right"
      >
        <Calendar size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-bold text-slate-800 dark:text-white mx-auto tracking-wide">
           {formattedDisplay}
        </span>
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 z-50 w-80 animate-in zoom-in-95 ${isRTL ? 'right-0' : 'left-0'}`}>
          <div className="flex justify-between items-center mb-4">
            <button 
                type="button" 
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight size={20} className={isRTL ? "" : "rotate-180"} />
            </button>
            <span className="font-bold text-slate-800 dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button 
                type="button" 
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft size={20} className={isRTL ? "" : "rotate-180"} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {weekDays.map(d => (
              <span key={d} className="text-xs text-slate-400 font-bold uppercase">{d}</span>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedStartDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const isSelected = validDate.getDate() === day && 
                                  validDate.getMonth() === currentMonth.getMonth() &&
                                  validDate.getFullYear() === currentMonth.getFullYear();
               return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`h-9 w-9 rounded-lg text-sm flex items-center justify-center transition-all ${
                    isSelected 
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {day}
                </button>
               );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const CashForm: React.FC<CashFormProps> = ({ lang, logoUrl, onLogoUpload, onSaveDocument, initialData }) => {
  const t = translations[lang].cash;
  const [logoSize, setLogoSize] = useState(100);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [counts, setCounts] = useState<Record<string, Record<string, string>>>({});
  const [atmTotal, setAtmTotal] = useState<string>('');

  const currentDateLabel = useMemo(() => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      const dayName = d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
      return `${dayName} ${d.toLocaleDateString('en-GB')}`;
  }, [date, lang]);

  useEffect(() => {
    if (initialData) {
        if (initialData.counts) setCounts(initialData.counts);
        if (initialData.date) setDate(initialData.date);
        if (initialData.atmTotal) setAtmTotal(initialData.atmTotal);
    } else {
      const init: Record<string, Record<string, string>> = {};
      CURRENCIES.forEach(curr => {
        init[curr.code] = {};
        curr.denoms.forEach(d => {
          init[curr.code][String(d)] = "";
        });
      });
      setCounts(init);
    }
  }, [initialData]);

  const handleCountChange = (currencyCode: string, denom: number, value: string) => {
    if (/^\d*$/.test(value)) {
      setCounts(prev => ({
        ...prev,
        [currencyCode]: {
          ...prev[currencyCode],
          [String(denom)]: value
        }
      }));
    }
  };

  const handlePrint = () => {
    printElement('printable-form');
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'CashForm',
            title: `Cash Form - ${currentDateLabel}`,
            date: new Date().toISOString(),
            data: { date, counts, atmTotal }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  const requestClearData = () => {
    setShowClearConfirm(true);
  };

  const confirmClearData = () => {
    const init: Record<string, Record<string, string>> = {};
    CURRENCIES.forEach(curr => {
        init[curr.code] = {};
        curr.denoms.forEach(d => {
        init[curr.code][String(d)] = "";
        });
    });
    setCounts(init);
    setAtmTotal('');
    setShowClearConfirm(false);
  };

  const grandTotalQAR = useMemo(() => {
    let total = 0;
    CURRENCIES.forEach(curr => {
      const nativeVal = calculateCurrencyTotal(curr.code, counts);
      const rate = EXCHANGE_RATES[curr.code] || 0;
      total += (nativeVal * rate);
    });
    return total;
  }, [counts]);

  const totalDailyAmount = useMemo(() => {
      const atm = parseFloat(atmTotal) || 0;
      return grandTotalQAR + atm;
  }, [grandTotalQAR, atmTotal]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
            <ProfessionalDatePicker date={date} onChange={setDate} lang={lang} />

            <button onClick={requestClearData} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm text-sm">
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
             <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-500">
               <AlertTriangle size={32} />
             </div>
             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{lang === 'ar' ? 'تفريغ البيانات' : 'Clear Data'}</h3>
             <div className="flex gap-3 mt-6">
               <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
               <button onClick={confirmClearData} className="flex-1 px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-xl font-bold">{lang === 'ar' ? 'تفريغ' : 'Clear'}</button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 md:p-8 rounded-2xl overflow-x-auto flex justify-center">
        <div 
          id="printable-form"
          className="bg-white text-black shadow-xl relative box-border"
          style={{ width: '297mm', minHeight: '210mm', fontFamily: "'Times New Roman', serif" }}
          dir="rtl"
        >
          <div className="flex-1 m-2 border-[4px] border-black p-4 flex flex-col h-full">
            
            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-2">
                <div className="text-right w-1/3">
                    <h2 className="text-xl font-bold">المكتب القطري الموحد للتأمين</h2>
                </div>
                <div className="text-center w-1/3">
                    <h1 className="text-3xl font-extrabold bg-yellow-300 inline-block px-4 py-1 border border-black rounded">نموذج الكاش</h1>
                    <p className="mt-2 font-bold dir-ltr text-lg">{currentDateLabel}</p>
                </div>
                <div className="text-left w-1/3 flex justify-end items-center print:hidden">
                    <div className="relative group inline-block">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px` }} className="object-contain max-h-20" />
                        ) : (
                            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 font-bold cursor-pointer hover:bg-gray-50">
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
                        <div className="ml-2 w-20 print:hidden">
                            <input type="range" min="50" max="150" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer" />
                        </div>
                    )}
                </div>
                {/* Print Only Logo */}
                <div className="hidden print:flex w-1/3 justify-end items-center">
                    {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px` }} className="object-contain max-h-20" />}
                </div>
            </div>

            {/* --- GRAND TOTALS & ATM --- */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Currency Total */}
                <div className="flex flex-col items-center bg-gray-50 border-[3px] border-black p-4 rounded-xl shadow-sm">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">إجمالي العملات (QAR)</h3>
                    <div className="text-3xl font-extrabold text-black bg-[#ffc000] px-4 py-2 border-2 border-black rounded w-full text-center">
                        {grandTotalQAR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                {/* 2. ATM Total (Editable) */}
                <div className="flex flex-col items-center bg-blue-50 border-[3px] border-black p-4 rounded-xl shadow-sm">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">إجمالي السحب الآلي ATM</h3>
                    <input 
                        type="text" 
                        value={atmTotal}
                        onChange={(e) => {
                            if (/^\d*\.?\d*$/.test(e.target.value)) setAtmTotal(e.target.value);
                        }}
                        className="text-3xl font-extrabold text-black bg-white px-4 py-2 border-2 border-black rounded w-full text-center outline-none focus:ring-4 focus:ring-blue-500/20"
                        placeholder="0.00"
                    />
                </div>

                {/* 3. Total Daily Amount */}
                <div className="flex flex-col items-center bg-green-50 border-[3px] border-black p-4 rounded-xl shadow-sm">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">الإجمالي الكلي لليوم</h3>
                    <div className="text-3xl font-extrabold text-white bg-green-600 px-4 py-2 border-2 border-black rounded w-full text-center shadow-md">
                        {totalDailyAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

            </div>

            {/* Currency Grids */}
            <div className="grid grid-cols-3 gap-4 flex-1">
                {CURRENCIES.map(curr => (
                    <div key={curr.code} className="h-full">
                        <CurrencyTable 
                          currency={curr} 
                          counts={counts}
                          onCountChange={handleCountChange}
                          t={t}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-6 border-t-2 border-black pt-4 px-8 font-bold text-2xl text-center">
                <p>مسئول الشفت : محمد السباعي</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CashForm;
