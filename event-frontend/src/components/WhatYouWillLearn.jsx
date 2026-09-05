import React from "react";

export const WhatYouWillLearn = () => {
  const modules = [
    {
      icon: "edit_note",
      title: "AI Scriptwriting & Viral Hooks",
      description:
        "Craft high-retention scripts for 30-second reels or 15-minute YouTube documentaries in seconds with custom prompt frameworks.",
    },
    {
      icon: "record_voice_over",
      title: "Studio Voice Cloning & Audio",
      description:
        "Generate human-like voiceovers with emotion, accents, and perfect pacing using ElevenLabs and free high-tier alternatives.",
    },
    {
      icon: "movie_creation",
      title: "Cinematic Image-to-Video",
      description:
        "Transform text and images into cinematic 4K video clips using Runway Gen-3, Kling AI, Luma Dream Machine, and Midjourney.",
    },
    {
      icon: "smart_toy",
      title: "Photorealistic Talking Avatars",
      description:
        "Build a brand or presentation without getting in front of a camera using custom lip-synced photorealistic avatars.",
    },
    {
      icon: "content_cut",
      title: "Automated Editing & Captions",
      description:
        "Cut editing time by 80% using CapCut AI, dynamic glowing captions, animated emojis, sound fx, and auto-zoom transitions.",
    },
    {
      icon: "monetization_on",
      title: "Monetization & Channel Growth",
      description:
        "Step-by-step blueprint on how to monetize your skills through faceless YouTube channels, client services, and sponsored videos.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 w-full" id="curriculum">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#c0c1ff] mb-3">
          <span className="material-symbols-outlined text-[16px]">school</span>
          <span>Comprehensive Curriculum</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#e5e1e5] tracking-tight">
          Everything You Need to Master AI Video
        </h2>
        <p className="text-sm sm:text-base text-[#94A3B8] mt-2">
          A practical, hands-on masterclass designed for real-world execution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod, idx) => (
          <div
            key={idx}
            className="bg-[#0B0B0F] border border-white/10 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all hover:bg-white/[0.03]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-[#c0c1ff]">
                <span className="material-symbols-outlined text-[24px]">
                  {mod.icon}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#e5e1e5] mb-2">
                {mod.title}
              </h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                {mod.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
