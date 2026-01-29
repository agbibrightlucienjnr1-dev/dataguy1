import { Outlet, Link } from "react-router-dom";
import { Wifi } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-2xl font-bold">DataGuy</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Sell Data Bundles.
            <br />
            Earn Commissions.
            <br />
            Grow Your Business.
          </h1>
          <p className="text-slate-300 text-lg max-w-md">
            Join thousands of agents selling MTN and AirtelTigo data bundles
            across Ghana. Start earning with every sale.
          </p>

          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-3xl font-bold">5,000+</div>
              <div className="text-slate-400 text-sm">Active Agents</div>
            </div>
            <div>
              <div className="text-3xl font-bold">₵500K+</div>
              <div className="text-slate-400 text-sm">Commissions Paid</div>
            </div>
            <div>
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-slate-400 text-sm">Uptime</div>
            </div>
          </div>
        </div>

        <div className="text-slate-400 text-sm">
          © 2026 DataGuy. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6 border-b">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">DataGuy</span>
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
