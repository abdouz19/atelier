'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  username: z.string().min(1, 'اسم المستخدم مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const SPRING = { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 } as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: SPRING },
};

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -10, 10, -7, 7, -4, 4, 0] as number[],
    transition: { duration: 0.45 },
  },
};

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    await login(values.username, values.password);
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
      dir="rtl"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">أهلاً بعودتك</h1>
        <p className="mt-2 text-sm text-white/40">سجّل دخولك للوصول إلى لوحة التحكم</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key={error}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={SPRING}
            className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm font-medium text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        variants={shakeVariants}
        animate={error ? 'shake' : 'idle'}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
      >
        {/* Username */}
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label htmlFor="username" className="block text-sm font-medium text-white/70">
            اسم المستخدم
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
              <User className={`h-4 w-4 transition-colors duration-150 ${errors.username ? 'text-red-400' : 'text-white/25 group-focus-within:text-indigo-400'}`} />
            </div>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="أدخل اسم المستخدم"
              {...register('username')}
              className={`h-11 w-full rounded-xl border bg-white/5 pr-10 pl-4 text-sm text-white placeholder-white/20 outline-none backdrop-blur-sm transition-all duration-150 focus:ring-2 ${errors.username ? 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/15' : 'border-white/10 focus:border-indigo-400/50 focus:ring-indigo-400/15'}`}
            />
          </div>
          <AnimatePresence>
            {errors.username && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400">
                {errors.username.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Password */}
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-white/70">
            كلمة المرور
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
              <Lock className={`h-4 w-4 transition-colors duration-150 ${errors.password ? 'text-red-400' : 'text-white/25 group-focus-within:text-indigo-400'}`} />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="أدخل كلمة المرور"
              {...register('password')}
              className={`h-11 w-full rounded-xl border bg-white/5 pr-10 pl-10 text-sm text-white placeholder-white/20 outline-none backdrop-blur-sm transition-all duration-150 focus:ring-2 ${errors.password ? 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/15' : 'border-white/10 focus:border-indigo-400/50 focus:ring-indigo-400/15'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/25 transition-colors hover:text-white/60 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <AnimatePresence>
            {errors.password && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400">
                {errors.password.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit */}
        <motion.div variants={itemVariants} className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full overflow-hidden rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-400 hover:shadow-indigo-400/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>جاري الدخول...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                </>
              )}
            </span>
          </button>
        </motion.div>
      </motion.form>

      <motion.div variants={itemVariants} className="mt-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/8" />
        <span className="text-xs text-white/20">نظام إدارة الإنتاج النسيجي</span>
        <div className="h-px flex-1 bg-white/8" />
      </motion.div>
    </motion.div>
  );
}
