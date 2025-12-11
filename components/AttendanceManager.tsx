import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus, AnnualLeaveRequest } from '../types';
import { translations } from '../utils/translations';

interface Props {
  employees: Employee[];
  records: AttendanceRecord[];
  annualLeaves: AnnualLeaveRequest[];
  onUpdateRecord: (record: AttendanceRecord) => void;
  lang: 'ar' | 'en';
  dateRange: { from: string, to: string };
  setDateRange: (range: { from: string, to: string }) => void;
}

const AttendanceManager: React.FC<Props> = ({ employees, records, onUpdateRecord, lang, dateRange, setDateRange }) => {
  const t = translations[lang].attendance;
  const isRTL = lang === 'ar';

  const getDaysArray = (start: string, end: string) => {
    const arr = []; const dt = new Date(start); const endDt = new Date(end);
    if (isNaN(dt.getTime()) || isNaN(endDt.getTime()) || dt > endDt) return [new Date()];
    while (dt <= endDt) { arr.push(new Date(dt)); dt.setDate(dt.getDate() + 1); }
    return arr;
  };
  const dates = useMemo(() => getDaysArray(dateRange.from, dateRange.to), [dateRange.from, dateRange.to]);

  const getRecord = (empId: string, dateStr: string) => records.find(r => r.employeeId === empId && r.date === dateStr);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto relative min-h-[500px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th>#</th>
              <th>{t.employee}</th>
              {dates.map(date => <th key={date.toISOString()}>{date.getDate()}</th>)}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, idx) => (
              <tr key={emp.id}>
                <td>{idx + 1}</td>
                <td>{emp.name}</td>
                {dates.map(date => {
                  const dateStr = date.toISOString().split('T')[0];
                  const record = getRecord(emp.id, dateStr);
                  return (
                    <td key={dateStr}>
                      <select
                        value={record?.status || ''}
                        onChange={(e) => onUpdateRecord({ employeeId: emp.id, date: dateStr, status: e.target.value as AttendanceStatus })}
                        className="bg-transparent w-full text-center"
                      >
                        <option value="">--</option>
                        <option value={AttendanceStatus.PRESENT}>Present</option>
                        <option value={AttendanceStatus.DEDUCTION}>Deduction</option>
                        <option value={AttendanceStatus.CASUAL}>Casual</option>
                        <option value={AttendanceStatus.SICK}>Sick</option>
                        <option value={AttendanceStatus.VACATION}>Vacation</option>
                        <option value={AttendanceStatus.MISSION}>Mission</option>
                        <option value={AttendanceStatus.LATE}>Late</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceManager;
