'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, User, Factory, ArrowLeft } from 'lucide-react'
import { loginAction } from '@/actions/auth'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    try {
      // چون redirect در سرور اکشن انجام می‌شود، اگر خطایی باشد اینجا دریافت می‌شود
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
    } catch (error) {
      // اگر سرور اکشن ریدایرکت کند، Next.js یک خطای خاص پرتاب می‌کند که نباید به کاربر نشان داده شود
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        return
      }
      setError('خطایی در سرور رخ داد. لطفاً دوباره تلاش کنید.')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4 bg-slate-950">
      
      {/* بک‌گراند انیمیشنی و صنعتی */}
      <div className="absolute inset-0 z-0">
        {/* دایره‌های متحرک برای حس صنعتی و تکنولوژی */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#ed6e2b]/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-3xl animate-pulse delay-1000"></div>
        
        {/* شبکه‌بندی پس‌زمینه */}
        <div 
          className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>

      {/* کارت لاگین شیشه‌ای */}
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10">
          
          {/* لوگو و عنوان */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#ed6e2b] flex items-center justify-center shadow-lg shadow-[#ed6e2b]/30 mb-4 transform transition-transform hover:scale-105">
              <Factory className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-wide">ERP RAMYCO</h1>
            <p className="text-white/60 mt-2 text-sm">سیستم یکپارچه مدیریت، تعمیرات و حقوق و دستمزد</p>
          </div>

          {/* فرم لاگین */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* فیلد نام کاربری */}
            <div className="relative group">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-[#ed6e2b] transition-colors" />
              <input
                type="text"
                name="username"
                required
                placeholder="نام کاربری"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3.5 pr-12 pl-4 outline-none focus:border-[#ed6e2b] focus:ring-2 focus:ring-[#ed6e2b]/20 transition-all duration-300 placeholder:text-white/40"
              />
            </div>

            {/* فیلد پسورد */}
            <div className="relative group">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-[#ed6e2b] transition-colors" />
              <input
                type="password"
                name="password"
                required
                placeholder="رمز عبور"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3.5 pr-12 pl-4 outline-none focus:border-[#ed6e2b] focus:ring-2 focus:ring-[#ed6e2b]/20 transition-all duration-300 placeholder:text-white/40"
              />
            </div>

            {/* نمایش خطا */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 text-center animate-shake">
                {error}
              </div>
            )}

            {/* دکمه ورود */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ed6e2b] hover:bg-[#d65f1f] text-white font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-[#ed6e2b]/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ورود...
                </>
              ) : (
                <>
                  ورود به سیستم
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* فوتر */}
          <div className="mt-8 text-center text-xs text-white/40">
            © {new Date().getFullYear()} ERP Ramyco. تمامی حقوق محفوظ است.
          </div>
        </div>
      </div>
    </div>
  )
}