'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Lock, User, Factory, ChevronDown } from 'lucide-react'
import { loginAction } from '@/actions/auth'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loginSectionRef = useRef<HTMLDivElement>(null)
  const [isLoginVisible, setIsLoginVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (loginSectionRef.current) {
        const rect = loginSectionRef.current.getBoundingClientRect()
        if (rect.top < window.innerHeight - 100) {
          setIsLoginVisible(true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
    } catch (error) {
      // این بخش برای مدیریت ریدایرکت Next.js است
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        return
      }
      setError('خطایی در سرور رخ داد.')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative bg-slate-950 text-white overflow-x-hidden">
      
      {/* بک‌گراند ثابت */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#ed6e2b]/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-blue-500/10 blur-3xl animate-pulse delay-1000"></div>
        <div 
          className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>

      {/* بخش اول: انیمیشن ورود */}
      <section className="relative z-10 h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center opacity-0 animate-welcome">
          <h1 className="text-5xl md:text-8xl font-bold tracking-wider bg-gradient-to-r from-white via-[#ed6e2b] to-white bg-clip-text text-transparent animate-glow">
            ERP RAMYCO
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/60 tracking-wide">
            یکپارچه‌سازی مدیریت صنعتی و منابع انسانی
          </p>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
          <span className="text-sm text-white/40 mb-2">اسکرول کنید برای ورود</span>
          <ChevronDown className="w-8 h-8 text-[#ed6e2b]" />
        </div>
      </section>

      {/* بخش دوم: فرم لاگین */}
      <section ref={loginSectionRef} className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className={`w-full max-w-md reveal-up ${isLoginVisible ? 'is-visible' : ''}`}>
          
          <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10">
            
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#ed6e2b] flex items-center justify-center shadow-lg shadow-[#ed6e2b]/30 mb-4 transform transition-transform hover:scale-105">
                <Factory className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide">ورود به سیستم</h2>
              <p className="text-white/60 mt-2 text-sm">لطفاً اطلاعات کاربری خود را وارد نمایید</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
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

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 text-center">
                  {error}
                </div>
              )}

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
                  'ورود به سیستم'
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  )
}