
import React, { useState, useEffect } from 'react';
import { Employee, SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, FileText, Upload, Image as ImageIcon, Save } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface CasualLeaveFormProps {
  employees: Employee[];
  lang: 'en' | 'ar';
  logoUrl?: string;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
}

const CasualLeaveForm: React.FC<CasualLeaveFormProps> = ({ employees, lang, logoUrl, onLogoUpload, onSaveDocument, initialData }) => {
  const t = translations[lang].casualLeave;
  
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [days, setDays] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [logoSize, setLogoSize] = useState(100);

  // Load initial data if provided (from Archive)
  useEffect(() => {
    if (initialData) {
        if (initialData.selectedEmpId) setSelectedEmpId(initialData.selectedEmpId);
        if (initialData.days) setDays(initialData.days);
        if (initialData.reason) setReason(initialData.reason);
    }
  }, [initialData]);

  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  
  const handlePrint = () => {
    printElement('printable-form');
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'CasualLeave',
            title: `Casual Leave - ${selectedEmp?.name || 'Unknown'}`,
            date: new Date().toISOString(),
            employeeName: selectedEmp?.name,
            data: { selectedEmpId, days, reason }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header & Controls */}
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
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 font-bold transition-all"
            >
            <Printer size={20} />
            <span>{t.print}</span>
            </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Input Form */}
        <div className="lg:w-1/3 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
               <FileText className="text-indigo-500" />
               {t.title}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t.selectEmployee}</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- {t.selectEmployee} --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t.daysCount}</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t.reason}</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Paper Preview */}
        <div className="lg:w-2/3 flex-1 overflow-x-auto">
          <div className="bg-slate-100 dark:bg-slate-800/50 p-4 md:p-8 rounded-2xl min-w-fit">
            <div 
              id="printable-form"
              className="bg-white text-black mx-auto shadow-xl relative flex flex-col"
              style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Times New Roman', serif" }}
              dir="rtl"
            >
              {/* Professional Border Frame */}
              <div className="flex-1 m-2 border-4 border-double border-black p-8 flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-12 border-b-2 border-black pb-4">
                  <div className="text-right pt-2">
                      <h2 className="text-xl font-bold">المكتب القطري الموحد للتأمين</h2>
                      <h3 className="text-lg text-gray-600">Unified Qatari Insurance Bureau</h3>
                  </div>
                  <div className="text-left flex flex-col items-center">
                      {/* Logo Area */}
                      <div className="relative group">
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt="Logo" 
                            style={{ width: `${logoSize}px` }}
                            className="object-contain max-h-32" 
                          />
                        ) : (
                          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 font-bold cursor-pointer hover:bg-gray-50 transition-colors">
                            <ImageIcon size={20} className="mb-1" />
                            <span>رفع الشعار</span>
                          </div>
                        )}
                        
                        {/* Upload Overlay - Hidden in Print */}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer rounded-lg transition-opacity print-hidden">
                          <Upload className="text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                        </label>
                      </div>

                      {/* Size Slider - Hidden in Print */}
                      {logoUrl && (
                        <div className="mt-2 w-32 print-hidden">
                          <input 
                            type="range" 
                            min="50" 
                            max="200" 
                            value={logoSize} 
                            onChange={(e) => setLogoSize(Number(e.target.value))}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                  </div>
                </div>

                <div>
                  {/* Date Header */}
                  <div className="text-left mb-8 font-bold text-lg flex items-center justify-end gap-2">
                      <span>التاريخ:</span>
                      <input type="text" defaultValue={new Date().toLocaleDateString('ar-EG')} className="w-40 text-right bg-transparent border-none outline-none font-bold text-lg" />
                  </div>

                  {/* Addressee */}
                  <div className="mb-10 text-xl font-bold leading-loose">
                      <div className="flex justify-between w-2/3">
                          <span>السيد / المدير العام</span>
                          <span>المحترم</span>
                      </div>
                      <div className="flex justify-between w-2/3 mt-2">
                          <span>السيد / مدير الشؤون الإدارية</span>
                          <span>المحترم</span>
                      </div>
                  </div>

                  {/* Greeting */}
                  <div className="mb-8 text-xl font-bold text-center">
                      تحية طيبة وبعد ،،،،
                  </div>

                  {/* Subject */}
                  <div className="mb-8 text-xl font-bold text-center underline underline-offset-8">
                      الموضوع: طلب إجازة عرضية
                  </div>

                  {/* Body */}
                  <div className="text-xl leading-loose text-justify mb-12">
                      <p>
                      أرجو التكرم بالموافقة على منحي إجازة عرضية لمدة 
                      <span className="px-2 font-bold">({days})</span> 
                      يوم،
                      اعتباراً من يوم 
                      <input type="text" defaultValue=".........................." className="mx-1 w-40 text-center font-bold bg-transparent border-none outline-none p-0 text-xl" />
                      الموافق 
                      <input type="text" defaultValue=".........................." className="mx-1 w-40 text-center font-bold bg-transparent border-none outline-none p-0 text-xl" />
                      {days > 1 && (
                          <>
                          ولغاية تاريخ
                          <input type="text" defaultValue=".........................." className="mx-1 w-40 text-center font-bold bg-transparent border-none outline-none p-0 text-xl" />
                          </>
                      )}، 
                      {reason ? (
                          <span>وذلك للأسباب التالية: <span className="px-2 underline">{reason}</span>.</span>
                      ) : (
                          <span>وذلك لظروف خاصة.</span>
                      )}
                      </p>
                      <p className="mt-4">
                      وتفضلوا بقبول فائق الاحترام والتقدير.
                      </p>
                  </div>

                  {/* Employee Signature */}
                  <div className="mt-12 text-xl font-bold">
                      <div className="flex items-center justify-start mb-6 gap-2">
                          <span>مقدمه لسيادتكم الموظف /</span>
                          <input 
                              key={`emp-name-${selectedEmpId}`}
                              type="text" 
                              defaultValue={selectedEmp ? selectedEmp.name : ".................................."} 
                              className="w-64 text-right bg-transparent border-none outline-none font-normal text-xl" 
                          />
                      </div>
                      <div className="flex items-center justify-start gap-12">
                          <span>توقيع الموظف /</span>
                          <input 
                              type="text" 
                              defaultValue=".................................." 
                              className="w-64 text-right bg-transparent border-none outline-none font-normal text-xl" 
                          />
                      </div>
                  </div>

                  {/* Managers Signatures Footer */}
                  <div className="flex justify-between items-start mt-auto pt-10 text-xl font-bold px-2">
                    <div className="text-center w-1/3">
                      <p>المدير العام</p>
                    </div>

                    <div className="text-center w-1/3">
                      <p>مدير الشؤون الإدارية</p>
                    </div>

                    <div className="text-center w-1/3">
                      <p>مشرف الشفت</p>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="absolute bottom-4 right-0 left-0 text-center text-sm text-gray-400 print-hidden">
                  * هذا النموذج تم إنشاؤه إلكترونياً عبر نظام AttendanceEase
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasualLeaveForm;
