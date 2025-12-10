import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, Employee, AttendanceStatus } from "../types";

const getAIClient = () => {
  // Safely access process.env to prevent ReferenceError in browsers
  let apiKey = '';
  try {
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    console.warn("Error accessing process.env", e);
  }

  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAttendanceInsights = async (
  employees: Employee[],
  records: AttendanceRecord[],
  lang: 'en' | 'ar' = 'en'
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return lang === 'ar' ? "مفتاح API مفقود: يرجى إضافة مفتاح API لاستخدام ميزات الذكاء الاصطناعي." : "AI Configuration Missing: Please add your API_KEY to using the AI features.";

  // Prepare data summary for the AI
  const summary = {
    totalEmployees: employees.length,
    totalRecords: records.length,
    absentCount: records.filter(r => r.status === AttendanceStatus.DEDUCTION).length,
    lateCount: records.filter(r => r.status === AttendanceStatus.LATE).length,
    recentRecords: records.slice(-20) // Send last 20 records to avoid token limits in this demo
  };

  const languageInstruction = lang === 'ar' 
    ? "Provide the response strictly in Arabic language." 
    : "Provide the response in English language.";

  const prompt = `
    You are an expert HR Analyst for "AttendanceEase". 
    Analyze the following attendance summary data:
    ${JSON.stringify(summary, null, 2)}

    Please provide:
    1. A brief analysis of the attendance trends.
    2. Three actionable recommendations to improve attendance.
    3. Identify any potential issues based on the high-level stats (e.g., high absenteeism).

    Keep the tone professional yet encouraging. Format the response in Markdown.
    ${languageInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || (lang === 'ar' ? "لا يمكن توليد رؤى في هذا الوقت." : "No insights could be generated at this time.");
  } catch (error) {
    console.error("Error generating insights:", error);
    return lang === 'ar' ? "فشل في توليد الرؤى. يرجى المحاولة مرة أخرى لاحقًا." : "Failed to generate AI insights. Please try again later.";
  }
};