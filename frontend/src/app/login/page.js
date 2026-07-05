"use client";

import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Sparkles, Mail, Shield, Zap } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* ── Left panel — branding ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col p-16 overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4 pointer-events-none" />

        {/* Grid texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-16">
          <span className="text-white font-bold text-xl tracking-tight">MailAI</span>
        </div>

        {/* Center copy */}
        <div className="relative flex-1 flex flex-col justify-center space-y-10">
          <div className="space-y-5">
            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest">
              AI Email Co-pilot
            </p>
            <h2 className="text-4xl font-bold text-white leading-[1.1] tracking-tight">
              Your inbox, finally under<br />control.
            </h2>
            <p className="text-gray-400 text-base leading-relaxed max-w-sm">
              Draft replies, summarize long email threads, and classify urgency in real-time with Google Gemini.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              { title: 'Gemini AI Summarizer', desc: 'Summarize long threads into 3 simple sentences.' },
              { title: 'One-Click Drafts', desc: 'Generate replies in formal, casual, or urgent tones.' },
              { title: 'Smart Classification', desc: 'Auto-detect urgency to focus on what matters.' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <div>
                  <span className="text-white text-sm font-semibold">{f.title}</span>
                  <span className="text-gray-500 text-sm"> · {f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stat row */}
          <div className="flex items-center gap-10 pt-6 border-t border-white/5">
            {[
              { value: 'Gemini Pro', label: 'AI Model' },
              { value: 'OAuth 2.0', label: 'Secure access' },
              { value: 'Real-time', label: 'Gmail sync' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-white text-base font-bold">{s.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-6 py-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-base">MailAI</span>
        </div>

        {/* Vertically centered form */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[400px]">

            {/* Heading */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-white tracking-tight">Sign in</h2>
              <p className="text-gray-500 text-base mt-2">
                Connect your Gmail account to get started.
              </p>
            </div>

            {/* Trust pills */}
            <div className="flex items-center gap-2 mb-8">
              {[
                { icon: Shield, label: 'OAuth 2.0 secured' },
                { icon: Mail, label: 'Gmail read & send' },
                { icon: Zap, label: 'Gemini powered' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-full">
                  <Icon size={11} className="text-indigo-400" />
                  <span className="text-gray-400 text-[10px]">{label}</span>
                </div>
              ))}
            </div>

            {/* Google OAuth button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-base font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {/* Google icon */}
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="rgba(255,255,255,0.9)" />
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="rgba(255,255,255,0.8)" />
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="rgba(255,255,255,0.7)" />
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="rgba(255,255,255,0.9)" />
                  </svg>
                  <span>Continue with Google</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-gray-700 text-xs">what you get access to</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Permission preview */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
              {[
                { icon: Mail, label: 'Read your inbox threads', sub: 'View and fetch Gmail messages' },
                { icon: Zap, label: 'Generate AI draft replies', sub: 'Powered by Google Gemini Pro' },
                { icon: Shield, label: 'Send replies on your behalf', sub: 'Via Gmail API with OAuth scope' },
              ].map(({ icon: Icon, label, sub }, i) => (
                <div key={label} className={`flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/[0.03] ${i < 2 ? 'border-b border-white/[0.04]' : ''}`}>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold">{label}</p>
                    <p className="text-gray-600 text-[10px] mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Legal */}
            <p className="text-center text-[10px] text-gray-700 mt-6 leading-relaxed">
              By connecting, you authorize MailAI to access your Gmail account.{' '}
              <span className="text-gray-500 hover:text-gray-400 cursor-pointer transition-colors">Privacy Policy</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-gray-700 mt-4">
          MailAI · Powered by Gemini · Google Cloud Sandbox
        </div>
      </div>
    </div>
  );
}