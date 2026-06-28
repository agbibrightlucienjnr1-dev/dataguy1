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
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none animate-blob animation-delay-2000"></div>

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
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
        <div className="w-full max-w-lg glass-panel p-8 md:p-10 rounded-3xl relative border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          {/* Animated floating wrench */}
          <div className="mx-auto w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-slate-900/25 relative animate-float">
            <Wrench className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
              <ShieldAlert className="w-3 h-3 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center mb-3">
            MTN Maintenance
          </h1>
          <p className="text-slate-600 text-center text-sm md:text-base leading-relaxed mb-8 text-balance">
            We are temporarily offline due to ongoing network updates. Checkout and data delivery services are paused.
          </p>

          {/* Provider Status Details */}
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-5 mb-8">
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
          <div className="space-y-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-md shadow-slate-900/10 hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-80 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Checking connection..." : "Check Status / Refresh"}
            </button>
          </div>
        </div>
      </main>

      {/* Footer / Support info */}
      <footer className="w-full max-w-lg mx-auto px-6 py-8 text-center relative z-10">
        <div className="glass-panel/40 border border-slate-200/50 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-center gap-3 text-xs text-slate-600 mb-6 bg-white/30 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-slate-500" />
            <span>Need support? Contact us:</span>
          </div>
          <a
            href="mailto:admin@dataguy.shop"
            className="font-bold text-slate-900 hover:underline hover:text-slate-800"
          >
            admin@dataguy.shop
          </a>
        </div>
        <p className="text-xs text-slate-400">© 2026 DataGuy. All rights reserved.</p>
      </footer>
    </div>
  );
}
