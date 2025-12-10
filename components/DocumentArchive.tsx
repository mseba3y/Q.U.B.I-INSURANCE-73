
import React, { useState } from 'react';
import { SavedDocument } from '../types';
import { translations } from '../utils/translations';
import { Archive, Search, Trash2, Eye, Calendar, FileText, User } from 'lucide-react';

interface DocumentArchiveProps {
  documents: SavedDocument[];
  onDelete: (id: string) => void;
  onLoad: (doc: SavedDocument) => void;
  lang: 'en' | 'ar';
}

const DocumentArchive: React.FC<DocumentArchiveProps> = ({ documents, onDelete, onLoad, lang }) => {
  const t = translations[lang].archive;
  const isRTL = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (doc.employeeName && doc.employeeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t.subtitle}</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className={`absolute top-3 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} size={18} />
           <input 
              type="text" 
              placeholder={translations[lang].attendance.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
           />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[400px]">
        {filteredDocs.length > 0 ? (
          <div className="overflow-x-auto">
             <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                   <tr>
                      <th className="px-6 py-4 text-start font-bold text-slate-600 dark:text-slate-300">{t.type}</th>
                      <th className="px-6 py-4 text-start font-bold text-slate-600 dark:text-slate-300">{t.ref}</th>
                      <th className="px-6 py-4 text-start font-bold text-slate-600 dark:text-slate-300">{t.date}</th>
                      <th className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-300">{t.actions}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                  <FileText size={18} />
                               </div>
                               <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  {t.types[doc.type] || doc.type}
                               </span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div>
                               <p className="font-medium text-slate-800 dark:text-white">{doc.title}</p>
                               {doc.employeeName && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                     <User size={12} />
                                     <span>{doc.employeeName}</span>
                                  </div>
                               )}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-500">
                               <Calendar size={14} />
                               <span>{new Date(doc.createdAt).toLocaleDateString()} {new Date(doc.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                               <button 
                                  onClick={() => onLoad(doc)}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                               >
                                  <Eye size={14} />
                                  <span>{t.load}</span>
                               </button>
                               <button 
                                  onClick={() => { if(window.confirm('Delete this document?')) onDelete(doc.id); }}
                                  className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
             <Archive size={64} className="mb-4 opacity-20" />
             <p className="text-lg font-medium">{t.noDocs}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentArchive;
