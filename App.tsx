import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "firebase/auth";
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

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCuRfIK7fVlL5NptRm9NATs8a6denXJ4Z8",
  authDomain: "qubiinsurance73.firebaseapp.com",
  projectId: "qubiinsurance73",
  storageBucket: "qubiinsurance73.firebasestorage.app",
  messagingSenderId: "859059365584",
  appId: "1:859059365584:web:b74acb7434bffc45c5a0d5",
  measurementId: "G-4ZJBYVQKJ0"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
  const [user, setUser] = useState<any>(null);
  const [loginCredentials, setLoginCredentials] = useState({ email: '', password: '' });

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

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginCredentials.email, loginCredentials.password);
    } catch (error) {
      alert(lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleForgotPassword = async () => {
    if (!loginCredentials.email) {
      alert(lang === 'ar' ? 'ادخل البريد الإلكتروني أولاً' : 'Enter your email first');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginCredentials.email);
      alert(lang === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور على بريدك الإلكتروني' : 'Password reset email sent');
    } catch (error) {
      alert(lang === 'ar' ? 'حدث خطأ أثناء إرسال البريد' : 'Error sending reset email');
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

  const handleSaveDocument = (doc: Omit<SavedDocument, 'id' | 'createdAt'>) => {
    const newDoc: SavedDocument = {
      ...doc,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setSavedDocuments(prev => [newDoc, ...prev]);
  };

  const handleDeleteDocument = (id: string) => setSavedDocuments(prev => prev.filter(d => d.id !== id));

  const handleLoadDocument = (doc: SavedDocument) => {
    setLoadedDocument(doc);
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
    if (typeToTab[doc.type]) setActiveTab(typeToTab[doc.type]);
  };

  const handleManualTabChange = (tab: string) => {
    setActiveTab(tab);
    setLoadedDocument(null);
  };

  const isRTL = lang === 'ar';

  if (!user) {
    const t = translations[lang];
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-bold mb-6">{t.sidebar.title}</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              required
              value={loginCredentials.email}
              onChange={e => setLoginCredentials({ ...loginCredentials, email: e.target.value })}
              className="w-full p-3 border rounded-xl"
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={loginCredentials.password}
              onChange={e => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
              className="w-full p-3 border rounded-xl"
            />
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl"> {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'} </button>
          </form>
          <button onClick={handleForgotPassword} className="mt-4 text-sm text-indigo-600 underline">
            {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-950`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar activeTab={activeTab} setActiveTab={handleManualTabChange} lang={lang} setLang={setLang} darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} />
      <main className="flex-1 p-6">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
