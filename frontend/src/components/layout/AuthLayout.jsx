import { Outlet, Link } from "react-router-dom";
import { Wifi } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      {/* Background Blobs for Mobile/Form Side */}
      <div className="absolute top-0 -right-4 w-72 h-72 bg-slate-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob lg:hidden pointer-events-none"></div>
      <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-slate-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob animation-delay-4000 lg:hidden pointer-events-none"></div>

      {/* Left side - Branding Canvas */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-slate-900 border-r border-slate-800 shadow-2xl">
        {/* Animated Mesh Backing */}
        <div className="absolute inset-0 bg-mesh-navy opacity-40"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-slate-800 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob pointer-events-none"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-slate-700 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 w-max group">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-sm border border-white/20 transform group-hover:scale-105 transition-all">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">DataGuy</span>
          </Link>
        </div>

        <div className="space-y-8 relative z-10 animate-float-slow">
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] text-white">
            Sell Data Bundles.<br/>
            Earn Commissions.<br/>
            Grow Your Business.
          </h1>
          <p className="text-slate-300 text-lg max-w-md leading-relaxed font-medium">
            Join thousands of agents selling MTN, Telecel and AirtelTigo data bundles
            across Ghana. Start earning with every sale.
          </p>

          <div className="grid grid-cols-3 gap-6 pt-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white mb-1">5,000+</div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Agents</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white mb-1">₵500K+</div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Paid Out</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white mb-1">99.9%</div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Uptime</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-slate-400 text-sm font-medium">
          © 2026 DataGuy. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex flex-col relative z-20 transition-all bg-transparent">
        {/* Mobile header */}
        <div className="lg:hidden p-6 glass-panel border-b border-slate-200/50 sticky top-0 z-30">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">DataGuy</span>
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
          {/* Animated Background Blob for Desktop Form Side */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob hidden lg:block border border-slate-300/50 pointer-events-none"></div>
          
          <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 relative z-10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
