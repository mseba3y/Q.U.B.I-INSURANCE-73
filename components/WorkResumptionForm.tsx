
import React, { useState, useEffect } from 'react';
import { Employee, SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Upload, Image as ImageIcon, UserCheck, Save } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface WorkResumptionFormProps {
  employees: Employee[];
  lang: 'en' | 'ar';
  logoUrl?: string;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
}

// Helpers defined outside component
const InputDot = ({ width = "w-auto", value = "..............................", className = "", center=false }: { width?: string, value?: string, className?: string, center?: boolean }) => (
  <input 
    type="text" 
    defaultValue={value} 
    className={`${width} bg-transparent border-none outline-none ${center ? 'text-center' : 'text-right'} font-bold px-1 text-base text-slate-800 ${className}`} 
  />
);

const CheckOption = ({ label, num }: { label: string, num: string }) => (
  <div className="flex items-center gap-2 mb-2">
      <span className="font-bold">{num} –</span>
      <span className="font-bold whitespace-nowrap min-w-[100px]">{label}</span>
      <span className="font-bold">(</span>
      <input type="text" className="w-8 text-center bg-transparent border-none outline-none font-bold text-slate-800" />
      <span className="font-bold">)</span>
  </div>
);

const WorkResumptionForm: React.FC<WorkResumptionFormProps> = ({ employees, lang, logoUrl, onLogoUpload, onSaveDocument, initialData }) => {
  const t = translations[lang].workResumption;
  const [logoSize, setLogoSize] = useState(100);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  useEffect(() => {
    if (initialData && initialData.selectedEmpId) {
        setSelectedEmpId(initialData.selectedEmpId);
    }
  }, [initialData]);

  const selectedEmp = employees.find(e => e.id === selectedEmpId);

  const handlePrint = () => {
    printElement('printable-form');
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'WorkResumption',
            title: `Work Resumption - ${selectedEmp?.name || 'Unknown'}`,
            date: new Date().toISOString(),
            employeeName: selectedEmp?.name,
            data: { selectedEmpId }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Controls */}
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
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm"
          >
            <Save size={20} className="text-emerald-600" />
            <span>{t.saveToArchive}</span>
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

      {/* Form Preview */}
      <div className="bg-slate-100 dark:bg-slate-800/50 p-4 md:p-8 rounded-2xl overflow-x-auto flex justify-center">
        <div 
          id="printable-form"
          className="bg-white text-black shadow-xl relative flex flex-col box-border"
          style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Times New Roman', serif" }}
          dir="rtl"
        >
          {/* Professional Frame - Reduced padding */}
          <div className="flex-1 m-2 border-4 border-double border-black p-5 flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-3">
              <div className="text-right pt-2">
                  <h2 className="text-lg font-bold">المكتب القطري الموحد للتأمين</h2>
                  <h3 className="text-base text-gray-600">Unified Qatari Insurance Bureau</h3>
              </div>
              <div className="text-left flex flex-col items-center">
                  {/* Logo Area */}
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

            {/* Addressee - Compressed spacing */}
            <div className="mb-4 font-bold text-lg leading-relaxed">
              <div className="flex justify-between w-full">
                  <span>السيد / المدير العام</span>
                  <span className="ml-16">المحترم</span>
              </div>
              <div className="flex justify-between w-full mt-1">
                  <span>السيد / مدير الشؤون الإدارية</span>
                  <span className="ml-16">المحترم</span>
              </div>
            </div>

            {/* Greeting */}
            <div className="text-center font-bold text-lg mb-6">
              تحية طيبة وبعد ،،،،،،
            </div>

            {/* Subject */}
            <div className="text-center text-xl font-extrabold underline underline-offset-8 mb-8">
              الموضوع / مباشــرة عمــل
            </div>

            {/* Body - Compressed spacing */}
            <div className="w-full text-lg leading-relaxed font-bold space-y-4">
              
              <div className="flex items-center">
                  <span className="whitespace-nowrap ml-2">يرجى العلم ان الموظف  /</span>
                  <input 
                    key={`name-${selectedEmpId}`}
                    type="text" 
                    defaultValue={selectedEmp ? selectedEmp.name : "...................................................."} 
                    className="w-full bg-transparent border-none outline-none text-right font-bold px-1 text-lg text-slate-800"
                  />
              </div>

              <div className="flex items-center">
                  <span className="whitespace-nowrap ml-2">الوظيفة:</span>
                  <input 
                      type="text" 
                      defaultValue="موظف إصدار  (أبوسمرة)" 
                      className="w-full bg-transparent border-none outline-none text-right font-bold px-1 text-lg text-slate-800"
                  />
              </div>

              <div className="flex items-center">
                  <span className="whitespace-nowrap ml-2">قد باشر عمله إعتباراً من تاريخ  :</span>
                  <InputDot width="w-48" value="................................" />
              </div>

              {/* Checklist Options */}
              <div className="mt-6 pr-4">
                  <CheckOption num="1" label="إجازة سنوية" />
                  <CheckOption num="2" label="إجازة مرضية" />
                  <CheckOption num="3" label="إجازة طارئة" />
                  <CheckOption num="4" label="توظيف مؤقت" />
              </div>

              <div className="mt-8 mb-8">
                  وتفضلوا بقبول فائق الاحترام ،،،
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-start text-center text-base font-bold mt-auto pt-4 gap-2">
                  <div className="w-1/4">
                      <p className="mb-6">توقيع الموظف</p>
                      <input 
                        key={`sig-${selectedEmpId}`}
                        type="text" 
                        defaultValue={selectedEmp ? selectedEmp.name : "................"} 
                        className="w-full text-center bg-transparent border-none outline-none font-bold"
                      />
                  </div>
                  <div className="w-1/4">
                      <p className="mb-6">توقيع مسئول الشفت</p>
                      <p>......................</p>
                  </div>
                  <div className="w-1/4">
                      <p className="mb-6">توقيع الشئون الادارية</p>
                      <p>......................</p>
                  </div>
                  <div className="w-1/4">
                      <p className="mb-6">المدير العام بالوكالة</p>
                      <p>......................</p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkResumptionForm;
