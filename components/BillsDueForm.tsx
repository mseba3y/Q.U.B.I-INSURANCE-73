
import React, { useState, useEffect } from 'react';
import { Employee, SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Upload, Image as ImageIcon, Plus, Trash2, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface BillsDueFormProps {
  employees: Employee[];
  lang: 'en' | 'ar';
  logoUrl?: string;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
}

interface BillRow {
  id: string;
  date: string;
  docNo: string;
  employeeId: string;
  employeeName: string;
  status: string;
  amount: string;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper Input for Table
const TableInput = ({ value, onChange, className="", type="text", placeholder="" }: any) => (
  <input 
    type={type} 
    value={value || ''} 
    onChange={onChange}
    placeholder={placeholder}
    dir="auto"
    className={`w-full h-full bg-transparent text-center outline-none border-none p-1 font-bold text-slate-800 ${className}`} 
  />
);

const BillsDueForm: React.FC<BillsDueFormProps> = ({ employees, lang, logoUrl, onLogoUpload, onSaveDocument, initialData }) => {
  const t = translations[lang].billsDue;
  const [logoSize, setLogoSize] = useState(100);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const STORAGE_KEY = 'ae_bills_due_data';

  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
         const parsed = JSON.parse(saved);
         if (Array.isArray(parsed.rows)) {
            return parsed;
         }
      }
    } catch (e) {
      console.error("Failed to load bills data", e);
    }
    return null;
  };

  const savedData = loadSavedData();

  const [fromDate, setFromDate] = useState(savedData?.fromDate || "");
  const [toDate, setToDate] = useState(savedData?.toDate || "");
  
  const createDefaultRow = (): BillRow => ({ 
    id: generateId(), 
    date: '', 
    docNo: '', 
    employeeId: '', 
    employeeName: '', 
    status: '', 
    amount: '' 
  });

  const [rows, setRows] = useState<BillRow[]>(Array.isArray(savedData?.rows) ? savedData.rows : Array(15).fill(null).map(createDefaultRow));

  // Load from Archive if initialData is provided
  useEffect(() => {
    if (initialData) {
        if (initialData.fromDate) setFromDate(initialData.fromDate);
        if (initialData.toDate) setToDate(initialData.toDate);
        if (Array.isArray(initialData.rows)) setRows(initialData.rows);
    }
  }, [initialData]);

  const handlePrint = () => {
    printElement('printable-form');
  };

  const handleSaveData = () => {
    try {
        const dataToSave = { fromDate, toDate, rows };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        alert(lang === 'ar' ? 'تم حفظ بيانات الفواتير بنجاح!' : 'Bills data saved successfully!');
    } catch (e) {
        console.error("Storage limit exceeded", e);
        alert(lang === 'ar' ? 'فشل الحفظ: المساحة ممتلئة' : 'Save failed: Storage limit exceeded');
    }
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'BillsDue',
            title: `Bills Due (${fromDate} - ${toDate})`,
            date: new Date().toISOString(),
            data: { fromDate, toDate, rows }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  const requestClearData = () => {
    setShowClearConfirm(true);
  };

  const confirmClearData = () => {
    setRows(Array(15).fill(null).map(createDefaultRow));
    setFromDate("");
    setToDate("");
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { console.error(e); }
    setShowClearConfirm(false);
  };

  const addRow = () => {
    setRows([...rows, createDefaultRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof BillRow, value: string) => {
    setRows(prevRows => prevRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleEmployeeSelect = (rowId: string, empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setRows(prevRows => prevRows.map(r => r.id === rowId ? { ...r, employeeId: empId, employeeName: emp.name } : r));
    }
  };

  const totalAmount = rows.reduce((sum, row) => {
    const val = parseFloat(row.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t.subtitle}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 justify-end">
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
                <span>{lang === 'ar' ? 'إضافة صف' : 'Add Row'}</span>
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

            {/* Logo Area (Top Right) */}
            <div className="absolute top-8 right-8 print:hidden">
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

             {/* Printable Logo (Absolute Position) */}
            {logoUrl && (
                 <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px` }} className="absolute top-6 right-6 object-contain max-h-24 hidden print:block" />
            )}


            {/* HEADER: YELLOW BACKGROUND - CENTERED TITLE */}
            <div className="mt-16 mb-0 bg-[#ffc000] border border-black p-4 text-center">
                <div className="mb-2">
                    <h1 className="text-3xl font-extrabold text-black">فواتير مستحقة الدفع</h1>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <h2 className="text-xl font-bold text-black">من</h2>
                    <input 
                      type="date" 
                      value={fromDate} 
                      onChange={(e) => setFromDate(e.target.value)} 
                      className="bg-transparent border-b border-black font-bold text-xl w-40 text-center outline-none"
                    />
                    <h2 className="text-xl font-bold text-black">الي</h2>
                    <input 
                      type="date" 
                      value={toDate} 
                      onChange={(e) => setToDate(e.target.value)} 
                      className="bg-transparent border-b border-black font-bold text-xl w-40 text-center outline-none"
                    />
                </div>
            </div>

            {/* TABLE */}
            <table className="w-full border-collapse border border-black text-sm text-center">
              <thead>
                  {/* Dark Blue Header */}
                  <tr className="bg-[#1f497d] text-white print:bg-[#1f497d] print-color-adjust">
                      <th className="border border-black p-2 w-16 text-lg">{t.colSeq}</th>
                      <th className="border border-black p-2 w-32 text-lg">{t.colDate}</th>
                      <th className="border border-black p-2 w-40 text-lg">{t.colDocNo}</th>
                      <th className="border border-black p-2 w-64 text-lg">{t.colEmp}</th>
                      <th className="border border-black p-2 w-80 text-lg">{t.colStatus}</th>
                      <th className="border border-black p-2 w-40 text-lg">{t.colAmount}</th>
                  </tr>
              </thead>
              <tbody>
                  {rows.map((row, index) => (
                      <tr key={row.id} className="relative group hover:bg-slate-50">
                          <td className="border border-black p-0 h-10 font-bold bg-white">{index + 1}</td>
                          <td className="border border-black p-0 bg-white">
                              <TableInput type="date" value={row.date} onChange={(e: any) => updateRow(row.id, 'date', e.target.value)} />
                          </td>
                          <td className="border border-black p-0 bg-white">
                              <TableInput value={row.docNo} onChange={(e: any) => updateRow(row.id, 'docNo', e.target.value)} />
                          </td>
                          <td className="border border-black p-0 bg-white relative">
                              <select 
                                  className="w-full h-full bg-transparent outline-none appearance-none px-1 font-bold cursor-pointer print:hidden text-center"
                                  value={row.employeeId}
                                  onChange={(e) => handleEmployeeSelect(row.id, e.target.value)}
                              >
                                  <option value="">-- {lang === 'ar' ? 'اختر' : 'Select'} --</option>
                                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                              </select>
                              <div className="hidden print:flex w-full h-full items-center justify-center absolute inset-0 font-bold">
                                  {row.employeeName || ""}
                              </div>
                          </td>
                          <td className="border border-black p-0 bg-white">
                              <TableInput value={row.status} onChange={(e: any) => updateRow(row.id, 'status', e.target.value)} />
                          </td>
                          <td className="border border-black p-0 bg-white">
                              <TableInput value={row.amount} onChange={(e: any) => updateRow(row.id, 'amount', e.target.value)} placeholder="0.00" />
                          </td>
                          <td className="absolute -right-8 top-1 border-none p-0 print:hidden">
                              <button onClick={() => removeRow(row.id)} className="text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                  <Trash2 size={16} />
                              </button>
                          </td>
                      </tr>
                  ))}
                  <tr>
                      <td colSpan={5} className="border border-black p-2 bg-[#1f497d] text-white font-bold text-xl text-left pl-8">
                          {t.total}
                      </td>
                      <td className="border border-black p-2 font-bold text-xl bg-yellow-100">
                          {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                  </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillsDueForm;
