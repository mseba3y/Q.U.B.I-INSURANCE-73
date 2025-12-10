
import React, { useState, useEffect, useMemo } from 'react';
import { SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Upload, Image as ImageIcon, Save, Calendar, Clock } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface CustodyFormProps {
  lang: 'en' | 'ar';
  logoUrl?: string;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
}

const CustodyForm: React.FC<CustodyFormProps> = ({ lang, logoUrl, onLogoUpload, onSaveDocument, initialData }) => {
  const t = translations[lang].custody;
  const [logoSize, setLogoSize] = useState(100);
  
  // States
  const [locationType, setLocationType] = useState<string>('كابينة'); // 'كابينة' or 'الشحن'
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [cabinNo, setCabinNo] = useState('1');
  const [duration, setDuration] = useState<number>(30); // Default to 30 days as requested

  useEffect(() => {
    if (initialData) {
        if (initialData.locationType) setLocationType(initialData.locationType);
        if (initialData.startDate) setStartDate(initialData.startDate);
        if (initialData.cabinNo) setCabinNo(initialData.cabinNo);
        if (initialData.duration) setDuration(initialData.duration);
    }
  }, [initialData]);

  // Generate days based on start date and duration
  const dates = useMemo(() => {
    const arr = [];
    const start = startDate ? new Date(startDate) : new Date();
    
    for (let i = 0; i < duration; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        arr.push(d);
    }
    return arr;
  }, [startDate, duration]);

  const getAmountsText = () => {
    if (locationType === 'كابينة') {
        return "500 ريال قطري + 500 ريال سعودي + 500 درهم إماراتي";
    } else {
        return "1000 ريال قطري + 1000 ريال سعودي + 1000 درهم إماراتي";
    }
  };

  const getLabelText = () => {
      return locationType === 'الشحن' ? 'عهدة' : 'كابينة';
  };

  const handlePrint = () => {
    printElement('printable-form');
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'CustodyForm',
            title: `${locationType} - ${locationType === 'كابينة' ? cabinNo : 'General'} (${duration} days)`,
            date: new Date().toISOString(),
            data: { locationType, startDate, cabinNo, duration }
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
        
        <div className="flex flex-wrap items-center gap-3">
            {/* Duration Selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
               <Clock size={18} className="text-indigo-500" />
               <select 
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="bg-transparent border-none outline-none font-bold text-slate-800 dark:text-white text-sm cursor-pointer"
               >
                  <option value={7}>أسبوع (7 أيام)</option>
                  <option value={30}>شهر (30 يوم)</option>
               </select>
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl relative">
               <Calendar size={18} className="text-indigo-500" />
               <span className="text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">تاريخ أول يوم:</span>
               <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none outline-none font-bold text-slate-800 dark:text-white text-sm cursor-pointer min-w-[130px] font-mono"
               />
            </div>

            <button onClick={handleSaveToArchive} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm text-sm">
                <Save size={18} className="text-indigo-600" />
                <span>{t.saveToArchive}</span>
            </button>
            
            <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 font-bold transition-all text-sm">
                <Printer size={18} />
                <span>{t.print}</span>
            </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 md:p-8 rounded-2xl overflow-x-auto flex justify-center">
        <div 
          id="printable-form"
          className="bg-white text-black shadow-xl relative box-border"
          style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Times New Roman', serif" }} // A4 Portrait
          dir="rtl"
        >
          {/* Professional Outer Frame */}
          <div className="flex-1 m-2 border-[3px] border-black p-4 flex flex-col h-full">

            {/* Main Table - Integrated Header for Printing */}
            <table className="w-full border-collapse border border-black text-center text-sm font-bold table-fixed">
                <thead className="print:table-header-group">
                    {/* Header Row - Spanning all columns to repeat on print */}
                    <tr>
                        <td colSpan={4} className="p-0 border border-black">
                            <div className="flex h-32">
                                {/* Logo Section (Right in RTL) */}
                                <div className="w-1/4 border-l border-black p-2 flex items-center justify-center relative">
                                    <div className="relative group w-full h-full flex items-center justify-center">
                                        {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px` }} className="object-contain max-h-28" />
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
                                        <div className="absolute -bottom-6 w-24 print:hidden z-10">
                                        <input type="range" min="50" max="150" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer" />
                                        </div>
                                    )}
                                </div>

                                {/* Titles */}
                                <div className="flex-1 flex flex-col">
                                    <div className="border-b border-black p-1 text-center bg-gray-50 h-1/4 flex items-center justify-center">
                                        <h2 className="text-lg font-bold">المكتب القطري الموحد للتأمين <span className="text-xs font-normal">ذ.م.م</span></h2>
                                    </div>
                                    <div className="border-b border-black p-1 text-center h-1/4 flex items-center justify-center">
                                        <h3 className="text-lg font-bold">استلام وتسليم العهدة المالية للكابينة وماكنة السحب الآلي ATM</h3>
                                    </div>
                                    <div className="flex-1 flex h-2/4">
                                        <div className="flex-1 border-l border-black p-2 flex items-center justify-center text-center font-bold text-sm">
                                            {getAmountsText()}
                                        </div>
                                        <div className="w-48 flex">
                                            {/* Cabin/Custody Number */}
                                            <div className="w-20 border-l border-black flex items-center justify-center bg-white relative">
                                                {locationType === 'كابينة' ? (
                                                    <select 
                                                        value={cabinNo}
                                                        onChange={(e) => setCabinNo(e.target.value)}
                                                        className="w-full h-full text-center font-bold text-4xl bg-transparent outline-none appearance-none cursor-pointer p-0 m-0"
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                                                    </select>
                                                ) : (
                                                    <div className="w-full h-full bg-white"></div>
                                                )}
                                            </div>
                                            {/* Label */}
                                            <div className="flex-1 flex flex-col justify-center bg-gray-50 border-l border-black">
                                                <div className="text-center font-bold text-lg border-b border-black h-1/2 flex items-center justify-center">
                                                    {getLabelText()}
                                                </div>
                                                <div className="h-1/2 relative">
                                                    <select 
                                                        value={locationType}
                                                        onChange={(e) => setLocationType(e.target.value)}
                                                        className="w-full h-full text-center font-bold text-sm bg-transparent outline-none appearance-none cursor-pointer p-0 m-0"
                                                    >
                                                        <option value="كابينة">كابينة</option>
                                                        <option value="الشحن">الشحن</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>

                    {/* Column Headers */}
                    <tr className="bg-gray-50">
                        <th rowSpan={2} className="border border-black p-1 w-12 text-base align-middle">الرقم</th>
                        <th rowSpan={2} className="border border-black p-1 w-24 text-base align-middle">اليوم</th>
                        <th colSpan={2} className="border border-black p-1 text-lg">ختم الموظف المستلم</th>
                    </tr>
                    <tr className="bg-gray-50">
                        <th className="border border-black p-1 text-base h-8">صباحي</th>
                        <th className="border border-black p-1 text-base h-8">مسائي</th>
                    </tr>
                </thead>
                <tbody>
                    {dates.map((date, index) => {
                        // Date formatted as DD/MM/YYYY (e.g. 16/08/2025)
                        const dateStr = date ? date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
                        // Day name in Arabic (e.g. السبت)
                        const dayName = date ? date.toLocaleDateString('ar-EG', { weekday: 'long' }) : '';
                        
                        return (
                            <tr key={index} className="break-inside-avoid page-break-inside-avoid">
                                {/* Index */}
                                <td className="border border-black p-1 text-xl font-bold w-12 bg-white">{index + 1}</td>

                                {/* Date & Day - VERTICAL SPLIT */}
                                <td className="border border-black p-0 w-24 bg-white align-middle relative h-40">
                                    <div className="flex h-full w-full">
                                        {/* Right Half: Day Name (Rotated) */}
                                        <div className="w-1/2 h-full border-l border-black flex items-center justify-center bg-white">
                                            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-lg font-bold whitespace-nowrap">
                                                {dayName}
                                            </div>
                                        </div>
                                        
                                        {/* Left Half: Date (Rotated) */}
                                        <div className="w-1/2 h-full flex items-center justify-center bg-white">
                                            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-sm font-bold font-mono whitespace-nowrap" dir="ltr">
                                                {dateStr}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Cell: Morning (Active) */}
                                <td className="border border-black p-0 h-40 relative">
                                    <input type="text" className="w-full h-full bg-transparent text-center font-bold text-lg" />
                                </td>

                                {/* Cell: Evening (Active) */}
                                <td className="border border-black p-0 h-40 relative">
                                    <input type="text" className="w-full h-full bg-transparent text-center font-bold text-lg" />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CustodyForm;
