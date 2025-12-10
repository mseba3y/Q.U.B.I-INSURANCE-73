
import React, { useState, useEffect } from 'react';
import { Employee, AnnualLeaveRequest, SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Upload, Image as ImageIcon, UserCheck, Save, FileBox } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface AnnualLeaveFormProps {
  employees: Employee[];
  lang: 'en' | 'ar';
  logoUrl?: string;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddRequest?: (request: AnnualLeaveRequest) => void;
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
}

// Helper for dot inputs
const InputDot = ({ width = "w-auto", value = "..............................", className = "" }: { width?: string, value?: string, className?: string }) => (
  <input 
    type="text" 
    defaultValue={value} 
    className={`${width} bg-transparent border-none outline-none text-right font-bold px-1 text-base text-slate-800 ${className}`} 
  />
);

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const AnnualLeaveForm: React.FC<AnnualLeaveFormProps> = ({ employees, lang, logoUrl, onLogoUpload, onAddRequest, onSaveDocument, initialData }) => {
  const t = translations[lang].annualLeave;
  const [logoSize, setLogoSize] = useState(100);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');

  // Restore state from archive if loaded
  useEffect(() => {
    if (initialData) {
        if (initialData.selectedEmpId) setSelectedEmpId(initialData.selectedEmpId);
        if (initialData.startDate) setStartDate(initialData.startDate);
        if (initialData.endDate) setEndDate(initialData.endDate);
    }
  }, [initialData]);

  const selectedEmp = employees.find(e => e.id === selectedEmpId);

  useEffect(() => {
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setDuration(`${diffDays} يوم`);
        } else {
            setDuration('');
        }
    } else {
        setDuration('');
    }
  }, [startDate, endDate]);

  const handlePrint = () => {
    printElement('printable-form');
  };

  const handleSaveRequest = () => {
    if (!selectedEmpId || !startDate || !endDate) {
      alert(lang === 'ar' ? 'يرجى اختيار الموظف وتحديد التواريخ' : 'Please select employee and dates');
      return;
    }

    try {
      const newRequest: AnnualLeaveRequest = {
        id: generateId(),
        employeeId: selectedEmpId,
        startDate,
        endDate,
        duration,
        createdAt: new Date().toISOString()
      };

      if (onAddRequest) {
        onAddRequest(newRequest);
        alert(lang === 'ar' ? 'تم حفظ طلب الإجازة بنجاح' : 'Leave request saved successfully');
      } else {
        console.error("onAddRequest prop is missing");
      }
    } catch (e) {
      console.error(e);
      alert('Error saving data');
    }
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'AnnualLeave',
            title: `Annual Leave - ${selectedEmp?.name || 'Unknown'}`,
            date: new Date().toISOString(),
            employeeName: selectedEmp?.name,
            data: { selectedEmpId, startDate, endDate, duration }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
             <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
               <UserCheck size={18} />
             </div>
             <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
             >
                <option value="">-- اختر الموظف (تعبئة تلقائية) --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
             </select>
          </div>
          
          <button
            onClick={handleSaveToArchive}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm"
          >
            <FileBox size={20} className="text-emerald-600" />
            <span>{t.saveToArchive}</span>
          </button>

          <button
            onClick={handleSaveRequest}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 font-bold transition-all"
          >
            <Save size={20} />
            <span>{t.saveRequest}</span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 font-bold transition-all"
          >
            <Printer size={20} />
            <span>{t.print}</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 md:p-8 rounded-2xl overflow-x-auto flex justify-center">
        <div 
          id="printable-form"
          className="bg-white text-black shadow-xl relative flex flex-col box-border"
          style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Times New Roman', serif" }}
          dir="rtl"
        >
          <div className="flex-1 m-2 border-4 border-double border-black p-5 flex flex-col">

            <div className="flex justify-between items-start mb-3 border-b-2 border-black pb-2">
              <div className="text-right pt-2">
                  <h2 className="text-lg font-bold">المكتب القطري الموحد للتأمين</h2>
                  <h3 className="text-base text-gray-600">Unified Qatari Insurance Bureau</h3>
              </div>
              <div className="text-center pt-4">
                  <h1 className="text-xl font-extrabold underline underline-offset-4">طلب إجازة سنوية</h1>
              </div>
              <div className="text-left flex flex-col items-center">
                  <div className="relative group">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        style={{ width: `${logoSize}px` }}
                        className="object-contain max-h-20" 
                      />
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 font-bold cursor-pointer hover:bg-gray-50 transition-colors">
                        <ImageIcon size={20} className="mb-1" />
                        <span>رفع الشعار</span>
                      </div>
                    )}
                    
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded-lg transition-opacity print-hidden">
                      <Upload className="text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                    </label>
                  </div>

                  {logoUrl && (
                    <div className="mt-2 w-24 print-hidden">
                      <input 
                        type="range" 
                        min="50" 
                        max="150" 
                        value={logoSize} 
                        onChange={(e) => setLogoSize(Number(e.target.value))}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
              </div>
            </div>

            <div className="mb-3 font-bold text-base leading-relaxed">
              <div className="flex justify-between w-full">
                  <span>السيد / مدير عام المكتب القطري الموحد للتأمين</span>
                  <span className="ml-12">المحترم</span>
              </div>
              <div className="flex justify-between w-full mt-1">
                  <span>السيد / مدير الشؤون الإدارية</span>
                  <span className="ml-12">المحترم</span>
              </div>
              <div className="text-center mt-1 text-base">
                  السلام عليكم ورحمة الله وبركاته ،،،،،
              </div>
            </div>

            <div className="text-center text-lg font-bold underline underline-offset-8 mb-3">
              الموضوع : طلب إجازة سنوية
            </div>

            <div className="w-full text-base leading-normal font-bold space-y-2">
              
              <div className="flex flex-wrap items-center justify-between">
                  <div className="flex items-center">
                      <span className="whitespace-nowrap ml-2">اسم الموظف :</span>
                      <input 
                        key={`name-${selectedEmpId}`}
                        type="text" 
                        defaultValue={selectedEmp ? selectedEmp.name : ".........................................."} 
                        className="w-64 bg-transparent border-none outline-none text-right font-bold px-1 text-base text-slate-800"
                      />
                  </div>
                  <div className="flex items-center">
                      <select className="bg-transparent font-bold text-base border-none outline-none text-right cursor-pointer hover:bg-gray-50 rounded px-1 appearance-none min-w-[200px]">
                          <option value="مشرف بمنفذ أبو سمرة">مشرف بمنفذ أبو سمرة</option>
                          <option value="موظف اصدار تأمين">موظف اصدار تأمين</option>
                      </select>
                  </div>
              </div>

              <div className="flex flex-wrap items-center">
                  <span className="whitespace-nowrap ml-2">بداية الإجازة + نهاية الإجازة :</span>
                  
                  <span className="whitespace-nowrap ml-2">من</span>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-32 bg-transparent border-none outline-none text-center font-bold px-1 text-base text-slate-800 font-mono cursor-pointer"
                  />
                  
                  <span className="whitespace-nowrap mx-2">إلى</span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-32 bg-transparent border-none outline-none text-center font-bold px-1 text-base text-slate-800 font-mono cursor-pointer"
                  />
              </div>

              <div className="flex items-center">
                  <span className="whitespace-nowrap ml-2">مدة الإجازة المطلوبة :</span>
                  <input 
                    type="text" 
                    value={duration} 
                    readOnly
                    placeholder="........................................................................................................"
                    className="flex-1 bg-transparent border-none outline-none text-right font-bold px-1 text-base text-slate-800"
                  />
              </div>

              <div className="flex items-center">
                  <span className="whitespace-nowrap ml-2">مدة الإجازة المستحقة :</span>
                  <InputDot width="w-full" className="flex-1" value="........................................................................................................" />
              </div>

              <div className="flex items-center">
                  <span className="whitespace-nowrap ml-2">عنوان الموظف أثناء الإجازة :</span>
                  <InputDot width="w-full" className="flex-1" value="..................................................................................................." />
              </div>

              <div className="flex items-center">
                  <span className="whitespace-nowrap ml-2">رقم جوال الموظف أثناء الإجازة :</span>
                  <InputDot width="w-full" className="flex-1" value=".............................................................................................." />
              </div>

              <div className="flex items-center">
                  <span className="whitespace-nowrap ml-2">اسم الموظف البديل وتوقيعه :-</span>
                  <InputDot width="w-full" className="flex-1" value=".................................................................................................." />
              </div>

              <div className="flex items-center mt-1 whitespace-nowrap overflow-hidden">
                  <span className="ml-2">جهة السفر من :</span>
                  
                  <span className="font-normal">(</span>
                  <InputDot width="w-20" value="...................." />
                  <span className="font-bold mx-1">&</span>
                  <InputDot width="w-20" value="...................." />
                  <span className="font-normal">)</span>
                  
                  <span className="mx-2"></span>
                  
                  <span className="font-normal">(</span>
                  <InputDot width="w-20" value="...................." />
                  <span className="font-bold mx-1">&</span>
                  <InputDot width="w-20" value="...................." />
                  <span className="font-normal">)</span>
              </div>

              <div className="flex justify-end mt-2 mb-1">
                  <div className="flex flex-col items-center gap-1">
                      <span>توقيع الموظف</span>
                      <input 
                        key={`sig-${selectedEmpId}`}
                        type="text" 
                        defaultValue={selectedEmp ? selectedEmp.name : ".........................................."} 
                        className="w-64 bg-transparent border-none outline-none text-center font-bold px-1 text-base text-slate-800"
                      />
                  </div>
              </div>

              <div className="mt-2 border-t-2 border-black pt-2">
                  <h4 className="font-bold underline mb-1">ملاحظات الشئون الإدارية -:</h4>
                  <div className="space-y-1">
                      <InputDot width="w-full" value="................................................................................................................................................................................" />
                      <InputDot width="w-full" value="................................................................................................................................................................................" />
                  </div>
              </div>

              <div className="flex justify-between items-end mt-auto px-4 pb-2">
                  <div className="text-center">
                      <p className="mb-4 font-bold text-xl">المدير العام</p>
                      <p className="mb-2">التوقيع</p>
                      <InputDot width="w-48" value="..................................." />
                  </div>
                  <div className="text-center">
                      <p className="mb-4 font-bold text-xl">مدير الشؤون الإدارية</p>
                      <p className="mb-2">التوقيع</p>
                      <InputDot width="w-48" value="..................................." />
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualLeaveForm;
