"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Factory,
  Loader2,
  Lock,
  User,
  ArrowLeft,
} from "lucide-react";

import { loginAction } from "@/actions/auth";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginVisible, setIsLoginVisible] = useState(false);

  const loginSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = loginSectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoginVisible(true);
        }
      },
      {
        threshold: 0.15,
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const scrollToLogin = () => {
    loginSectionRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await loginAction(formData);

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
        return;
      }

      setError("خطایی در سرور رخ داد.");
      setIsLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="relative min-h-dvh w-full overflow-x-hidden bg-[#030712] text-white"
    >
      {/* ========================================================= */}
      {/* BACKGROUND */}
      {/* ========================================================= */}

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Orange glow */}
        <div
          className="
            absolute
            -left-[15%]
            -top-[20%]
            h-[600px]
            w-[600px]
            rounded-full
            bg-[#ed6e2b]/[0.07]
            blur-[120px]
          "
        />

        {/* Blue glow */}
        <div
          className="
            absolute
            -bottom-[20%]
            -right-[10%]
            h-[700px]
            w-[700px]
            rounded-full
            bg-blue-600/[0.07]
            blur-[140px]
          "
        />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(255,255,255,1) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255,255,255,1) 1px,
                transparent 1px
              )
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Vignette */}
        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(
              ellipse_at_center,
              transparent_0%,
              rgba(3,7,18,0.35)_55%,
              rgba(3,7,18,0.9)_100%
            )]
          "
        />
      </div>

      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}
      <section
        className="
    relative
    z-10
    flex
    min-h-[100dvh]
    w-full
    items-center
    justify-center
    px-6
  "
      >
        <div className="flex w-full max-w-4xl flex-col items-center text-center">
          {/* Logo */}
          <div className="animate-hero-logo relative mb-12">
            <div
              className="
          absolute
          left-1/2
          top-1/2
          h-40
          w-72
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#ed6e2b]/10
          blur-[80px]
        "
            />

            <img
              src="/MainLogo.png"
              alt="Ramyco"
              className="
          relative
          h-auto
          w-[300px]
          max-w-[75vw]
          object-contain
          drop-shadow-[0_15px_40px_rgba(237,110,43,0.15)]
          md:w-[380px]
        "
            />
          </div>

          {/* Title */}
          <h1
            className="
        animate-hero-content
        max-w-3xl
        text-3xl
        font-bold
        leading-[1.7]
        tracking-tight
        text-white
        sm:text-4xl
        md:text-5xl
      "
          >
            یکپارچه‌سازی
            <span className="text-[#ed6e2b]"> مدیریت صنعتی </span>
            و
            <br className="hidden sm:block" />
            منابع انسانی
          </h1>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToLogin}
          className="
      absolute
      bottom-8
      left-1/2
      flex
      -translate-x-1/2
      flex-col
      items-center
      gap-2
      text-white/35
      transition-colors
      hover:text-white/60
    "
        >
          <span className="text-[11px]">برای ورود اسکرول کنید</span>

          <ChevronDown
            className="
        h-5
        w-5
        animate-bounce
        text-[#ed6e2b]
      "
          />
        </button>
      </section>
      {/* ========================================================= */}
      {/* LOGIN */}
      {/* ========================================================= */}

      <section
        ref={loginSectionRef}
        className="
          relative
          z-10
          flex
          min-h-[100dvh]
          w-full
          items-center
          justify-center
          px-5
          py-20
        "
      >
        <div
          className={`
            w-full
            max-w-[440px]
            transition-all
            duration-1000
            ${
              isLoginVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }
          `}
        >
          {/* Login Card */}
          <div
            className="
              relative
              overflow-hidden
              rounded-[28px]
              border
              border-white/[0.09]
              bg-white/[0.045]
              p-7
              shadow-[0_30px_100px_rgba(0,0,0,0.4)]
              backdrop-blur-2xl
              sm:p-9
            "
          >
            {/* Card top glow */}
            <div
              className="
                pointer-events-none
                absolute
                -right-20
                -top-20
                h-40
                w-40
                rounded-full
                bg-[#ed6e2b]/10
                blur-[70px]
              "
            />

            {/* Header */}
            <div className="relative mb-8 text-center">
              <div
                className="
                  mx-auto
                  mb-5
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#ed6e2b]
                  shadow-[0_12px_35px_rgba(237,110,43,0.22)]
                "
              >
                <Factory className="h-7 w-7 text-white" />
              </div>

              <h2 className="text-2xl font-bold">ورود به سیستم</h2>

              <p className="mt-2 text-sm text-white/40">
                برای ادامه، اطلاعات حساب خود را وارد کنید
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative space-y-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-xs font-medium text-white/50"
                >
                  نام کاربری
                </label>

                <div className="group relative">
                  <User
                    className="
                      absolute
                      right-4
                      top-1/2
                      h-5
                      w-5
                      -translate-y-1/2
                      text-white/25
                      transition-colors
                      group-focus-within:text-[#ed6e2b]
                    "
                  />

                  <input
                    id="username"
                    type="text"
                    name="username"
                    required
                    autoComplete="username"
                    placeholder="نام کاربری خود را وارد کنید"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-white/[0.08]
                      bg-black/20
                      py-4
                      pl-4
                      pr-12
                      text-sm
                      text-white
                      outline-none
                      transition-all
                      duration-300
                      placeholder:text-white/20
                      focus:border-[#ed6e2b]/60
                      focus:bg-black/30
                      focus:ring-4
                      focus:ring-[#ed6e2b]/10
                    "
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-medium text-white/50"
                >
                  رمز عبور
                </label>

                <div className="group relative">
                  <Lock
                    className="
                      absolute
                      right-4
                      top-1/2
                      h-5
                      w-5
                      -translate-y-1/2
                      text-white/25
                      transition-colors
                      group-focus-within:text-[#ed6e2b]
                    "
                  />

                  <input
                    id="password"
                    type="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    placeholder="رمز عبور خود را وارد کنید"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-white/[0.08]
                      bg-black/20
                      py-4
                      pl-4
                      pr-12
                      text-sm
                      text-white
                      outline-none
                      transition-all
                      duration-300
                      placeholder:text-white/20
                      focus:border-[#ed6e2b]/60
                      focus:bg-black/30
                      focus:ring-4
                      focus:ring-[#ed6e2b]/10
                    "
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-500/20
                    bg-red-500/[0.07]
                    p-3
                    text-center
                    text-xs
                    text-red-400
                  "
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  mt-2
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#ed6e2b]
                  py-4
                  text-sm
                  font-bold
                  text-white
                  shadow-[0_12px_30px_rgba(237,110,43,0.18)]
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:bg-[#f27a38]
                  hover:shadow-[0_16px_40px_rgba(237,110,43,0.25)]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    در حال ورود...
                  </>
                ) : (
                  <>
                    ورود به سیستم
                    <ArrowLeft className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-7 border-t border-white/[0.06] pt-5 text-center">
              <span className="text-[11px] text-white/25">
                Ramyco Management System
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
