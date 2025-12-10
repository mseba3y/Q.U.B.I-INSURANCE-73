
import React, { useState, useEffect } from 'react';
import { Employee, SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Upload, Image as ImageIcon, Plus, Trash2, Save, RotateCcw, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface OvertimeFormProps {
  employees: Employee[];
  lang: 'en' | 'ar';
  logoUrl?: string;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
}

interface OvertimeRow {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftType: string;
  basicSalary: string;
  days: string[];
  totalHours: number;
  totalAmount: number;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const parseAnyNumber = (str: any): number => {
  if (str === null || str === undefined) return 0;
  const stringVal = String(str);
  const standardStr = stringVal.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const cleanStr = standardStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

// Helper Input
const TableInput = ({ value, onChange, className="", readOnly=false, placeholder="" }: any) => (
  <input 
    type="text" 
    value={value || ''} 
    onChange={onChange}
    readOnly={readOnly}
    placeholder={placeholder}
    dir="auto" 
    className={`w-full h-full bg-transparent text-center outline-none border-none p-0.5 font-bold text-slate-800 ${className}`} 
  />
);

const OvertimeForm: React.FC<OvertimeFormProps> = ({ employees, lang, logoUrl, onLogoUpload, onSaveDocument, initialData }) => {
  const t = translations[lang].overtime;
  const [logoSize, setLogoSize] = useState(100);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // State for toggling the Total Amount Column (Default: Visible)
  const [showTotalAmount, setShowTotalAmount] = useState(true);

  const STORAGE_KEY = 'ae_overtime_data';

  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
         const parsed = JSON.parse(saved);
         if (parsed && typeof parsed === 'object') {
            return parsed;
         }
      }
    } catch (e) {
      console.error("Failed to load overtime data", e);
    }
    return null;
  };

  const savedData = loadSavedData();

  const [fromDate, setFromDate] = useState(savedData?.fromDate || "");
  const [toDate, setToDate] = useState(savedData?.toDate || "");
  const [periodText, setPeriodText] = useState(savedData?.periodText || "..................");
  const [dates, setDates] = useState<string[]>(Array.isArray(savedData?.dates) ? savedData.dates : Array(7).fill(""));
  const createDefaultRow = (daysLength: number): OvertimeRow => ({ 
    id: generateId(), 
    employeeId: '', 
    employeeName: '', 
    shiftType: 'صباحية', 
    basicSalary: '2000', 
    days: Array(daysLength).fill('0'), 
    totalHours: 0, 
    totalAmount: 0 
  });
  const [rows, setRows] = useState<OvertimeRow[]>(Array.isArray(savedData?.rows) ? savedData.rows : [createDefaultRow(7)]);

  // Restore toggle state on mount
  useEffect(() => {
    if (savedData && savedData.showTotalAmount !== undefined) {
        setShowTotalAmount(savedData.showTotalAmount);
    }
  }, []);

  useEffect(() => {
    if (initialData) {
        if (initialData.fromDate) setFromDate(initialData.fromDate);
        if (initialData.toDate) setToDate(initialData.toDate);
        if (initialData.periodText) setPeriodText(initialData.periodText);
        if (Array.isArray(initialData.dates)) setDates(initialData.dates);
        if (Array.isArray(initialData.rows)) setRows(initialData.rows);
        if (initialData.showTotalAmount !== undefined) setShowTotalAmount(initialData.showTotalAmount);
    }
  }, [initialData]);

  const calculateAmount = (salaryStr: string, totalHours: number) => {
     const salary = parseAnyNumber(salaryStr);
     if (salary === 0 || totalHours === 0) return 0;
     const hourlyRate = (salary / 30) / 8;
     const amount = hourlyRate * 1.5 * totalHours;
     return Math.round(amount);
  };

  useEffect(() => {
    if (!fromDate || !toDate) return;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return;

    const newDateHeaders: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
       const formatted = curr.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
       newDateHeaders.push(formatted);
       curr.setDate(curr.getDate() + 1);
    }

    setDates(newDateHeaders);

    setRows(prevRows => prevRows.map(row => {
        // SAFEGUARD: Ensure row.days is an array
        let newDays = Array.isArray(row.days) ? [...row.days] : [];
        const currentLen = newDays.length;
        const targetLen = newDateHeaders.length;

        if (targetLen > currentLen) {
            newDays = [...newDays, ...Array(targetLen - currentLen).fill('0')];
        } else if (targetLen < currentLen) {
            newDays = newDays.slice(0, targetLen);
        }

        const totalHrs = newDays.reduce((acc, curr) => acc + parseAnyNumber(curr), 0);
        const amount = calculateAmount(row.basicSalary, totalHrs);
        return { ...row, days: newDays, totalHours: totalHrs, totalAmount: amount };
    }));

  }, [fromDate, toDate, lang]);

  const handlePrint = () => {
    printElement('printable-form');
  };

  const handleSaveData = () => {
    try {
        const dataToSave = { fromDate, toDate, dates, periodText, rows, showTotalAmount };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        alert(lang === 'ar' ? 'تم حفظ بيانات العمل الإضافي بنجاح!' : 'Overtime data saved successfully!');
    } catch (e) {
        console.error("Storage limit exceeded", e);
        alert(lang === 'ar' ? 'فشل الحفظ: المساحة ممتلئة' : 'Save failed: Storage limit exceeded');
    }
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'Overtime',
            title: `Overtime Sheet (${fromDate} - ${toDate})`,
            date: new Date().toISOString(),
            data: { fromDate, toDate, dates, periodText, rows, showTotalAmount }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  const requestClearData = () => {
    setShowClearConfirm(true);
  };

  const confirmClearData = () => {
    const currentLen = dates.length || 7;
    const newRows = rows.map(row => ({
      ...row,
      days: Array(currentLen).fill('0'),
      totalHours: 0,
      totalAmount: 0
    }));

    setRows(newRows);
    try {
        const dataToSave = { fromDate, toDate, dates, periodText, rows: newRows, showTotalAmount };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) { console.error(e); }
    setShowClearConfirm(false);
  };

  const addRow = () => {
    setRows([...rows, createDefaultRow(dates.length || 7)]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateSalary = (id: string, val: string) => {
    setRows(prevRows => prevRows.map(r => {
      if (r.id === id) {
        const amount = calculateAmount(val, r.totalHours);
        return { ...r, basicSalary: val, totalAmount: amount };
      }
      return r;
    }));
  };

  const updateShift = (id: string, val: string) => {
    setRows(prevRows => prevRows.map(r => r.id === id ? { ...r, shiftType: val } : r));
  };

  const updateDayHour = (rowId: string, dayIndex: number, val: string) => {
    setRows(prevRows => prevRows.map(r => {
      if (r.id === rowId) {
        // SAFEGUARD
        const newDays = Array.isArray(r.days) ? [...r.days] : [];
        newDays[dayIndex] = val;
        const totalHrs = newDays.reduce((acc, curr) => acc + parseAnyNumber(curr), 0);
        const amount = calculateAmount(r.basicSalary, totalHrs);
        return { ...r, days: newDays, totalHours: totalHrs, totalAmount: amount };
      }
      return r;
    }));
  };

  const handleEmployeeSelect = (rowId: string, empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setRows(prevRows => prevRows.map(r => r.id === rowId ? { ...r, employeeId: empId, employeeName: emp.name } : r));
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
        
        <div className="flex flex-wrap items-center gap-3 justify-end">
            {/* Toggle Total Amount Column Button */}
            <button 
                onClick={() => setShowTotalAmount(!showTotalAmount)}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all ${showTotalAmount ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}
                title={showTotalAmount ? "إخفاء عمود الإجمالي" : "إظهار عمود الإجمالي"}
            >
                {showTotalAmount ? <Eye size={18} /> : <EyeOff size={18} />}
                <span className="hidden sm:inline">{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
            </button>

            <button onClick={requestClearData} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all">
                <RotateCcw size={18} />
                <span className="hidden sm:inline">{lang === 'ar' ? 'تفريغ' : 'Clear'}</span>
            </button>
            <button onClick={handleSaveData} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm">
                <Save size={18} className="text-emerald-600" />
                <span>{lang === 'ar' ? 'حفظ البيانات' : 'Save Data'}</span>
            </button>
            <button onClick={handleSaveToArchive} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm">
                <Save size={18} className="text-indigo-600" />
                <span>{t.saveToArchive}</span>
            </button>
            <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>
            <button onClick={addRow} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all">
                <Plus size={18} />
                <span>إضافة صف</span>
            </button>
            <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 font-bold transition-all">
                <Printer size={20} />
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
             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{lang === 'ar' ? 'تفريغ الجدول' : 'Clear Table'}</h3>
             <div className="flex gap-3 mt-6">
               <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
               <button onClick={confirmClearData} className="flex-1 px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-xl font-bold">{lang === 'ar' ? 'تفريغ' : 'Clear'}</button>
             </div>
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 md:p-8 rounded-2xl overflow-x-auto flex justify-center">
        <div 
          id="printable-form"
          className="bg-white text-black shadow-xl relative box-border"
          style={{ width: '297mm', minHeight: '210mm', fontFamily: "'Times New Roman', serif" }} // A4 Landscape
          dir="rtl"
        >
          {/* Professional Frame */}
          <div className="flex-1 m-2 border-4 border-double border-black p-6 flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="text-right">
                  <h2 className="text-lg font-bold">المكتب القطري الموحد للتأمين</h2>
                  <h3 className="text-base text-gray-600">Unified Qatari Insurance Bureau</h3>
              </div>
              <div className="text-left">
                  <div className="relative group inline-block">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px` }} className="object-contain max-h-24" />
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 font-bold cursor-pointer hover:bg-gray-50">
                        <ImageIcon size={20} className="mb-1" />
                        <span>رفع الشعار</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded-lg print-hidden">
                      <Upload className="text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                    </label>
                  </div>
                  {logoUrl && (
                    <div className="mt-2 w-24 print-hidden">
                      <input type="range" min="50" max="150" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer" />
                    </div>
                  )}
              </div>
            </div>

            <div className="mb-6 font-bold text-lg text-center border-b-2 border-black pb-2 flex items-center justify-center">
              <span className="ml-2">العمل الإضافي للموظفين عن</span>
              <input type="text" className="w-40 text-center font-bold border-b border-dotted border-black mx-2 outline-none bg-transparent" value={periodText} onChange={(e) => setPeriodText(e.target.value)} />
              <span className="mx-2">في الفتره من</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36 text-center font-bold border-b border-dotted border-black mx-2 outline-none bg-transparent font-mono cursor-pointer" />
              <span className="mx-2">الي</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36 text-center font-bold border-b border-dotted border-black mx-2 outline-none bg-transparent font-mono cursor-pointer" />
            </div>

            {/* TABLE */}
            <table className="w-full border-collapse border border-black text-xs text-center table-fixed">
              <thead>
                  <tr className="bg-gray-100">
                      <th className="border border-black p-1 w-28 text-[11px]">اسم الموظف</th>
                      <th className="border border-black p-1 w-16 text-[10px]">نوع المناوبة</th>
                      <th className="border border-black p-1 w-16 text-[10px]">اساسي الراتب</th>
                      {Array.isArray(dates) && dates.map((dayName, i) => (
                          <th key={i} className="border border-black p-0.5 min-w-[32px] text-[9px]">
                              <div className="leading-tight">
                                  {lang === 'ar' ? 'عدد ساعات' : 'Hours'}
                                  <br />
                                  {lang === 'ar' ? 'يوم ' + dayName : dayName}
                              </div>
                          </th>
                      ))}
                      <th className="border border-black p-1 w-16 text-[10px]">عدد الساعات<br/>الكلي</th>
                      
                      {/* CONDITIONAL HEADER */}
                      {showTotalAmount && (
                          <th className="border border-black p-1 w-20 text-[10px]">اجمالي المبلغ<br/>الاضافي</th>
                      )}
                  </tr>
              </thead>
              <tbody>
                  {Array.isArray(rows) && rows.map((row) => (
                      <tr key={row.id} className="relative group">
                          <td className="border border-black p-0 h-8 relative">
                              <select 
                                  className="w-full h-full bg-transparent outline-none appearance-none px-1 font-bold cursor-pointer print:hidden text-[11px]"
                                  value={row.employeeId}
                                  onChange={(e) => handleEmployeeSelect(row.id, e.target.value)}
                              >
                                  <option value="">-- اختر --</option>
                                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                              </select>
                              <div className="hidden print:flex w-full h-full items-center justify-center absolute inset-0 text-[11px]">
                                  {row.employeeName || "................"}
                              </div>
                          </td>
                          <td className="border border-black p-0 relative">
                              <select 
                                  className="w-full h-full bg-transparent outline-none appearance-none text-center font-bold cursor-pointer print:hidden text-[10px]"
                                  value={row.shiftType}
                                  onChange={(e) => updateShift(row.id, e.target.value)}
                              >
                                  <option value="صباحية">صباحية</option>
                                  <option value="مسائية">مسائية</option>
                              </select>
                              <div className="hidden print:flex w-full h-full items-center justify-center absolute inset-0 text-[10px]">
                                  {row.shiftType}
                              </div>
                          </td>
                          <td className="border border-black p-0">
                              <TableInput className="text-[10px]" value={row.basicSalary} onChange={(e: any) => updateSalary(row.id, e.target.value)} />
                          </td>
                          {Array.isArray(dates) && dates.map((_, idx) => (
                              <td key={idx} className="border border-black p-0">
                                  <TableInput className="text-[10px]" value={Array.isArray(row.days) ? row.days[idx] : '0'} onChange={(e: any) => updateDayHour(row.id, idx, e.target.value)} />
                              </td>
                          ))}
                          <td className="border border-black p-0 bg-gray-50 font-bold text-[10px]">
                              {row.totalHours}
                          </td>
                          
                          {/* CONDITIONAL CELL */}
                          {showTotalAmount && (
                              <td className="border border-black p-0 bg-gray-50 font-bold text-[10px]">
                                  {row.totalAmount.toLocaleString('en-US')}
                              </td>
                          )}

                          <td className="absolute -right-8 top-1 border-none p-0 print:hidden">
                              <button onClick={() => removeRow(row.id)} className="text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                  <Trash2 size={16} />
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
            </table>
            
            <div className="text-center mt-auto text-gray-400 font-bold text-xl print:text-black/30 print:text-sm">
                Page 1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OvertimeForm;
