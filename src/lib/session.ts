import { SignJWT, jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'erp-ramyco-secret-key-change-in-production-2024'
);

export async function createSession(data: { userId: number; role: string; name: string; image?: string | null }) {
  return await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as { userId: number; role: string; name: string; image?: string | null };
  } catch {
    return null;
  }
}

// تابع تبدیل نقش انگلیسی به فارسی
export function normalizeRole(role: string): string {
  const roleMap: Record<string, string> = {
    'Factory_Manager': 'مدیر کارخانه',
    'Factory Manager': 'مدیر کارخانه',
    'ModirNet': 'مدیر نت',
    'Production_Supervisor': 'سرپرست تولید',
    'Production Supervisor': 'سرپرست تولید',
    'Repairer': 'تعمیرکار',
    'Operator': 'اپراتور',
    'Commerce': 'واحد مالی',
    'Contractor': 'پیمانکار'
  };
  return roleMap[role] || role;
}