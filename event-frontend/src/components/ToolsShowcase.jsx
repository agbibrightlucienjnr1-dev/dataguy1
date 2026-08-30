import React from "react";

export const ToolsShowcase = () => {
  const tools = [
    { name: "ChatGPT", icon: "chat" },
    { name: "Claude", icon: "psychology" },
    { name: "ElevenLabs", icon: "mic" },
    { name: "Midjourney", icon: "palette" },
    { name: "Runway", icon: "movie" },
    { name: "Kling AI", icon: "animation" },
    { name: "CapCut", icon: "cut" },
  ];

  return (
    <section className="flex flex-col gap-10 py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 w-full" id="tools">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#e5e1e5] mb-2 tracking-tight">
          The Industry Standard Toolstack
        </h2>
        <p className="text-sm sm:text-base text-[#94A3B8]">
          Master the exact platforms used by top creators and studios.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {tools.map((tool, idx) => (
          <div
            key={idx}
            className="bg-[#0B0B0F] border border-white/10 rounded-xl p-5 sm:p-6 flex flex-col items-center gap-3 hover:bg-white/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-1 group-hover:bg-[#494bd6]/20 transition-colors">
              <span className="material-symbols-outlined text-[#e5e1e5] group-hover:text-[#c0c1ff] transition-colors text-[22px]">
                {tool.icon}
              </span>
            </div>
            <span className="text-sm font-medium text-[#e5e1e5]">
              {tool.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
