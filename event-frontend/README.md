<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AI Video Mastery - Masterclass</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-variant": "#353438",
                        "outline": "#908fa0",
                        "primary-fixed-dim": "#c0c1ff",
                        "error-container": "#93000a",
                        "inverse-surface": "#e5e1e5",
                        "on-tertiary-fixed": "#301400",
                        "tertiary": "#ffb783",
                        "surface-container-lowest": "#0e0e11",
                        "on-tertiary": "#4f2500",
                        "on-error-container": "#ffdad6",
                        "on-primary-container": "#0d0096",
                        "secondary-fixed-dim": "#c6c6c7",
                        "tertiary-fixed": "#ffdcc5",
                        "on-background": "#e5e1e5",
                        "on-secondary-fixed": "#1a1c1c",
                        "outline-variant": "#464554",
                        "primary-container": "#8083ff",
                        "surface-dim": "#131316",
                        "on-error": "#690005",
                        "surface-container-low": "#1c1b1e",
                        "on-primary": "#1000a9",
                        "text-muted": "#94A3B8",
                        "secondary": "#c6c6c7",
                        "tertiary-container": "#d97721",
                        "on-surface-variant": "#c7c4d7",
                        "surface-container-highest": "#353438",
                        "primary": "#c0c1ff",
                        "border-hairline": "rgba(255, 255, 255, 0.08)",
                        "on-secondary-container": "#b4b5b5",
                        "secondary-container": "#454747",
                        "surface-elevated": "#0B0B0F",
                        "surface-container": "#201f22",
                        "surface-container-high": "#2a2a2d",
                        "background": "#131316",
                        "primary-fixed": "#e1e0ff",
                        "surface": "#131316",
                        "on-secondary": "#2f3131",
                        "surface-tint": "#c0c1ff",
                        "inverse-on-surface": "#313033",
                        "on-primary-fixed-variant": "#2f2ebe",
                        "tertiary-fixed-dim": "#ffb783",
                        "on-tertiary-container": "#452000",
                        "on-primary-fixed": "#07006c",
                        "on-surface": "#e5e1e5",
                        "success-emerald": "#10B981",
                        "surface-glass": "#121218",
                        "on-tertiary-fixed-variant": "#703700",
                        "inverse-primary": "#494bd6",
                        "text-dim": "#64748B",
                        "surface-bright": "#39393c",
                        "error": "#ffb4ab",
                        "on-secondary-fixed-variant": "#454747",
                        "secondary-fixed": "#e2e2e2"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "gutter": "24px",
                        "max-width": "1440px",
                        "margin-desktop": "64px",
                        "unit": "4px",
                        "margin-mobile": "20px"
                    },
                    "fontFamily": {
                        "display-lg-mobile": ["Inter"],
                        "body-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg": ["Inter"],
                        "label-sm": ["Inter"],
                        "headline-xl": ["Inter"],
                        "label-md": ["Inter"]
                    },
                    "fontSize": {
                        "display-lg-mobile": ["40px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "letterSpacing": "0em", "fontWeight": "400" }],
                        "display-lg": ["72px", { "lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700" }],
                        "body-md": ["16px", { "lineHeight": "1.6", "letterSpacing": "0em", "fontWeight": "400" }],
                        "headline-lg": ["32px", { "lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "headline-xl": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600" }],
                        "label-md": ["14px", { "lineHeight": "1.4", "letterSpacing": "0.02em", "fontWeight": "500" }]
                    }
                }
            }
        }
    </script>
<style>
        body {
            background-color: #050507;
            color: #e5e1e5;
        }
        .bg-glass {
            background-color: rgba(18, 18, 24, 0.6);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
        }
    </style>
</head>
<body class="antialiased min-h-screen flex flex-col">
<!-- TopNavBar (Generated from JSON) -->
<header class="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-max-width rounded-full border border-border-hairline shadow-2xl bg-surface-glass/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 z-50">
<div class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface tracking-tighter">
            AI Video Mastery
        </div>
<nav class="hidden md:flex gap-6 items-center font-label-md text-label-md">
<a class="text-primary font-bold active:scale-95 transition-transform" href="#curriculum">Curriculum</a>
<a class="text-on-surface-variant hover:text-primary transition-colors duration-300 active:scale-95 transition-transform" href="#tools">Tools</a>
<a class="text-on-surface-variant hover:text-primary transition-colors duration-300 active:scale-95 transition-transform" href="#pricing">Pricing</a>
<a class="text-on-surface-variant hover:text-primary transition-colors duration-300 active:scale-95 transition-transform" href="#faq">FAQ</a>
</nav>
<div class="flex items-center gap-4">
<span class="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-border-hairline font-label-sm text-label-sm text-text-muted">
<span class="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                Live Interactive Session
            </span>
<button class="bg-[#494bd6] text-white px-6 py-2 rounded-full font-label-md text-label-md font-semibold hover:bg-opacity-90 transition-all shadow-[0_0_20px_rgba(73,75,214,0.3)] hover:shadow-[0_0_30px_rgba(73,75,214,0.5)] active:scale-95">
                Enroll Now
            </button>
</div>
</header>
<main class="flex-grow pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto w-full flex flex-col gap-[120px]">
<!-- Hero Section -->
<section class="flex flex-col items-center text-center pt-16 md:pt-24 max-w-4xl mx-auto gap-8">
<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-border-hairline">
<span class="material-symbols-outlined text-[16px] text-tertiary" data-icon="star" data-weight="fill" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-md text-label-md text-on-surface">1-Day Intensive Online Masterclass</span>
</div>
<h1 class="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface">
                Master Cinema-Grade <br class="hidden md:block"/>Long &amp; Short-Form Video with AI
            </h1>
<p class="font-body-lg text-body-lg text-text-muted max-w-2xl">
                Transform your ideas into professional, high-retention videos without cameras, actors, or expensive equipment. Join the definitive guide to modern AI video generation.
            </p>
<!-- Countdown Timer -->
<div class="flex gap-4 md:gap-6 mt-4">
<div class="bg-surface-elevated border border-border-hairline rounded-lg p-4 w-20 md:w-24 flex flex-col items-center justify-center">
<span class="font-headline-xl text-headline-xl text-on-surface" id="days">02</span>
<span class="font-label-sm text-label-sm text-text-muted mt-1 uppercase">Days</span>
</div>
<div class="bg-surface-elevated border border-border-hairline rounded-lg p-4 w-20 md:w-24 flex flex-col items-center justify-center">
<span class="font-headline-xl text-headline-xl text-on-surface" id="hours">14</span>
<span class="font-label-sm text-label-sm text-text-muted mt-1 uppercase">Hours</span>
</div>
<div class="bg-surface-elevated border border-border-hairline rounded-lg p-4 w-20 md:w-24 flex flex-col items-center justify-center">
<span class="font-headline-xl text-headline-xl text-on-surface" id="minutes">45</span>
<span class="font-label-sm text-label-sm text-text-muted mt-1 uppercase">Mins</span>
</div>
<div class="bg-surface-elevated border border-border-hairline rounded-lg p-4 w-20 md:w-24 flex flex-col items-center justify-center">
<span class="font-headline-xl text-headline-xl text-on-surface" id="seconds">30</span>
<span class="font-label-sm text-label-sm text-text-muted mt-1 uppercase">Secs</span>
</div>
</div>
<div class="flex flex-col items-center gap-4 mt-8 w-full max-w-md">
<button class="w-full bg-[#494bd6] text-white py-4 rounded-xl font-label-md text-label-md font-semibold hover:bg-opacity-90 transition-all shadow-[0_0_30px_rgba(73,75,214,0.2)] hover:shadow-[0_0_40px_rgba(73,75,214,0.4)] flex items-center justify-center gap-2 group">
                    Register &amp; Join Class — GH₵ 10.00
                    <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
</button>
<div class="flex items-center gap-4 font-label-sm text-label-sm text-text-muted opacity-60">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]" data-icon="lock">lock</span> Secured by Paystack</span>
<span>•</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]" data-icon="verified_user">verified_user</span> VIP WhatsApp Access</span>
</div>
</div>
</section>
<!-- Tool Stack -->
<section class="flex flex-col gap-12" id="tools">
<div class="text-center">
<h2 class="font-headline-lg text-headline-lg text-on-surface mb-2">The Industry Standard Toolstack</h2>
<p class="font-body-md text-body-md text-text-muted">Master the exact platforms used by top creators and studios.</p>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
<!-- Tool Cards -->
<div class="bg-surface-elevated border border-border-hairline rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors">
<div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-on-surface" data-icon="chat">chat</span>
</div>
<span class="font-label-md text-label-md text-on-surface">ChatGPT</span>
</div>
<div class="bg-surface-elevated border border-border-hairline rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors">
<div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-on-surface" data-icon="psychology">psychology</span>
</div>
<span class="font-label-md text-label-md text-on-surface">Claude</span>
</div>
<div class="bg-surface-elevated border border-border-hairline rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors">
<div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-on-surface" data-icon="mic">mic</span>
</div>
<span class="font-label-md text-label-md text-on-surface">ElevenLabs</span>
</div>
<div class="bg-surface-elevated border border-border-hairline rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors">
<div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-on-surface" data-icon="palette">palette</span>
</div>
<span class="font-label-md text-label-md text-on-surface">Midjourney</span>
</div>
<div class="bg-surface-elevated border border-border-hairline rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors">
<div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-on-surface" data-icon="movie">movie</span>
</div>
<span class="font-label-md text-label-md text-on-surface">Runway</span>
</div>
<div class="bg-surface-elevated border border-border-hairline rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors">
<div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-on-surface" data-icon="animation">animation</span>
</div>
<span class="font-label-md text-label-md text-on-surface">Kling AI</span>
</div>
<div class="bg-surface-elevated border border-border-hairline rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors col-span-2 md:col-span-1">
<div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-on-surface" data-icon="cut">cut</span>
</div>
<span class="font-label-md text-label-md text-on-surface">CapCut</span>
</div>
</div>
</section>
</main>
<!-- Footer (Generated from JSON) -->
<footer class="w-full py-12 border-t border-border-hairline bg-background">
<div class="max-w-max-width mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-6">
<div class="font-headline-lg text-headline-lg text-on-surface opacity-80 hover:opacity-100">
                AI Video Mastery
            </div>
<div class="flex gap-6 font-label-sm text-label-sm text-text-muted">
<a class="hover:text-on-surface transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</a>
<a class="hover:text-on-surface transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
<a class="hover:text-on-surface transition-colors opacity-80 hover:opacity-100" href="#">Contact Support</a>
</div>
<div class="font-label-sm text-label-sm text-text-muted opacity-80 hover:opacity-100">
                © 2024 AI Video Mastery. All rights reserved.
            </div>
</div>
</footer>
<script>
        // Simple countdown logic for visual effect
        setInterval(() => {
            const secondsEl = document.getElementById('seconds');
            let currentSeconds = parseInt(secondsEl.innerText);
            if(currentSeconds > 0) {
                currentSeconds--;
                secondsEl.innerText = currentSeconds.toString().padStart(2, '0');
            } else {
                secondsEl.innerText = '59';
            }
        }, 1000);
    </script>
</body></html>









<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Payment Confirmed - AI Video Mastery</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-variant": "#353438",
                        "outline": "#908fa0",
                        "primary-fixed-dim": "#c0c1ff",
                        "error-container": "#93000a",
                        "inverse-surface": "#e5e1e5",
                        "on-tertiary-fixed": "#301400",
                        "tertiary": "#ffb783",
                        "surface-container-lowest": "#0e0e11",
                        "on-tertiary": "#4f2500",
                        "on-error-container": "#ffdad6",
                        "on-primary-container": "#0d0096",
                        "secondary-fixed-dim": "#c6c6c7",
                        "tertiary-fixed": "#ffdcc5",
                        "on-background": "#e5e1e5",
                        "on-secondary-fixed": "#1a1c1c",
                        "outline-variant": "#464554",
                        "primary-container": "#8083ff",
                        "surface-dim": "#131316",
                        "on-error": "#690005",
                        "surface-container-low": "#1c1b1e",
                        "on-primary": "#1000a9",
                        "text-muted": "#94A3B8",
                        "secondary": "#c6c6c7",
                        "tertiary-container": "#d97721",
                        "on-surface-variant": "#c7c4d7",
                        "surface-container-highest": "#353438",
                        "primary": "#c0c1ff",
                        "border-hairline": "rgba(255, 255, 255, 0.08)",
                        "on-secondary-container": "#b4b5b5",
                        "secondary-container": "#454747",
                        "surface-elevated": "#0B0B0F",
                        "surface-container": "#201f22",
                        "surface-container-high": "#2a2a2d",
                        "background": "#131316",
                        "primary-fixed": "#e1e0ff",
                        "surface": "#131316",
                        "on-secondary": "#2f3131",
                        "surface-tint": "#c0c1ff",
                        "inverse-on-surface": "#313033",
                        "on-primary-fixed-variant": "#2f2ebe",
                        "tertiary-fixed-dim": "#ffb783",
                        "on-tertiary-container": "#452000",
                        "on-primary-fixed": "#07006c",
                        "on-surface": "#e5e1e5",
                        "success-emerald": "#10B981",
                        "surface-glass": "#121218",
                        "on-tertiary-fixed-variant": "#703700",
                        "inverse-primary": "#494bd6",
                        "text-dim": "#64748B",
                        "surface-bright": "#39393c",
                        "error": "#ffb4ab",
                        "on-secondary-fixed-variant": "#454747",
                        "secondary-fixed": "#e2e2e2"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "gutter": "24px",
                        "max-width": "1440px",
                        "margin-desktop": "64px",
                        "unit": "4px",
                        "margin-mobile": "20px"
                    },
                    "fontFamily": {
                        "display-lg-mobile": ["Inter"],
                        "body-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg": ["Inter"],
                        "label-sm": ["Inter"],
                        "headline-xl": ["Inter"],
                        "label-md": ["Inter"]
                    },
                    "fontSize": {
                        "display-lg-mobile": ["40px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "letterSpacing": "0em", "fontWeight": "400" }],
                        "display-lg": ["72px", { "lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700" }],
                        "body-md": ["16px", { "lineHeight": "1.6", "letterSpacing": "0em", "fontWeight": "400" }],
                        "headline-lg": ["32px", { "lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "headline-xl": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600" }],
                        "label-md": ["14px", { "lineHeight": "1.4", "letterSpacing": "0.02em", "fontWeight": "500" }]
                    }
                },
            },
        }
    </script>
<style>
        body {
            background-color: #050507; /* Level 0 Base */
            color: #e5e1e5;
        }
        
        /* Utility for Material Symbols */
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        
        .material-symbols-outlined.fill {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        /* Glassmorphism utility classes aligned with design guidance */
        .glass-card {
            background-color: #121218; /* Level 2 */
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08); /* Hairline border */
            box-shadow: inset 0 0.5px 0 0 rgba(255, 255, 255, 0.05); /* Inner top glow */
        }
        
        .glow-shadow {
            box-shadow: 0 0 64px 0 rgba(192, 193, 255, 0.1);
        }
    </style>
</head>
<body class="antialiased min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
<!-- Ambient Glow Background -->
<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[160px] opacity-[0.03] pointer-events-none z-0"></div>
<!-- Main Content Canvas -->
<main class="w-full max-w-lg px-margin-mobile md:px-0 z-10 flex flex-col items-center">
<!-- Confirmation Card -->
<div class="glass-card w-full rounded-2xl p-8 flex flex-col items-center glow-shadow text-center relative overflow-hidden">
<!-- Subtle accent top line -->
<div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-success-emerald to-transparent opacity-50"></div>
<!-- Verified Emerald Badge -->
<div class="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6 border border-[rgba(16,185,129,0.2)]">
<span class="material-symbols-outlined fill text-success-emerald text-[32px]" data-icon="check_circle" data-weight="fill">check_circle</span>
</div>
<!-- Headline -->
<h1 class="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-2">Payment Confirmed</h1>
<p class="font-body-md text-body-md text-text-muted mb-10">Welcome to AI Video Creation Masterclass</p>
<!-- Receipt Summary -->
<div class="w-full bg-[#0B0B0F] border border-border-hairline rounded-lg p-6 mb-8 text-left">
<div class="flex justify-between items-center mb-4 pb-4 border-b border-border-hairline">
<span class="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Transaction ID</span>
<span class="font-body-md text-body-md text-on-surface font-mono">#TXN-89A4B2</span>
</div>
<div class="space-y-3">
<div class="flex justify-between items-center">
<span class="font-body-md text-body-md text-text-muted">Attendee</span>
<span class="font-body-md text-body-md text-on-surface">Alex Carter</span>
</div>
<div class="flex justify-between items-center">
<span class="font-body-md text-body-md text-text-muted">Phone Number</span>
<span class="font-body-md text-body-md text-on-surface">+1 (555) 019-2834</span>
</div>
<div class="flex justify-between items-center pt-2">
<span class="font-body-md text-body-md text-text-muted">Amount Paid</span>
<span class="font-body-md text-body-md text-on-surface font-medium">$497.00</span>
</div>
</div>
</div>
<!-- Primary Action -->
<div class="w-full space-y-4">
<a class="w-full bg-primary hover:bg-primary-fixed-dim text-[#0d0096] font-label-md text-label-md py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-[0.98]" href="#">
<span class="material-symbols-outlined text-[20px]" data-icon="forum">forum</span>
                    Join Private WhatsApp Student Group
                </a>
<button class="w-full bg-transparent border border-border-hairline hover:bg-[rgba(255,255,255,0.05)] text-on-surface font-label-md text-label-md py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300" id="copyLinkBtn">
<span class="material-symbols-outlined text-[20px]" data-icon="content_copy">content_copy</span>
<span>Copy Invite Link</span>
</button>
</div>
</div>
<!-- Footer / Return -->
<div class="mt-8">
<a class="font-label-sm text-label-sm text-text-muted hover:text-on-surface transition-colors flex items-center gap-2" href="#">
<span class="material-symbols-outlined text-[16px]" data-icon="arrow_back">arrow_back</span>
                Return to Dashboard
            </a>
</div>
</main>
<!-- Footer Component (Shared, modified for transactional relevance by suppressing top links as per rules, but keeping copyright) -->
<footer class="w-full py-12 max-w-max-width mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-6 border-t border-border-hairline opacity-80 hover:opacity-100 transition-opacity bg-background absolute bottom-0">
<div class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">AI Video Mastery</div>
<div class="font-label-sm text-label-sm text-text-muted">© 2024 AI Video Mastery. All rights reserved.</div>
</footer>
<script>
        // Micro-interaction for copy button
        const copyBtn = document.getElementById('copyLinkBtn');
        copyBtn.addEventListener('click', function() {
            const originalText = this.querySelector('span:not(.material-symbols-outlined)').innerText;
            const icon = this.querySelector('.material-symbols-outlined');
            
            // Simulate copy
            navigator.clipboard.writeText("https://chat.whatsapp.com/invite-link-placeholder").then(() => {
                this.querySelector('span:not(.material-symbols-outlined)').innerText = "Copied!";
                icon.innerText = "check";
                icon.classList.add('text-success-emerald');
                this.classList.add('border-success-emerald', 'bg-[rgba(16,185,129,0.05)]');
                
                setTimeout(() => {
                    this.querySelector('span:not(.material-symbols-outlined)').innerText = originalText;
                    icon.innerText = "content_copy";
                    icon.classList.remove('text-success-emerald');
                    this.classList.remove('border-success-emerald', 'bg-[rgba(16,185,129,0.05)]');
                }, 2000);
            });
        });
    </script>
</body></html>







<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Registration - AI Video Creation Masterclass</title>
<!-- Google Fonts: Inter & Material Symbols -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-variant": "#353438",
                        "outline": "#908fa0",
                        "primary-fixed-dim": "#c0c1ff",
                        "error-container": "#93000a",
                        "inverse-surface": "#e5e1e5",
                        "on-tertiary-fixed": "#301400",
                        "tertiary": "#ffb783",
                        "surface-container-lowest": "#0e0e11",
                        "on-tertiary": "#4f2500",
                        "on-error-container": "#ffdad6",
                        "on-primary-container": "#0d0096",
                        "secondary-fixed-dim": "#c6c6c7",
                        "tertiary-fixed": "#ffdcc5",
                        "on-background": "#e5e1e5",
                        "on-secondary-fixed": "#1a1c1c",
                        "outline-variant": "#464554",
                        "primary-container": "#8083ff",
                        "surface-dim": "#131316",
                        "on-error": "#690005",
                        "surface-container-low": "#1c1b1e",
                        "on-primary": "#1000a9",
                        "text-muted": "#94A3B8",
                        "secondary": "#c6c6c7",
                        "tertiary-container": "#d97721",
                        "on-surface-variant": "#c7c4d7",
                        "surface-container-highest": "#353438",
                        "primary": "#c0c1ff",
                        "border-hairline": "rgba(255, 255, 255, 0.08)",
                        "on-secondary-container": "#b4b5b5",
                        "secondary-container": "#454747",
                        "surface-elevated": "#0B0B0F",
                        "surface-container": "#201f22",
                        "surface-container-high": "#2a2a2d",
                        "background": "#131316",
                        "primary-fixed": "#e1e0ff",
                        "surface": "#131316",
                        "on-secondary": "#2f3131",
                        "surface-tint": "#c0c1ff",
                        "inverse-on-surface": "#313033",
                        "on-primary-fixed-variant": "#2f2ebe",
                        "tertiary-fixed-dim": "#ffb783",
                        "on-tertiary-container": "#452000",
                        "on-primary-fixed": "#07006c",
                        "on-surface": "#e5e1e5",
                        "success-emerald": "#10B981",
                        "surface-glass": "#121218",
                        "on-tertiary-fixed-variant": "#703700",
                        "inverse-primary": "#494bd6",
                        "text-dim": "#64748B",
                        "surface-bright": "#39393c",
                        "error": "#ffb4ab",
                        "on-secondary-fixed-variant": "#454747",
                        "secondary-fixed": "#e2e2e2"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "gutter": "24px",
                        "max-width": "1440px",
                        "margin-desktop": "64px",
                        "unit": "4px",
                        "margin-mobile": "20px"
                    },
                    "fontFamily": {
                        "display-lg-mobile": ["Inter"],
                        "body-lg": ["Inter"],
                        "display-lg": ["Inter"],
                        "body-md": ["Inter"],
                        "headline-lg": ["Inter"],
                        "label-sm": ["Inter"],
                        "headline-xl": ["Inter"],
                        "label-md": ["Inter"]
                    },
                    "fontSize": {
                        "display-lg-mobile": ["40px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "letterSpacing": "0em", "fontWeight": "400" }],
                        "display-lg": ["72px", { "lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700" }],
                        "body-md": ["16px", { "lineHeight": "1.6", "letterSpacing": "0em", "fontWeight": "400" }],
                        "headline-lg": ["32px", { "lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "headline-xl": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600" }],
                        "label-md": ["14px", { "lineHeight": "1.4", "letterSpacing": "0.02em", "fontWeight": "500" }]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        /* Custom scrollbar for a cleaner look */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #131316;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body class="bg-background text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 font-sans antialiased selection:bg-inverse-primary/30 selection:text-primary">
<!-- Distraction-free Container / Modal Wrapper -->
<main class="w-full max-w-[480px] relative z-10">
<!-- Ambient Glow behind modal -->
<div class="absolute -inset-10 bg-inverse-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
<!-- Glassmorphic Modal Card (Level 2 Elevation) -->
<div class="relative bg-surface-glass/80 backdrop-blur-2xl border border-border-hairline rounded-xl shadow-2xl overflow-hidden flex flex-col">
<!-- Top Inner Glow (0.5px simulated) -->
<div class="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
<!-- Header Section -->
<header class="pt-10 pb-6 px-8 text-center border-b border-border-hairline bg-surface-elevated/50">
<div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-variant border border-border-hairline mb-6">
<span class="material-symbols-outlined text-inverse-primary" style="font-variation-settings: 'FILL' 1;">movie_creation</span>
</div>
<h1 class="font-headline-lg text-headline-lg text-on-surface mb-2">Secure Checkout</h1>
<p class="font-body-md text-body-md text-text-muted">Complete registration for the AI Video Creation Masterclass.</p>
</header>
<!-- Form Section -->
<div class="p-8 space-y-6 flex-1">
<form action="#" class="space-y-5" method="POST">
<!-- Full Name -->
<div class="space-y-2">
<label class="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest" for="fullName">Full Name</label>
<div class="relative group">
<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
<span class="material-symbols-outlined text-text-muted group-focus-within:text-inverse-primary transition-colors">person</span>
</div>
<input class="w-full bg-surface-elevated border border-border-hairline rounded-lg pl-12 pr-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-text-muted/50 focus:outline-none focus:border-inverse-primary focus:ring-2 focus:ring-inverse-primary/20 transition-all" id="fullName" name="fullName" placeholder="Enter your full name" required="" type="text"/>
</div>
</div>
<!-- WhatsApp Phone Number -->
<div class="space-y-2">
<label class="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest" for="whatsapp">WhatsApp Number</label>
<div class="relative group">
<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
<span class="material-symbols-outlined text-text-muted group-focus-within:text-inverse-primary transition-colors">chat</span>
</div>
<input class="w-full bg-surface-elevated border border-border-hairline rounded-lg pl-12 pr-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-text-muted/50 focus:outline-none focus:border-inverse-primary focus:ring-2 focus:ring-inverse-primary/20 transition-all" id="whatsapp" name="whatsapp" placeholder="+233 XX XXX XXXX" required="" type="tel"/>
</div>
</div>
<!-- Email Address (Optional) -->
<div class="space-y-2">
<div class="flex justify-between items-center">
<label class="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest" for="email">Email Address</label>
<span class="font-label-sm text-label-sm text-text-muted/60">Optional</span>
</div>
<div class="relative group">
<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
<span class="material-symbols-outlined text-text-muted group-focus-within:text-inverse-primary transition-colors">mail</span>
</div>
<input class="w-full bg-surface-elevated border border-border-hairline rounded-lg pl-12 pr-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-text-muted/50 focus:outline-none focus:border-inverse-primary focus:ring-2 focus:ring-inverse-primary/20 transition-all" id="email" name="email" placeholder="hello@example.com" type="email"/>
</div>
</div>
</form>
<!-- Order Breakdown (Level 1 Elevation equivalent in a box) -->
<div class="mt-8 bg-surface-elevated border border-border-hairline rounded-lg p-5">
<h3 class="font-label-sm text-label-sm text-text-muted uppercase tracking-widest mb-4">Order Summary</h3>
<div class="flex justify-between items-start mb-4 pb-4 border-b border-border-hairline border-dashed">
<div class="font-body-md text-body-md text-on-surface">Masterclass Entry Ticket</div>
<div class="font-body-md text-body-md text-on-surface font-medium whitespace-nowrap ml-4">GH₵ 10.00</div>
</div>
<div class="flex justify-between items-center">
<div class="font-body-md text-body-md text-on-surface-variant">Total due today</div>
<div class="font-headline-lg-mobile text-headline-lg-mobile text-inverse-primary">GH₵ 10.00</div>
</div>
</div>
</div>
<!-- Footer / CTA -->
<div class="p-8 pt-0 mt-auto">
<button class="w-full bg-inverse-primary text-white font-label-md text-label-md py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-inverse-primary/90 transition-all shadow-[0_4px_24px_-4px_rgba(73,75,214,0.4)] hover:shadow-[0_8px_32px_-4px_rgba(73,75,214,0.5)] active:scale-[0.98]" type="submit">
<span class="material-symbols-outlined text-[20px]">lock</span>
                    Pay with Paystack (Mobile Money / Card)
                </button>
<div class="mt-4 flex items-center justify-center gap-2 text-text-muted font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px]">encrypted</span>
                    Payments are secure and encrypted
                </div>
</div>
</div>
</main>
</body></html>