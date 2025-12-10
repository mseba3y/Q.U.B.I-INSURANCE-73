
export enum AttendanceStatus {
  PRESENT = 'Present',
  DEDUCTION = 'Deduction', // إجازة بالخصم
  CASUAL = 'Casual', // إجازة عرضية
  SICK = 'Sick', // إجازة مرضية
  MISSION = 'Mission', // مباشرة عمل
  LATE = 'Late', // تأخير
  VACATION = 'Vacation' // إجازة سنوية (Keeping generic vacation if needed, or mapped to others)
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 string
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  joinDate: string;
  avatarUrl: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // ISO Date string YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
  checkInTime?: string;
  attachments?: Attachment[];
}

export interface DailyStats {
  date: string;
  present: number;
  absent: number;
  late: number;
}

export interface AnnualLeaveRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  duration: string;
  createdAt: string;
}

export interface SavedDocument {
  id: string;
  type: 'CasualLeave' | 'AnnualLeave' | 'WorkResumption' | 'PaymentVoucher' | 'Overtime' | 'BillsDue' | 'MonthlyReport' | 'CustodyForm' | 'CashForm' | 'DailyClosingForm' | 'MoneyReceiptForm' | 'BankDepositG4' | 'NotesForm';
  title: string;
  date: string;
  createdAt: string;
  data: any;
  employeeName?: string;
}
