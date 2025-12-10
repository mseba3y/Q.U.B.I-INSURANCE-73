
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus, AnnualLeaveRequest, SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Printer, Upload, Image as ImageIcon, Calendar, Save } from 'lucide-react';
import { printElement } from '../utils/printHelper';

interface MonthlyReportFormProps {
  employees: Employee[];
  records: AttendanceRecord[];
  annualLeaves: AnnualLeaveRequest[];
  lang: 'en' | 'ar';
  logoUrl?: string;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dateRange: { from: string, to: string };
  onSaveDocument?: (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => void;
  initialData?: any;
}

const MonthlyReportForm: React.FC<MonthlyReportFormProps> = ({ employees, records, annualLeaves, lang, logoUrl, onLogoUpload, dateRange, onSaveDocument, initialData }) => {
  const t = translations[lang].monthlyReport;
  const [logoSize, setLogoSize] = useState(100);
  
  const [manualPresentCounts, setManualPresentCounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && initialData.manualPresentCounts) {
        setManualPresentCounts(initialData.manualPresentCounts);
    }
  }, [initialData]);

  // Helper to format date as DDD dd/mm/yyyy
  const formatDateFull = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    
    const dayName = date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${dayName} ${day}/${month}/${year}`;
  };

  const reportData = useMemo(() => {
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    
    const timeDiff = Math.abs(to.getTime() - from.getTime());
    const totalDaysInPeriod = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    return employees.map(emp => {
      const empRecords = records.filter(r => {
        const d = new Date(r.date);
        return r.employeeId === emp.id && d >= from && d <= to;
      });

      const sickCount = empRecords.filter(r => r.status === AttendanceStatus.SICK).length;
      const casualCount = empRecords.filter(r => r.status === AttendanceStatus.CASUAL).length;
      const missionCount = empRecords.filter(r => r.status === AttendanceStatus.MISSION).length;
      const deductionCount = empRecords.filter(r => r.status === AttendanceStatus.DEDUCTION).length;
      
      // --- NEW LOGIC: Generate Auto Notes for specific leaves ---
      const autoNotes: string[] = [];
      
      // Map status to Arabic text
      const statusMap: Record<string, string> = {
        [AttendanceStatus.SICK]: 'إجازة مرضية',
        [AttendanceStatus.CASUAL]: 'إجازة عرضية',
        [AttendanceStatus.DEDUCTION]: 'إجازة بالخصم',
        [AttendanceStatus.MISSION]: 'مباشرة عمل', // Or 'مهمة عمل' based on preference
        [AttendanceStatus.LATE]: 'تأخير'
      };

      // Sort records by date
      const sortedRecords = [...empRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedRecords.forEach(r => {
        if (statusMap[r.status]) {
            const d = new Date(r.date);
            const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });
            const dateStr = d.toLocaleDateString('en-GB'); // DD/MM/YYYY
            
            // Format: "1 يوم [نوع الاجازة] يوم [الاسم] [التاريخ]"
            autoNotes.push(`1 يوم ${statusMap[r.status]} يوم ${dayName} ${dateStr}`);
        }
      });

      let annualLeaveDays = 0;
      let annualLeaveData = null;

      const empLeaves = annualLeaves.filter(leave => leave.employeeId === emp.id);

      empLeaves.forEach(leave => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);

        if (leaveStart <= to && leaveEnd >= from) {
            const start = leaveStart < from ? from : leaveStart;
            const end = leaveEnd > to ? to : leaveEnd;
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
            if (days > 0) {
                annualLeaveDays += days;
                if (!annualLeaveData) {
                    annualLeaveData = { start: leave.startDate, end: leave.endDate };
                }
                // Optional: Add Annual Leave to notes as well if desired
                // autoNotes.push(`إجازة سنوية ${days} يوم`);
            }
        }
      });

      const totalAbsences = sickCount + casualCount + missionCount + deductionCount + annualLeaveDays;
      const presentCount = Math.max(0, totalDaysInPeriod - totalAbsences);

      return {
        ...emp,
        stats: {
          present: presentCount,
          sick: sickCount,
          casual: casualCount,
          mission: missionCount,
          deduction: deductionCount,
          annual: annualLeaveDays
        },
        annualLeave: annualLeaveData,
        notes: autoNotes.join('، ') // Join multiple notes with comma
      };
    });
  }, [employees, records, annualLeaves, dateRange]);

  const handlePrint = () => {
    printElement('printable-form');
  };

  const handleManualChange = (empId: string, value: string) => {
    setManualPresentCounts(prev => ({
      ...prev,
      [empId]: value
    }));
  };

  const handleSaveToArchive = () => {
    if (onSaveDocument) {
        onSaveDocument({
            type: 'MonthlyReport',
            title: `Monthly Report (${dateRange.from} - ${dateRange.to})`,
            date: new Date().toISOString(),
            data: { manualPresentCounts, dateRange }
        });
        alert(lang === 'ar' ? 'تم الحفظ في الأرشيف' : 'Saved to Archive');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
             <Calendar size={18} className="text-indigo-500" />
             <span className="text-indigo-700 dark:text-indigo-300 font-bold text-sm">
               {dateRange.from} <span className="mx-2">➔</span> {dateRange.to}
             </span>
          </div>

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
            <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
              <div className="text-right pt-2">
                  <h2 className="text-lg font-bold">المكتب القطري الموحد للتأمين</h2>
                  <h3 className="text-base text-gray-600">Unified Qatari Insurance Bureau</h3>
              </div>
              <div className="text-center pt-2">
                  <h1 className="text-2xl font-extrabold mb-2">تقرير شهري عن الحضور والإنصراف للموظفين</h1>
                  <h3 className="text-xl font-bold border-b border-black inline-block px-4" dir="ltr">
                     {dateRange.from} / {dateRange.to}
                  </h3>
              </div>
              <div className="text-left flex flex-col items-center">
                  <div className="relative group">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px` }} className="object-contain max-h-24" />
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 font-bold cursor-pointer hover:bg-gray-50">
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
                      <input type="range" min="50" max="150" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer" />
                    </div>
                  )}
              </div>
            </div>

            {/* Main Table */}
            <table className="w-full border-collapse border border-black text-center text-sm">
              <thead>
                <tr className="bg-gray-200 print:bg-gray-200 print-color-adjust">
                  <th rowSpan={2} className="border border-black p-2 w-10">م</th>
                  <th rowSpan={2} className="border border-black p-2 w-48">{t.colName}</th>
                  {/* ORDER: Present, Deduction, Casual, Sick, Mission, Annual */}
                  <th rowSpan={2} className="border border-black p-2 w-16 bg-green-50">{t.colPresent}</th>
                  <th rowSpan={2} className="border border-black p-2 w-16 bg-yellow-50">{t.colDeduction}</th>
                  <th rowSpan={2} className="border border-black p-2 w-16 bg-orange-50">{t.colCasual}</th>
                  <th rowSpan={2} className="border border-black p-2 w-16 bg-red-50">{t.colSick}</th>
                  <th rowSpan={2} className="border border-black p-2 w-16 bg-purple-50">{t.colMission}</th>
                  <th colSpan={2} className="border border-black p-2 bg-blue-50">{t.colAnnual}</th>
                  <th rowSpan={2} className="border border-black p-2 w-64">{t.colNotes}</th>
                </tr>
                <tr className="bg-gray-200 print:bg-gray-200 print-color-adjust">
                  <th className="border border-black p-1 bg-blue-50 text-xs w-24">{t.colStart}</th>
                  <th className="border border-black p-1 bg-blue-50 text-xs w-24">{t.colEnd}</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="border border-black p-2 font-bold">{idx + 1}</td>
                    <td className="border border-black p-2 font-bold text-right px-3">{row.name}</td>
                    
                    {/* 1. Present */}
                    <td className="border border-black p-0 bg-white">
                        <input 
                            type="text" 
                            className="w-full h-full text-center font-bold bg-transparent outline-none border-none p-1"
                            value={manualPresentCounts[row.id] !== undefined ? manualPresentCounts[row.id] : row.stats.present}
                            onChange={(e) => handleManualChange(row.id, e.target.value)}
                        />
                    </td>
                    {/* 2. Deduction */}
                    <td className="border border-black p-2 font-bold">{row.stats.deduction}</td>
                    {/* 3. Casual */}
                    <td className="border border-black p-2 font-bold">{row.stats.casual}</td>
                    {/* 4. Sick */}
                    <td className="border border-black p-2 font-bold">{row.stats.sick}</td>
                    {/* 5. Mission */}
                    <td className="border border-black p-2 font-bold">{row.stats.mission}</td>
                    
                    {/* 6. Annual (Start/End) */}
                    <td className="border border-black p-2 text-[10px] font-semibold">
                        {formatDateFull(row.annualLeave?.start || '')}
                    </td>
                    <td className="border border-black p-2 text-[10px] font-semibold">
                        {formatDateFull(row.annualLeave?.end || '')}
                    </td>

                    {/* 7. Auto Generated Notes */}
                    <td className="border border-black p-1 text-[11px] font-semibold text-right align-middle">
                       <div className="whitespace-pre-wrap leading-tight px-1">
                          {row.notes}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Signatures */}
            <div className="flex justify-between items-end mt-auto px-12 pb-4 pt-12">
               <div className="text-center">
                  <p className="font-bold text-lg mb-8">مسئول الشفت</p>
                  <p>................................</p>
               </div>
               <div className="text-center">
                  <p className="font-bold text-lg mb-8">مسئول الشفت</p>
                  <p>................................</p>
               </div>
               <div className="text-center">
                  <p className="font-bold text-lg mb-8">مسئول الشفت</p>
                  <p>................................</p>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportForm;
