import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Mail, Briefcase, Edit, User, Calendar } from 'lucide-react';
import { translations } from '../utils/translations';
import { 
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc 
} from "firebase/firestore";
import { db } from "./firebase";


const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const EmployeeList = ({ lang }) => {
  const t = translations[lang].employees;
  const isRTL = lang === 'ar';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: '',
  });

  // Load employees from Firestore
  useEffect(() => {
    const fetchEmployees = async () => {
      const snap = await getDocs(collection(db, "employees"));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(list);
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ name: '', role: '', department: '' });
    setShowForm(true);
  };

  const handleEditClick = (emp) => {
    setEditingId(emp.id);
    setFormData({ name: emp.name, role: emp.role, department: emp.department });
    setShowForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm(t.confirmRemoveEmp)) {
      await deleteDoc(doc(db, "employees", id));
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.name && formData.role && formData.department) {
      if (editingId) {
        // Update Firestore
        const docRef = doc(db, "employees", editingId);
        await updateDoc(docRef, {
          name: formData.name,
          role: formData.role,
          department: formData.department
        });

        setEmployees(employees.map(e => 
          e.id === editingId
            ? { ...e, name: formData.name, role: formData.role, department: formData.department }
            : e
        ));
      } 
      else {
        // Add new employee
        const newEmp = {
          name: formData.name,
          role: formData.role,
          department: formData.department,
          joinDate: new Date().toISOString().split('T')[0],
          avatarUrl: `https://picsum.photos/seed/${Math.random()}/200`
        };

        const ref = await addDoc(collection(db, "employees"), newEmp);
        setEmployees([...employees, { id: ref.id, ...newEmp }]);
      }

      setFormData({ name: '', role: '', department: '' });
      setShowForm(false);
    }
  };

  if (loading) {
    return <p className="text-center py-10 text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-8 animate-fade-in">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t.subtitle}</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/20 font-semibold"
        >
          <Plus size={20} className={isRTL ? 'ml-2' : 'mr-2'} />
          <span>{t.add}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white flex items-center gap-2">
            <User className="text-indigo-500" />
            {editingId ? t.editTitle : t.newTitle}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.namePlaceholder}</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.rolePlaceholder}</label>
              <input
                type="text"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.deptPlaceholder}</label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                required
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
              >
                {t.cancel}
              </button>

              <button 
                type="submit" 
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition-all"
              >
                {editingId ? t.update : t.create}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <img src={emp.avatarUrl} alt={emp.name} className="w-14 h-14 rounded-full object-cover bg-slate-100 ring-4 ring-slate-50 dark:ring-slate-800 group-hover:ring-indigo-50 dark:group-hover:ring-indigo-900/20 transition-all" />
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{emp.name}</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{emp.role}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                    onClick={() => handleEditClick(emp)}
                    className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    title={t.edit}
                 >
                    <Edit size={18} />
                 </button>
                 <button 
                    onClick={() => handleDeleteClick(emp.id)}
                    className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title="Remove"
                 >
                    <Trash2 size={18} />
                 </button>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"><Briefcase size={14} /></div>
                <span>{emp.department}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"><Mail size={14} /></div>
                <span>{emp.name.toLowerCase().replace(' ', '.')}@company.com</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"><Calendar size={14} /></div>
                <span>{t.joined} {emp.joinDate}</span>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeList;
