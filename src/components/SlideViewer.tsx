import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlideData, DeckMetadata } from '../types';
import { DynamicIcon } from './DynamicIcon';
import {
  Scale,
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
  Layers,
  Database,
  Users,
  Briefcase,
  FileCheck2,
  Zap,
  Building2,
  HeartHandshake,
  Bot
} from 'lucide-react';

interface SlideViewerProps {
  slide: SlideData;
  metadata: DeckMetadata;
  onOpenDemo: () => void;
  onOpenQA: () => void;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  slide,
  metadata,
  onOpenDemo,
  onOpenQA,
}) => {
  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 min-h-[calc(100vh-140px)] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, y: 15, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.99 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full flex flex-col justify-between"
        >
          {/* Header Block for Slide 2-11 */}
          {slide.id !== 1 && (
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <DynamicIcon name={slide.iconName} size={18} />
                </div>
                <span className="text-xs font-mono tracking-widest text-amber-400 uppercase">
                  {slide.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
                {slide.headline}
              </h1>

              {/* Short Gold Underline Divider */}
              <div className="h-1 w-16 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mt-2 shadow-sm shadow-amber-500/50" />
            </div>
          )}

          {/* SLIDE CONTENT ROUTER */}

          {/* SLIDE 1: Title Slide */}
          {slide.id === 1 && (
            <div className="flex flex-col items-center text-center py-8 sm:py-12 my-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="relative mb-8"
              >
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20">
                  <Scale className="w-14 h-14 sm:w-18 sm:h-18 text-amber-400" />
                  <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-slate-900 border border-blue-400/40 text-blue-400 shadow-lg">
                    <Brain className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-2"
              >
                MERA WAKEEL AI
              </motion.h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="h-1 w-32 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full mb-4 shadow-md shadow-amber-500/50"
              />

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-400 tracking-wide mb-3"
              >
                {slide.subtitle}
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl text-slate-300 font-medium max-w-xl mb-10"
              >
                "{slide.tagline}"
              </motion.p>

              {/* Action Buttons & Meta Footer */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-4 mb-10"
              >
                <button
                  onClick={onOpenDemo}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <Sparkles className="w-5 h-5 text-slate-950" />
                  Launch Live AI Assistant Demo
                </button>
                <button
                  onClick={onOpenQA}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center gap-2"
                >
                  <Brain className="w-5 h-5 text-blue-400" />
                  Ask Technical Judge Q&A
                </button>
              </motion.div>

              <div className="pt-6 border-t border-slate-800/80 max-w-md w-full">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                  {metadata.teamName} • {metadata.collegeName}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {metadata.hackathonName} Submission
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 2: Problem Statement */}
          {slide.id === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-4">
                {slide.bullets?.map((bullet, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 transition-all"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                      <DynamicIcon name="AlertTriangle" size={18} />
                    </div>
                    <p className="text-base sm:text-lg text-slate-200 font-medium leading-relaxed">
                      {bullet}
                    </p>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-l-4 border-amber-400 mt-6"
                >
                  <p className="text-lg sm:text-xl font-bold text-amber-300 italic">
                    "{slide.punchyLine}"
                  </p>
                </motion.div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-xl flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-slate-800/80 border border-amber-500/40 text-amber-400 mb-4 shadow-lg">
                    <DynamicIcon name="FileSearch" size={48} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">5 Crore+ Pending Cases</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Lack of early legal guidance forces millions into unnecessary lawsuits and extortionate settlement fees.
                  </p>
                  <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-left">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-mono">Dispute Types</span>
                      <p className="text-xs font-semibold text-amber-300">Land & Tenant</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-mono">Awareness Gap</span>
                      <p className="text-xs font-semibold text-red-400">Over 85%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: Our Solution */}
          {slide.id === 3 && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/60 to-slate-900/90 border border-amber-500/40 text-center shadow-lg"
              >
                <p className="text-xl sm:text-2xl font-extrabold text-white">
                  "{slide.mainSentence}"
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slide.bullets?.map((bullet, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-200 font-medium">
                      {bullet}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={onOpenDemo}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <Bot className="w-5 h-5" />
                  Try Live Interactive Legal Demo
                </button>
              </div>
            </div>
          )}

          {/* SLIDE 4: What Makes This Different */}
          {slide.id === 4 && slide.comparisonData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Other Apps */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-6 rounded-2xl bg-slate-900/60 border border-red-500/20"
              >
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-500/20">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <h3 className="text-lg font-bold text-red-300">
                    {slide.comparisonData.others.title}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {slide.comparisonData.others.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Mera Wakeel AI */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-2 border-amber-500/60 shadow-xl shadow-amber-500/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg">
                  OUR ADVANTAGE
                </div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-500/30">
                  <CheckCircle2 className="w-6 h-6 text-amber-400" />
                  <h3 className="text-lg font-bold text-amber-400">
                    {slide.comparisonData.meraWakeel.title}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {slide.comparisonData.meraWakeel.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          )}

          {/* SLIDE 5: How It Works */}
          {slide.id === 5 && slide.stepsData && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {slide.stepsData.map((st, idx) => (
                <motion.div
                  key={st.step}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between h-full relative"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                        {st.step}
                      </span>
                      <DynamicIcon name={st.iconName} size={20} className="text-slate-400" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white mb-1.5 leading-snug">
                      {st.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                  {idx < 5 && (
                    <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 z-10" />
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* SLIDE 6: Core Differentiator — Honesty Principle */}
          {slide.id === 6 && slide.honestyData && (
            <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
              {/* Centered Scale Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative p-5 rounded-2xl bg-slate-900 border border-amber-500/50 shadow-xl text-amber-400">
                  <Scale className="w-16 h-16 text-amber-400" />
                </div>
              </div>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-2 border-amber-500/50 w-full"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-amber-300 leading-tight">
                  {slide.honestyData.boldStatement}
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                {slide.honestyData.subpoints.map((sub, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3"
                  >
                    <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300">{sub}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 7: Tech Architecture */}
          {slide.id === 7 && slide.techArchitectureData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {slide.techArchitectureData.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded bg-amber-500/10 text-amber-400">
                        <DynamicIcon name={item.iconName} size={16} />
                      </div>
                      <span className="text-xs font-mono text-amber-400 uppercase font-bold">
                        {item.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{item.tech}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Diagram Flow */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 flex flex-wrap items-center justify-around gap-2 text-center text-xs font-mono">
                <span className="text-slate-300 px-3 py-1 rounded bg-slate-800 border border-slate-700">
                  User (Voice/Text)
                </span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30">
                  Next.js Frontend
                </span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30">
                  FastAPI Backend
                </span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <span className="text-blue-300 px-3 py-1 rounded bg-blue-900/30 border border-blue-500/30">
                  Gemini + OCR + RAG
                </span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <span className="text-emerald-300 px-3 py-1 rounded bg-emerald-900/30 border border-emerald-500/30">
                  Honest Verdict & Case Brief
                </span>
              </div>
            </div>
          )}

          {/* SLIDE 8: Feasibility & Current Progress */}
          {slide.id === 8 && slide.progressData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Built */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30"
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-emerald-300">What's Built</h3>
                </div>
                <ul className="space-y-2.5">
                  {slide.progressData.built.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Tested */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl bg-slate-900/80 border border-blue-500/30"
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/30">
                  <FileCheck2 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-blue-300">What's Tested</h3>
                </div>
                <ul className="space-y-2.5">
                  {slide.progressData.tested.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Next */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30"
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-500/30">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-amber-300">What's Next</h3>
                </div>
                <ul className="space-y-2.5">
                  {slide.progressData.next.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          )}

          {/* SLIDE 9: Two-Sided Platform */}
          {slide.id === 9 && slide.twoSidedData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Citizens */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-amber-500/30"
                >
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-amber-500/20">
                    <Users className="w-6 h-6 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">
                      {slide.twoSidedData.leftSide.title}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {slide.twoSidedData.leftSide.points.map((pt, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Right: Lawyers */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-blue-500/30"
                >
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-500/20">
                    <Briefcase className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">
                      {slide.twoSidedData.rightSide.title}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {slide.twoSidedData.rightSide.points.map((pt, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-blue-400 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <p className="text-sm font-bold text-amber-300">
                  {slide.twoSidedData.bottomLine}
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 10: Impact & Market Potential */}
          {slide.id === 10 && slide.impactData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {slide.impactData.stats.map((st, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 text-center">
                      <span className="text-xl sm:text-2xl font-black text-amber-400 block">{st.number}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tight block mt-0.5">{st.label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-2">
                  {slide.impactData.points.map((pt, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
                      <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-200">{pt}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border-2 border-amber-500/50 text-center shadow-2xl relative overflow-hidden">
                  <Building2 className="w-16 h-16 text-amber-400/40 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-amber-300 tracking-wider">
                    {slide.impactData.bigText}
                  </h2>
                  <p className="text-xs text-slate-400 mt-2">
                    Transforming legal access for 1.4 Billion Indian citizens
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 11: Why We Deserve to Be Selected */}
          {slide.id === 11 && slide.closingData && (
            <div className="space-y-6 text-center max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {slide.closingData.points.map((pt, idx) => {
                  const parts = pt.split(': ');
                  return (
                    <motion.div
                      key={idx}
                      initial={{ y: 15, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-left flex flex-col justify-between"
                    >
                      <div>
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center mb-3">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-amber-300 mb-1">{parts[0]}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{parts[1] || pt}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xl shadow-xl shadow-amber-500/20"
              >
                "{slide.closingData.boldClosing}"
              </motion.div>

              <div className="pt-4 border-t border-slate-800 text-slate-400 text-xs flex flex-wrap items-center justify-between gap-2">
                <span>{metadata.teamName} • {metadata.collegeName}</span>
                <span>Contact: {metadata.contactEmail}</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
