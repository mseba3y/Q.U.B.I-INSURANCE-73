
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Save, Download, ChevronLeft, ChevronRight, Calendar, Upload, Image as ImageIcon } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface BankDepositG4FormProps {
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
  lang,
  transparent = false
}: { 
  date: string; 
  onChange: (d: string) => void; 
  lang: 'en' | 'ar';
  transparent?: boolean;
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
    const dayName = validDate.toLocaleDateString('ar-EG', { weekday: 'long' });
    const datePart = validDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }); 
    return `${dayName} ${datePart}`;
  }, [validDate]);

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-2 h-full w-full font-bold text-lg transition-colors p-1 ${transparent ? 'bg-transparent hover:bg-black/5' : 'bg-transparent hover:bg-black/5'}`}
      >
        <span className="truncate" dir="rtl">{formattedDisplay}</span>
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

const BankDepositG4Form: React.FC<BankDepositG4FormProps> = ({ lang, onSaveDocument, initialData, logoUrl, onLogoUpload }) => {
  const t = translations[lang].bankDepositG4;
  const [logoSize, setLogoSize] = useState(100);
  const [dateDeposit, setDateDeposit] = useState(new Date().toISOString().split('T')[0]);
  const [closingDay, setClosingDay] = useState(new Date().toISOString().split('T')[0]);
  
  const [amounts, setAmounts] = useState<Record<string, string>>({
    'Qatari Riyal': '0', 'Saudi Riyal': '0', 'Emirates Dirham': '0', 'Omani Riyal': '0', 'Kuwaiti Dinar': '0', 'Bahraini Dinar': '0', 'Dollar': '0.00'
  });

  const weekDaysList = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const [selectedDayName, setSelectedDayName] = useState(weekDaysList[new Date().getDay() === 6 ? 0 : new Date().getDay() + 1]);

  const DRAFT_KEY = 'ae_bank_deposit_g4_draft';

  useEffect(() => {
    const d = new Date(closingDay);
    if (!isNaN(d.getTime())) {
        const dayIdx = d.getDay(); 
        const mappedIdx = dayIdx === 6 ? 0 : dayIdx + 1;
        setSelectedDayName(weekDaysList[mappedIdx]);
    }
  }, [closingDay]);

  // Load data: either initialData (from archive) or draft (from local storage)
  useEffect(() => {
    if (initialData) {
        if (initialData.dateDeposit) setDateDeposit(initialData.dateDeposit);
        if (initialData.closingDay) setClosingDay(initialData.closingDay);
        if (initialData.amounts) setAmounts(initialData.amounts);
        if (initialData.selectedDayName) setSelectedDayName(initialData.selectedDayName);
    } else {
        // Try loading draft
        try {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.dateDeposit) setDateDeposit(parsed.dateDeposit);
                if (parsed.closingDay) setClosingDay(parsed.closingDay);
                if (parsed.amounts) setAmounts(parsed.amounts);
                // selectedDayName updates via closingDay effect
            }
        } catch (e) {
            console.error("Failed to load draft", e);
        }
    }
  }, [initialData]);

  const handleSaveDraft = () => {
    try {
        const draftData = { dateDeposit, closingDay, amounts };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        alert(lang === 'ar' ? 'تم حفظ المسودة بنجاح' : 'Draft saved successfully');
    } catch (e) {
        console.error("Failed to save draft", e);
        alert(lang === 'ar' ? 'فشل حفظ المسودة' : 'Failed to save draft');
    }
  };

  // --- ENTER KEY NAVIGATION ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('.deposit-input')) as HTMLInputElement[];
      const index = inputs.indexOf(e.currentTarget);
      if (index > -1 && index < inputs.length - 1) {
        const nextInput = inputs[index + 1];
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  // --- CUSTOM SINGLE PAGE PRINT HANDLER ---
  const handlePrint = () => {
    const element = document.getElementById('printable-form');
    if (!element) return;

    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input[type="file"], input[type="range"], .print-hidden').forEach(el => el.remove());
    
    // Sync Inputs
    const originalInputs = element.querySelectorAll('input');
    const clonedInputs = clone.querySelectorAll('input');
    originalInputs.forEach((inp, i) => { if (clonedInputs[i]) clonedInputs[i].value = inp.value; });

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="ltr">
            <head>
                <title>Bank Deposit G4</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Inter:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    /* Force Single Page Logic */
                    @page { size: auto; margin: 0; } 
                    body { 
                        font-family: 'Cairo', sans-serif; 
                        margin: 0;
                        padding: 0;
                        height: 100vh;
                        width: 100vw;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        overflow: hidden; /* Prevent multi-page spill */
                    }
                    #printable-form {
                        width: 98% !important;
                        height: 98% !important;
                        max-height: 98vh !important;
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        display: flex;
                        flex-direction: column;
                    }
                    /* Ensure flex containers distribute space */
                    .flex-grow { flex-grow: 1; }
                    
                    input { background: transparent; border: none; outline: none; }
                </style>
            </head>
            <body>${clone.outerHTML}<script>window.onload = function() { window.print(); }</script></body>
            </html>
        `);
        printWindow.document.close();
    }
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({ type: 'BankDepositG4', title: `Bank Deposit G4 - ${dateDeposit}`, date: new Date().toISOString(), data: { dateDeposit, closingDay, amounts, selectedDayName } });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  const loadFromReceipt = () => {
    try {
        const savedDocsStr = localStorage.getItem('ae_archived_documents');
        if (!savedDocsStr) { alert(lang === 'ar' ? 'الأرشيف فارغ.' : 'Archive empty.'); return; }
        const savedDocs: SavedDocument[] = JSON.parse(savedDocsStr);
        const latestReceipt = savedDocs.filter(d => d.type === 'MoneyReceiptForm').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (latestReceipt?.data?.values) {
            const vals = latestReceipt.data.values;
            const parseVal = (v: any) => { const str = String(v || 0).replace(/,/g, ''); return parseFloat(str) || 0; };
            const SMALL_RATES: Record<string, number> = { 'SAR': 0.94, 'AED': 0.94, 'OMR': 9.2, 'KWD': 10.5, 'BHD': 9.2 };
            
            let totalSmallQAR = 0;
            ['SAR', 'AED', 'OMR', 'KWD', 'BHD'].forEach(c => { if(vals[c]) totalSmallQAR += parseVal(vals[c].deduction) * (SMALL_RATES[c] || 0); });
            
            const getNet = (c: string) => {
                const amt = parseVal(vals[c]?.amount), ded = parseVal(vals[c]?.deduction);
                return (c === 'QAR' ? amt + Math.round(totalSmallQAR) : amt - ded).toLocaleString('en-US');
            };

            setAmounts({ 'Qatari Riyal': getNet('QAR'), 'Saudi Riyal': getNet('SAR'), 'Emirates Dirham': getNet('AED'), 'Omani Riyal': getNet('OMR'), 'Kuwaiti Dinar': getNet('KWD'), 'Bahraini Dinar': getNet('BHD'), 'Dollar': getNet('USD') });
            if (latestReceipt.data.date) setClosingDay(latestReceipt.data.date);
            alert(lang === 'ar' ? 'تم تحميل البيانات.' : 'Data loaded.');
        } else {
            alert(lang === 'ar' ? 'لم يتم العثور على بيانات.' : 'No data found.');
        }
    } catch (e) { console.error(e); alert('Error.'); }
  };

  const handleAmountChange = (key: string, val: string) => setAmounts(prev => ({ ...prev, [key]: val }));
  const headerTitle = `إيداع عمل يوم ${selectedDayName}`;

  return (
    <div className="animate-fade-in space-y-6">
       <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div><h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2><p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t.subtitle}</p></div>
        <div className="flex items-center gap-3">
            <button onClick={loadFromReceipt} className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm text-sm"><Download size={18} /><span>{t.loadFromReceipt}</span></button>
            <button onClick={handleSaveDraft} className="bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm text-sm"><Save size={18} /><span>{lang === 'ar' ? 'حفظ مؤقت' : 'Save Draft'}</span></button>
            <button onClick={handleSaveToArchive} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm text-sm"><Save size={18} /><span>{t.saveToArchive}</span></button>
            <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg font-bold transition-all text-sm"><Printer size={18} /><span>{t.print}</span></button>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 md:p-8 rounded-2xl overflow-x-auto flex justify-center">
        <div id="printable-form" className="bg-white text-black shadow-xl relative box-border flex flex-col" style={{ width: '210mm', minHeight: 'auto', fontFamily: "'Arial', sans-serif" }} dir="ltr">
            <div className="flex-1 m-4 p-6 border-4 border-double border-gray-800 flex flex-col bg-white print:m-0 print:border-2 print:p-2 print:h-full">
                <div className="flex justify-between items-start mb-2 border-b-2 border-gray-800 pb-2">
                    <div className="w-1/3 flex flex-col items-start justify-center pl-2 pt-1">
                        <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-0.5">Closing Day Date</span>
                        <div className="border-b border-gray-400 pb-0.5 w-40"><ProfessionalDatePicker date={closingDay} onChange={setClosingDay} lang={lang} transparent /></div>
                    </div>
                    <div className="w-1/3 text-center pt-1">
                        <h2 className="text-lg font-extrabold text-black uppercase tracking-widest border-2 border-black p-1 bg-gray-50 inline-block whitespace-nowrap" dir="rtl">{headerTitle}</h2>
                    </div>
                    <div className="w-1/3 flex flex-col items-end pr-2">
                        <h3 className="text-lg font-black text-black mb-1" dir="rtl">إيداع البنك G4</h3>
                        <div className="relative group">
                            {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px` }} className="object-contain max-h-16" /> : <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 font-bold cursor-pointer hover:bg-gray-50"><ImageIcon size={16} className="mb-1" /><span>Logo</span></div>}
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded-lg print-hidden"><Upload className="text-white" /><input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} /></label>
                        </div>
                         {logoUrl && <div className="mt-1 w-20 print:hidden"><input type="range" min="50" max="150" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer" /></div>}
                    </div>
                </div>

                <div className="bg-gray-100 border-2 border-gray-800 text-center py-2 mb-4 shadow-sm rounded-lg">
                    <span className="font-black text-xl tracking-widest text-gray-800">0229/0170677-9/001/0010/000</span>
                    <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 tracking-widest">Account Number</div>
                </div>

                <div className="grid grid-cols-1 gap-0 mb-4 border-2 border-gray-800">
                    <div className="flex border-b-2 border-gray-800">
                        <div className="w-1/3 bg-gray-200 flex items-center justify-center border-r-2 border-gray-800 p-1"><span className="font-bold text-base uppercase tracking-wide">Date Deposit</span></div>
                        <div className="w-2/3 p-1 bg-white flex items-center justify-center"><ProfessionalDatePicker date={dateDeposit} onChange={setDateDeposit} lang={lang} /></div>
                    </div>
                    <div className="flex">
                        <div className="w-1/3 bg-gray-200 flex items-center justify-center border-r-2 border-gray-800 p-1"><span className="font-bold text-base uppercase tracking-wide">Closing Day</span></div>
                        <div className="w-2/3 p-1 bg-white flex items-center justify-center"><ProfessionalDatePicker date={closingDay} onChange={setClosingDay} lang={lang} /></div>
                    </div>
                </div>

                {/* Amounts Table - Flex Grow for Auto Fit */}
                <div className="border-2 border-gray-800 mb-4 flex-grow flex flex-col">
                    <div className="flex bg-gray-800 text-white">
                        <div className="w-3/5 p-2 font-bold text-base text-center border-r-2 border-white uppercase tracking-wider">Currency Type</div>
                        <div className="w-2/5 p-2 font-bold text-base text-center uppercase tracking-wider">Amount</div>
                    </div>
                    <div className="flex-1 flex flex-col">
                        {Object.keys(amounts).map((currency, idx) => (
                            <div key={currency} className={`flex border-b border-gray-300 last:border-b-0 flex-grow items-stretch ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <div className="w-3/5 p-2 font-bold text-base flex items-center justify-center border-r-2 border-gray-800 text-gray-800 uppercase tracking-wide">{currency}</div>
                                <div className="w-2/5 relative flex items-center justify-center p-1">
                                    <span className="absolute left-4 text-[10px] font-bold text-gray-400">
                                        {currency === 'Qatari Riyal' ? 'QAR' : currency === 'Saudi Riyal' ? 'SAR' : currency === 'Emirates Dirham' ? 'AED' : currency === 'Omani Riyal' ? 'OMR' : currency === 'Kuwaiti Dinar' ? 'KWD' : currency === 'Bahraini Dinar' ? 'BHD' : '$'}
                                    </span>
                                    <input 
                                        type="text" 
                                        value={amounts[currency]} 
                                        onChange={(e) => handleAmountChange(currency, e.target.value)} 
                                        onKeyDown={handleKeyDown} 
                                        className="w-full h-full text-center font-bold text-xl outline-none bg-transparent deposit-input" 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto flex justify-start pt-2">
                     <div className="text-center px-4">
                        <div className="mb-1 font-bold text-base text-black">مسئول الشفت</div>
                        <div className="font-bold text-lg border-b-2 border-black pb-0.5 min-w-[180px]" dir="rtl">محمد السباعي</div>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BankDepositG4Form;
