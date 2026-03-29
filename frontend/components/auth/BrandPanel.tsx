'use client';

import { motion } from 'framer-motion';
import { Scissors, BarChart3, Package, Users } from 'lucide-react';

const features = [
  {
    icon: Package,
    title: 'إدارة المخزون',
    desc: 'تتبع القماش والمستلزمات بدقة متناهية',
  },
  {
    icon: Scissors,
    title: 'جلسات القص',
    desc: 'تنظيم العمليات الإنتاجية من البداية للنهاية',
  },
  {
    icon: Users,
    title: 'إدارة الفريق',
    desc: 'متابعة الخياطين والموظفين والمدفوعات',
  },
  {
    icon: BarChart3,
    title: 'تحليلات ذكية',
    desc: 'لوحة تحكم شاملة للأداء والإنتاج',
  },
];

const SPRING = { type: 'spring', stiffness: 260, damping: 26 } as const;

export function BrandPanel() {
  return (
    <div className="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/login-bg.png)' }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#05091a]/80 via-[#0d1230]/60 to-[#12062a]/75" />

      {/* Animated glow orbs */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-indigo-500/20 blur-[120px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/3 h-72 w-72 rounded-full bg-violet-500/20 blur-[100px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Content */}
      <div className="relative z-10 flex max-w-lg flex-col items-center px-12 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...SPRING, delay: 0.1 }}
          className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md"
        >
          <Scissors className="h-8 w-8 text-white" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.2 }}
          className="mb-3 text-4xl font-bold leading-tight tracking-tight text-white"
        >
          أتيلييه
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.3 }}
          className="mb-12 text-lg leading-relaxed text-white/60"
        >
          نظام متكامل لإدارة الإنتاج النسيجي
          <br />
          <span className="text-white/40 text-sm">من القص إلى التوزيع بكفاءة عالية</span>
        </motion.p>

        {/* Feature cards grid */}
        <div className="grid w-full grid-cols-2 gap-3">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...SPRING, delay: 0.4 + i * 0.08 }}
              whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.12)' }}
              className="flex flex-col gap-2 rounded-xl bg-white/7 p-4 text-right ring-1 ring-white/10 backdrop-blur-sm transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-400/20 ring-1 ring-indigo-300/20">
                <feat.icon className="h-4 w-4 text-indigo-300" />
              </div>
              <p className="text-sm font-semibold text-white/90">{feat.title}</p>
              <p className="text-xs leading-relaxed text-white/45">{feat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Divider + tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-10 flex items-center gap-4"
        >
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/30">إدارة أذكى · إنتاج أفضل</span>
          <div className="h-px flex-1 bg-white/10" />
        </motion.div>
      </div>
    </div>
  );
}
