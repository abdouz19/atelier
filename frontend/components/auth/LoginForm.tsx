'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  username: z.string().min(1, 'اسم المستخدم مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, error } = useAuth();

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
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg" dir="rtl">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        تسجيل الدخول
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="username"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            اسم المستخدم
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            {...register('username')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {isLoading ? 'جاري الدخول...' : 'دخول'}
        </button>
      </form>
    </div>
  );
}
