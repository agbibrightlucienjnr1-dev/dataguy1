import React from "react";
import { Users, Briefcase, Video, GraduationCap, DollarSign, Target } from "lucide-react";

export const WhoIsThisFor = () => {
  const personas = [
    {
      icon: Video,
      title: "Content Creators & YouTubers",
      desc: "Produce 10x more content in half the time without creative burnout or hiring expensive editors.",
    },
    {
      icon: DollarSign,
      title: "Freelancers & Video Editors",
      desc: "Add high-ticket AI video generation to your service offerings and charge premium rates to clients.",
    },
    {
      icon: Briefcase,
      title: "Business Owners & Marketers",
      desc: "Create engaging product reels, promotional ads, and social media announcements on a budget.",
    },
    {
      icon: GraduationCap,
      title: "Complete Beginners & Students",
      desc: "No prior video editing experience required. Learn practical AI tech skills that pay.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-400 mb-3">
            <Target className="w-3.5 h-3.5" />
            <span>Target Audience</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Who Is This Masterclass Built For?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {personas.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
