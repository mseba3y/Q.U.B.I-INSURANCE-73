


import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AttendanceManager from './components/AttendanceManager';
import EmployeeList from './components/EmployeeList';
import AIReport from './components/AIReport';
import CasualLeaveForm from './components/CasualLeaveForm';
import AnnualLeaveForm from './components/AnnualLeaveForm';
import WorkResumptionForm from './components/WorkResumptionForm';
import OvertimeForm from './components/OvertimeForm';
import PaymentVoucherForm from './components/PaymentVoucherForm';
import BillsDueForm from './components/BillsDueForm';
import MonthlyReportForm from './components/MonthlyReportForm';
import CustodyForm from './components/CustodyForm';
import CashForm from './components/CashForm';
import DailyClosingForm from './components/DailyClosingForm';
import MoneyReceiptForm from './components/MoneyReceiptForm';
import BankDepositG4Form from './components/BankDepositG4Form';
import NotesForm from './components/NotesForm';
import DocumentArchive from './components/DocumentArchive';
import { Employee, AttendanceRecord, AnnualLeaveRequest, SavedDocument } from './types';
import { Lock, User, LogIn } from 'lucide-react';
import { translations } from './utils/translations';

// Safe UUID Generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Mock Initial Data
const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Sarah Connor', role: 'Project Manager', department: 'Management', joinDate: '2023-01-15', avatarUrl: 'https://picsum.photos/seed/sarah/200' },
  { id: '2', name: 'John Doe', role: 'Software Engineer', department: 'Engineering', joinDate: '2023-03-10', avatarUrl: 'https://picsum.photos/seed/john/200' },
  { id: '3', name: 'Emily Chen', role: 'UX Designer', department: 'Design', joinDate: '2023-06-22', avatarUrl: 'https://picsum.photos/seed/emily/200' },
  { id: '4', name: 'Michael Scott', role: 'Regional Manager', department: 'Sales', joinDate: '2022-11-01', avatarUrl: 'https://picsum.photos/seed/mike/200' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState<'en' | 'ar'>('ar');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
        const saved = localStorage.getItem('ae_theme');
        return saved === 'dark';
    } catch { return false; }
  });

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('ae_auth') === 'true';
  });
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  
  // Lifted Date State
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 6);
  const [dateRange, setDateRange] = useState({
    from: lastWeek.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0]
  });

  // State for data to be loaded into a form from the Archive
  const [loadedDocument, setLoadedDocument] = useState<SavedDocument | null>(null);

  // Persisted State - Employees
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('ae_employees');
      const parsed = saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
      return Array.isArray(parsed) ? parsed : INITIAL_EMPLOYEES;
    } catch (e) { return INITIAL_EMPLOYEES; }
  });
  
  // Persisted State - Attendance Records
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ae_records');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });

  // Persisted State - Annual Leave Requests
  const [annualLeaves, setAnnualLeaves] = useState<AnnualLeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem('ae_annual_leave_requests');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });

  // Persisted State - Saved Documents (Archive)
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>(() => {
    try {
      const saved = localStorage.getItem('ae_archived_documents');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });

  // Logo State (Global)
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try { return localStorage.getItem('ae_logo') || ''; } catch { return ''; }
  });

  // Effects for Persistence
  useEffect(() => {
    try {
        if (darkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('ae_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('ae_theme', 'light');
        }
    } catch (e) { console.error('Theme storage error', e); }
  }, [darkMode]);

  useEffect(() => {
    try { localStorage.setItem('ae_employees', JSON.stringify(employees)); } 
    catch (e) { console.error('Storage error', e); }
  }, [employees]);

  useEffect(() => {
    try { localStorage.setItem('ae_records', JSON.stringify(records)); } 
    catch (e) { console.error('Storage error', e); }
  }, [records]);

  useEffect(() => {
    try { localStorage.setItem('ae_annual_leave_requests', JSON.stringify(annualLeaves)); } 
    catch (e) { console.error('Storage error', e); }
  }, [annualLeaves]);

  useEffect(() => {
    try { localStorage.setItem('ae_archived_documents', JSON.stringify(savedDocuments)); } 
    catch (e) { console.error('Archive storage error', e); }
  }, [savedDocuments]);

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginCredentials.username && loginCredentials.password) {
        setIsAuthenticated(true);
        localStorage.setItem('ae_auth', 'true');
    }
  };

  const handleLogout = () => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?')) {
        setIsAuthenticated(false);
        localStorage.removeItem('ae_auth');
        setLoginCredentials({ username: '', password: '' });
        setActiveTab('dashboard');
    }
  };

  const handleAddEmployee = (emp: Employee) => setEmployees([...employees, emp]);
  const handleEditEmployee = (updatedEmp: Employee) => setEmployees(prev => prev.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp));
  const handleRemoveEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    setRecords(prev => prev.filter(r => r.employeeId !== id));
    setAnnualLeaves(prev => prev.filter(l => l.employeeId !== id));
  };
  const handleUpdateRecord = (record: AttendanceRecord) => {
    setRecords(prev => {
      const filtered = prev.filter(r => !(r.employeeId === record.employeeId && r.date === record.date));
      return [...filtered, record];
    });
  };
  const handleClearRecords = () => setRecords([]);
  const handleAddAnnualLeave = (request: AnnualLeaveRequest) => setAnnualLeaves(prev => [...prev, request]);
  
  const handleLoadData = (newEmployees: Employee[], newRecords: AttendanceRecord[], newLeaves?: AnnualLeaveRequest[]) => {
    if (Array.isArray(newEmployees)) setEmployees(newEmployees);
    if (Array.isArray(newRecords)) setRecords(newRecords);
    if (newLeaves && Array.isArray(newLeaves)) setAnnualLeaves(newLeaves);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoUrl(base64);
        try { localStorage.setItem('ae_logo', base64); } catch (e) { console.error(e); }
      };
      reader.readAsDataURL(file);
    }
  };

  // ARCHIVE HANDLERS
  const handleSaveDocument = (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => {
    const newDoc: SavedDocument = {
      ...doc,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setSavedDocuments(prev => [newDoc, ...prev]);
  };

  const handleDeleteDocument = (id: string) => {
    setSavedDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleLoadDocument = (doc: SavedDocument) => {
    setLoadedDocument(doc);
    // Map document type to tab ID
    const typeToTab: Record<string, string> = {
        'CasualLeave': 'casualLeave',
        'AnnualLeave': 'annualLeave',
        'WorkResumption': 'workResumption',
        'PaymentVoucher': 'paymentVoucher',
        'Overtime': 'overtime',
        'BillsDue': 'billsDue',
        'MonthlyReport': 'monthlyReport',
        'CustodyForm': 'custody',
        'CashForm': 'cash',
        'DailyClosingForm': 'dailyClosing',
        'MoneyReceiptForm': 'moneyReceipt',
        'BankDepositG4': 'bankDepositG4',
        'NotesForm': 'notesForm'
    };
    if (typeToTab[doc.type]) {
        setActiveTab(typeToTab[doc.type]);
    }
  };

  // When switching tabs manually via Sidebar, we want to clear the loaded document
  const handleManualTabChange = (tab: string) => {
    setActiveTab(tab);
    setLoadedDocument(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={employees} records={records} lang={lang} />;
      case 'employees': return <EmployeeList employees={employees} onAddEmployee={handleAddEmployee} onEditEmployee={handleEditEmployee} onRemoveEmployee={handleRemoveEmployee} lang={lang} />;
      case 'attendance': return <AttendanceManager employees={employees} records={records} annualLeaves={annualLeaves} onUpdateRecord={handleUpdateRecord} onAddEmployee={handleAddEmployee} onEditEmployee={handleEditEmployee} onRemoveEmployee={handleRemoveEmployee} onClearRecords={handleClearRecords} onLoadData={handleLoadData} lang={lang} dateRange={dateRange} setDateRange={setDateRange} />;
      case 'monthlyReport': return <MonthlyReportForm employees={employees} records={records} annualLeaves={annualLeaves} lang={lang} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} dateRange={dateRange} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'MonthlyReport' ? loadedDocument.data : null} />;
      case 'casualLeave': return <CasualLeaveForm employees={employees} lang={lang} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'CasualLeave' ? loadedDocument.data : null} />;
      case 'annualLeave': return <AnnualLeaveForm employees={employees} onAddRequest={handleAddAnnualLeave} lang={lang} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'AnnualLeave' ? loadedDocument.data : null} />;
      case 'workResumption': return <WorkResumptionForm employees={employees} lang={lang} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'WorkResumption' ? loadedDocument.data : null} />;
      case 'paymentVoucher': return <PaymentVoucherForm employees={employees} lang={lang} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'PaymentVoucher' ? loadedDocument.data : null} />;
      case 'billsDue': return <BillsDueForm employees={employees} lang={lang} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'BillsDue' ? loadedDocument.data : null} />;
      case 'overtime': return <OvertimeForm employees={employees} lang={lang} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'Overtime' ? loadedDocument.data : null} />;
      case 'custody': return <CustodyForm lang={lang} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'CustodyForm' ? loadedDocument.data : null} />;
      case 'cash': return <CashForm lang={lang} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'CashForm' ? loadedDocument.data : null} />;
      case 'dailyClosing': return <DailyClosingForm lang={lang} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'DailyClosingForm' ? loadedDocument.data : null} />;
      case 'moneyReceipt': return <MoneyReceiptForm lang={lang} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'MoneyReceiptForm' ? loadedDocument.data : null} />;
      case 'bankDepositG4': return <BankDepositG4Form lang={lang} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'BankDepositG4' ? loadedDocument.data : null} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} />;
      case 'notesForm': return <NotesForm lang={lang} onSaveDocument={handleSaveDocument} initialData={loadedDocument?.type === 'NotesForm' ? loadedDocument.data : null} logoUrl={logoUrl} onLogoUpload={handleLogoUpload} />;
      case 'archive': return <DocumentArchive documents={savedDocuments} onDelete={handleDeleteDocument} onLoad={handleLoadDocument} lang={lang} />;
      case 'insights': return <AIReport employees={employees} records={records} lang={lang} />;
      default: return <Dashboard employees={employees} records={records} lang={lang} />;
    }
  };

  const isRTL = lang === 'ar';

  if (!isAuthenticated) {
     const t = translations[lang];
     
     return (
       <div 
         className={`min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden`}
         dir={isRTL ? 'rtl' : 'ltr'}
         style={{ fontFamily: isRTL ? 'Cairo, sans-serif' : 'Inter, sans-serif' }}
       >
          {/* Background Pattern */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          </div>

          <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10 animate-in fade-in zoom-in-95">
             <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-indigo-500/30 mb-4">
                  Q
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.sidebar.title}</h1>
                <p className="text-slate-500 dark:text-slate-400">{t.dashboard.welcome}</p>
             </div>

             <form onSubmit={handleLogin} className="space-y-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{lang === 'ar' ? 'اسم المستخدم' : 'Username'}</label>
                   <div className="relative">
                      <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
                         <User size={18} />
                      </div>
                      <input 
                        type="text" 
                        required
                        value={loginCredentials.username}
                        onChange={e => setLoginCredentials({...loginCredentials, username: e.target.value})}
                        className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white`}
                        placeholder="admin"
                        autoFocus
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                   <div className="relative">
                      <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
                         <Lock size={18} />
                      </div>
                      <input 
                        type="password" 
                        required
                        value={loginCredentials.password}
                        onChange={e => setLoginCredentials({...loginCredentials, password: e.target.value})}
                        className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white`}
                        placeholder="••••••••"
                      />
                   </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <LogIn size={20} />
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </button>
             </form>

             <div className="mt-8 flex items-center justify-center gap-4 text-xs font-medium text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-6">
                <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                   {lang === 'en' ? 'العربية' : 'English'}
                </button>
                <button onClick={() => setDarkMode(!darkMode)} className="hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                   {darkMode ? (lang === 'ar' ? 'وضع النهار' : 'Light Mode') : (lang === 'ar' ? 'وضع الليل' : 'Dark Mode')}
                </button>
             </div>
             
             {/* Login Page Footer */}
             <div className="mt-6 text-center">
                 <p className="text-slate-400 dark:text-slate-600 text-[10px] font-semibold">
                    Created By Mohamed El-Sebaie
                 </p>
             </div>
          </div>
       </div>
     );
  }

  return (
    <div 
      className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden" 
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRTL ? 'Cairo, sans-serif' : 'Inter, sans-serif' }}
    >
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>
      <div>
        <Sidebar activeTab={activeTab} setActiveTab={handleManualTabChange} lang={lang} setLang={setLang} darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} />
      </div>
      <main className={`flex-1 p-6 md:p-8 overflow-y-auto h-screen transition-all duration-300 z-10 ${isRTL ? 'md:mr-72' : 'md:ml-72'}`}>
        <div className="max-w-7xl mx-auto pb-10 flex flex-col min-h-[calc(100vh-100px)]">
          <div className="flex-1">
             {renderContent()}
          </div>
          
          <footer className="mt-10 py-6 text-center border-t border-slate-200 dark:border-slate-800/50">
             <p className="text-slate-400 dark:text-slate-600 text-sm font-semibold tracking-wide flex items-center justify-center gap-1">
                Created By Mohamed El-Sebaie
             </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;