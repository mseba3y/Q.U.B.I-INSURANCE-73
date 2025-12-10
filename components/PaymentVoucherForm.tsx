
import React, { useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import { Printer, Upload, Image as ImageIcon, Save, CheckCircle } from 'lucide-react';
import { printElement } from '../utils/printHelper';
import { Employee, SavedDocument } from '../types';

interface PaymentVoucherFormProps {
  employees: Employee[];
  lang: 'en' | 'ar';
  logoUrl?: string;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
}

// --- Arabic Number to Words Helper (Simplified Tafqit) ---
const convertNumberToArabicWords = (n: number): string => {
  if (n === 0) return "";
  const units = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

  const convertGroup = (num: number): string => {
    let res = "";
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    const t = Math.floor(remainder / 10);
    const u = remainder % 10;
    if (h > 0) {
      res += hundreds[h];
      if (remainder > 0) res += " و";
    }
    if (remainder > 0) {
      if (remainder < 10) {
        res += units[remainder];
      } else if (remainder < 20) {
        res += teens[remainder - 10];
      } else {
        res += units[u];
        if (u > 0 && t > 0) res += " و";
        res += tens[t];
      }
    }
    return res;
  };

  let words = "";
  const millions = Math.floor(n / 1000000);
  let remainder = n % 1000000;
  if (millions > 0) {
    words += convertGroup(millions) + " مليون";
    if (remainder > 0) words += " و";
  }
  const thousands = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  if (thousands > 0) {
    if (thousands === 1) words += "ألف";
    else if (thousands === 2) words += "ألفان";
    else if (thousands >= 3 && thousands <= 10) words += convertGroup(thousands) + " آلاف";
    else words += convertGroup(thousands) + " ألف";
    if (remainder > 0) words += " و";
  }
  if (remainder > 0) {
    words += convertGroup(remainder);
  }
  return words + " ريال قطري لا غير";
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const PaymentVoucherForm: React.FC<PaymentVoucherFormProps> = ({ employees, lang, logoUrl, onLogoUpload, onSaveDocument, initialData }) => {
  const t = translations[lang].paymentVoucher;
  const [logoSize, setLogoSize] = useState(100);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [docNo, setDocNo] = useState('');
  const [amount, setAmount] = useState('');
  const [amountWords, setAmountWords] = useState('');
  const [payTo, setPayTo] = useState('');
  const [description, setDescription] = useState('');
  const [shiftManager, setShiftManager] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');

  useEffect(() => {
    if (initialData) {
        if (initialData.date) setDate(initialData.date);
        if (initialData.docNo) setDocNo(initialData.docNo);
        if (initialData.amount) setAmount(initialData.amount);
        if (initialData.amountWords) setAmountWords(initialData.amountWords);
        if (initialData.payTo) setPayTo(initialData.payTo);
        if (initialData.description) setDescription(initialData.description);
        if (initialData.selectedEmpId) setSelectedEmpId(initialData.selectedEmpId);
    }
  }, [initialData]);

  const selectedEmp = employees.find(e => e.id === selectedEmpId);

  const handlePrint = () => {
    printElement('printable-form');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow numbers only
    if (/^\d*\.?\d*$/.test(val)) {
        setAmount(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setAmountWords(convertNumberToArabicWords(Math.floor(num)));
        } else {
            setAmountWords('');
        }
    }
  };

  const handleSaveAndPost = () => {
    if (!amount || !selectedEmpId || !docNo) {
        alert(lang === 'ar' ? 'يرجى تعبئة المبلغ، رقم الوثيقة، واسم الموظف' : 'Please fill Amount, Doc No, and Employee');
        return;
    }

    try {
        const STORAGE_KEY = 'ae_bills_due_data';
        const existingDataStr = localStorage.getItem(STORAGE_KEY);
        let data = existingDataStr ? JSON.parse(existingDataStr) : { rows: [], fromDate: '', toDate: '' };
        
        if (!Array.isArray(data.rows)) {
            data.rows = [];
        }

        const newBill = {
            id: generateId(),
            date: date,
            docNo: docNo,
            employeeId: selectedEmpId,
            employeeName: selectedEmp ? selectedEmp.name : '',
            status: description, 
            amount: amount
        };

        data.rows.push(newBill);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        // Also save to archive
        if (onSaveDocument) {
            onSaveDocument({
                type: 'PaymentVoucher',
                title: `Voucher #${docNo} - ${selectedEmp?.name || ''}`,
                date: date,
                employeeName: selectedEmp?.name,
                data: { date, docNo, amount, amountWords, payTo, description, shiftManager, selectedEmpId }
            });
        }

        alert(lang === 'ar' 
            ? 'تم الحفظ والترحيل إلى فواتير مستحقة الدفع بنجاح' 
            : 'Saved and posted to Bills Due successfully');
            
    } catch (e) {
        console.error("Error posting to bills", e);
        alert(lang === 'ar' ? 'حدث خطأ أثناء الترحيل' : 'Error posting data');
    }
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'PaymentVoucher',
            title: `Voucher #${docNo} - ${selectedEmp?.name || ''}`,
            date: date,
            employeeName: selectedEmp?.name,
            data: { date, docNo, amount, amountWords, payTo, description, shiftManager, selectedEmpId }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-3">
            <button
            onClick={handleSaveToArchive}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm"
            >
            <Save size={20} className="text-emerald-600" />
            <span>{t.saveToArchive}</span>
            </button>
            <button
            onClick={handleSaveAndPost}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 font-bold transition-all"
            >
            <CheckCircle size={20} />
            <span>{lang === 'ar' ? 'حفظ وترحيل للفواتير' : 'Save & Post'}</span>
            </button>
            <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 font-bold transition-all"
            >
            <Printer size={20} />
            <span>{t.print}</span>
            </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 md:p-8 rounded-2xl overflow-x-auto flex justify-center">
        <div 
          id="printable-form"
          className="bg-white text-black shadow-xl relative box-border"
          style={{ width: '297mm', minHeight: '210mm', fontFamily: "'Times New Roman', serif" }} // A4 Landscape
          dir="rtl"
        >
          {/* Professional Frame */}
          <div className="flex-1 m-2 border-4 border-double border-black p-8 flex flex-col">

            {/* Header Row */}
            <div className="flex justify-between items-start mb-4 relative">
                {/* Logo (Top Right in RTL) */}
                <div className="text-right flex flex-col items-center justify-center w-1/4 print:hidden">
                  <div className="relative group inline-block">
                      {logoUrl ? (
                          <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px` }} className="object-contain max-h-32" />
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
                      <div className="mt-2 w-24 print:hidden">
                          <input type="range" min="50" max="200" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer" />
                      </div>
                  )}
                  <div className="mt-2 text-xs text-gray-400 print:hidden">ارفع الشعار</div>
                </div>

                {/* Title (Center) */}
                <div className="flex-1 text-center pt-8">
                    <h1 className="text-4xl font-bold">سند صرف</h1>
                </div>

                {/* Left spacer for balance or absolute logo */}
                <div className="w-1/4 relative">
                     {/* Printable Logo (Absolute Position) */}
                    {logoUrl && (
                        <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px` }} className="absolute top-0 right-0 object-contain max-h-24 hidden print:block" />
                    )}
                </div>
            </div>

            <hr className="border-black border-2 mb-6" />

            {/* Date Row */}
            <div className="flex justify-end mb-6 px-4">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">التاريخ</span>
                    <div className="border border-gray-300 rounded px-2 py-1 bg-white flex items-center">
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="font-bold bg-transparent outline-none cursor-pointer w-40"
                        />
                    </div>
                </div>
            </div>

            {/* Document & Employee Table Block */}
            <div className="flex border-2 border-black mb-8 mx-4">
                <div className="w-1/2 border-l-2 border-black">
                    <div className="border-b-2 border-black p-2 text-center font-bold text-lg bg-gray-50">
                        اسم الموظف
                    </div>
                    <div className="p-0 relative h-12">
                        <select 
                            value={selectedEmpId} 
                            onChange={(e) => setSelectedEmpId(e.target.value)}
                            className="w-full h-full bg-transparent border-none outline-none font-bold cursor-pointer appearance-none text-center text-xl print:hidden px-2"
                        >
                            <option value="">-- اختر الموظف --</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                        <div className="hidden print:flex absolute inset-0 items-center justify-center font-bold text-xl">
                            {selectedEmp ? selectedEmp.name : ""}
                        </div>
                    </div>
                </div>
                <div className="w-1/2">
                    <div className="border-b-2 border-black p-2 text-center font-bold text-lg bg-gray-50">
                        رقم الوثيقة
                    </div>
                    <div className="p-0 h-12">
                        <input 
                            type="text" 
                            value={docNo}
                            onChange={(e) => setDocNo(e.target.value)}
                            className="w-full h-full text-center bg-transparent border-none outline-none font-bold text-xl"
                        />
                    </div>
                </div>
            </div>

            {/* Body Content */}
            <div className="px-4 space-y-8 font-bold text-xl leading-loose">
                
                {/* Amount Row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Amount Section */}
                    <div className="flex items-center gap-4 flex-1">
                        <span className="w-20 text-left pl-4">المبلغ</span>
                        <input 
                          type="text" 
                          value={amount}
                          onChange={handleAmountChange}
                          placeholder="0"
                          className="border border-gray-300 rounded px-4 py-2 w-48 text-center font-bold bg-transparent outline-none focus:border-indigo-500 text-2xl"
                        />
                        <span>ريال قطري</span>
                    </div>
                </div>

                {/* Amount In Words - CLEAN SINGLE BORDER */}
                <div className="flex items-start gap-4">
                    <span className="w-32 whitespace-nowrap pt-2">المبلغ كتابة</span>
                    <div className="flex-1">
                        <textarea 
                            rows={2}
                            value={amountWords}
                            onChange={(e) => setAmountWords(e.target.value)}
                            className="w-full border border-gray-300 rounded px-4 py-2 font-bold bg-transparent outline-none focus:border-indigo-500 resize-none text-xl"
                        />
                    </div>
                </div>

                {/* Pay To */}
                <div className="flex items-center gap-4">
                    <span className="whitespace-nowrap">يصرف للسيد /</span>
                    <input 
                      type="text" 
                      value={payTo}
                      onChange={(e) => setPayTo(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-4 py-2 font-bold bg-transparent outline-none focus:border-indigo-500"
                    />
                </div>

                {/* Description (For) */}
                <div className="flex items-center gap-4">
                    <span className="whitespace-nowrap">وذلك قيمة /</span>
                    <input 
                      type="text" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-4 py-2 font-bold bg-transparent outline-none focus:border-indigo-500"
                    />
                </div>

            </div>

            {/* Footer Signatures - Swapped & Auto-Filled */}
            <div className="mt-auto px-12 pb-4 flex justify-between items-end">
                
                {/* Receiver (Right side in RTL now) */}
                <div className="text-center w-1/3">
                    <h3 className="font-bold text-xl mb-6">المستلم</h3>
                    <div className="border-t border-dotted border-black pt-2 w-full mx-auto relative min-h-[40px] flex items-center justify-center">
                        <input
                            type="text"
                            value={payTo}
                            onChange={(e) => setPayTo(e.target.value)}
                            placeholder="الاسم / التوقيع"
                            className="w-full text-center bg-transparent border-none outline-none font-bold text-xl placeholder-gray-300"
                        />
                    </div>
                </div>

                {/* Shift Manager (Left side in RTL now) */}
                <div className="text-center w-1/3">
                    <h3 className="font-bold text-xl mb-6">مسئول الشفت</h3>
                    <div className="border-t border-dotted border-black pt-2 w-full mx-auto relative min-h-[40px] flex items-center justify-center">
                        <input
                            type="text"
                            value={shiftManager}
                            onChange={(e) => setShiftManager(e.target.value)}
                            placeholder="الاسم / التوقيع"
                            className="w-full text-center bg-transparent border-none outline-none font-bold text-xl placeholder-gray-300"
                        />
                    </div>
                </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVoucherForm;
