import React, { useState } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { generateAttendanceInsights } from '../services/geminiService';
import { Sparkles, RefreshCw, AlertTriangle, Bot } from 'lucide-react';
import { translations } from '../utils/translations';

interface AIReportProps {
  employees: Employee[];
  records: AttendanceRecord[];
  lang: 'en' | 'ar';
}

const AIReport: React.FC<AIReportProps> = ({ employees, records, lang }) => {
  const t = translations[lang].insights;
  const isRTL = lang === 'ar';
  
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateAttendanceInsights(employees, records, lang);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-10">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-2xl shadow-xl shadow-indigo-500/30 mb-2">
          <Bot className="text-white w-10 h-10" />
        </div>
        <div>
           <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">{t.title}</h2>
           <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
             {t.desc}
           </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`flex items-center space-x-3 px-10 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-xl ${
            loading 
            ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-wait' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/40 ring-4 ring-indigo-50 dark:ring-indigo-900/20'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin" />
              <span>{t.btnLoading}</span>
            </>
          ) : (
            <>
              <Sparkles size={22} className={isRTL ? 'ml-2' : 'mr-2'} />
              <span>{t.btnGenerate}</span>
            </>
          )}
        </button>
      </div>

      {report && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-8">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1.5"></div>
          <div className="p-8 md:p-10">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <Sparkles className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
              <span>{t.reportTitle}</span>
            </h3>
            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
              {report.split('\n').map((line, i) => {
                 if (line.trim().startsWith('#')) {
                    const level = line.match(/^#+/)?.[0].length || 1;
                    const text = line.replace(/^#+/, '');
                    return <h4 key={i} className={`font-bold text-indigo-900 dark:text-indigo-300 mt-6 mb-3 ${level === 1 ? 'text-xl' : 'text-lg'}`}>{text}</h4>;
                 }
                 if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
                    return (
                       <div key={i} className="flex gap-3 mb-3 ml-2">
                          <span className="text-indigo-500 mt-1.5">•</span>
                          <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{line.replace(/[*|-]/g, '')}</span>
                       </div>
                    );
                 }
                 if (line.trim().length === 0) return <div key={i} className="h-4"></div>;
                 return <p key={i} className="text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">{line}</p>
              })}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 text-center text-xs font-medium text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
            {t.footer}
          </div>
        </div>
      )}

      {!report && !loading && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 flex items-start gap-4 max-w-2xl mx-auto">
          <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-400">{t.privacyTitle}</h4>
            <p className="text-amber-800 dark:text-amber-500/80 text-sm mt-1 leading-relaxed">
              {t.privacyDesc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReport;