import React, { useState } from "react";
import { Wrench, Mail, Clock, RefreshCw, Wifi, ShieldAlert } from "lucide-react";

export default function MaintenancePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate checking status before reload
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-mesh-navy flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-action-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="animate-fade-in-up w-full max-w-4xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-sky-600 tracking-tight">
            DataGuy
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold shadow-xs">
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></div>
          Service Offline
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="animate-fade-in-up animation-delay-150 w-full max-w-lg glass-panel p-8 md:p-10 rounded-3xl relative border border-white/60 shadow-[0_20px_50px_rgba(124,58,237,0.12)]">
          {/* Animated floating wrench */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-brand-600 via-brand-500 to-sky-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-brand-600/30 relative animate-float">
            <Wrench className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
              <ShieldAlert className="w-3 h-3 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight text-center mb-3">
            MTN Maintenance
          </h1>
          <p className="text-slate-600 text-center text-sm md:text-base leading-relaxed mb-8 text-balance">
            We are temporarily offline due to ongoing network updates. Checkout and data delivery services are paused.
          </p>

          {/* Provider Status Details */}
          <div className="animate-fade-in-up animation-delay-300 bg-brand-50/60 border border-brand-100 rounded-2xl p-5 mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Impacted Network Provider
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <span className="text-sm font-semibold text-slate-700">MTN Network Services</span>
                </div>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-100">
                  Maintenance
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Because the MTN network is undergoing maintenance, we are not accepting new bundle orders at this time to prevent transaction delays.
            </p>
          </div>

          {/* Actions */}
          <div className="animate-fade-in-up animation-delay-450 space-y-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="shimmer-sweep w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 text-white font-bold text-sm shadow-md shadow-brand-600/30 hover:bg-brand-700 hover:shadow-brand-600/40 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-80 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Checking connection..." : "Check Status / Refresh"}
            </button>
          </div>
        </div>
      </main>

      {/* Footer / Support info */}
      <footer className="animate-fade-in-up animation-delay-450 w-full max-w-lg mx-auto px-6 py-8 text-center relative z-10">
        <div className="glass-panel/40 border border-brand-100/50 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-center gap-3 text-xs text-slate-600 mb-6 bg-white/30 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-brand-500" />
            <span>Need support? Contact us:</span>
          </div>
          <a
            href="mailto:admin@dataguy.shop"
            className="font-bold text-brand-700 hover:underline hover:text-brand-800"
          >
            admin@dataguy.shop
          </a>
        </div>
        <p className="text-xs text-slate-400">© 2026 DataGuy. All rights reserved.</p>
      </footer>
    </div>
  );
}
