import React, { useState } from "react";
import { ChevronDown, BookOpen, Clock, Award } from "lucide-react";

export const CurriculumAccordion = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const modules = [
    {
      title: "Module 1: The AI Video Revolution & Anatomy of Viral Videos",
      duration: "30 Mins",
      topics: [
        "How the short-form and long-form algorithm works in 2026",
        "The 3-second hook framework to prevent viewers from scrolling",
        "Dissecting 10M+ view faceless channels and their video structure",
      ],
    },
    {
      title: "Module 2: AI Script Generation & Creative Ideation",
      duration: "45 Mins",
      topics: [
        "Custom GPT prompt engineering for research & high-retention scripts",
        "Writing long-form documentary scripts vs punchy short-form reels",
        "Automated title and hook generation for maximum CTR",
      ],
    },
    {
      title: "Module 3: Studio Voiceovers, Audio Cloning & Sound Design",
      duration: "40 Mins",
      topics: [
        "Generating emotional, human-like voiceovers on ElevenLabs",
        "Cloning your own voice in under 60 seconds",
        "Curating high-energy background tracks and trending sound effects",
      ],
    },
    {
      title: "Module 4: Cinematic AI Images to Video Generation",
      duration: "60 Mins",
      topics: [
        "Midjourney & Flux prompt formulation for hyper-realistic scenes",
        "Animate static images with Runway Gen-3, Kling AI, and Luma",
        "Controlling camera motion: zooms, drone shots, character consistency",
      ],
    },
    {
      title: "Module 5: Fast Assembly, Captions, Transitions & AI Avatars",
      duration: "45 Mins",
      topics: [
        "CapCut AI workflow: auto-syncing b-rolls to speech",
        "Viral animated captions (dynamic colors, bold highlights, emojis)",
        "Talking avatar setup with HeyGen & Hedra for instant presentation clips",
      ],
    },
    {
      title: "Module 6: Channel Growth, Client Pitching & Monetization",
      duration: "40 Mins",
      topics: [
        "How to launch and automate a faceless YouTube or TikTok channel",
        "Pricing and selling short-form video packages to business owners",
        "Live Q&A, prompt sheet giveaway, and next-level creator roadmap",
      ],
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-900/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-xs font-bold text-indigo-400 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Step-by-Step Roadmap</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Class Breakdown & Schedule
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Every step is demonstrated live with actionable prompt templates and cheat sheets.
          </p>
        </div>

        <div className="space-y-3.5">
          {modules.map((mod, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`glass-card rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-indigo-500/50 bg-slate-900/90 shadow-lg shadow-indigo-500/10"
                    : "border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isOpen
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {mod.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> {mod.duration}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-indigo-400" : ""
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-800/70">
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                      {mod.topics.map((topic, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
