import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo, useId, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { Link, useSearchParams, useParams, useLocation, Routes, Route, MemoryRouter } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform, useMotionValue, useInView, animate } from "motion/react";
import { X, Menu, ArrowRight, SlidersHorizontal, Search, CircleDollarSign, Wrench, Layers3, MonitorSmartphone, ServerCog, ShieldCheck, Workflow, Gauge, Code2, LifeBuoy, Network, Check, RefreshCw, Zap, Target, Layers, BarChart, MessageSquare, Users, Rocket, Send, CheckCircle2, Sparkles, TrendingUp, Clock, Terminal, Shield, GitBranch, Cloud, MonitorCog, Minus, Plus, Calendar, User, Share2, Twitter, Linkedin, Mail, Link as Link$1, ArrowUpRight, PhoneCall, CheckCircle, PartyPopper, AlertCircle, Phone, ChevronUp, Bot, FileText, Paperclip, CalendarClock, Image, MessageCircle, EyeOff, Eye, Heading2, Heading3, Heading4, Bold, Italic, Underline, List, ListOrdered, Quote, Undo2, Redo2, RemoveFormatting, Info, Lightbulb, AlertTriangle, Lock, RefreshCcw, Bell, BellOff, LogOut, ClipboardList, Trash2, Save, UploadCloud, Star, Archive, UserPlus, ArrowLeft, Cookie, Globe2, Smartphone, BarChart3, MapPin } from "lucide-react";
import confetti from "canvas-confetti";
import * as Tabs from "@radix-ui/react-tabs";
import { format } from "date-fns";
function isGaEnabled() {
  return Boolean(
    typeof window !== "undefined" && typeof window.gtag === "function"
  );
}
function trackPageView(path) {
  if (!isGaEnabled() || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    service_region: "UK",
    business_model: "subscription_software_delivery"
  });
}
function trackEvent(eventName, params) {
  if (!isGaEnabled() || !window.gtag) return;
  window.gtag("event", eventName, {
    service_region: "UK",
    business_model: "subscription_software_delivery",
    page_path: window.location.pathname,
    page_title: document.title,
    transport_type: "beacon",
    ...params
  });
}
function trackCtaClick(ctaText, ctaLocation, extraParams) {
  trackEvent("cta_click", {
    cta_text: ctaText,
    cta_location: ctaLocation,
    ...extraParams
  });
}
function normalizeChatAnalyticsStatus(status) {
  if (status === "online") return "online";
  if (status === "away") return "away";
  if (status === "offline") return "offline";
  if (status === "assistant") return "assistant";
  return "unknown";
}
function getMessageLengthBucket(messageLength) {
  const length = Number(messageLength || 0);
  if (length <= 0) return "empty";
  if (length <= 80) return "short";
  if (length <= 300) return "medium";
  return "long";
}
function getAttachmentSizeBucket(sizeBytes) {
  const size = Number(sizeBytes || 0);
  if (!size || Number.isNaN(size)) return "unknown";
  if (size <= 1e6) return "small";
  if (size <= 5e6) return "medium";
  return "large";
}
function trackChatOpen(params) {
  trackEvent("chat_open", {
    chat_status: normalizeChatAnalyticsStatus(params == null ? void 0 : params.chatStatus),
    chat_title: (params == null ? void 0 : params.chatTitle) || "unknown",
    cta_location: params == null ? void 0 : params.ctaLocation
  });
}
function trackChatMessageSent(params) {
  const attachmentCount = Number((params == null ? void 0 : params.attachmentCount) || 0);
  trackEvent("chat_message_sent", {
    chat_status: normalizeChatAnalyticsStatus(params == null ? void 0 : params.chatStatus),
    message_length_bucket: getMessageLengthBucket(params == null ? void 0 : params.messageLength),
    has_attachment: attachmentCount > 0,
    attachment_count: attachmentCount,
    bot_reply_sent: Boolean(params == null ? void 0 : params.botReplySent),
    cta_location: params == null ? void 0 : params.ctaLocation,
    lead_type: "chat_message"
  });
}
function trackChatAppointmentRequested(params) {
  trackEvent("chat_appointment_requested", {
    chat_status: normalizeChatAnalyticsStatus(params == null ? void 0 : params.chatStatus),
    has_message: Boolean(params == null ? void 0 : params.hasMessage),
    cta_location: params == null ? void 0 : params.ctaLocation,
    lead_type: "appointment_request"
  });
}
function trackChatAttachmentUploaded(params) {
  const kind = (params == null ? void 0 : params.attachmentKind) === "image" ? "image" : "file";
  trackEvent("chat_attachment_uploaded", {
    chat_status: normalizeChatAnalyticsStatus(params == null ? void 0 : params.chatStatus),
    attachment_kind: kind,
    attachment_size_bucket: getAttachmentSizeBucket(params == null ? void 0 : params.sizeBytes),
    cta_location: params == null ? void 0 : params.ctaLocation
  });
}
function TrackedLink({
  href,
  children,
  className,
  ariaLabel,
  target,
  rel,
  ctaText,
  ctaLocation,
  eventType = "cta_click",
  trackingParams,
  onClick,
  whileHover,
  whileTap
}) {
  const handleClick = () => {
    if (eventType === "cta_click") {
      trackCtaClick(ctaText, ctaLocation, trackingParams);
    } else {
      trackEvent(eventType, {
        cta_text: ctaText,
        cta_location: ctaLocation,
        ...trackingParams
      });
    }
    onClick == null ? void 0 : onClick();
  };
  return /* @__PURE__ */ jsx(
    motion.a,
    {
      href,
      "aria-label": ariaLabel,
      target,
      rel,
      onClick: handleClick,
      whileHover,
      whileTap,
      className,
      children
    }
  );
}
const SITE_CONTAINER_CLASS = "mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8";
const Logo = "/primewayz-infotech-logo.svg";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { name: "How it Works", href: "/#how-it-works" },
    { name: "Features", href: "/#features" },
    { name: "Success Stories", href: "/#success-stories" },
    { name: "Subscription", href: "/software-development-subscription-uk" },
    { name: "Maintenance", href: "/website-maintenance-subscription-uk" },
    { name: "Pricing", href: "/#pricing" },
    { name: "FAQ", href: "/#faq" }
  ];
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);
  return /* @__PURE__ */ jsxs(
    motion.nav,
    {
      initial: false,
      animate: { y: 0 },
      transition: { duration: 0.45, ease: "easeOut" },
      className: "fixed left-0 right-0 top-0 z-50 border-b border-slate-200/90 bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.04)]",
      style: { paddingTop: "env(safe-area-inset-top)" },
      children: [
        /* @__PURE__ */ jsx("div", { className: SITE_CONTAINER_CLASS, children: /* @__PURE__ */ jsxs("div", { className: "relative flex min-h-[3.25rem] items-center py-2 sm:min-h-16 sm:py-0", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/",
              className: "relative z-10 flex min-h-[44px] min-w-0 shrink-0 items-center pr-2",
              "aria-label": "Primewayz Home",
              children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: Logo,
                  alt: "Primewayz Infotech",
                  style: { height: "40px", width: "auto" }
                }
              )
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 hidden h-full items-center justify-center lg:flex", children: /* @__PURE__ */ jsx("div", { className: "pointer-events-auto flex max-h-14 max-w-[min(100%,36rem)] flex-wrap items-center justify-center gap-x-2 gap-y-1 xl:max-w-[min(100%,44rem)] xl:gap-x-5", children: navLinks.map((link) => /* @__PURE__ */ jsx(
            "a",
            {
              href: link.href,
              className: "rounded-md px-1.5 py-2 text-[13px] font-medium leading-none text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/40 xl:text-sm",
              children: link.name
            },
            link.name
          )) }) }),
          /* @__PURE__ */ jsxs("div", { className: "ml-auto flex shrink-0 items-center gap-1 sm:gap-2", children: [
            /* @__PURE__ */ jsx(
              TrackedLink,
              {
                href: "/#contact",
                ctaText: "Book a call",
                ctaLocation: "navbar_desktop",
                eventType: "book_call_click",
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.98 },
                className: "hidden min-h-[40px] items-center rounded-md bg-slate-900 px-3 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 md:inline-flex xl:px-5 xl:text-sm",
                children: "Book a call"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setIsOpen((v) => !v),
                className: "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/40 lg:hidden",
                "aria-expanded": isOpen,
                "aria-label": isOpen ? "Close menu" : "Open menu",
                "aria-controls": "mobile-menu",
                children: isOpen ? /* @__PURE__ */ jsx(X, { className: "h-6 w-6", strokeWidth: 2 }) : /* @__PURE__ */ jsx(Menu, { className: "h-6 w-6", strokeWidth: 2 })
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsx(
          motion.div,
          {
            id: "mobile-menu",
            initial: { opacity: 0, height: 0 },
            animate: { opacity: 1, height: "auto" },
            exit: { opacity: 0, height: 0 },
            transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
            className: "border-t border-slate-100 bg-white lg:hidden",
            children: /* @__PURE__ */ jsx(
              "div",
              {
                className: `${SITE_CONTAINER_CLASS} max-h-[min(70vh,calc(100dvh-3.5rem))] overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] pt-1`,
                children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5 py-2", children: [
                  navLinks.map((link) => /* @__PURE__ */ jsx(
                    "a",
                    {
                      href: link.href,
                      onClick: () => setIsOpen(false),
                      className: "min-h-[44px] rounded-md px-3 py-3 text-[15px] font-medium leading-snug text-slate-700 active:bg-slate-50",
                      children: link.name
                    },
                    link.name
                  )),
                  /* @__PURE__ */ jsx(
                    TrackedLink,
                    {
                      href: "/#contact",
                      ctaText: "Book a call",
                      ctaLocation: "navbar_mobile",
                      eventType: "book_call_click",
                      onClick: () => setIsOpen(false),
                      whileTap: { scale: 0.99 },
                      className: "mt-3 flex min-h-[48px] w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-[15px] font-semibold text-white shadow-md shadow-slate-900/10",
                      children: "Book a call"
                    }
                  )
                ] })
              }
            )
          }
        ) })
      ]
    }
  );
};
const DEFAULT_INTERVAL = 5200;
const HeroSplitSlider = ({
  slides,
  interval = DEFAULT_INTERVAL,
  className
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [slides.length, interval, paused]);
  if (slides.length === 0) return null;
  const activeSlide = slides[activeIndex];
  const goToSlide = (index) => {
    setActiveIndex(index);
  };
  const contentMotion = reducedMotion ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 1, y: 0 } } : {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 }
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `relative w-full ${className ?? ""}`.trim(),
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
      children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 lg:min-h-[min(70vh,640px)] gap-0 items-stretch", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative order-1 min-h-[280px] sm:min-h-[360px] lg:min-h-0 overflow-hidden rounded-2xl lg:rounded-none lg:rounded-l-3xl", children: [
          /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", initial: false, children: /* @__PURE__ */ jsx(
            motion.img,
            {
              src: activeSlide.image,
              alt: activeSlide.imageAlt,
              initial: { opacity: reducedMotion ? 1 : 0 },
              animate: { opacity: 1 },
              exit: { opacity: reducedMotion ? 1 : 0 },
              transition: { duration: reducedMotion ? 0.05 : 0.65, ease: "easeInOut" },
              className: "absolute inset-0 h-full w-full object-cover",
              loading: "eager",
              decoding: "async"
            },
            activeSlide.id
          ) }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "pointer-events-none absolute inset-y-0 right-0 z-[1] w-24 bg-gradient-to-l from-white via-white/60 to-transparent lg:w-40",
              "aria-hidden": true
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-zinc-900/20 to-transparent lg:hidden", "aria-hidden": true })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative z-10 order-2 flex flex-col justify-center lg:-ml-12 xl:-ml-20 lg:pl-0", children: /* @__PURE__ */ jsxs("div", { className: "relative flex min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-col shrink-0 w-2 overflow-hidden rounded-l-2xl border-y border-l border-zinc-200/80 bg-white/40", children: [
            /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-[40%] bg-emerald-500" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-[30%] bg-emerald-600/90" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-[30%] bg-orange-500" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-xl shadow-zinc-900/5 backdrop-blur-md sm:p-8 lg:max-w-[50rem] lg:rounded-l-none lg:border-l-0 lg:py-10 lg:pl-10 lg:pr-8 xl:pl-12", children: [
            /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", initial: false, children: /* @__PURE__ */ jsxs(
              motion.div,
              {
                initial: contentMotion.initial,
                animate: contentMotion.animate,
                exit: contentMotion.exit,
                transition: { duration: reducedMotion ? 0.05 : 0.52, ease: [0.22, 1, 0.36, 1] },
                children: [
                  /* @__PURE__ */ jsx("div", { className: "mb-5 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700", children: activeSlide.badge }),
                  /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold leading-[1.12] tracking-tight text-zinc-900 sm:text-4xl md:text-[2.85rem]", children: activeSlide.headline }),
                  /* @__PURE__ */ jsx("p", { className: "mt-3 text-xl font-semibold leading-tight text-blue-700 sm:text-2xl", children: activeSlide.highlight }),
                  /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 md:text-lg", children: activeSlide.description })
                ]
              },
              activeSlide.id
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3", children: [
                /* @__PURE__ */ jsxs(
                  TrackedLink,
                  {
                    href: activeSlide.primaryCtaHref,
                    ctaText: activeSlide.primaryCtaLabel,
                    ctaLocation: "hero_primary",
                    trackingParams: {
                      hero_slide: activeSlide.headline
                    },
                    whileHover: reducedMotion ? void 0 : { scale: 1.01 },
                    whileTap: reducedMotion ? void 0 : { scale: 0.99 },
                    className: "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-zinc-900/15 transition-colors hover:bg-zinc-800 sm:w-auto",
                    children: [
                      activeSlide.primaryCtaLabel,
                      /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  TrackedLink,
                  {
                    href: activeSlide.secondaryCtaHref,
                    ctaText: activeSlide.secondaryCtaLabel,
                    ctaLocation: "hero_secondary",
                    trackingParams: {
                      hero_slide: activeSlide.headline
                    },
                    whileHover: reducedMotion ? void 0 : { scale: 1.01 },
                    whileTap: reducedMotion ? void 0 : { scale: 0.99 },
                    className: "inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-7 py-3.5 text-[15px] font-semibold text-zinc-900 shadow-sm transition-colors hover:border-zinc-400 sm:w-auto",
                    children: activeSlide.secondaryCtaLabel
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", role: "tablist", "aria-label": "Hero slide controls", children: slides.map((slide, index) => {
                const isActive = index === activeIndex;
                return /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    role: "tab",
                    "aria-selected": isActive,
                    "aria-label": `Show hero slide ${index + 1}`,
                    onClick: () => goToSlide(index),
                    className: `h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/70 ${isActive ? "w-8 bg-blue-600" : "w-2.5 bg-slate-300 hover:bg-slate-400"}`
                  },
                  slide.id
                );
              }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "sr-only", "aria-live": "polite", children: [
              "Slide ",
              activeIndex + 1,
              " of ",
              slides.length
            ] })
          ] })
        ] }) })
      ] })
    }
  );
};
const heroHeadlineSlides = [
  {
    id: "monthly-delivery",
    badge: "FLEXIBLE MONTHLY DELIVERY",
    headline: "Subscription software delivery for UK SMEs",
    highlight: "Start with Foundation Sprint, then scale monthly capacity",
    description: "Websites, CMS platforms, integrations, and digital improvements - planned, designed, built, tested, and released through a structured monthly delivery model.",
    primaryCtaLabel: "Book a UK discovery call",
    primaryCtaHref: "#contact",
    secondaryCtaLabel: "See plans",
    secondaryCtaHref: "#pricing",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Developer working on a laptop with code on screen"
  },
  {
    id: "adaptive-priorities",
    badge: "FLEXIBLE MONTHLY DELIVERY",
    headline: "Software delivery that adapts as your priorities evolve",
    highlight: "Scale up, slow down, or move to maintenance",
    description: "Start with your current goals, then adjust your delivery pace as your roadmap changes. Add new priorities, refine direction, or switch to maintenance mode without losing continuity.",
    primaryCtaLabel: "Book a UK discovery call",
    primaryCtaHref: "#contact",
    secondaryCtaLabel: "How it works",
    secondaryCtaHref: "#how-it-works",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Team collaborating on software delivery"
  },
  {
    id: "structured-delivery",
    badge: "STRUCTURED DELIVERY MODEL",
    headline: "A structured delivery model with clear execution rhythm",
    highlight: "One clear workstream. Sequential execution. Predictable outcomes.",
    description: "Every approved workstream moves through planning, design, development, QA, and deployment in sequence - helping you stay in control of priorities, approvals, and delivery quality.",
    primaryCtaLabel: "Book a UK discovery call",
    primaryCtaHref: "#contact",
    secondaryCtaLabel: "How delivery works",
    secondaryCtaHref: "#how-it-works",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Software planning discussion between professionals"
  },
  {
    id: "transparent-commercials",
    badge: "TRANSPARENT COMMERCIAL MODEL",
    headline: "Clear monthly capacity. Transparent add-ons. No hidden surprises.",
    highlight: "Know what's included - and what's billed separately",
    description: "Your subscription covers Primewayz delivery capacity for websites, CRM integrations, automation, SEO foundations, maintenance, and ongoing digital improvements. Third-party services like hosting, messaging, payment gateways, and external tools are handled transparently through clearly defined add-ons.",
    primaryCtaLabel: "See plans",
    primaryCtaHref: "#pricing",
    secondaryCtaLabel: "Book a call",
    secondaryCtaHref: "#contact",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Business team reviewing transparent software delivery plan"
  }
];
const subscriptionValueChips = [
  {
    id: "flexible-monthly-capacity",
    label: "Flexible monthly capacity",
    icon: SlidersHorizontal
  },
  {
    id: "technical-seo-foundation-included",
    label: "Technical SEO foundation included",
    icon: Search
  },
  {
    id: "transparent-add-ons",
    label: "Transparent add-ons",
    icon: CircleDollarSign
  },
  {
    id: "move-to-maintenance-anytime",
    label: "Move to maintenance anytime",
    icon: Wrench
  }
];
const subscriptionCapabilitiesData = [
  {
    id: "product-engineering-subscription",
    title: "Product Engineering on Subscription",
    description: "Move forward with a structured delivery model where priorities, requirements, and output are aligned to your business goals month by month.",
    icon: Layers3
  },
  {
    id: "frontend-ux-delivery",
    title: "Frontend and UX Delivery",
    description: "Build polished, high-converting interfaces with clean user journeys, modern frontend implementation, and practical design thinking.",
    icon: MonitorSmartphone
  },
  {
    id: "backend-integrations",
    title: "Backend and Integrations",
    description: "Strengthen your product with scalable backend development, APIs, workflows, and integrations that support real business operations.",
    icon: ServerCog
  },
  {
    id: "qa-refinement-stabilization",
    title: "QA, Refinement, and Stabilization",
    description: "Reduce friction with ongoing testing, issue resolution, validation, and improvement cycles that keep delivery reliable over time.",
    icon: ShieldCheck
  },
  {
    id: "automation-operational-efficiency",
    title: "Automation and Operational Efficiency",
    description: "Identify repetitive work, streamline processes, and introduce practical automation that improves speed, consistency, and control.",
    icon: Workflow
  },
  {
    id: "flexible-output-growth",
    title: "Flexible Output for Long-Term Growth",
    description: "Adjust the delivery rhythm and monthly subscription based on the pace of output your business needs, without forcing a rigid engagement model.",
    icon: Gauge
  }
];
const SubscriptionCapabilitiesSection = () => {
  const featuredIds = ["product-engineering-subscription", "flexible-output-growth"];
  return /* @__PURE__ */ jsxs(
    "section",
    {
      id: "capabilities",
      className: "relative mx-auto w-full py-16 sm:py-20 lg:py-24",
      children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 -z-10 bg-gradient-to-b from-slate-50/30 via-white to-white" }),
        /* @__PURE__ */ jsx(
          "div",
          {
            "aria-label": "Subscription trust highlights",
            className: "mb-12 grid grid-cols-1 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-5 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.25)] backdrop-blur-sm sm:grid-cols-2 sm:gap-x-4 sm:px-7 sm:py-6 lg:mb-16 lg:grid-cols-4 lg:gap-x-6",
            children: subscriptionValueChips.map((item, index) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: `flex min-h-[60px] items-center gap-3 py-2.5 text-slate-700 ${index > 0 ? "lg:border-l lg:border-slate-200/70 lg:pl-6" : ""}`,
                children: [
                  /* @__PURE__ */ jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 text-slate-600", children: /* @__PURE__ */ jsx(item.icon, { className: "h-4 w-4", "aria-hidden": "true" }) }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold leading-5 text-slate-800", children: item.label })
                ]
              },
              item.id
            ))
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "mb-14 lg:mb-20", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-start lg:gap-12", children: [
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 24 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, margin: "-120px" },
              transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
              className: "max-w-3xl",
              children: [
                /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700/90", children: "Built for predictable, flexible delivery" }),
                /* @__PURE__ */ jsx("h2", { className: "text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]", children: "Subscription Delivery, Backed by Full‑Stack Capability" }),
                /* @__PURE__ */ jsx("p", { className: "mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg", children: "Our subscription model is designed to give you more control over priorities, pace, and outcomes. From product engineering and UX to QA, backend, and automation, we support long‑term delivery through structured execution that adapts to your business needs." })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { opacity: 0, x: 20 },
              whileInView: { opacity: 1, x: 0 },
              viewport: { once: true, margin: "-120px" },
              transition: { duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] },
              className: "lg:justify-self-end",
              children: /* @__PURE__ */ jsxs(
                "a",
                {
                  href: "/#how-it-works",
                  className: "group inline-flex items-center gap-2 border-b border-slate-300 pb-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900",
                  children: [
                    "Explore delivery model",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" })
                  ]
                }
              )
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-5 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3", children: subscriptionCapabilitiesData.map((card, index) => {
          const isFeatured = featuredIds.includes(card.id);
          return /* @__PURE__ */ jsxs(
            motion.article,
            {
              initial: { opacity: 0, y: 24 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, margin: "-80px" },
              transition: { duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] },
              className: `group relative rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${isFeatured ? "border-emerald-200/80 bg-emerald-50/40 shadow-[0_12px_40px_-30px_rgba(16,185,129,0.25)] hover:border-emerald-300 hover:shadow-[0_24px_50px_-36px_rgba(16,185,129,0.35)]" : "border-slate-200/70 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.15)] hover:border-slate-300 hover:shadow-[0_20px_40px_-30px_rgba(15,23,42,0.2)]"}`,
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl transition-colors duration-300 ${isFeatured ? "bg-emerald-100/80 text-emerald-700 group-hover:bg-emerald-100" : "bg-slate-100/80 text-slate-600 group-hover:bg-slate-200/80"}`,
                    children: /* @__PURE__ */ jsx(card.icon, { className: "h-6 w-6", "aria-hidden": "true" })
                  }
                ),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold leading-tight text-slate-900", children: card.title }),
                /* @__PURE__ */ jsx("p", { className: "mt-3.5 text-sm leading-6 text-slate-600 sm:text-[15px]", children: card.description }),
                isFeatured && /* @__PURE__ */ jsx("div", { className: "absolute -top-2 right-6 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white", children: "Featured" })
              ]
            },
            card.id
          );
        }) }),
        /* @__PURE__ */ jsx("p", { className: "mt-12 text-center text-sm text-slate-500", children: "A system designed to support both momentum now and sustainability over the long term." })
      ]
    }
  );
};
const Hero = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  const ySlow = useTransform(scrollYProgress, [0, 1], [0, 800]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, 2e3]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  return /* @__PURE__ */ jsxs(
    "section",
    {
      ref: containerRef,
      className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-white pt-20",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "pointer-events-none absolute inset-0 z-0 overflow-hidden", children: [
          /* @__PURE__ */ jsx(
            motion.div,
            {
              style: { y: ySlow, opacity },
              className: "absolute left-10 top-20 h-64 w-64 rounded-full bg-emerald-100/30 opacity-50 blur-3xl"
            }
          ),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              style: { y: yFast, opacity },
              className: "absolute bottom-20 right-10 h-96 w-96 rounded-full bg-indigo-100/30 opacity-50 blur-3xl"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: `relative z-10 ${SITE_CONTAINER_CLASS}`, children: /* @__PURE__ */ jsxs(motion.div, { style: { scale, opacity }, className: "w-full", children: [
          /* @__PURE__ */ jsx(HeroSplitSlider, { slides: heroHeadlineSlides }),
          /* @__PURE__ */ jsx(SubscriptionCapabilitiesSection, {})
        ] }) })
      ]
    }
  );
};
const deliveryHighlights = [
  {
    title: "Flexible monthly capacity",
    label: "Capacity control",
    image: "/images/delivery-model/flexible-monthly-capacity.webp",
    alt: "Monthly delivery capacity dashboard showing adjustable workload planning for UK SME teams",
    description: "Adjust delivery capacity up or down based on your roadmap, campaign needs, fixes, and current priorities.",
    outcome: "Stay aligned with current workload."
  },
  {
    title: "Technical SEO foundation included",
    label: "Search-ready basics",
    image: "/images/delivery-model/technical-seo-foundation.webp",
    alt: "Technical SEO dashboard showing site health checks metadata and performance tracking",
    description: "Keep metadata, page structure, speed checks, tracking improvements, and technical SEO hygiene part of ongoing delivery.",
    outcome: "Keep SEO basics moving monthly."
  },
  {
    title: "Transparent add-ons",
    label: "Commercial clarity",
    image: "/images/delivery-model/transparent-addons.webp",
    alt: "Transparent invoice breakdown separating Primewayz delivery from third party add on costs",
    description: "Keep Primewayz delivery fees separate from third-party costs such as hosting, domain, SSL, tools, or specialist services.",
    outcome: "Know what is included and what is separate."
  },
  {
    title: "Move to maintenance anytime",
    label: "Continuity without pressure",
    image: "/images/delivery-model/maintenance-transition.webp",
    alt: "Workflow transition from active delivery to ongoing website maintenance support",
    description: "Scale down when priorities slow, keep essential support running, and restart active delivery when new priorities return.",
    outcome: "Pause intensity without losing continuity."
  }
];
const UKTrustStrip = () => /* @__PURE__ */ jsx("section", { className: "bg-white py-16", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10", children: [
  /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold uppercase tracking-[0.22em] text-blue-700", children: "Built for predictable, flexible delivery" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-3 max-w-3xl text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl", children: "A clearer monthly support model for UK SME teams" }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-2xl text-base leading-7 text-zinc-600", children: "Keep digital work moving without restarting projects every time priorities change. Scale capacity, keep SEO basics in view, separate vendor costs, and move into maintenance when active delivery slows." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/15", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-blue-200", children: "What this means in practice" }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-3 sm:grid-cols-2", children: [
        "Adjust monthly delivery effort",
        "Keep technical foundations moving",
        "Separate delivery and vendor costs",
        "Pause intensity without losing continuity"
      ].map((item) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200",
          children: [
            /* @__PURE__ */ jsx("span", { className: "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white", children: "✓" }),
            /* @__PURE__ */ jsx("span", { children: item })
          ]
        },
        item
      )) })
    ] })
  ] }),
  /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-6 lg:grid-cols-2", children: deliveryHighlights.map((item) => /* @__PURE__ */ jsxs(
    "article",
    {
      className: "group overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-zinc-50/70 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-blue-950/10",
      children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-[16/9] overflow-hidden border-b border-zinc-200 bg-white p-4", children: /* @__PURE__ */ jsx(
          "img",
          {
            decoding: "async",
            src: item.image,
            alt: item.alt,
            className: "h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]",
            loading: "lazy"
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700", children: item.label }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-black tracking-tight text-zinc-950", children: item.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-7 text-zinc-600", children: item.description }),
          /* @__PURE__ */ jsx("div", { className: "mt-5 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800", children: item.outcome })
        ] })
      ]
    },
    item.title
  )) })
] }) }) });
const servicePaths = [
  {
    title: "Software Development Subscription",
    description: "Monthly software delivery support for websites, automation, integrations, SEO foundations, and ongoing digital improvements.",
    href: "/software-development-subscription-uk",
    icon: Code2
  },
  {
    title: "Website Maintenance Subscription",
    description: "Reliable website updates, bug fixes, technical SEO checks, landing page improvements, analytics support, and monthly care.",
    href: "/website-maintenance-subscription-uk",
    icon: LifeBuoy
  },
  {
    title: "CRM Integration & Support",
    description: "Connect CRM with ERP, website forms, email, reporting, support workflows, and automation for cleaner business operations.",
    href: "/crm-integration-support-uk",
    icon: Network
  }
];
const ServicePathCards = () => {
  return /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden bg-white py-24 sm:py-28", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold uppercase tracking-[0.24em] text-emerald-600", children: "Explore Primewayz UK service paths" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-4 text-3xl font-black tracking-tight text-[#000A2D] sm:text-4xl", children: "Choose the support route that fits your next operational priority" }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg leading-8 text-slate-600", children: "Start with the area causing the most friction today — software delivery, website maintenance, or CRM integration — then build a practical monthly improvement rhythm around it." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 md:grid-cols-3", children: servicePaths.map((item) => {
        const Icon = item.icon;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: item.href,
            className: "group rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-xl",
            children: [
              /* @__PURE__ */ jsx("div", { className: "mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#000A2D] text-white transition group-hover:bg-emerald-600", children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-[#000A2D]", children: item.title }),
              /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-7 text-slate-600", children: item.description }),
              /* @__PURE__ */ jsxs("div", { className: "mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700", children: [
                "View service page",
                /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 transition group-hover:translate-x-1" })
              ] })
            ]
          },
          item.href
        );
      }) })
    ] })
  ] });
};
const traditionalSteps = [
  "Discovery",
  "Fixed scope",
  "Build",
  "QA",
  "Launch",
  "Change request"
];
const subscriptionSteps = [
  "Prioritise",
  "Deliver",
  "Review",
  "Adjust",
  "Support",
  "Continue"
];
const comparisonModels = [
  {
    title: "Traditional project model",
    eyebrow: "Linear delivery path",
    description: "Scope is locked early, delivery moves in a straight line, and new priorities usually become change requests that slow momentum.",
    image: "/images/model-comparison/traditional-project-model.webp",
    imageAlt: "Traditional software project model showing discovery scope build QA launch steps and change request roadblocks",
    tone: "traditional",
    steps: traditionalSteps,
    points: [
      "Large upfront scope and commitment",
      "Changes usually need re-estimation",
      "Momentum slows after launch"
    ]
  },
  {
    title: "Primewayz subscription model",
    eyebrow: "Continuous monthly delivery",
    description: "Your roadmap stays flexible. We prioritise, deliver, review, adjust capacity, and continue support without restarting the project.",
    image: "/images/model-comparison/primewayz-subscription-model.webp",
    imageAlt: "Primewayz subscription model showing continuous monthly software delivery review capacity adjustment and ongoing support",
    tone: "primewayz",
    steps: subscriptionSteps,
    points: [
      "Monthly capacity aligned to business needs",
      "Priorities can change without project reset",
      "Delivery, maintenance, and improvement stay connected"
    ]
  }
];
const benefits$1 = [
  {
    icon: RefreshCw,
    title: "Software adapts to you",
    description: "Your roadmap can evolve without forcing a full project reset."
  },
  {
    icon: ShieldCheck,
    title: "Full functional control",
    description: "Add, remove, or reprioritise work as business needs change."
  },
  {
    icon: Zap,
    title: "Continuous evolution",
    description: "Improve your platform steadily instead of waiting for the next big rebuild."
  }
];
const Philosophy = () => {
  return /* @__PURE__ */ jsx("section", { className: "py-16 bg-white overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsx(
        motion.h2,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          className: "text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6",
          children: "A better model for ongoing software delivery"
        }
      ),
      /* @__PURE__ */ jsx(
        motion.p,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: 0.1 },
          className: "text-lg text-zinc-600 max-w-3xl mx-auto",
          children: "A structured monthly delivery model built for flexibility, control, and continuity - without rigid project cycles or scope friction."
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12", children: comparisonModels.map((model, index) => {
      const isPrimewayz = model.tone === "primewayz";
      return /* @__PURE__ */ jsxs(
        motion.article,
        {
          initial: { opacity: 0, y: 28 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { delay: index * 0.12 },
          className: [
            "group relative overflow-hidden rounded-3xl border p-5 md:p-6 transition-all duration-500 motion-safe:hover:-translate-y-1",
            isPrimewayz ? "bg-blue-900 border-blue-700 shadow-xl shadow-blue-200/40 hover:shadow-2xl hover:shadow-blue-300/40" : "bg-slate-50 border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/80"
          ].join(" "),
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: [
                  "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                  isPrimewayz ? "bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.28),transparent_38%)]" : "bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_38%)]"
                ].join(" ")
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 mb-5", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(
                    "p",
                    {
                      className: [
                        "text-xs font-bold uppercase tracking-[0.28em] mb-2",
                        isPrimewayz ? "text-blue-200" : "text-slate-500"
                      ].join(" "),
                      children: model.eyebrow
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "h3",
                    {
                      className: [
                        "text-2xl font-bold tracking-tight",
                        isPrimewayz ? "text-white" : "text-slate-900"
                      ].join(" "),
                      children: model.title
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: [
                      "hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:rotate-3 group-hover:scale-105",
                      isPrimewayz ? "border-blue-500 bg-blue-800 text-blue-100" : "border-slate-200 bg-white text-slate-500"
                    ].join(" "),
                    children: isPrimewayz ? /* @__PURE__ */ jsx(Check, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx(X, { className: "h-6 w-6" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                "p",
                {
                  className: [
                    "text-sm leading-relaxed mb-6",
                    isPrimewayz ? "text-blue-100/90" : "text-slate-600"
                  ].join(" "),
                  children: model.description
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: [
                    "overflow-hidden rounded-2xl border mb-6 bg-white/90",
                    isPrimewayz ? "border-blue-600/70" : "border-slate-200"
                  ].join(" "),
                  children: /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: model.image,
                      alt: model.imageAlt,
                      loading: "lazy",
                      decoding: "async",
                      width: 1280,
                      height: 920,
                      className: "w-full aspect-[16/10] object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.035]"
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2 mb-6", children: model.steps.map((step, stepIndex) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: [
                      "rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-300 motion-safe:group-hover:-translate-y-0.5",
                      isPrimewayz ? "border-blue-500/70 bg-blue-800/70 text-blue-50" : "border-slate-200 bg-white text-slate-600"
                    ].join(" "),
                    children: step
                  }
                ),
                stepIndex < model.steps.length - 1 && /* @__PURE__ */ jsx(
                  ArrowRight,
                  {
                    className: [
                      "h-3.5 w-3.5",
                      isPrimewayz ? "text-blue-300" : "text-slate-400"
                    ].join(" ")
                  }
                )
              ] }, step)) }),
              /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: model.points.map((point) => /* @__PURE__ */ jsxs(
                "li",
                {
                  className: [
                    "flex items-start gap-3 text-sm leading-relaxed",
                    isPrimewayz ? "text-blue-50" : "text-slate-700"
                  ].join(" "),
                  children: [
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: [
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                          isPrimewayz ? "bg-blue-200 text-blue-900" : "bg-slate-200 text-slate-600"
                        ].join(" "),
                        children: isPrimewayz ? /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" })
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: isPrimewayz ? "" : "line-through decoration-slate-300", children: point })
                  ]
                },
                point
              )) })
            ] })
          ]
        },
        model.title
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5 mt-6", children: benefits$1.map((benefit, i) => /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { delay: i * 0.1 },
        className: "group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300",
        children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 border border-blue-100 shadow-sm transition-transform duration-300 group-hover:scale-105", children: /* @__PURE__ */ jsx(benefit.icon, { className: "w-7 h-7 text-blue-700" }) }),
          /* @__PURE__ */ jsx("h4", { className: "text-xl font-bold text-slate-900 mb-3", children: benefit.title }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-600 text-sm leading-relaxed", children: benefit.description })
        ]
      },
      benefit.title
    )) })
  ] }) });
};
const flowSteps = [
  {
    label: "STEP 01",
    title: "Discovery and priority alignment",
    description: "Tell us about your goals, roadmap, constraints, and current priorities.",
    icon: Target
  },
  {
    label: "STEP 02",
    title: "Scope the right delivery model",
    description: "We define the best-fit plan, workstream structure, and execution approach for your business.",
    icon: Layers
  },
  {
    label: "STEP 03",
    title: "Start delivery and review progress",
    description: "Work moves through planning, build, QA, and release with clear visibility and regular updates.",
    icon: BarChart
  }
];
const HowItWorks = () => {
  const [imagePan, setImagePan] = useState({ x: 0, y: 0, active: false });
  const handleInfographicMouseMove = (event) => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;
    setImagePan({
      x: relativeX * 18,
      y: relativeY * -22,
      active: true
    });
  };
  const handleInfographicMouseLeave = () => {
    setImagePan({ x: 0, y: 0, active: false });
  };
  return /* @__PURE__ */ jsx("section", { id: "how-it-works", className: "bg-white py-24", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12 md:mb-14", children: [
      /* @__PURE__ */ jsx(
        motion.p,
        {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          className: "mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700/80",
          children: "PROCESS & DELIVERY"
        }
      ),
      /* @__PURE__ */ jsx(
        motion.h2,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          className: "text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4",
          children: "How delivery works"
        }
      ),
      /* @__PURE__ */ jsx(
        motion.p,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: 0.1 },
          className: "text-lg text-zinc-600 max-w-3xl mx-auto",
          children: "A structured process designed for clarity, prioritisation, and steady progress - from discovery through release."
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
        className: "overflow-hidden rounded-[2.25rem] border border-zinc-200 bg-zinc-50/80",
        children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_0.92fr]", children: [
          /* @__PURE__ */ jsx("div", { className: "border-b border-zinc-200 bg-zinc-100/70 p-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-8", children: /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { opacity: 0, x: -18 },
              whileInView: { opacity: 1, x: 0 },
              viewport: { once: true },
              transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
              onMouseMove: handleInfographicMouseMove,
              onMouseLeave: handleInfographicMouseLeave,
              className: "group relative mx-auto w-full overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_24px_54px_-34px_rgba(15,23,42,0.75)]",
              "aria-label": "Software delivery process infographic",
              children: /* @__PURE__ */ jsxs("div", { className: "relative mx-auto aspect-[9/16] w-full overflow-hidden bg-white", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: "/images/process-delivery/how-delivery-works-infographic.webp",
                    alt: "Infographic showing the software delivery workflow from discovery and priority alignment through delivery planning, progress review, release, support, and continuous improvement",
                    loading: "lazy",
                    decoding: "async",
                    width: 1200,
                    height: 1500,
                    style: {
                      transform: imagePan.active ? `scale(1.07) translate3d(${imagePan.x}px, ${imagePan.y}px, 0)` : "scale(1) translate3d(0, 0, 0)"
                    },
                    className: "h-full w-full object-contain object-center transition-transform duration-300 ease-out"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-tr from-blue-950/0 via-transparent to-blue-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" }),
                /* @__PURE__ */ jsxs("div", { className: "pointer-events-none absolute inset-x-5 bottom-5 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-blue-700", children: "Visual delivery flow" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-medium text-zinc-800", children: "Prioritise, plan, deliver, review, release, and improve." })
                ] })
              ] })
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "relative p-7 md:p-10 lg:p-12", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-2xl md:text-3xl font-bold leading-tight text-zinc-900", children: "Delivery milestones" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-zinc-600", children: "A clear three-step path that turns priorities into structured delivery, visible progress, and release-ready outcomes." }),
            /* @__PURE__ */ jsxs("div", { className: "relative mt-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative space-y-5", children: [
                /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute bottom-5 left-[1.22rem] top-5 w-px bg-zinc-300/80" }),
                flowSteps.map((step, index) => /* @__PURE__ */ jsxs(
                  motion.div,
                  {
                    initial: { opacity: 0, x: 18 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true },
                    transition: { delay: index * 0.1, duration: 0.45 },
                    className: "relative grid grid-cols-[2.5rem,1fr] items-center gap-4",
                    children: [
                      /* @__PURE__ */ jsx("div", { className: "z-10 flex h-[2.5rem] w-[2.5rem] shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700 shadow-[0_8px_16px_-12px_rgba(30,64,175,0.55)]", children: /* @__PURE__ */ jsx(step.icon, { className: "h-4 w-4" }) }),
                      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-zinc-200/95 bg-white px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.55)] sm:px-5 sm:py-4", children: [
                        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700", children: step.label }),
                        /* @__PURE__ */ jsx("h4", { className: "mt-1 text-xl font-semibold leading-tight text-zinc-900 sm:text-2xl", children: step.title }),
                        /* @__PURE__ */ jsx("p", { className: "mt-1.5 max-w-xl text-sm leading-6 text-zinc-600", children: step.description })
                      ] })
                    ]
                  },
                  step.title
                ))
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-6 pl-[3.15rem]", children: /* @__PURE__ */ jsx(
                TrackedLink,
                {
                  href: "#contact",
                  ctaText: "Book a UK discovery call",
                  ctaLocation: "how_it_works",
                  eventType: "book_call_click",
                  whileHover: { scale: 1.01 },
                  whileTap: { scale: 0.99 },
                  className: "inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800",
                  children: "Book a UK discovery call"
                }
              ) })
            ] })
          ] })
        ] })
      }
    )
  ] }) });
};
const steps$1 = [
  {
    id: "request",
    title: "Submit a priority",
    description: "Add approved requests, fixes, or next-phase goals to your backlog.",
    icon: MessageSquare,
    color: "emerald"
  },
  {
    id: "queue",
    title: "Prioritise the right workstream",
    description: "We align the next approved item with your plan, roadmap, and current business priorities.",
    icon: Users,
    color: "indigo"
  },
  {
    id: "build",
    title: "Build in sequence",
    description: "Work moves through planning, design, build, QA, and release with clear visibility.",
    icon: Code2,
    color: "emerald"
  },
  {
    id: "deliver",
    title: "Review and release",
    description: "Review progress, approve outcomes, and move the next item into delivery.",
    icon: Rocket,
    color: "indigo"
  }
];
const InteractiveDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setCurrentStep((curr) => (curr + 1) % steps$1.length);
            return 0;
          }
          return prev + 1;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying]);
  const handleStepClick = (index) => {
    setCurrentStep(index);
    setProgress(0);
    setIsAutoPlaying(false);
  };
  steps$1[currentStep].icon;
  return /* @__PURE__ */ jsx("section", { id: "demo", className: "py-24 bg-zinc-50 overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4",
          children: [
            /* @__PURE__ */ jsx(Zap, { className: "w-3 h-3" }),
            "Interactive Experience"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        motion.h2,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: 0.1 },
          className: "text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4",
          children: [
            "How work moves from ",
            /* @__PURE__ */ jsx("span", { className: "text-emerald-600 italic", children: "request" }),
            " to release"
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        motion.p,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: 0.2 },
          className: "max-w-2xl mx-auto text-lg text-zinc-600",
          children: "A structured delivery flow built for clarity, prioritisation, and steady monthly progress."
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center", children: [
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: steps$1.map((step, index) => /* @__PURE__ */ jsxs(
        motion.button,
        {
          onClick: () => handleStepClick(index),
          initial: { opacity: 0, x: -20 },
          whileInView: { opacity: 1, x: 0 },
          viewport: { once: true },
          transition: { delay: index * 0.1 },
          className: `w-full text-left p-6 rounded-2xl transition-all relative overflow-hidden group ${currentStep === index ? "bg-white shadow-xl shadow-zinc-200/50 ring-1 ring-zinc-200" : "hover:bg-zinc-100"}`,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 relative z-10", children: [
              /* @__PURE__ */ jsx("div", { className: `p-3 rounded-xl ${currentStep === index ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-500 group-hover:bg-zinc-300"} transition-colors`, children: /* @__PURE__ */ jsx(step.icon, { className: "w-6 h-6" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: `font-bold text-lg mb-1 ${currentStep === index ? "text-zinc-900" : "text-zinc-500"}`, children: step.title }),
                /* @__PURE__ */ jsx("p", { className: `text-sm leading-relaxed ${currentStep === index ? "text-zinc-600" : "text-zinc-400"}`, children: step.description })
              ] })
            ] }),
            currentStep === index && /* @__PURE__ */ jsx(
              motion.div,
              {
                className: "absolute bottom-0 left-0 h-1 bg-emerald-600",
                initial: { width: 0 },
                animate: { width: `${progress}%` },
                transition: { ease: "linear" }
              }
            )
          ]
        },
        step.id
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "relative h-[500px] bg-zinc-900 rounded-[2.5rem] shadow-2xl shadow-emerald-900/20 p-8 flex flex-col overflow-hidden border border-zinc-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8 border-b border-zinc-800 pb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-red-500/50" }),
            /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-amber-500/50" }),
            /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-emerald-500/50" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "px-3 py-1 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-500 uppercase tracking-widest", children: "Primewayz_OS v2.4" })
        ] }),
        /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.95, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 1.05, y: -20 },
            transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
            className: "flex-1 flex flex-col items-center justify-center text-center",
            children: [
              currentStep === 0 && /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm space-y-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50 backdrop-blur-sm", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4 text-emerald-400" }) }),
                    /* @__PURE__ */ jsx("div", { className: "h-2 w-24 bg-zinc-700 rounded-full" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "h-3 w-full bg-zinc-700/50 rounded-full" }),
                    /* @__PURE__ */ jsx("div", { className: "h-3 w-3/4 bg-zinc-700/50 rounded-full" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    animate: { y: [0, -5, 0] },
                    transition: { repeat: Infinity, duration: 2 },
                    className: "flex justify-center",
                    children: /* @__PURE__ */ jsxs("div", { className: "bg-emerald-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40", children: [
                      /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }),
                      "Submit Priority"
                    ] })
                  }
                )
              ] }),
              currentStep === 1 && /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm space-y-6", children: [
                /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-4 mb-8", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    initial: { scale: 0 },
                    animate: { scale: 1 },
                    transition: { delay: i * 0.1 },
                    className: "w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center",
                    children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6 text-indigo-400" })
                  },
                  i
                )) }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-emerald-500" }),
                      /* @__PURE__ */ jsx("div", { className: "h-2 w-32 bg-zinc-600 rounded-full" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "px-2 py-1 rounded bg-indigo-500/10 text-[10px] text-indigo-400 font-bold", children: "HIGH PRIORITY" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    motion.div,
                    {
                      initial: { x: -20, opacity: 0 },
                      animate: { x: 0, opacity: 1 },
                      transition: { delay: 0.5 },
                      className: "p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 flex items-center justify-between opacity-50",
                      children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-zinc-600" }),
                        /* @__PURE__ */ jsx("div", { className: "h-2 w-24 bg-zinc-600 rounded-full" })
                      ] })
                    }
                  )
                ] })
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm space-y-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative h-48 flex items-center justify-center", children: [
                  /* @__PURE__ */ jsx(
                    motion.div,
                    {
                      animate: { rotate: 360 },
                      transition: { duration: 10, repeat: Infinity, ease: "linear" },
                      className: "absolute inset-0 flex items-center justify-center",
                      children: /* @__PURE__ */ jsx("div", { className: "w-40 h-40 rounded-full border-2 border-dashed border-emerald-500/20" })
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "relative z-10 p-8 bg-emerald-600/10 rounded-3xl border border-emerald-500/30", children: /* @__PURE__ */ jsx(Code2, { className: "w-12 h-12 text-emerald-400" }) }),
                  [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx(
                    motion.div,
                    {
                      animate: {
                        x: [0, Math.random() * 40 - 20, 0],
                        y: [0, Math.random() * 40 - 20, 0],
                        opacity: [0.2, 0.8, 0.2]
                      },
                      transition: { duration: 3, repeat: Infinity, delay: i * 0.5 },
                      className: "absolute text-[10px] font-mono text-emerald-500/40",
                      style: {
                        top: `${Math.random() * 80 + 10}%`,
                        left: `${Math.random() * 80 + 10}%`
                      },
                      children: "{...}"
                    },
                    i
                  ))
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest", children: [
                    /* @__PURE__ */ jsx("span", { children: "Development Progress" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      Math.floor(progress),
                      "%"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "h-2 w-full bg-zinc-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                    motion.div,
                    {
                      className: "h-full bg-emerald-500",
                      initial: { width: 0 },
                      animate: { width: `${progress}%` },
                      transition: { ease: "linear" }
                    }
                  ) })
                ] })
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm space-y-8", children: [
                /* @__PURE__ */ jsxs(
                  motion.div,
                  {
                    initial: { scale: 0.8, opacity: 0 },
                    animate: { scale: 1, opacity: 1 },
                    className: "relative",
                    children: [
                      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" }),
                      /* @__PURE__ */ jsx("div", { className: "relative z-10 w-24 h-24 mx-auto bg-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-900/50", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-12 h-12 text-white" }) }),
                      /* @__PURE__ */ jsx(
                        motion.div,
                        {
                          animate: { scale: [1, 1.2, 1], opacity: [0, 1, 0] },
                          transition: { repeat: Infinity, duration: 2 },
                          className: "absolute inset-0 border-2 border-emerald-500 rounded-3xl"
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-xl font-bold text-white", children: "Review and Release" }),
                  /* @__PURE__ */ jsx("p", { className: "text-zinc-500 text-sm", children: "Review progress, approve outcomes, and move the next item into delivery." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-bold border border-zinc-700", children: "Request Revision" }),
                  /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-2", children: [
                    "Approve & Close",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" })
                  ] })
                ] })
              ] })
            ]
          },
          currentStep
        ) }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        className: "mt-20 p-8 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-8",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-emerald-600/10 flex items-center justify-center border border-emerald-500/20", children: /* @__PURE__ */ jsx(Sparkles, { className: "w-8 h-8 text-emerald-500" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-xl font-bold text-white mb-1", children: "Experience it for real." }),
              /* @__PURE__ */ jsx("p", { className: "text-zinc-500", children: "Book a UK discovery call to see how we can transform your development." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            TrackedLink,
            {
              href: "#contact",
              ctaText: "Book a UK discovery call",
              ctaLocation: "interactive_demo",
              eventType: "book_call_click",
              whileHover: { scale: 1.05 },
              whileTap: { scale: 0.95 },
              className: "px-8 py-4 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2",
              children: [
                "Book a UK discovery call",
                /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5" })
              ]
            }
          )
        ]
      }
    )
  ] }) });
};
const BASE_PATH = "/".replace(/\/$/, "");
function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalizedPath}`;
}
const stackRows = [
  ["React", "Next.js", "TypeScript", "Node.js", "Java", "Python", "C#", "Go", "Swift"],
  ["Angular", "Vue.js", "PHP", "Rails", ".NET", "Android", "iOS", "Kotlin", "PostgreSQL"]
];
const initialFormData = {
  name: "",
  email: "",
  company: "",
  requirement: ""
};
const TechStack = () => {
  const [selectedStack, setSelectedStack] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const allStacks = useMemo(() => stackRows.flat(), []);
  const closeModal = () => {
    setSelectedStack(null);
    setSubmitMessage(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setFormData(initialFormData);
  };
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedStack) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);
    const messageLines = [
      `Interested stack: ${selectedStack}`,
      formData.company.trim() ? `Company: ${formData.company.trim()}` : null,
      "",
      formData.requirement.trim() || "Customer asked for stack consultation."
    ].filter(Boolean);
    try {
      const response = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          message: messageLines.join("\n")
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error((data == null ? void 0 : data.error) || "Unable to submit stack request right now.");
      }
      setSubmitMessage(`Thanks! We received your request for ${selectedStack}.`);
      setFormData(initialFormData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to send your request.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("section", { className: "bg-zinc-100 py-20 md:py-24 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center", children: [
      /* @__PURE__ */ jsxs(
        motion.h2,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-100px" },
          className: "text-4xl md:text-5xl font-bold tracking-tight text-zinc-900",
          children: [
            "Yes. We cover your tech stack",
            /* @__PURE__ */ jsx("span", { className: "text-orange-500", children: "." })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        motion.p,
        {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          transition: { delay: 0.1 },
          viewport: { once: true, margin: "-100px" },
          className: "mx-auto mt-4 max-w-2xl text-base md:text-lg text-zinc-600",
          children: "Our 4,000+ team has expertise across almost every programming language."
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-14 space-y-4", children: stackRows.map((row, rowIndex) => {
      const marqueeItems = [...row, ...row];
      return /* @__PURE__ */ jsxs("div", { className: "tech-marquee-row group relative overflow-hidden", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: `tech-marquee-track ${rowIndex % 2 === 0 ? "tech-marquee-track-left" : "tech-marquee-track-right"}`,
            children: marqueeItems.map((stack, idx) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  setSelectedStack(stack);
                  setSubmitMessage(null);
                  setSubmitError(null);
                },
                className: "whitespace-nowrap text-4xl md:text-6xl leading-[1.25] py-1 font-bold text-zinc-300 hover:text-zinc-700 focus-visible:text-zinc-700 transition-colors duration-300",
                "aria-label": `Open enquiry form for ${stack}`,
                children: stack
              },
              `${stack}-${idx}`
            ))
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-100 to-transparent" }),
        /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-100 to-transparent" })
      ] }, rowIndex);
    }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-10 flex justify-center", children: /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setSelectedStack(allStacks[0]),
        className: "group inline-flex items-center gap-2 border-b border-zinc-400 pb-1 text-sm font-semibold text-zinc-700 hover:text-zinc-900 hover:border-zinc-800 transition-colors",
        children: [
          "Our full repertoire",
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 transition-transform group-hover:translate-x-0.5" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: selectedStack && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 z-[80] bg-zinc-900/60 backdrop-blur-[2px] p-4",
        children: /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 22, scale: 0.97 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 16, scale: 0.98 },
            transition: { duration: 0.2 },
            className: "mx-auto mt-10 w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 md:p-8 shadow-2xl",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-start justify-between gap-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500", children: "Stack Enquiry" }),
                  /* @__PURE__ */ jsx("h3", { className: "mt-2 text-2xl font-bold text-zinc-900", children: selectedStack }),
                  /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-zinc-600", children: "Share your requirement and our team will reach out with the right plan." })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: closeModal,
                    className: "rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors",
                    "aria-label": "Close stack enquiry form",
                    children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      name: "name",
                      value: formData.name,
                      onChange: handleChange,
                      placeholder: "Full name",
                      required: true,
                      className: "w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "email",
                      name: "email",
                      value: formData.email,
                      onChange: handleChange,
                      placeholder: "Work email",
                      required: true,
                      className: "w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    name: "company",
                    value: formData.company,
                    onChange: handleChange,
                    placeholder: "Company name (optional)",
                    className: "w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    name: "requirement",
                    value: formData.requirement,
                    onChange: handleChange,
                    rows: 4,
                    placeholder: `What do you need help with in ${selectedStack}?`,
                    required: true,
                    className: "w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition resize-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                  }
                ),
                submitError && /* @__PURE__ */ jsx("p", { className: "text-sm text-rose-600", children: submitError }),
                submitMessage && /* @__PURE__ */ jsx("p", { className: "text-sm text-emerald-700", children: submitMessage }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "submit",
                    disabled: isSubmitting,
                    className: "inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-75",
                    children: [
                      /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
                      isSubmitting ? "Sending..." : `Send for ${selectedStack}`
                    ]
                  }
                )
              ] })
            ]
          }
        )
      }
    ) })
  ] });
};
const stats = [
  {
    label: "Faster Delivery",
    value: 3,
    suffix: "x",
    description: "Compared to traditional agencies",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50"
  },
  {
    label: "Cost Reduction",
    value: 40,
    suffix: "%",
    description: "Average savings on dev overhead",
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-50"
  },
  {
    label: "Uptime Guarantee",
    value: 99.9,
    suffix: "%",
    description: "Reliable infrastructure & code",
    icon: Clock,
    color: "text-indigo-500",
    bg: "bg-indigo-50"
  },
  {
    label: "Success Rate",
    value: 100,
    suffix: "%",
    description: "Project completion & satisfaction",
    icon: Target,
    color: "text-rose-500",
    bg: "bg-rose-50"
  }
];
const Counter = ({ value, suffix, decimals = 0 }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(decimals));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState("0");
  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 2,
        ease: "easeOut"
      });
      return controls.stop;
    }
  }, [isInView, value, count]);
  useEffect(() => {
    return rounded.on("change", (v) => setDisplayValue(v));
  }, [rounded]);
  return /* @__PURE__ */ jsxs("span", { ref, children: [
    displayValue,
    suffix
  ] });
};
const Stats = () => {
  return /* @__PURE__ */ jsxs("section", { className: "py-24 bg-zinc-900 text-white overflow-hidden relative", children: [
    /* @__PURE__ */ jsxs("div", { className: "absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[150px]" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12", children: stats.map((stat, index) => /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 30 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: index * 0.1, duration: 0.6 },
          className: "flex flex-col items-center text-center group",
          children: [
            /* @__PURE__ */ jsx(
              motion.div,
              {
                whileHover: { scale: 1.15, rotate: 5 },
                className: `w-16 h-16 rounded-3xl ${stat.bg} flex items-center justify-center mb-6 transition-colors duration-300`,
                children: /* @__PURE__ */ jsx(stat.icon, { className: `w-8 h-8 ${stat.color}` })
              }
            ),
            /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { scale: 0.5, opacity: 0 },
                whileInView: { scale: 1, opacity: 1 },
                viewport: { once: true },
                transition: { delay: index * 0.1 + 0.3, type: "spring", stiffness: 100 },
                className: "text-5xl font-bold tracking-tighter mb-2",
                children: /* @__PURE__ */ jsx(
                  Counter,
                  {
                    value: stat.value,
                    suffix: stat.suffix,
                    decimals: stat.value % 1 !== 0 ? 1 : 0
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-zinc-300 mb-2 uppercase tracking-wider", children: stat.label }),
            /* @__PURE__ */ jsx("p", { className: "text-zinc-500 text-sm max-w-[200px]", children: stat.description })
          ]
        },
        index
      )) }),
      /* @__PURE__ */ jsx("div", { className: "mt-24 pt-24 border-t border-zinc-800", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-16 items-center", children: [
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, x: -50 },
            whileInView: { opacity: 1, x: 0 },
            viewport: { once: true },
            children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-3xl md:text-4xl font-bold mb-6", children: [
                "Visualizing the ",
                /* @__PURE__ */ jsx("span", { className: "text-emerald-500", children: "Efficiency Gap" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-zinc-400 text-lg mb-8", children: "Traditional models are plagued by communication overhead, context switching, and idle time. Our model eliminates these bottlenecks through sequential execution and dedicated focus." }),
              /* @__PURE__ */ jsx("div", { className: "space-y-6", children: [
                { label: "Traditional Agency", value: 35, color: "bg-zinc-700" },
                { label: "Primewayz Model", value: 95, color: "bg-emerald-500" }
              ].map((bar, i) => /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm font-medium uppercase tracking-wider", children: [
                  /* @__PURE__ */ jsx("span", { children: bar.label }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    bar.value,
                    "% Efficiency"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-3 bg-zinc-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    initial: { width: 0 },
                    whileInView: { width: `${bar.value}%` },
                    viewport: { once: true },
                    transition: { duration: 1.5, delay: 0.5, ease: "easeOut" },
                    className: `h-full ${bar.color} rounded-full`
                  }
                ) })
              ] }, i)) })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.8 },
            whileInView: { opacity: 1, scale: 1 },
            viewport: { once: true },
            className: "relative aspect-square max-w-md mx-auto lg:mx-0",
            children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 400 400", className: "w-full h-full", children: [
              /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "grad1", x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [
                /* @__PURE__ */ jsx("stop", { offset: "0%", style: { stopColor: "#10b981", stopOpacity: 1 } }),
                /* @__PURE__ */ jsx("stop", { offset: "100%", style: { stopColor: "#3b82f6", stopOpacity: 1 } })
              ] }) }),
              /* @__PURE__ */ jsx("circle", { cx: "200", cy: "200", r: "180", fill: "none", stroke: "rgba(255,255,255,0.05)", strokeWidth: "1" }),
              /* @__PURE__ */ jsx("circle", { cx: "200", cy: "200", r: "140", fill: "none", stroke: "rgba(255,255,255,0.05)", strokeWidth: "1" }),
              /* @__PURE__ */ jsxs(
                motion.g,
                {
                  animate: { rotate: 360 },
                  transition: { duration: 20, repeat: Infinity, ease: "linear" },
                  style: { originX: "200px", originY: "200px" },
                  children: [
                    /* @__PURE__ */ jsx("circle", { cx: "200", cy: "20", r: "8", fill: "#10b981" }),
                    /* @__PURE__ */ jsx("circle", { cx: "380", cy: "200", r: "8", fill: "#3b82f6" }),
                    /* @__PURE__ */ jsx("circle", { cx: "200", cy: "380", r: "8", fill: "#10b981" }),
                    /* @__PURE__ */ jsx("circle", { cx: "20", cy: "200", r: "8", fill: "#3b82f6" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("circle", { cx: "200", cy: "200", r: "80", fill: "url(#grad1)", opacity: "0.2" }),
              /* @__PURE__ */ jsx("circle", { cx: "200", cy: "200", r: "60", fill: "url(#grad1)", opacity: "0.4" }),
              /* @__PURE__ */ jsx("circle", { cx: "200", cy: "200", r: "40", fill: "url(#grad1)" }),
              /* @__PURE__ */ jsx("text", { x: "200", y: "205", textAnchor: "middle", fill: "white", fontSize: "12", fontWeight: "bold", className: "uppercase tracking-widest", children: "Core" })
            ] })
          }
        )
      ] }) })
    ] })
  ] });
};
const deliveryPrinciples = [
  {
    title: "Flexible monthly capacity",
    description: "Scale delivery based on your roadmap and pace.",
    icon: RefreshCw,
    color: "emerald"
  },
  {
    title: "One approved workstream at a time",
    description: "Keeps execution focused and predictable on entry plans.",
    icon: Terminal,
    color: "indigo"
  },
  {
    title: "Transparent commercial model",
    description: "Clear subscription scope with add-ons shown separately.",
    icon: Shield,
    color: "amber"
  },
  {
    title: "Built for evolving roadmaps",
    description: "Add, reprioritise, or pause work as business needs change.",
    icon: GitBranch,
    color: "emerald"
  },
  {
    title: "Quality built into delivery",
    description: "Planning, build, QA, and release happen through a structured flow.",
    icon: Code2,
    color: "indigo"
  },
  {
    title: "Continuity without rigid lock-in",
    description: "Move to maintenance mode when priorities slow down.",
    icon: Zap,
    color: "amber"
  }
];
const colorClasses = {
  emerald: {
    icon: "text-emerald-400",
    bg: "bg-emerald-500/20"
  },
  indigo: {
    icon: "text-indigo-400",
    bg: "bg-indigo-500/20"
  },
  amber: {
    icon: "text-amber-400",
    bg: "bg-amber-500/20"
  }
};
const Experience = () => {
  return /* @__PURE__ */ jsx("section", { id: "features", className: "py-24 bg-zinc-900 text-white overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-16 text-center", children: [
      /* @__PURE__ */ jsx(
        motion.h2,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          className: "text-3xl md:text-5xl font-bold tracking-tight mb-6",
          children: "Delivery principles that keep work moving"
        }
      ),
      /* @__PURE__ */ jsx(
        motion.p,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: 0.1 },
          className: "text-lg text-zinc-400 max-w-3xl mx-auto",
          children: "A structured software delivery model built for flexibility, focus, and continuity."
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8", children: deliveryPrinciples.map((principle, i) => {
      const color = colorClasses[principle.color];
      return /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 30 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: i * 0.05 },
          className: "group p-8 rounded-2xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-5", children: [
              /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center group-hover:opacity-90 transition-opacity`, children: /* @__PURE__ */ jsx(principle.icon, { className: `w-6 h-6 ${color.icon}` }) }),
              /* @__PURE__ */ jsx("h4", { className: "text-xl font-bold", children: principle.title })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-zinc-400 leading-relaxed", children: principle.description })
          ]
        },
        i
      );
    }) }),
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 40 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        className: "mt-20 text-center",
        children: /* @__PURE__ */ jsx("p", { className: "text-zinc-500 text-sm max-w-2xl mx-auto", children: "Our delivery model is designed to reduce overhead, increase predictability, and adapt to your changing business needs-without the rigidity of traditional contracts." })
      }
    )
  ] }) });
};
const clarityBadges = [
  "Prices shown ex VAT",
  "Third-party vendor costs billed separately",
  "Flexible monthly capacity",
  "Move to maintenance anytime"
];
const foundationSprint = {
  name: "Foundation Sprint",
  launchPrice: "£722.50",
  originalPrice: "£850 one-time",
  launchDiscount: "15% Launch Discount",
  priceValue: 722.5,
  originalPriceValue: 850,
  currency: "GBP",
  billingPeriod: "one_time",
  capacity: "2-4 week structured launch phase",
  description: "A structured starting phase for discovery, planning, setup, and launch readiness.",
  bestFor: [
    "New website or platform starts",
    "Redesign foundations",
    "CMS setup",
    "Launch preparation",
    "Technical SEO baseline",
    "Roadmap alignment"
  ],
  included: [
    "Discovery and requirement alignment",
    "Content and structure planning",
    "UX direction",
    "CMS / environment setup",
    "Analytics baseline",
    "Technical SEO foundation",
    "Delivery roadmap for next phase"
  ],
  limitations: ["Not designed for ongoing monthly feature delivery"],
  cta: "Start with Foundation Sprint",
  ctaHref: "#contact"
};
const activePlans = [
  {
    name: "Essential",
    launchPrice: "£741/mo",
    originalPrice: "£950/mo",
    launchDiscount: "22% Launch Discount",
    priceValue: 741,
    originalPriceValue: 950,
    currency: "GBP",
    billingPeriod: "monthly",
    capacity: "Up to 40 hrs/month • 1 active workstream",
    description: "For websites, CMS improvements, light integrations, technical upkeep, and technical SEO foundation.",
    bestFor: [
      "Stable monthly execution for core website and CMS delivery",
      "Light integrations and technical upkeep",
      "Technical SEO foundation support"
    ],
    included: [
      "Monthly planning and prioritisation",
      "Website and CMS improvements",
      "Bug fixes and refinement",
      "Light integrations",
      "Technical SEO foundation upkeep",
      "Staging, QA, and deployment support"
    ],
    limitations: [
      "No complex ecommerce ecosystems",
      "No multi-stream delivery",
      "No advanced automation"
    ],
    cta: "Book a call for Essential",
    ctaHref: "#contact"
  },
  {
    name: "Growth",
    launchPrice: "£1,189/mo",
    originalPrice: "£1,450/mo",
    launchDiscount: "18% Launch Discount",
    priceValue: 1189,
    originalPriceValue: 1450,
    currency: "GBP",
    billingPeriod: "monthly",
    capacity: "Up to 80 hrs/month",
    description: "For growing businesses that need ongoing digital improvement, landing pages, CRM integrations, and conversion-focused work.",
    bestFor: [
      "Teams needing broader delivery capacity",
      "Landing pages and digital improvement",
      "CRM and light API integrations",
      "Conversion-focused work"
    ],
    included: [
      "Everything in Essential",
      "Broader design and development coverage",
      "Landing page system support",
      "CRM and light API integrations",
      "SEO growth support",
      "Analytics and conversion improvements"
    ],
    limitations: [
      "Not ideal for highly complex operational platforms",
      "Not ideal for governance-heavy delivery"
    ],
    cta: "Book a call for Growth",
    ctaHref: "#contact",
    highlight: true
  },
  {
    name: "Scale",
    launchPrice: "£2,100/mo",
    originalPrice: "£2,500/mo",
    launchDiscount: "16% Launch Discount",
    priceValue: 2100,
    originalPriceValue: 2500,
    currency: "GBP",
    billingPeriod: "monthly",
    capacity: "Up to 120 hrs/month",
    description: "For portals, dashboards, workflow automation, backend/frontend coordination, and structured digital scale-up.",
    bestFor: [
      "Businesses running broader digital operations",
      "Portals and dashboards",
      "Workflow automation",
      "Backend/frontend coordination"
    ],
    included: [
      "Everything in Growth",
      "Custom workflows and admin systems",
      "Automation and process improvement",
      "Backend + frontend + QA coordination",
      "Structured release rhythm"
    ],
    limitations: [
      "Architecture-led transformation should move to Enterprise",
      "Complex governance needs Enterprise engagement"
    ],
    cta: "Book a call for Scale",
    ctaHref: "#contact"
  }
];
const maintenancePlan = {
  name: "Maintenance Mode",
  launchPrice: "£405/mo",
  originalPrice: "£450/mo",
  launchDiscount: "10% Launch Discount",
  priceValue: 405,
  originalPriceValue: 450,
  currency: "GBP",
  billingPeriod: "monthly",
  capacity: "8-10 hrs/month focused continuity support",
  description: "For continuity, support, and stability between active build phases.",
  bestFor: [
    "Teams focused on stable operations between active build phases",
    "Routine upkeep and minor fixes",
    "Continuity without active monthly feature delivery"
  ],
  included: [
    "Minor bug fixes",
    "Routine upkeep",
    "Limited content/config updates",
    "Small support requests"
  ],
  limitations: ["No active redesign", "No major new features", "No deeper integrations"],
  cta: "Move to Maintenance Mode",
  ctaHref: "#contact"
};
const enterprisePlan = {
  name: "Enterprise",
  launchPrice: "£3,400/mo",
  originalPrice: "£4,000/mo",
  launchDiscount: "15% Launch Discount",
  priceValue: 3400,
  originalPriceValue: 4e3,
  currency: "GBP",
  billingPeriod: "monthly",
  capacity: "Custom pod / advanced delivery capacity",
  description: "For advanced platforms, architect-led delivery, and governance-heavy engagements.",
  bestFor: [
    "Complex integration-heavy systems",
    "Architect-led delivery",
    "Compliance or governance-heavy work",
    "Large-scale roadmap execution"
  ],
  included: [
    "Custom team shape",
    "Architecture support",
    "Stronger governance",
    "Advanced integration work",
    "Compliance-ready delivery support"
  ],
  limitations: ["Not required for standard website/CMS monthly delivery"],
  note: "Custom scope after discovery may apply for advanced cases.",
  cta: "Talk to us about Enterprise",
  ctaHref: "#contact"
};
const transparencyColumns = [
  {
    title: "Third-party vendor costs",
    icon: Cloud,
    items: [
      "Cloud hosting (AWS, GCP, Azure)",
      "Domain registration & SSL",
      "SaaS tool subscriptions"
    ]
  },
  {
    title: "Optional Primewayz add-ons",
    icon: MonitorCog,
    items: [
      "Technical specialists",
      "Specialized UX/UI support",
      "Complex DevOps engineering"
    ]
  }
];
const GroupLabel = ({ label }) => /* @__PURE__ */ jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500", children: label });
const rememberSelectedPlan = (plan) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    "primewayz_selected_plan",
    JSON.stringify({
      plan_name: plan.name,
      plan_launch_price: plan.launchPrice,
      plan_price_value: plan.priceValue,
      currency: plan.currency,
      billing_period: plan.billingPeriod
    })
  );
};
const getPlanTrackingParams = (plan) => ({
  plan_name: plan.name,
  plan_launch_price: plan.launchPrice,
  plan_original_price: plan.originalPrice,
  plan_price_value: plan.priceValue,
  plan_original_price_value: plan.originalPriceValue,
  currency: plan.currency,
  billing_period: plan.billingPeriod,
  plan_capacity: plan.capacity,
  plan_discount: plan.launchDiscount
});
const FoundationFeaturedCard = ({ plan }) => {
  var _a;
  return /* @__PURE__ */ jsxs("article", { className: "rounded-3xl border border-emerald-300 bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.55)] ring-1 ring-emerald-200 sm:p-7 lg:p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "mb-4 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700", children: "START HERE" }),
        /* @__PURE__ */ jsx("h3", { className: "text-3xl font-semibold tracking-tight text-zinc-900", children: plan.name }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500", children: "2026 Launch Price" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-3xl font-bold text-zinc-900", children: plan.launchPrice }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-zinc-500 line-through", children: plan.originalPrice }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700", children: plan.launchDiscount })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm font-semibold text-zinc-700", children: plan.capacity }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-zinc-600", children: plan.description }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500", children: "Best for" }),
          /* @__PURE__ */ jsx("ul", { className: "mt-2 grid grid-cols-1 gap-2 md:grid-cols-2", children: plan.bestFor.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-zinc-700", children: [
            /* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 shrink-0 text-blue-600" }),
            /* @__PURE__ */ jsx("span", { children: item })
          ] }, item)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-4 sm:p-5", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700", children: "Included in Foundation Sprint" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2.5", children: plan.included.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-zinc-700", children: [
          /* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-600" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-col gap-3 border-t border-zinc-200/80 pt-4 sm:flex-row sm:items-end sm:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-amber-700", children: "Limitations / not ideal for" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-zinc-700", children: (_a = plan.limitations) == null ? void 0 : _a[0] })
      ] }),
      /* @__PURE__ */ jsxs(
        TrackedLink,
        {
          href: plan.ctaHref,
          ctaText: plan.cta,
          ctaLocation: "pricing_featured_plan",
          eventType: "pricing_plan_click",
          trackingParams: getPlanTrackingParams(plan),
          onClick: () => rememberSelectedPlan(plan),
          whileHover: { scale: 1.01 },
          whileTap: { scale: 0.99 },
          className: "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 sm:w-auto",
          children: [
            plan.cta,
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ]
        }
      )
    ] })
  ] });
};
const PlanCardBlock = ({ plan, featured }) => /* @__PURE__ */ jsxs(
  "article",
  {
    className: `rounded-3xl border bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.55)] sm:p-7 ${plan.highlight ? "border-blue-300 ring-1 ring-blue-200" : featured ? "border-emerald-300 ring-1 ring-emerald-200" : "border-zinc-200/90"}`,
    children: [
      (plan.highlight || featured) && /* @__PURE__ */ jsx(
        "div",
        {
          className: `mb-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${plan.highlight ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`,
          children: plan.highlight ? "RECOMMENDED" : "START HERE"
        }
      ),
      /* @__PURE__ */ jsx("h3", { className: "text-2xl font-semibold tracking-tight text-zinc-900", children: plan.name }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500", children: "2026 Launch Price" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-3xl font-bold text-zinc-900", children: plan.launchPrice }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-zinc-500 line-through", children: plan.originalPrice }),
        /* @__PURE__ */ jsx(
          "p",
          {
            className: `mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${plan.highlight ? "border-blue-200 bg-blue-50 text-blue-700" : featured ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-100 text-zinc-700"}`,
            children: plan.launchDiscount
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm font-semibold text-zinc-700", children: plan.capacity }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-zinc-600", children: plan.description }),
      plan.note && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs font-medium text-zinc-500", children: plan.note }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500", children: "Best for" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-2", children: plan.bestFor.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-zinc-700", children: [
          /* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 shrink-0 text-blue-600" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] }),
      /* @__PURE__ */ jsxs("details", { className: "mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4", children: [
        /* @__PURE__ */ jsx("summary", { className: "cursor-pointer list-none text-sm font-semibold text-zinc-800", children: "Included scope details" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2", children: plan.included.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-zinc-700", children: [
          /* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-600" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] }),
      plan.limitations && /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-2xl border border-amber-100 bg-amber-50/50 p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-amber-700", children: "Limitations / not ideal for" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-2", children: plan.limitations.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-zinc-700", children: [
          /* @__PURE__ */ jsx(Minus, { className: "mt-0.5 h-4 w-4 shrink-0 text-amber-600" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] }),
      /* @__PURE__ */ jsxs(
        TrackedLink,
        {
          href: plan.ctaHref,
          ctaText: plan.cta,
          ctaLocation: plan.highlight ? "pricing_recommended_plan" : "pricing_plan",
          eventType: "pricing_plan_click",
          trackingParams: getPlanTrackingParams(plan),
          onClick: () => rememberSelectedPlan(plan),
          whileHover: { scale: 1.01 },
          whileTap: { scale: 0.99 },
          className: `mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${plan.highlight ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-zinc-900 text-white hover:bg-zinc-800"}`,
          children: [
            plan.cta,
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ]
        }
      )
    ]
  }
);
const Pricing = () => {
  return /* @__PURE__ */ jsx("section", { id: "pricing", className: "bg-zinc-50 py-24", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl text-center", children: [
      /* @__PURE__ */ jsx(
        motion.h2,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          className: "text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl",
          children: "Flexible delivery plans for every stage of growth"
        }
      ),
      /* @__PURE__ */ jsx(
        motion.p,
        {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay: 0.08 },
          className: "mx-auto mt-4 max-w-3xl text-base leading-7 text-zinc-600 md:text-lg",
          children: "Choose the capacity that fits your current roadmap. Start with a Foundation Sprint, scale through active delivery plans, or move to Maintenance Mode when priorities slow down."
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { delay: 0.12 },
        className: "mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-2.5",
        children: clarityBadges.map((rule) => /* @__PURE__ */ jsx(
          "div",
          {
            className: "rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-zinc-700",
            children: rule
          },
          rule
        ))
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mt-12 space-y-10", children: [
      /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          children: /* @__PURE__ */ jsx(FoundationFeaturedCard, { plan: foundationSprint })
        }
      ),
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          className: "space-y-3",
          children: [
            /* @__PURE__ */ jsx(GroupLabel, { label: "ACTIVE MONTHLY DELIVERY" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: activePlans.map((plan) => /* @__PURE__ */ jsx(PlanCardBlock, { plan }, plan.name)) })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          className: "grid grid-cols-1 gap-6 lg:grid-cols-2",
          children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(GroupLabel, { label: "PAUSE OR CONTINUITY" }),
              /* @__PURE__ */ jsx(PlanCardBlock, { plan: maintenancePlan })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(GroupLabel, { label: "ADVANCED DELIVERY" }),
              /* @__PURE__ */ jsx(PlanCardBlock, { plan: enterprisePlan })
            ] })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("section", { className: "mt-10 rounded-3xl border border-slate-700/95 bg-slate-900 p-7 text-slate-100 shadow-[0_28px_60px_-34px_rgba(2,6,23,0.85)] sm:mt-12 sm:p-9", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200/90", children: "COMMERCIAL CLARITY" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-3 text-[1.72rem] font-semibold tracking-tight text-white", children: "Transparency first" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-6 text-slate-300", children: "All plans cover Primewayz delivery capacity. To ensure you always own your infrastructure and maintain full control, we separate our delivery fees from third-party vendor and operational costs." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-2", children: transparencyColumns.map((column) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rounded-2xl border border-slate-600/90 bg-slate-800/70 p-4 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.95)]",
          children: [
            /* @__PURE__ */ jsxs("h4", { className: "flex items-center gap-2 text-sm font-semibold text-slate-100", children: [
              /* @__PURE__ */ jsx(column.icon, { className: "h-4 w-4 text-blue-200" }),
              column.title
            ] }),
            /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2", children: column.items.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-slate-300", children: [
              /* @__PURE__ */ jsx(Check, { className: "mt-0.5 h-4 w-4 shrink-0 text-slate-400" }),
              /* @__PURE__ */ jsx("span", { children: item })
            ] }, item)) })
          ]
        },
        column.title
      )) })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "mt-14", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-3xl", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold uppercase tracking-[0.22em] text-blue-700", children: "Why Subscription Works Better" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl", children: "Clear reasons UK teams choose capacity-based delivery" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-base leading-7 text-zinc-600", children: "Instead of restarting projects whenever priorities change, your monthly support can scale, pause, continue, and restart around the roadmap your business actually needs." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-6 lg:grid-cols-2", children: [
        {
          title: "Flexibility",
          image: "/images/subscription-flexibility.png",
          alt: "Minimal dashboard showing monthly delivery capacity adjusted up or down based on roadmap priorities.",
          description: "Adjust your capacity monthly based on your roadmap and current priorities.",
          points: [
            "Scale delivery up when campaigns, fixes, or new features need momentum.",
            "Reduce capacity when the roadmap slows down or internal priorities shift.",
            "Keep support aligned with real business demand instead of fixed project cycles."
          ],
          label: "Capacity control"
        },
        {
          title: "Total transparency",
          image: "/images/subscription-total-transparency.png",
          alt: "Transparent subscription pricing breakdown with Primewayz service fee separated from vendor costs.",
          description: "Clear pricing with vendor costs handled separately where applicable.",
          points: [
            "See what is part of Primewayz delivery and support.",
            "Keep third-party costs like hosting, domain, SSL, and tools separate.",
            "Avoid bundled pricing confusion and keep infrastructure ownership clear."
          ],
          label: "Clear commercial model"
        },
        {
          title: "Roadmap continuity",
          image: "/images/subscription-roadmap-continuity.png",
          alt: "Continuous roadmap timeline showing steady delivery phases without restarting project cycles.",
          description: "Maintain delivery momentum without restarting procurement or project cycles.",
          points: [
            "Continue from foundation to scale, optimisation, and improvements.",
            "Keep context, backlog, and delivery knowledge within one aligned team.",
            "Build compound value over time instead of repeatedly starting from zero."
          ],
          label: "Continuous delivery"
        },
        {
          title: "Seamless maintenance",
          image: "/images/subscription-seamless-maintenance.png",
          alt: "Workflow showing active delivery moving into maintenance mode and restarting active delivery when needed.",
          description: "Scale down when priorities slow, then restart active delivery when needed.",
          points: [
            "Move into maintenance mode when active delivery is not required.",
            "Keep essential checks, updates, monitoring, and small improvements running.",
            "Restart active delivery quickly when new priorities return."
          ],
          label: "Stay ready"
        }
      ].map((item) => /* @__PURE__ */ jsxs(
        "article",
        {
          className: "overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10",
          children: [
            /* @__PURE__ */ jsx("div", { className: "aspect-[16/9] overflow-hidden bg-blue-50", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: item.image,
                alt: item.alt,
                className: "h-full w-full object-cover",
                loading: "lazy"
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 lg:p-7", children: [
              /* @__PURE__ */ jsx("div", { className: "mb-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700", children: item.label }),
              /* @__PURE__ */ jsx("h4", { className: "text-2xl font-black tracking-tight text-zinc-950", children: item.title }),
              /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-7 text-zinc-600", children: item.description }),
              /* @__PURE__ */ jsx("ul", { className: "mt-5 space-y-3", children: item.points.map((point) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3 text-sm leading-6 text-zinc-600", children: [
                /* @__PURE__ */ jsx("span", { className: "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700", children: "✓" }),
                /* @__PURE__ */ jsx("span", { children: point })
              ] }, point)) })
            ] })
          ]
        },
        item.title
      )) })
    ] })
  ] }) });
};
const faqs = [
  {
    question: "Is Primewayz UK suitable for small and medium UK businesses?",
    answer: "Yes. Primewayz UK is designed for UK SMEs and UK-facing teams that need reliable monthly software delivery without hiring a full in-house technical team. We support websites, CRM improvements, automation, SEO foundations, integrations, maintenance, and ongoing digital improvements."
  },
  {
    question: "Do I need to start with Foundation Sprint?",
    answer: "Foundation Sprint is recommended when your requirements, priorities, risks, content, integrations, or delivery roadmap are not fully clear. It helps define what should be built first, what can wait, and which monthly support plan is most suitable."
  },
  {
    question: "Can I take Foundation Sprint and a monthly plan together?",
    answer: "Yes. Some UK businesses use Foundation Sprint first for discovery and planning, then continue into Essential, Growth, or Scale. If your priorities are already clear, you may start directly with a monthly plan."
  },
  {
    question: "How do I choose between Essential, Growth, and Scale?",
    answer: "Choose based on delivery pace and volume. Essential is suitable for smaller updates and steady support. Growth is better when you need regular website, CRM, automation, or SEO foundation improvements. Scale is suitable when you need faster execution, more coordination, or broader technical support."
  },
  {
    question: "What types of work can be handled under the subscription?",
    answer: "Typical work includes website updates, landing pages, CMS improvements, CRM setup or integration, internal workflow automation, reporting dashboards, SEO foundation improvements, maintenance, bug fixes, and controlled feature development."
  },
  {
    question: "Why are add-ons and third-party vendor costs separate?",
    answer: "Your subscription covers Primewayz delivery capacity. External costs such as hosting, domains, email tools, SMS or WhatsApp providers, payment gateways, SaaS tools, and paid plugins are billed separately so pricing remains transparent and vendor ownership stays with your business."
  },
  {
    question: "When should I move to Maintenance Mode?",
    answer: "Maintenance Mode is useful when active development slows down but you still want basic support, monitoring, minor updates, and a ready team to resume work when new priorities appear."
  },
  {
    question: "Can I switch plans as priorities change?",
    answer: "Yes. The subscription model is designed to stay flexible. You can increase, reduce, pause, or move into maintenance depending on workload, business priorities, and delivery needs."
  }
];
const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  return /* @__PURE__ */ jsx("section", { id: "faq", className: "py-24 bg-white", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-8 lg:grid-cols-[0.45fr_0.55fr] lg:gap-10", children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        className: "rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6 sm:p-7",
        children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-blue-700/80", children: "DELIVERY MODEL GUIDE" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl", children: "Watch how to choose the right delivery model" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-zinc-600", children: "A quick walkthrough of when to start with Foundation Sprint, when to move into monthly delivery, and how add-ons and third-party costs work." }),
          /* @__PURE__ */ jsxs(
            "video",
            {
              controls: true,
              preload: "metadata",
              playsInline: true,
              muted: true,
              poster: "/images/delivery-process-poster.jpg",
              className: "mt-5 aspect-[9/16] w-full object-cover object-center rounded-2xl border border-zinc-200/80 bg-zinc-900 shadow-lg",
              children: [
                /* @__PURE__ */ jsx("source", { src: "/videos/delivery-process-pwuk.mp4", type: "video/mp4" }),
                "Your browser does not support the video tag."
              ]
            }
          ),
          /* @__PURE__ */ jsx("ul", { className: "mt-5 space-y-2", children: [
            "Start with Foundation Sprint",
            "Choose the monthly capacity that fits your roadmap",
            "Add optional specialist support only when needed",
            "Move to Maintenance Mode when priorities slow down"
          ].map((item) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-zinc-700", children: [
            /* @__PURE__ */ jsx("span", { className: "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" }),
            /* @__PURE__ */ jsx("span", { children: item })
          ] }, item)) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-7", children: [
        /* @__PURE__ */ jsx(
          motion.h2,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            className: "text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl",
            children: "Common questions"
          }
        ),
        /* @__PURE__ */ jsx(
          motion.p,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { delay: 0.08 },
            className: "mt-2 text-base text-zinc-600",
            children: "Everything you need to know before choosing a plan."
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        motion.div,
        {
          variants: {
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.07
              }
            }
          },
          initial: "hidden",
          whileInView: "visible",
          viewport: { once: true },
          className: "space-y-3",
          children: faqs.map((faq, index) => /* @__PURE__ */ jsxs(
            motion.div,
            {
              variants: {
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
              },
              className: "overflow-hidden rounded-2xl border border-zinc-200 bg-white",
              children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setActiveIndex(activeIndex === index ? null : index),
                    className: "flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-zinc-50 sm:p-6",
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "pr-4 text-base font-semibold leading-6 text-zinc-900 sm:text-lg", children: faq.question }),
                      activeIndex === index ? /* @__PURE__ */ jsx(Minus, { className: "h-5 w-5 shrink-0 text-zinc-500" }) : /* @__PURE__ */ jsx(Plus, { className: "h-5 w-5 shrink-0 text-zinc-500" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(AnimatePresence, { children: activeIndex === index && /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    initial: { height: 0, opacity: 0 },
                    animate: { height: "auto", opacity: 1 },
                    exit: { height: 0, opacity: 0 },
                    transition: { duration: 0.24, ease: "easeInOut" },
                    children: /* @__PURE__ */ jsx("div", { className: "whitespace-pre-line border-t border-zinc-100 px-5 pb-5 pt-4 text-sm leading-7 text-zinc-600 sm:px-6 sm:pb-6", children: faq.answer })
                  }
                ) })
              ]
            },
            faq.question
          ))
        }
      )
    ] })
  ] }) }) });
};
const supportValues = [
  {
    title: "Monthly clarity",
    label: "Planning clarity",
    description: "Know what to improve next across your website, CRM, forms, SEO foundations, and operational workflows without turning every need into a separate project."
  },
  {
    title: "Predictable progress",
    label: "Steady delivery",
    description: "Move forward through practical monthly releases instead of waiting for large projects, urgent fixes, or multiple disconnected vendors."
  },
  {
    title: "Lower operational friction",
    label: "Operational stability",
    description: "Reduce missed follow-ups, outdated pages, tracking blind spots, and maintenance gaps that quietly affect enquiries, campaigns, and daily delivery."
  }
];
const Testimonials = () => /* @__PURE__ */ jsx("section", { className: "bg-zinc-50 py-24", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: [
  /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl text-center", children: [
    /* @__PURE__ */ jsxs("h2", { className: "text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl", children: [
      "Why UK SME teams choose",
      " ",
      /* @__PURE__ */ jsx("span", { className: "italic text-blue-800", children: "practical ongoing support" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg leading-8 text-zinc-600", children: "Focused monthly delivery for businesses that need dependable progress across websites, CRM workflows, SEO foundations, and digital operations." })
  ] }),
  /* @__PURE__ */ jsx("div", { className: "mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3", children: supportValues.map((item, index) => /* @__PURE__ */ jsxs(
    "article",
    {
      className: "group relative overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute right-6 top-6 text-7xl font-black leading-none text-blue-50 transition group-hover:text-blue-100", children: [
          "0",
          index + 1
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-700 ring-1 ring-blue-100", children: "✓" }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-black tracking-tight text-zinc-950", children: item.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-7 text-zinc-600", children: item.description }),
          /* @__PURE__ */ jsx("div", { className: "mt-7 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500", children: item.label })
        ] })
      ]
    },
    item.title
  )) })
] }) });
const BlogCard = ({ post, featured = false }) => /* @__PURE__ */ jsx(
  "article",
  {
    className: `group h-full overflow-hidden border border-zinc-100 bg-white shadow-sm shadow-zinc-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10 ${featured ? "rounded-[2rem] lg:grid lg:grid-cols-[1.05fr_0.95fr]" : "rounded-[1.75rem] flex flex-col"}`,
    children: /* @__PURE__ */ jsxs(Link, { to: `/blog/${post.id}`, className: featured ? "contents" : "flex h-full flex-col", children: [
      post.image && /* @__PURE__ */ jsxs("div", { className: `relative overflow-hidden ${featured ? "min-h-[280px] lg:min-h-full" : "aspect-[16/10]"}`, children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: post.image,
            alt: post.title,
            className: "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105",
            referrerPolicy: "no-referrer"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-4", children: /* @__PURE__ */ jsx("span", { className: "rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 backdrop-blur-md", children: post.category }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `flex flex-1 flex-col ${featured ? "p-8 sm:p-10 lg:p-12" : "p-7"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3" }),
            post.date
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
            post.readTime
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "h3",
          {
            className: `font-bold tracking-tight text-zinc-900 transition-colors group-hover:text-emerald-600 ${featured ? "text-3xl leading-tight sm:text-4xl" : "line-clamp-2 text-xl"}`,
            children: post.title
          }
        ),
        /* @__PURE__ */ jsx("p", { className: `mt-4 leading-relaxed text-zinc-600 ${featured ? "text-base" : "line-clamp-3 text-sm"}`, children: post.description || post.excerpt }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 flex flex-wrap gap-2", children: post.tags.slice(0, featured ? 4 : 2).map((tag) => /* @__PURE__ */ jsx("span", { className: "rounded-full bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-500", children: tag }, tag)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-auto flex items-center justify-between border-t border-zinc-100 pt-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100", children: /* @__PURE__ */ jsx(User, { className: "h-4 w-4 text-zinc-400" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-zinc-700", children: post.author })
          ] }),
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5 text-emerald-600 transition-transform group-hover:translate-x-1" })
        ] })
      ] })
    ] })
  }
);
const posts = [
  {
    id: "monthly-digital-support-uk-smes",
    slug: "monthly-digital-support-uk-smes",
    title: "Why UK SMEs Need Monthly Digital Support",
    description: "How a predictable monthly delivery model helps small businesses keep websites, SEO, CRM, and automation work moving.",
    excerpt: "How a predictable monthly delivery model helps small businesses keep websites, SEO, CRM, and automation work moving.",
    content: `
      <p>Many UK small businesses do not need a large one-off software project. They need steady digital progress: website improvements, technical SEO fixes, CRM cleanup, landing pages, analytics, and small automations delivered in a practical monthly rhythm.</p>

      <h3>The problem with one-off digital projects</h3>
      <p>One-off projects often start well but leave the business with a long list of unresolved improvements after launch. Forms need refining, pages need updating, tracking needs fixing, and new campaign ideas appear every month.</p>

      <h3>Why monthly delivery works better</h3>
      <p>A monthly model gives UK SMEs a clear queue of priorities. Instead of repeatedly finding a new freelancer or agency, the business keeps one delivery partner who understands the website, systems, and commercial goals.</p>

      <h3>What should be included</h3>
      <p>Good monthly support should cover website updates, technical SEO foundations, CRM workflows, forms, lead tracking, landing pages, integrations, small automation tasks, maintenance, and release support.</p>

      <p>Primewayz UK is built around this need: flexible monthly digital delivery for UK small businesses that want progress without hiring a full in-house team.</p>
    `,
    date: "March 24, 2026",
    readTime: "5 min read",
    author: "Primewayz UK Team",
    category: "UK SMEs",
    tags: ["Monthly support", "Digital operations", "UK SMEs"],
    image: "https://picsum.photos/seed/uk-monthly-support/800/500",
    featured: true,
    seoTitle: "Monthly Digital Support for UK SMEs",
    seoDescription: "Why UK SMEs benefit from predictable monthly support across websites, SEO, CRM, automation, and digital delivery."
  },
  {
    id: "website-seo-crm-automation-uk",
    slug: "website-seo-crm-automation-uk",
    title: "Website, SEO, CRM and Automation: The Practical UK SME Stack",
    description: "A simple framework for deciding what to improve first when your business needs better digital operations.",
    excerpt: "A simple framework for deciding what to improve first when your business needs better digital operations.",
    content: `
      <p>For many UK businesses, digital improvement becomes confusing because everything feels urgent: the website, SEO, lead forms, CRM, automation, content, analytics, and customer follow-up.</p>

      <h3>Start with the customer journey</h3>
      <p>The first step is to understand how a customer finds the business, what pages they view, which form or call-to-action they use, and what happens after the enquiry arrives.</p>

      <h3>Fix the core before adding more tools</h3>
      <p>A clean website structure, reliable contact forms, basic technical SEO, clear analytics, and a working CRM process often create more value than adding another disconnected tool.</p>

      <h3>Automate only where it helps</h3>
      <p>Automation should reduce manual follow-up, lost enquiries, repeated updates, and reporting gaps. It should not make the process harder for staff or customers.</p>

      <p>Primewayz UK helps businesses prioritise these improvements through Foundation Sprint planning and monthly delivery capacity.</p>
    `,
    date: "March 18, 2026",
    readTime: "6 min read",
    author: "Primewayz UK Team",
    category: "Digital Operations",
    tags: ["SEO", "CRM", "Automation", "Websites"],
    image: "https://picsum.photos/seed/uk-digital-stack/800/500"
  },
  {
    id: "foundation-sprint-before-monthly-delivery",
    slug: "foundation-sprint-before-monthly-delivery",
    title: "Why Start with a Foundation Sprint Before Monthly Delivery?",
    description: "How a short planning and setup phase reduces confusion before website, SEO, CRM, or automation work begins.",
    excerpt: "How a short planning and setup phase reduces confusion before website, SEO, CRM, or automation work begins.",
    content: `
      <p>Starting monthly delivery without a clear foundation can create confusion. Priorities change, assumptions remain hidden, and small technical issues can delay visible progress.</p>

      <h3>What a Foundation Sprint should clarify</h3>
      <p>A strong Foundation Sprint confirms business goals, current website condition, tracking gaps, content needs, CRM requirements, technical risks, and the best delivery plan.</p>

      <h3>Why it matters for UK SMEs</h3>
      <p>Small businesses usually need clarity before capacity. A short setup phase helps the team decide what should be fixed first, what should wait, and what belongs in monthly delivery.</p>

      <h3>Moving into monthly support</h3>
      <p>Once the foundation is clear, monthly delivery can focus on agreed priorities: website improvements, landing pages, technical SEO, integrations, automation, maintenance, and reporting.</p>

      <p>This is why Primewayz UK recommends starting with a focused Foundation Sprint before moving into Essential, Growth, Scale, or Maintenance Mode.</p>
    `,
    date: "March 12, 2026",
    readTime: "5 min read",
    author: "Primewayz UK Team",
    category: "Delivery Model",
    tags: ["Foundation Sprint", "Planning", "Monthly delivery"],
    image: "https://picsum.photos/seed/uk-foundation-sprint/800/500"
  },
  {
    id: "technical-seo-basics-uk-small-business",
    slug: "technical-seo-basics-uk-small-business",
    title: "Technical SEO Basics for UK Small Business Websites",
    description: "The website checks that matter before spending more on campaigns, content, or paid traffic.",
    excerpt: "The website checks that matter before spending more on campaigns, content, or paid traffic.",
    content: `
      <p>Before investing heavily in campaigns, UK small businesses should make sure the basics are working: page speed, headings, metadata, indexability, mobile usability, redirects, analytics, and conversion tracking.</p>

      <h3>Start with crawlability and page structure</h3>
      <p>Search engines need clear pages, clean internal links, useful titles, readable descriptions, and technical signals that match the service area and audience.</p>

      <h3>Measure enquiries, not only visits</h3>
      <p>Traffic matters, but enquiry quality matters more. GA4 events, form tracking, phone clicks, and CTA tracking help show what is actually working.</p>

      <h3>Keep improving monthly</h3>
      <p>Technical SEO is not a one-time task. Websites change, pages age, campaigns shift, and small improvements compound over time.</p>

      <p>Primewayz UK supports technical SEO foundations as part of monthly digital delivery for UK SMEs.</p>
    `,
    date: "March 10, 2026",
    readTime: "6 min read",
    author: "Primewayz UK Team",
    category: "SEO",
    tags: ["Technical SEO", "Analytics", "Small business websites"],
    image: "https://picsum.photos/seed/uk-technical-seo/800/500"
  },
  {
    id: "crm-integration-for-uk-smes",
    slug: "crm-integration-for-uk-smes",
    title: "CRM Integration for UK SMEs: Keep Enquiries from Falling Through",
    description: "How better forms, routing, and CRM workflows help small teams respond faster and work more consistently.",
    excerpt: "How better forms, routing, and CRM workflows help small teams respond faster and work more consistently.",
    content: `
      <p>Many UK SMEs lose potential customers because enquiries are scattered across email, forms, spreadsheets, and inboxes. A simple CRM flow can make follow-up more reliable.</p>

      <h3>Connect the form to the next action</h3>
      <p>A website form should not simply send an email. It should capture the right data, send it to the right place, and make follow-up clear for the team.</p>

      <h3>Keep workflows practical</h3>
      <p>Small teams need simple CRM stages, useful notifications, clean customer records, and reporting that helps decision-making without creating admin burden.</p>

      <h3>Improve gradually</h3>
      <p>Start with enquiry capture, then add routing, tagging, reminders, reporting, and useful automation once the basics are stable.</p>

      <p>Primewayz UK helps UK businesses connect websites, forms, CRM tools, and follow-up processes through monthly delivery support.</p>
    `,
    date: "March 05, 2026",
    readTime: "5 min read",
    author: "Primewayz UK Team",
    category: "CRM",
    tags: ["CRM", "Forms", "Lead management"],
    image: "https://picsum.photos/seed/uk-crm-integration/800/500"
  },
  {
    id: "maintenance-mode-for-uk-business-websites",
    slug: "maintenance-mode-for-uk-business-websites",
    title: "When Should a UK Business Move to Maintenance Mode?",
    description: "A simple way to keep your digital presence stable when active development slows down.",
    excerpt: "A simple way to keep your digital presence stable when active development slows down.",
    content: `
      <p>Not every month needs heavy development. Some months are about stability, small fixes, content updates, form checks, analytics review, and keeping the website healthy.</p>

      <h3>Maintenance is not doing nothing</h3>
      <p>Good maintenance keeps systems reliable. It reduces small issues, protects previous work, and gives the business continuity until the next active delivery phase begins.</p>

      <h3>What belongs in Maintenance Mode</h3>
      <p>Minor bug fixes, plugin or configuration checks, content changes, tracking checks, form testing, small support requests, and basic reporting are typical maintenance tasks.</p>

      <h3>When to restart active delivery</h3>
      <p>Move back into active monthly delivery when there is a new campaign, redesign, integration, CRM change, automation requirement, or wider roadmap.</p>

      <p>Primewayz UK offers Maintenance Mode so UK SMEs can slow down delivery without losing continuity.</p>
    `,
    date: "February 28, 2026",
    readTime: "5 min read",
    author: "Primewayz UK Team",
    category: "Maintenance",
    tags: ["Maintenance", "Website support", "Stability"],
    image: "https://picsum.photos/seed/uk-maintenance-mode-blog/800/500"
  }
];
const blogPosts = posts;
const getAllBlogPosts = () => blogPosts;
const getFeaturedBlogPost = () => blogPosts.find((post) => post.featured) || blogPosts[0];
const getBlogPostById = (id) => {
  if (!id) return void 0;
  return blogPosts.find((post) => post.id === id || post.slug === id);
};
const getRelatedBlogPosts = (post, limit = 3) => {
  const tagSet = new Set(post.tags);
  return blogPosts.filter((candidate) => candidate.id !== post.id).map((candidate) => ({
    post: candidate,
    score: (candidate.category === post.category ? 2 : 0) + candidate.tags.filter((tag) => tagSet.has(tag)).length
  })).sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.post);
};
const BlogSection = () => {
  const [posts2, setPosts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    fetchPosts();
  }, []);
  const fetchPosts = async () => {
    try {
      const res = await fetch(apiUrl("/api/blog/posts"));
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        setPosts(getAllBlogPosts());
      }
    } catch (error) {
      setPosts(getAllBlogPosts());
    } finally {
      setIsLoading(false);
    }
  };
  const loadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };
  return /* @__PURE__ */ jsx("section", { id: "blog", className: "py-24 bg-zinc-50 overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
        /* @__PURE__ */ jsxs(
          motion.h2,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            className: "text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6",
            children: [
              "UK digital support ",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("span", { className: "text-emerald-600 italic", children: "insights for SMEs" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          motion.p,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { delay: 0.1 },
            className: "text-lg text-zinc-600",
            children: "Practical guidance for UK small businesses on website upkeep, SEO foundations, CRM workflows, automation, and monthly digital delivery."
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(
        motion.a,
        {
          initial: { opacity: 0, x: 20 },
          whileInView: { opacity: 1, x: 0 },
          viewport: { once: true },
          whileHover: { x: 5 },
          whileTap: { scale: 0.95 },
          href: "/blog",
          className: "flex items-center gap-2 text-zinc-900 font-bold hover:text-emerald-600 transition-colors group",
          children: [
            "Read UK insights",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 group-hover:translate-x-1 transition-transform" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 mb-12", children: isLoading ? Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden animate-pulse h-[400px]", children: [
      /* @__PURE__ */ jsx("div", { className: "aspect-[16/10] bg-zinc-100" }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-zinc-100 rounded w-1/2" }),
        /* @__PURE__ */ jsx("div", { className: "h-8 bg-zinc-100 rounded w-full" }),
        /* @__PURE__ */ jsx("div", { className: "h-20 bg-zinc-100 rounded w-full" })
      ] })
    ] }, i)) : posts2.slice(0, visibleCount).map((post, index) => /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { delay: index % 3 * 0.1 },
        children: /* @__PURE__ */ jsx(BlogCard, { post })
      },
      post.id
    )) }),
    posts2.length > visibleCount && /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
      motion.button,
      {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        onClick: loadMore,
        className: "px-8 py-4 bg-zinc-900 text-white rounded-full font-bold hover:bg-emerald-600 transition-colors shadow-xl shadow-zinc-900/10",
        children: "Load more UK insights"
      }
    ) })
  ] }) });
};
const ShareButton = ({ title, url }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };
  const shareOptions = [
    {
      name: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: "hover:text-[#1DA1F2]"
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: "hover:text-[#0A66C2]"
    },
    {
      name: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check this out: ${url}`)}`,
      color: "hover:text-emerald-600"
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "relative", ref: dropdownRef, children: [
    /* @__PURE__ */ jsx(
      motion.button,
      {
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.9 },
        onClick: () => setIsOpen(!isOpen),
        className: "p-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors border border-white/20",
        "aria-label": "Share story",
        children: /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 10, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 10, scale: 0.95 },
        className: "absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl shadow-emerald-900/20 border border-zinc-100 overflow-hidden z-50",
        children: /* @__PURE__ */ jsxs("div", { className: "p-2 space-y-1", children: [
          shareOptions.map((option) => /* @__PURE__ */ jsxs(
            "a",
            {
              href: option.href,
              target: "_blank",
              rel: "noopener noreferrer",
              className: `flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 rounded-xl hover:bg-zinc-50 transition-colors ${option.color}`,
              onClick: () => setIsOpen(false),
              children: [
                /* @__PURE__ */ jsx(option.icon, { className: "w-4 h-4" }),
                option.name
              ]
            },
            option.name
          )),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleCopyLink,
              className: "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 rounded-xl hover:bg-zinc-50 transition-colors",
              children: copied ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-emerald-500" }),
                /* @__PURE__ */ jsx("span", { className: "text-emerald-500", children: "Copied!" })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Link$1, { className: "w-4 h-4" }),
                "Copy Link"
              ] })
            }
          )
        ] })
      }
    ) })
  ] });
};
const stories = [
  {
    title: "Local Trades Website & Lead Capture Setup",
    category: "UK Local Trades",
    metric: "84",
    metricLabel: "New Enquiries",
    description: "For plumbers, electricians, roofing firms, builders, cleaners, landscapers, and local service businesses that need clearer quote requests, call tracking, WhatsApp leads, and faster follow-ups.",
    image: "/images/localTradesWbsite.png",
    icon: PhoneCall,
    color: "emerald",
    href: "/success-stories/local-trades-lead-capture"
  },
  {
    title: "Professional Services: CRM & Lead Flow Cleanup",
    category: "UK Professional Services",
    metric: "3 Weeks",
    metricLabel: "FIRST RELEASE",
    description: "A practical CRM and form-flow improvement sprint for consultants, accountants, recruitment firms, advisors, and service teams that need cleaner lead tracking and follow-up visibility.",
    image: "/images/professional-services-crm-cleanup.png",
    icon: Zap,
    color: "indigo",
    href: "/success-stories/professional-services-crm-cleanup"
  },
  {
    title: "E-commerce Store Stability & Support",
    category: "UK E-commerce SMEs",
    metric: "99.9%",
    metricLabel: "UPTIME READY",
    description: "Support for small online stores, boutiques, specialist sellers, subscription stores, and catalogue-led businesses that need reliable product pages, smoother checkout journeys, clean campaign tracking, and faster offer updates.",
    image: "/images/ecommerce-store-stability-support.png",
    icon: Users,
    color: "amber",
    href: "/success-stories/ecommerce-store-stability-support"
  }
];
const SuccessStories = () => {
  return /* @__PURE__ */ jsx("section", { id: "success-stories", className: "py-24 bg-white overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
        /* @__PURE__ */ jsxs(
          motion.h2,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            className: "text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6",
            children: [
              "Practical outcomes for ",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("span", { className: "text-emerald-600 italic", children: "UK small businesses" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          motion.p,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { delay: 0.1 },
            className: "text-lg text-zinc-600",
            children: "Focused example workstreams for UK businesses that need clearer enquiry flow, cleaner CRM operations, website upkeep, SEO foundations, and predictable monthly delivery."
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(
        motion.a,
        {
          href: "#contact",
          initial: { opacity: 0, x: 20 },
          whileInView: { opacity: 1, x: 0 },
          viewport: { once: true },
          whileHover: { x: 5 },
          whileTap: { scale: 0.95 },
          className: "flex items-center gap-2 text-zinc-900 font-bold hover:text-emerald-600 transition-colors group focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-lg px-2",
          children: [
            "Discuss your UK requirements",
            /* @__PURE__ */ jsx(ArrowUpRight, { className: "w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: stories.map((story, index) => /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { delay: index * 0.1 },
        className: "group cursor-pointer",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 bg-white border border-zinc-200/80 shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition-all duration-300 group-hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]", children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: story.image,
                alt: story.title,
                loading: "lazy",
                className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.025]",
                referrerPolicy: "no-referrer"
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-4 left-4", children: /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-zinc-900", children: story.category }) }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-4", children: /* @__PURE__ */ jsx(
              ShareButton,
              {
                title: story.title,
                url: typeof window !== "undefined" ? window.location.href : "https://uk.primewayz.com/"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx(
                motion.div,
                {
                  whileHover: { y: -5 },
                  transition: { type: "spring", stiffness: 400, damping: 10 },
                  className: `w-10 h-10 rounded-xl flex items-center justify-center ${story.color === "emerald" ? "bg-emerald-100" : story.color === "indigo" ? "bg-indigo-100" : "bg-amber-100"}`,
                  children: /* @__PURE__ */ jsx(story.icon, { className: `w-5 h-5 ${story.color === "emerald" ? "text-emerald-600" : story.color === "indigo" ? "text-indigo-600" : "text-amber-600"}` })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-zinc-900 leading-none", children: story.metric }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold text-zinc-400 uppercase tracking-tighter", children: story.metricLabel })
              ] })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors", children: story.title }),
            /* @__PURE__ */ jsx("p", { className: "text-zinc-500 text-sm leading-relaxed", children: story.description }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: story.href,
                className: "mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-900",
                children: [
                  "View project details",
                  /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-4 w-4" })
                ]
              }
            )
          ] })
        ]
      },
      story.title
    )) })
  ] }) });
};
const CONTACT_SOCIAL_LINKS = [
  {
    href: "https://www.linkedin.com/company/primewayz/mycompany/",
    label: "LinkedIn",
    ariaLabel: "Primewayz on LinkedIn"
  }
];
const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;
const NAME_MIN = 2;
const NAME_MAX = 80;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2e3;
const CALENDLY_URL = "https://calendly.com/primewayz-info/30-minute-meeting-uk";
const CALENDLY_SCRIPT_URL = "https://assets.calendly.com/assets/external/widget.js";
function normalizeUkPhoneNumber(raw) {
  const compact = raw.replace(/[^\d+]/g, "");
  const normalized = compact.startsWith("0044") ? `+44${compact.slice(4)}` : compact;
  if (normalized.startsWith("+44")) {
    const national = normalized.slice(3).replace(/\D/g, "");
    return national.length === 10 ? `+44${national}` : null;
  }
  const digits = normalized.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    return `+44${digits.slice(1)}`;
  }
  return null;
}
function validateUkMobileOrLandline(e164) {
  return /^\+44[1-9]\d{9}$/.test(e164);
}
function parseUkPhoneNumbers(input) {
  const matches = input.match(/(?:\+44|0044|0)\s*\d(?:[\s().-]*\d){9}/g) || [];
  const normalized = matches.map((match) => normalizeUkPhoneNumber(match)).filter((phone) => Boolean(phone && validateUkMobileOrLandline(phone)));
  return Array.from(new Set(normalized));
}
function formatUkPhoneNumber(e164) {
  const national = e164.replace(/^\+44/, "");
  return `+44 ${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`.trim();
}
function SocialIcon({ label }) {
  const cls = "w-4 h-4 shrink-0";
  switch (label) {
    case "LinkedIn":
      return /* @__PURE__ */ jsx(Linkedin, { className: cls, "aria-hidden": true });
    default:
      return null;
  }
}
function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  const validateForm = () => {
    const newErrors = {};
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const message = formData.message.trim();
    const parsedPhoneNumbers2 = parseUkPhoneNumbers(phone);
    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.length < NAME_MIN) {
      newErrors.name = `Name must be at least ${NAME_MIN} characters`;
    } else if (name.length > NAME_MAX) {
      newErrors.name = `Name must be at most ${NAME_MAX} characters`;
    } else if (!NAME_REGEX.test(name)) {
      newErrors.name = "Name contains invalid characters";
    }
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!message) {
      newErrors.message = "Please describe your enquiry";
    } else if (message.length < MESSAGE_MIN) {
      newErrors.message = `Message must be at least ${MESSAGE_MIN} characters`;
    } else if (message.length > MESSAGE_MAX) {
      newErrors.message = `Message must be at most ${MESSAGE_MAX} characters`;
    }
    if (!phone.trim()) {
      newErrors.phone = "Enter a UK contact number";
    } else if (parsedPhoneNumbers2.length === 0) {
      newErrors.phone = "Enter a valid UK number, for example 07522 146 354 or +44 7522 146354";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        message: formData.message.trim(),
        phone: parseUkPhoneNumbers(phone)[0],
        phoneNumbers: parseUkPhoneNumbers(phone)
      };
      const response = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        trackEvent("contact_form_submit", {
          form_name: "primewayz_uk_contact_form",
          lead_type: "contact_enquiry",
          cta_location: "contact_form"
        });
        setIsSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
        setPhone("");
      } else {
        const data = await response.json().catch(() => null);
        setSubmitError((data == null ? void 0 : data.error) || "Something went wrong. Please try again later.");
      }
    } catch {
      setSubmitError("Failed to send message. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "email") {
      processedValue = value.replace(/[^a-zA-Z0-9@._+-]/g, "");
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: void 0 }));
    }
  };
  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: void 0 }));
  };
  const parsedPhoneNumbers = parseUkPhoneNumbers(phone);
  useEffect(() => {
    const handleCalendlyEvent = (event) => {
      var _a;
      if (event.origin !== "https://calendly.com") return;
      const calendlyEventName = (_a = event.data) == null ? void 0 : _a.event;
      if (calendlyEventName === "calendly.event_scheduled") {
        trackEvent("calendly_event_scheduled", {
          calendly_url: CALENDLY_URL,
          lead_type: "discovery_call",
          cta_location: "contact_calendly_lazy"
        });
      }
    };
    window.addEventListener("message", handleCalendlyEvent);
    return () => {
      window.removeEventListener("message", handleCalendlyEvent);
    };
  }, []);
  useEffect(() => {
    if (!isCalendlyOpen) return;
    const initCalendly = () => {
      var _a;
      const parentElement = document.getElementById("primewayz-calendly-inline");
      if (!parentElement || !((_a = window.Calendly) == null ? void 0 : _a.initInlineWidget)) return;
      parentElement.innerHTML = "";
      window.Calendly.initInlineWidget({
        url: CALENDLY_URL,
        parentElement
      });
    };
    const existingScript = document.querySelector(
      `script[src="${CALENDLY_SCRIPT_URL}"]`
    );
    if (existingScript) {
      initCalendly();
      return;
    }
    const script = document.createElement("script");
    script.src = CALENDLY_SCRIPT_URL;
    script.async = true;
    script.onload = initCalendly;
    document.body.appendChild(script);
  }, [isCalendlyOpen]);
  useEffect(() => {
    if (isSubmitted) {
      const duration = 3 * 1e3;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isSubmitted]);
  if (isSubmitted) {
    return /* @__PURE__ */ jsx("section", { id: "contact", className: "py-24 bg-white", "aria-labelledby": "contact-heading", children: /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.9, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        className: "text-center py-16 px-6 bg-emerald-50 rounded-3xl border border-emerald-100 relative overflow-hidden",
        children: [
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { scale: 0 },
              animate: { scale: [0, 1.2, 1] },
              transition: { duration: 0.5, ease: "backOut" },
              className: "relative z-10",
              children: /* @__PURE__ */ jsxs("div", { className: "relative inline-block", children: [
                /* @__PURE__ */ jsx(CheckCircle, { className: "w-20 h-20 text-emerald-500 mx-auto mb-6" }),
                /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    animate: {
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5]
                    },
                    transition: { duration: 2, repeat: Infinity },
                    className: "absolute inset-0 bg-emerald-200 rounded-full -z-10 blur-xl"
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-3xl font-bold text-emerald-900 mb-3 flex items-center justify-center gap-3", children: [
              /* @__PURE__ */ jsx(PartyPopper, { className: "w-8 h-8 text-emerald-600" }),
              "Message Sent!"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xl text-emerald-700 mb-8 max-w-md mx-auto", children: "Thank you for reaching out. Our team will review your enquiry and get back to you shortly." }),
            /* @__PURE__ */ jsx(
              motion.button,
              {
                whileHover: { scale: 1.05 },
                whileTap: { scale: 0.95 },
                onClick: () => setIsSubmitted(false),
                className: "px-8 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20",
                children: "Send another message"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden", children: [...Array(6)].map((_, i) => /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { opacity: 0 },
              animate: {
                opacity: [0, 0.5, 0],
                scale: [0.5, 1.5, 0.5],
                x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                y: [Math.random() * 100 - 50, Math.random() * 100 - 50]
              },
              transition: {
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              },
              className: "absolute w-2 h-2 bg-emerald-300 rounded-full",
              style: {
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`
              }
            },
            i
          )) })
        ]
      }
    ) }) });
  }
  return /* @__PURE__ */ jsx("section", { id: "contact", className: "py-24 bg-white", "aria-labelledby": "contact-heading", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-16 max-w-4xl mx-auto", children: [
      /* @__PURE__ */ jsx("h2", { id: "contact-heading", className: "text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4", children: "Choose how you want to connect" }),
      /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600", children: "Tell us what your UK business needs help with - website updates, SEO, CRM, automation, integrations, or monthly digital support." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-gray-500", children: "Primewayz UK currently supports UK-based small businesses and UK-facing teams only." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-8 items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600", children: "Fill out the form" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-2 text-2xl font-bold text-gray-900", children: "Send us your enquiry" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-600", children: "Share your requirement and we will review it before getting back to you." })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", noValidate: true, children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-semibold text-gray-700", children: "Name" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    id: "name",
                    name: "name",
                    value: formData.name,
                    onChange: handleChange,
                    placeholder: "Name",
                    autoComplete: "name",
                    "aria-required": "true",
                    "aria-invalid": !!errors.name,
                    "aria-describedby": errors.name ? "name-error" : void 0,
                    className: `w-full px-4 py-3 rounded-lg border bg-white ${errors.name ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-slate-600"} focus:ring-2 focus:ring-slate-400/30 outline-none transition-all`
                  }
                ),
                errors.name && /* @__PURE__ */ jsxs("p", { id: "name-error", className: "text-red-500 text-xs mt-1 flex items-center gap-1", role: "alert", children: [
                  /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
                  " ",
                  errors.name
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-semibold text-gray-700", children: "Email Address" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    id: "email",
                    name: "email",
                    value: formData.email,
                    onChange: handleChange,
                    placeholder: "Email Address",
                    autoComplete: "email",
                    "aria-required": "true",
                    "aria-invalid": !!errors.email,
                    "aria-describedby": errors.email ? "email-error" : void 0,
                    className: `w-full px-4 py-3 rounded-lg border bg-white ${errors.email ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-slate-600"} focus:ring-2 focus:ring-slate-400/30 outline-none transition-all`
                  }
                ),
                errors.email && /* @__PURE__ */ jsxs("p", { id: "email-error", className: "text-red-500 text-xs mt-1 flex items-center gap-1", role: "alert", children: [
                  /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
                  " ",
                  errors.email
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("span", { id: "phone-label", className: "block text-sm font-semibold text-gray-700", children: "Contact Number" }),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: `flex rounded-lg border bg-white overflow-hidden ${errors.phone ? "border-red-500 bg-red-50" : "border-gray-200"} focus-within:ring-2 focus-within:ring-slate-400/30`,
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "inline-flex shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700", children: "UK +44" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          id: "phone",
                          name: "phone",
                          type: "tel",
                          value: phone,
                          onChange: handlePhoneChange,
                          placeholder: "07522 146 354 or multiple numbers",
                          autoComplete: "tel",
                          "aria-labelledby": "phone-label",
                          "aria-invalid": !!errors.phone,
                          "aria-describedby": errors.phone ? "phone-error" : void 0,
                          className: "min-w-0 flex-1 bg-transparent px-4 py-3 text-base outline-none"
                        }
                      )
                    ]
                  }
                ),
                parsedPhoneNumbers.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 pt-1", "aria-label": "Parsed UK phone numbers", children: parsedPhoneNumbers.map((parsedPhone) => /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700",
                    children: formatUkPhoneNumber(parsedPhone)
                  },
                  parsedPhone
                )) }),
                errors.phone && /* @__PURE__ */ jsxs("p", { id: "phone-error", className: "text-red-500 text-xs mt-1 flex items-center gap-1", role: "alert", children: [
                  /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
                  " ",
                  errors.phone
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-6 flex flex-col", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2 flex-1 flex flex-col min-h-0", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "message", className: "block text-sm font-semibold text-gray-700", children: "What does your UK business need help with?" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  id: "message",
                  name: "message",
                  value: formData.message,
                  onChange: handleChange,
                  rows: 8,
                  placeholder: "Tell us about your website, SEO, CRM, automation, integration, or monthly support requirement...",
                  "aria-required": "true",
                  "aria-invalid": !!errors.message,
                  "aria-describedby": errors.message ? "message-error" : void 0,
                  className: `flex-1 min-h-[200px] w-full px-4 py-3 rounded-lg border bg-white resize-y ${errors.message ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-slate-600"} focus:ring-2 focus:ring-slate-400/30 outline-none transition-all`
                }
              ),
              errors.message && /* @__PURE__ */ jsxs("p", { id: "message-error", className: "text-red-500 text-xs mt-1 flex items-center gap-1", role: "alert", children: [
                /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
                " ",
                errors.message
              ] })
            ] }) })
          ] }),
          submitError && /* @__PURE__ */ jsxs(
            "div",
            {
              className: "p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2",
              role: "alert",
              children: [
                /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }),
                " ",
                submitError
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 pt-2", children: [
            /* @__PURE__ */ jsx(
              motion.button,
              {
                type: "submit",
                disabled: isSubmitting,
                "aria-busy": isSubmitting,
                whileHover: !isSubmitting ? { scale: 1.02 } : {},
                whileTap: !isSubmitting ? { scale: 0.98 } : {},
                className: `w-full max-w-md px-8 py-3.5 rounded-lg font-semibold text-white transition-all shadow-md ${isSubmitting ? "bg-slate-500 cursor-not-allowed opacity-80" : "bg-slate-800 hover:bg-slate-900 shadow-slate-900/20"}`,
                children: isSubmitting ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center justify-center gap-2", children: [
                  /* @__PURE__ */ jsxs(
                    "svg",
                    {
                      className: "animate-spin h-5 w-5",
                      xmlns: "http://www.w3.org/2000/svg",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      children: [
                        /* @__PURE__ */ jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                        /* @__PURE__ */ jsx(
                          "path",
                          {
                            className: "opacity-75",
                            fill: "currentColor",
                            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          }
                        )
                      ]
                    }
                  ),
                  "Sending…"
                ] }) : "Submit UK Enquiry"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 text-center max-w-lg", children: "We will use the information you provide to us to contact you in response to your submission." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "social-media-btn-wrapper mt-10 pt-8 border-t border-gray-200", children: /* @__PURE__ */ jsx("p", { className: "flex flex-wrap justify-center items-center gap-2 sm:gap-3", children: CONTACT_SOCIAL_LINKS.map((link) => /* @__PURE__ */ jsxs(
          "a",
          {
            href: link.href,
            target: "_blank",
            rel: "noopener noreferrer",
            "aria-label": link.ariaLabel,
            className: "social-btns inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors",
            children: [
              /* @__PURE__ */ jsx(SocialIcon, { label: link.label }),
              link.label
            ]
          },
          link.href
        )) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 md:p-8 rounded-3xl border border-emerald-100 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600", children: "Setup a discovery call" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-2 text-2xl font-bold text-gray-900", children: "Book a 30-minute discovery call" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-600", children: "Pick a convenient slot directly from our calendar." })
        ] }),
        isCalendlyOpen ? /* @__PURE__ */ jsx(
          "div",
          {
            id: "primewayz-calendly-inline",
            className: "overflow-hidden rounded-2xl border border-gray-100",
            style: { minWidth: "320px", height: "700px" }
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-gray-100 bg-slate-50 p-8 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-base font-semibold text-slate-900", children: "Load the calendar only when you are ready to book." }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: "This keeps the page faster and avoids loading third-party booking scripts before they are needed." }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                trackEvent("book_call_click", {
                  cta_text: "Open Calendly calendar",
                  cta_location: "contact_calendly_lazy_button",
                  lead_type: "discovery_call"
                });
                setIsCalendlyOpen(true);
              },
              className: "mt-6 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800",
              children: "Open booking calendar"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs text-slate-500", children: "The calendar opens inside this page after you click." })
        ] })
      ] })
    ] })
  ] }) });
}
const productLinks = [
  { label: "Software Subscription", href: "/software-development-subscription-uk" },
  { label: "Website Maintenance", href: "/website-maintenance-subscription-uk" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Success Stories", href: "/#success-stories" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" }
];
const legalLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Contact Us", href: "/#contact" }
];
const Footer = () => {
  return /* @__PURE__ */ jsx("footer", { className: "py-16 bg-[#000A2D] text-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "col-span-1 sm:col-span-2 lg:col-span-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-6", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "/primewayz-uk-dark-logo.png",
            alt: "Primewayz UK Infotech Pvt. Ltd.",
            className: "h-20 w-auto max-w-[240px] object-contain",
            loading: "lazy"
          }
        ) }),
        /* @__PURE__ */ jsx("p", { className: "text-zinc-400 max-w-sm mb-6", children: "Subscription-based software delivery for UK businesses - covering websites, SEO foundations, CRM integrations, automation, maintenance, and ongoing digital improvements." }),
        /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsx("p", { className: "mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-500", children: "Service paths" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/software-development-subscription-uk",
                className: "block text-zinc-400 transition-colors hover:text-white",
                children: "Software Development Subscription"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/website-maintenance-subscription-uk",
                className: "block text-zinc-400 transition-colors hover:text-white",
                children: "Website Maintenance Subscription"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/crm-integration-support-uk",
                className: "block text-zinc-400 transition-colors hover:text-white",
                children: "CRM Integration & Support"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 mb-8", children: [
          /* @__PURE__ */ jsxs(
            TrackedLink,
            {
              href: "tel:+919717132668",
              ctaText: "+91 97171 32668",
              ctaLocation: "footer_contact",
              eventType: "phone_click",
              className: "flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm",
              children: [
                /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4 text-emerald-500" }),
                "+91 97171 32668"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            TrackedLink,
            {
              href: "mailto:info@primewayz.com",
              ctaText: "info@primewayz.com",
              ctaLocation: "footer_contact",
              eventType: "email_click",
              className: "flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm",
              children: [
                /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4 text-emerald-500" }),
                "info@primewayz.com"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4", children: /* @__PURE__ */ jsx(
          TrackedLink,
          {
            href: "https://www.linkedin.com/company/primewayz-uk/",
            target: "_blank",
            rel: "noopener noreferrer",
            ariaLabel: "Primewayz on LinkedIn",
            ctaText: "LinkedIn",
            ctaLocation: "footer_social",
            eventType: "external_link_click",
            className: "p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors",
            children: /* @__PURE__ */ jsx(Linkedin, { className: "w-5 h-5" })
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold uppercase tracking-wider mb-6", children: "Product" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-4 text-zinc-400", children: productLinks.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          TrackedLink,
          {
            href: link.href,
            ctaText: link.label,
            ctaLocation: "footer_product_navigation",
            eventType: "footer_link_click",
            className: "hover:text-white transition-colors",
            children: link.label
          }
        ) }, link.href)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold uppercase tracking-wider mb-6", children: "Legal" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-4 text-zinc-400", children: legalLinks.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          TrackedLink,
          {
            href: link.href,
            ctaText: link.label,
            ctaLocation: "footer_legal_navigation",
            eventType: "footer_link_click",
            className: "hover:text-white transition-colors",
            children: link.label
          }
        ) }, link.href)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-1 sm:col-span-2 lg:col-span-1", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold uppercase tracking-wider mb-6", children: "UK Focus" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-emerald-500 uppercase tracking-widest", children: "Region" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-zinc-500 leading-relaxed", children: "Built for UK SMEs that need reliable monthly digital delivery without hiring a full in-house team." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-emerald-500 uppercase tracking-widest", children: "Delivery" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-zinc-500 leading-relaxed", children: "Websites, CMS improvements, SEO foundations, CRM integrations, automation, and maintenance." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-emerald-500 uppercase tracking-widest", children: "Commercial Model" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-zinc-500 leading-relaxed", children: "Flexible monthly plans, transparent add-ons, and maintenance mode when priorities slow down." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm", children: /* @__PURE__ */ jsxs("p", { children: [
      " © ",
      (/* @__PURE__ */ new Date()).getFullYear(),
      " Primewayz Infotech Pvt. Ltd. All rights reserved."
    ] }) })
  ] }) });
};
const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  return /* @__PURE__ */ jsx(AnimatePresence, { children: isVisible && /* @__PURE__ */ jsx(
    motion.button,
    {
      initial: { opacity: 0, scale: 0.5, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.5, y: 20 },
      onClick: scrollToTop,
      className: "fixed bottom-8 left-8 z-50 p-4 bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 transition-colors group",
      "aria-label": "Scroll to top",
      children: /* @__PURE__ */ jsx(ChevronUp, { className: "w-6 h-6 group-hover:-translate-y-1 transition-transform" })
    }
  ) });
};
const normalizeChatStatus = (status) => {
  if (status === "online") return "online";
  if (status === "away") return "away";
  if (status === "assistant") return "assistant";
  return "offline";
};
const defaultAvailability = {
  status: "assistant",
  title: "Primewayz Assistant is active",
  subtitle: "Human team replies during business hours",
  responseExpectation: "Human team replies during business hours",
  businessHours: "Mon-Fri, 10:00-19:00 UK time",
  canAcceptMessages: true,
  canBookCall: true,
  serverTime: ""
};
const availabilityStyles = {
  online: {
    dot: "bg-green-600",
    badge: "border border-green-300 bg-green-100 text-green-800",
    label: "Online",
    launcherLabel: "Online"
  },
  away: {
    dot: "bg-amber-500",
    badge: "border border-amber-300 bg-amber-100 text-amber-800",
    label: "Away",
    launcherLabel: "Away - leave a message"
  },
  offline: {
    dot: "bg-slate-400",
    badge: "border border-slate-300 bg-slate-100 text-slate-700",
    label: "Offline",
    launcherLabel: "Offline - leave a message"
  },
  assistant: {
    dot: "bg-slate-500",
    badge: "border border-slate-300 bg-slate-100 text-slate-700",
    label: "Assistant",
    launcherLabel: "Assistant"
  }
};
const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTrackedChatOpen, setHasTrackedChatOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem("primewayz_chat_open_tracked") === "true";
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [availability, setAvailability] = useState(defaultAvailability);
  normalizeChatStatus(availability == null ? void 0 : availability.status);
  const [userName, setUserName] = useState(() => localStorage.getItem("chat_user_name") || "");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("chat_user_email") || "");
  const [showLeadForm, setShowLeadForm] = useState(!userName || !userEmail);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    name: userName,
    email: userEmail,
    phone: "",
    preferredDate: "",
    preferredTime: "",
    message: ""
  });
  const [appointmentError, setAppointmentError] = useState("");
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem("chat_session_id");
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(7);
    localStorage.setItem("chat_session_id", newId);
    return newId;
  });
  useEffect(() => {
    if (!isOpen || !sessionId) return;
    let cancelled = false;
    const sendVisitorHeartbeat = async () => {
      try {
        await fetch(apiUrl("/api/chat/heartbeat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userName,
            userEmail
          })
        });
      } catch (error) {
        if (!cancelled) {
          console.warn("Chat heartbeat failed", error);
        }
      }
    };
    sendVisitorHeartbeat();
    const heartbeatTimer = window.setInterval(sendVisitorHeartbeat, 3e4);
    return () => {
      cancelled = true;
      window.clearInterval(heartbeatTimer);
    };
  }, [isOpen, sessionId, userName, userEmail]);
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(apiUrl(`/api/chat/${sessionId}`));
        if (res.ok) {
          const history = await res.json();
          if (history.length > 0) {
            setMessages(history.map((m) => ({
              ...m,
              id: m.id.toString(),
              timestamp: new Date(m.timestamp),
              attachments: m.attachments || []
            })));
          } else {
            setMessages([{
              id: "1",
              text: "Hi there! 👋 Welcome to Primewayz UK. How can we help your UK business with website, SEO, CRM, automation, or monthly digital support?",
              sender: "bot",
              timestamp: /* @__PURE__ */ new Date()
            }]);
          }
        } else if (res.status === 404) {
          setApiAvailable(false);
          setMessages([{
            id: "1",
            text: "Hi there! 👋 Welcome to Primewayz UK. How can we help your UK business with website, SEO, CRM, automation, or monthly digital support?",
            sender: "bot",
            timestamp: /* @__PURE__ */ new Date()
          }]);
        }
      } catch (error) {
        setApiAvailable(false);
        setMessages([{
          id: "1",
          text: "Hi there! 👋 Welcome to Primewayz UK. How can we help your UK business with website, SEO, CRM, automation, or monthly digital support?",
          sender: "bot",
          timestamp: /* @__PURE__ */ new Date()
        }]);
      }
    };
    fetchHistory();
  }, [sessionId]);
  useEffect(() => {
    if (!isOpen || !apiAvailable) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/chat/${sessionId}`));
        if (res.ok) {
          const history = await res.json();
          if (history.length > messages.length) {
            setMessages(history.map((m) => ({
              ...m,
              id: m.id.toString(),
              timestamp: new Date(m.timestamp),
              attachments: m.attachments || []
            })));
          }
        }
      } catch (error) {
        setApiAvailable(false);
      }
    }, 5e3);
    return () => clearInterval(pollInterval);
  }, [isOpen, sessionId, messages.length, apiAvailable]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch(apiUrl("/api/chat/availability"));
        if (res.ok) {
          setAvailability(await res.json());
        }
      } catch {
        setAvailability(defaultAvailability);
      }
    };
    fetchAvailability();
    const interval = setInterval(fetchAvailability, 6e4);
    return () => clearInterval(interval);
  }, []);
  const availabilityStyle = availabilityStyles[availability.status] || availabilityStyles.assistant;
  const openChatWidget = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (!hasTrackedChatOpen) {
      trackChatOpen({
        chatStatus: availability.status,
        chatTitle: availability.title,
        ctaLocation: "chat_launcher"
      });
      setHasTrackedChatOpen(true);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("primewayz_chat_open_tracked", "true");
      }
    }
  };
  const scrollToBottom = () => {
    var _a;
    (_a = messagesEndRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;
    localStorage.setItem("chat_user_name", userName);
    localStorage.setItem("chat_user_email", userEmail);
    try {
      const res = await fetch(apiUrl("/api/chat/session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name: userName, email: userEmail })
      });
      if (!res.ok) {
        setApiAvailable(false);
      }
      setShowLeadForm(false);
    } catch (error) {
      setApiAvailable(false);
      setShowLeadForm(false);
    }
  };
  const syncAppointmentContactDetails = () => {
    const storedName = typeof window !== "undefined" ? window.localStorage.getItem("chat_user_name") || "" : "";
    const storedEmail = typeof window !== "undefined" ? window.localStorage.getItem("chat_user_email") || "" : "";
    setAppointmentForm((prev) => ({
      ...prev,
      name: prev.name || userName || storedName,
      email: prev.email || userEmail || storedEmail
    }));
  };
  const toggleAppointmentForm = () => {
    syncAppointmentContactDetails();
    setShowAppointmentForm((value) => !value);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };
  const uploadChatFile = async (file) => {
    setUploadError("");
    setIsUploading(true);
    const body = new FormData();
    body.append("sessionId", sessionId);
    body.append("file", file);
    try {
      const res = await fetch(apiUrl("/api/chat/uploads"), {
        method: "POST",
        body
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed.");
        return;
      }
      setPendingAttachments((prev) => [...prev, data]);
      trackChatAttachmentUploaded({
        chatStatus: availability.status,
        attachmentKind: data == null ? void 0 : data.kind,
        sizeBytes: file.size,
        ctaLocation: "live_chat_attachment"
      });
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handlePaste = (event) => {
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
    if (file) uploadChatFile(file);
  };
  const submitAppointmentRequest = async (event) => {
    event.preventDefault();
    setAppointmentError("");
    try {
      const res = await fetch(apiUrl("/api/chat/appointments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          ...appointmentForm,
          name: appointmentForm.name || userName,
          email: appointmentForm.email || userEmail,
          timezone: "Europe/London"
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAppointmentError((data == null ? void 0 : data.error) || "Could not send appointment request.");
        return;
      }
      trackChatAppointmentRequested({
        chatStatus: availability.status,
        hasMessage: Boolean(appointmentForm.message.trim()),
        ctaLocation: "chat_appointment_form"
      });
      setShowAppointmentForm(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `appointment-${Date.now()}`,
          text: "Thanks, your appointment request has been received. Our team will confirm shortly.",
          sender: "bot",
          timestamp: /* @__PURE__ */ new Date()
        }
      ]);
    } catch {
      setAppointmentError("Could not send appointment request.");
    }
  };
  const handleSend = async (e) => {
    var _a, _b;
    e.preventDefault();
    if (!message.trim() && pendingAttachments.length === 0) return;
    const outgoingMessageText = message.trim();
    const outgoingAttachmentCount = pendingAttachments.length;
    const userMessage = {
      id: Date.now().toString(),
      text: outgoingMessageText || "Shared an attachment",
      sender: "user",
      timestamp: /* @__PURE__ */ new Date(),
      attachments: pendingAttachments
    };
    setMessages((prev) => [...prev, userMessage]);
    const attachmentIds = pendingAttachments.map((attachment) => attachment.id);
    setMessage("");
    setPendingAttachments([]);
    setIsTyping(true);
    try {
      const res = await fetch(apiUrl("/api/chat/respond"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage.text,
          userName: userName || void 0,
          attachmentIds
        })
      });
      if (!res.ok) throw new Error("Backend chat request failed");
      const payload = await res.json();
      setIsTyping(false);
      trackChatMessageSent({
        chatStatus: ((_a = payload == null ? void 0 : payload.availability) == null ? void 0 : _a.status) || availability.status,
        messageLength: outgoingMessageText.length,
        attachmentCount: outgoingAttachmentCount,
        botReplySent: Boolean(payload == null ? void 0 : payload.botMessage),
        ctaLocation: "live_chat"
      });
      if ((_b = payload == null ? void 0 : payload.botMessage) == null ? void 0 : _b.text) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: payload.botMessage.text,
          sender: "bot",
          timestamp: new Date(payload.botMessage.timestamp || Date.now())
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("AI Chat error:", error);
      setApiAvailable(false);
      setIsTyping(false);
      const errorBotMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having a little trouble connecting right now. Please try again in a moment or use our contact form!",
        sender: "bot",
        timestamp: /* @__PURE__ */ new Date()
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed bottom-6 right-6 z-[60] flex flex-col items-end", children: [
    /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && !isMinimized && /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.95 },
        className: "mb-3 w-[calc(100vw-48px)] max-w-[400px] h-[min(82vh,560px)] bg-white rounded-2xl shadow-2xl shadow-emerald-900/20 border border-zinc-200 flex flex-col overflow-hidden sm:mb-4 sm:w-[400px] sm:h-[560px] sm:rounded-3xl max-[360px]:w-[calc(100vw-32px)]",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 bg-zinc-900 text-white flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center", children: /* @__PURE__ */ jsx(Bot, { className: "w-6 h-6 text-white" }) }),
                /* @__PURE__ */ jsx("div", { className: `absolute bottom-0 right-0 w-3 h-3 border-2 border-zinc-900 rounded-full ${availabilityStyle.dot}` })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm", children: availability.title }),
                  /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1 px-1.5 py-0.5 rounded-full ${availabilityStyle.badge}`, children: [
                    /* @__PURE__ */ jsx("div", { className: `w-1 h-1 rounded-full ${availabilityStyle.dot}` }),
                    /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold uppercase tracking-tighter", children: availabilityStyle.label })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-zinc-400", children: availability.subtitle })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setIsMinimized(true),
                  className: "p-2 hover:bg-white/10 rounded-full transition-colors",
                  children: /* @__PURE__ */ jsx(Minus, { className: "w-4 h-4" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setIsOpen(false),
                  className: "p-2 hover:bg-white/10 rounded-full transition-colors",
                  children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50", children: showLeadForm ? /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center p-6 text-center space-y-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "w-8 h-8 text-emerald-600" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-zinc-900", children: "Welcome to Primewayz!" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-zinc-500 mt-1", children: "Please introduce yourself to start chatting with our team." })
            ] }),
            /* @__PURE__ */ jsxs("form", { onSubmit: handleLeadSubmit, className: "w-full space-y-3", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Your Name",
                  value: userName,
                  onChange: (e) => setUserName(e.target.value),
                  className: "w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20",
                  required: true
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  placeholder: "Your Email",
                  value: userEmail,
                  onChange: (e) => setUserEmail(e.target.value),
                  className: "w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20",
                  required: true
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  className: "w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all",
                  children: "Start Chatting"
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            messages.map((msg) => /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                className: `flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`,
                children: /* @__PURE__ */ jsxs("div", { className: `max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === "user" ? "bg-emerald-600 text-white rounded-br-none shadow-lg shadow-emerald-900/10" : msg.sender === "admin" ? "bg-zinc-900 text-white rounded-bl-none shadow-lg" : "bg-white text-zinc-800 border border-zinc-200 rounded-bl-none shadow-sm"}`, children: [
                  msg.sender === "admin" && /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1", children: "Support Agent" }),
                  msg.text,
                  msg.attachments && msg.attachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-2", children: msg.attachments.map((attachment) => attachment.kind === "image" ? /* @__PURE__ */ jsx("a", { href: attachment.url, target: "_blank", rel: "noopener noreferrer", children: /* @__PURE__ */ jsx("img", { src: attachment.url, alt: attachment.originalName, className: "max-h-36 rounded-xl border border-white/20 object-cover" }) }, attachment.id) : /* @__PURE__ */ jsxs(
                    "a",
                    {
                      href: attachment.url,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "flex flex-wrap items-center gap-2 rounded-xl bg-white/10 p-2 text-xs font-bold underline-offset-2 hover:underline",
                      children: [
                        /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
                        attachment.originalName
                      ]
                    },
                    attachment.id
                  )) }),
                  /* @__PURE__ */ jsx("div", { className: `text-[10px] mt-1 opacity-50 ${msg.sender === "user" ? "text-right" : "text-left"}`, children: msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
                ] })
              },
              msg.id
            )),
            isTyping && /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxs("div", { className: "bg-white border border-zinc-200 p-3 rounded-2xl rounded-bl-none flex gap-1", children: [
              /* @__PURE__ */ jsx(motion.div, { animate: { opacity: [0.3, 1, 0.3] }, transition: { repeat: Infinity, duration: 1 }, className: "w-1.5 h-1.5 bg-zinc-400 rounded-full" }),
              /* @__PURE__ */ jsx(motion.div, { animate: { opacity: [0.3, 1, 0.3] }, transition: { repeat: Infinity, duration: 1, delay: 0.2 }, className: "w-1.5 h-1.5 bg-zinc-400 rounded-full" }),
              /* @__PURE__ */ jsx(motion.div, { animate: { opacity: [0.3, 1, 0.3] }, transition: { repeat: Infinity, duration: 1, delay: 0.4 }, className: "w-1.5 h-1.5 bg-zinc-400 rounded-full" })
            ] }) }),
            /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
          ] }) }),
          !showLeadForm && /* @__PURE__ */ jsxs("div", { className: "border-t border-zinc-100 bg-white p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    var _a;
                    return (_a = fileInputRef.current) == null ? void 0 : _a.click();
                  },
                  className: "inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200",
                  children: [
                    /* @__PURE__ */ jsx(Paperclip, { className: "h-3.5 w-3.5" }),
                    "Attach"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: toggleAppointmentForm,
                  className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${availability.status === "online" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"}`,
                  children: [
                    /* @__PURE__ */ jsx(CalendarClock, { className: "h-3.5 w-3.5" }),
                    "Book a call"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: fileInputRef,
                  type: "file",
                  className: "hidden",
                  accept: "image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
                  onChange: (event) => {
                    var _a;
                    const file = (_a = event.target.files) == null ? void 0 : _a[0];
                    if (file) uploadChatFile(file);
                  }
                }
              )
            ] }),
            showAppointmentForm && /* @__PURE__ */ jsxs("form", { onSubmit: submitAppointmentRequest, className: "mb-3 space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsx("input", { value: appointmentForm.name, onChange: (e) => setAppointmentForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Name", className: "rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none" }),
                /* @__PURE__ */ jsx("input", { value: appointmentForm.email, onChange: (e) => setAppointmentForm((prev) => ({ ...prev, email: e.target.value })), placeholder: "Email", className: "rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none" }),
                /* @__PURE__ */ jsx("input", { value: appointmentForm.phone, onChange: (e) => setAppointmentForm((prev) => ({ ...prev, phone: e.target.value })), placeholder: "Phone", className: "rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none" }),
                /* @__PURE__ */ jsx("input", { type: "date", value: appointmentForm.preferredDate, onChange: (e) => setAppointmentForm((prev) => ({ ...prev, preferredDate: e.target.value })), className: "rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none" }),
                /* @__PURE__ */ jsx("input", { type: "time", value: appointmentForm.preferredTime, onChange: (e) => setAppointmentForm((prev) => ({ ...prev, preferredTime: e.target.value })), className: "rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none" })
              ] }),
              /* @__PURE__ */ jsx("textarea", { value: appointmentForm.message, onChange: (e) => setAppointmentForm((prev) => ({ ...prev, message: e.target.value })), placeholder: "What would you like to discuss?", rows: 2, className: "w-full rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none resize-none" }),
              appointmentError && /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-red-600", children: appointmentError }),
              /* @__PURE__ */ jsx("button", { type: "submit", className: "rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700", children: "Send request" })
            ] }),
            uploadError && /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-bold text-red-600", children: uploadError }),
            isUploading && /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-bold text-zinc-500", children: "Uploading file..." }),
            pendingAttachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "mb-2 flex flex-wrap gap-2", children: pendingAttachments.map((attachment) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600", children: [
              attachment.kind === "image" ? /* @__PURE__ */ jsx(Image, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(FileText, { className: "h-3 w-3" }),
              attachment.originalName
            ] }, attachment.id)) }),
            /* @__PURE__ */ jsxs("form", { onSubmit: handleSend, className: "flex items-end gap-2", children: [
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  ref: textareaRef,
                  rows: 1,
                  value: message,
                  onChange: (e) => setMessage(e.target.value),
                  onKeyDown: handleKeyDown,
                  onPaste: handlePaste,
                  placeholder: availability.status === "online" ? "Message Primewayz team..." : "Leave your message and contact details...",
                  className: "flex-1 bg-zinc-100 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none max-h-[120px] transition-[height] duration-100"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: !message.trim() && pendingAttachments.length === 0,
                  className: "w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 flex-shrink-0",
                  children: /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" })
                }
              )
            ] })
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex flex-wrap items-center gap-2", children: [
      !isOpen && /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${availabilityStyle.badge}`, children: [
        /* @__PURE__ */ jsx("span", { className: `h-2 w-2 rounded-full ${availabilityStyle.dot}` }),
        availabilityStyle.launcherLabel
      ] }),
      /* @__PURE__ */ jsxs(
        motion.button,
        {
          "aria-label": `Open chat. ${availability.title}. ${availability.subtitle}`,
          onClick: openChatWidget,
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 },
          className: `relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen && !isMinimized ? "bg-zinc-900 text-white rotate-90" : "bg-emerald-600 text-white"}`,
          children: [
            isOpen && !isMinimized ? /* @__PURE__ */ jsx(X, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(MessageCircle, { className: "w-6 h-6" }),
            !isOpen && /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { scale: 0 },
                animate: { scale: 1 },
                className: `absolute -top-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${availabilityStyle.dot}`
              }
            )
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(
      motion.button,
      {
        "aria-label": `Open chat. ${availability.title}. ${availability.subtitle}`,
        onClick: () => {
          setIsOpen(true);
          setIsMinimized(false);
        },
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        className: `sm:hidden relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen && !isMinimized ? "bg-zinc-900 text-white rotate-90" : "bg-emerald-600 text-white"}`,
        children: [
          isOpen && !isMinimized ? /* @__PURE__ */ jsx(X, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(MessageCircle, { className: "w-6 h-6" }),
          !isOpen && /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { scale: 0 },
              animate: { scale: 1 },
              className: `absolute -top-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${availabilityStyle.dot}`
            }
          )
        ]
      }
    )
  ] });
};
function PasswordInput({
  id,
  className = "",
  leftIcon,
  toggleLabel = "password",
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isVisible, setIsVisible] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    leftIcon,
    /* @__PURE__ */ jsx(
      "input",
      {
        id: inputId,
        type: isVisible ? "text" : "password",
        className,
        ...props
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setIsVisible((visible) => !visible),
        className: "absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
        "aria-label": isVisible ? `Hide ${toggleLabel}` : `Show ${toggleLabel}`,
        "aria-controls": inputId,
        "aria-pressed": isVisible,
        children: isVisible ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
      }
    )
  ] });
}
const ALLOWED_TAGS = /* @__PURE__ */ new Set([
  "a",
  "blockquote",
  "br",
  "div",
  "em",
  "h2",
  "h3",
  "h4",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "u",
  "ul"
]);
const ALLOWED_ATTRS = /* @__PURE__ */ new Set(["alt", "class", "href", "rel", "src", "target", "title"]);
function isSafeUrl(value) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("/") || trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:");
}
function sanitizeClassName(value) {
  return value.split(/\s+/).filter((token) => /^(blog-|cms-|attachment-|callout-|prose-|quote-)[a-z0-9_-]*$/i.test(token)).join(" ");
}
function sanitizeWithDomParser(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";
  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const element = child;
      const tag = element.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        element.replaceWith(...Array.from(element.childNodes));
        return;
      }
      Array.from(element.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value;
        if (name.startsWith("on") || !ALLOWED_ATTRS.has(name)) {
          element.removeAttribute(attr.name);
          return;
        }
        if ((name === "href" || name === "src") && !isSafeUrl(value)) {
          element.removeAttribute(attr.name);
          return;
        }
        if (name === "class") {
          const safeClassName = sanitizeClassName(value);
          if (safeClassName) element.setAttribute("class", safeClassName);
          else element.removeAttribute("class");
        }
      });
      if (tag === "a") {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      }
      walk(element);
    });
  };
  walk(root);
  return root.innerHTML;
}
function sanitizeWithRegex(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/<\s*(script|style|iframe|embed|object|form|input|button|textarea|select|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "").replace(/<\s*(script|style|iframe|embed|object|form|input|button|textarea|select|meta|link)[^>]*\/?\s*>/gi, "").replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/\s+(href|src)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, "").replace(/\s+(href|src)\s*=\s*javascript:[^\s>]+/gi, "");
}
function sanitizeBlogHtml(html) {
  if (!html) return "";
  if (typeof DOMParser !== "undefined") {
    return sanitizeWithDomParser(html);
  }
  return sanitizeWithRegex(html);
}
const buttonClass = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900";
function createAttachmentHtml(upload) {
  return `<p><a class="blog-attachment-card" href="${upload.url}" target="_blank" rel="noopener noreferrer" title="${upload.originalName}"><strong>${upload.originalName}</strong><span>${Math.round(upload.size / 1024)} KB ${upload.mimeType}</span></a></p>`;
}
function RichBlogEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const [mode, setMode] = useState("edit");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  useEffect(() => {
    if (!editorRef.current || editorRef.current.innerHTML === value) return;
    editorRef.current.innerHTML = value || "<p></p>";
  }, [value]);
  const syncContent = () => {
    if (!editorRef.current) return;
    onChange(sanitizeBlogHtml(editorRef.current.innerHTML));
  };
  const runCommand = (command, commandValue) => {
    var _a;
    (_a = editorRef.current) == null ? void 0 : _a.focus();
    document.execCommand(command, false, commandValue);
    syncContent();
  };
  const formatBlock = (tag) => {
    runCommand("formatBlock", tag);
  };
  const insertHtml = (html) => {
    var _a;
    (_a = editorRef.current) == null ? void 0 : _a.focus();
    document.execCommand("insertHTML", false, html);
    syncContent();
  };
  const addLink = () => {
    const href = window.prompt("Paste the link URL");
    if (!href) return;
    runCommand("createLink", href);
  };
  const insertCallout = (kind) => {
    const labels = {
      info: "Info",
      tip: "Tip",
      warning: "Note",
      quote: "Quote"
    };
    insertHtml(`<div class="blog-callout blog-callout-${kind}"><strong>${labels[kind]}</strong><p>Write the ${labels[kind].toLowerCase()} content here.</p></div><p></p>`);
  };
  const handleUpload = async (file) => {
    if (!file) return;
    setUploadError("");
    setIsUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(apiUrl("/api/admin/uploads"), {
        method: "POST",
        body
      });
      const data = await response.json();
      if (!response.ok) {
        setUploadError(data.error || "Upload failed.");
        return;
      }
      const upload = data;
      if (upload.kind === "image") {
        insertHtml(`<p><img src="${upload.url}" alt="${upload.originalName}" class="blog-content-image" /></p><p></p>`);
      } else {
        insertHtml(createAttachmentHtml(upload));
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-2xl border border-zinc-200 bg-white", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 p-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setMode("edit"), className: `${buttonClass} ${mode === "edit" ? "bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white" : ""}`, children: "Edit" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setMode("preview"), className: `${buttonClass} ${mode === "preview" ? "bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white" : ""}`, children: "Preview" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-zinc-400", children: isUploading ? "Uploading..." : "HTML is saved to the existing content field" })
    ] }),
    mode === "edit" && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 border-b border-zinc-100 p-3", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => formatBlock("p"), children: "P" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => formatBlock("h2"), children: /* @__PURE__ */ jsx(Heading2, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => formatBlock("h3"), children: /* @__PURE__ */ jsx(Heading3, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => formatBlock("h4"), children: /* @__PURE__ */ jsx(Heading4, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => runCommand("bold"), children: /* @__PURE__ */ jsx(Bold, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => runCommand("italic"), children: /* @__PURE__ */ jsx(Italic, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => runCommand("underline"), children: /* @__PURE__ */ jsx(Underline, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => runCommand("insertUnorderedList"), children: /* @__PURE__ */ jsx(List, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => runCommand("insertOrderedList"), children: /* @__PURE__ */ jsx(ListOrdered, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => formatBlock("blockquote"), children: /* @__PURE__ */ jsx(Quote, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: addLink, children: /* @__PURE__ */ jsx(Link$1, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => runCommand("insertHorizontalRule"), children: /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => runCommand("undo"), children: /* @__PURE__ */ jsx(Undo2, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => runCommand("redo"), children: /* @__PURE__ */ jsx(Redo2, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("button", { type: "button", className: buttonClass, onClick: () => runCommand("removeFormat"), children: /* @__PURE__ */ jsx(RemoveFormatting, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: buttonClass, onClick: () => {
        var _a;
        return (_a = imageInputRef.current) == null ? void 0 : _a.click();
      }, children: [
        /* @__PURE__ */ jsx(Image, { className: "h-4 w-4" }),
        " Insert Image"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: buttonClass, onClick: () => {
        var _a;
        return (_a = documentInputRef.current) == null ? void 0 : _a.click();
      }, children: [
        /* @__PURE__ */ jsx(Paperclip, { className: "h-4 w-4" }),
        " Attach Document"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: buttonClass, onClick: () => insertCallout("info"), children: [
        /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
        " Info"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: buttonClass, onClick: () => insertCallout("tip"), children: [
        /* @__PURE__ */ jsx(Lightbulb, { className: "h-4 w-4" }),
        " Tip"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: buttonClass, onClick: () => insertCallout("warning"), children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
        " Note"
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: buttonClass, onClick: () => insertCallout("quote"), children: [
        /* @__PURE__ */ jsx(Quote, { className: "h-4 w-4" }),
        " Quote block"
      ] }),
      /* @__PURE__ */ jsx("input", { ref: imageInputRef, type: "file", accept: "image/jpeg,image/png,image/webp", className: "hidden", onChange: (event) => {
        var _a;
        return handleUpload((_a = event.target.files) == null ? void 0 : _a[0]);
      } }),
      /* @__PURE__ */ jsx("input", { ref: documentInputRef, type: "file", accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation", className: "hidden", onChange: (event) => {
        var _a;
        return handleUpload((_a = event.target.files) == null ? void 0 : _a[0]);
      } })
    ] }),
    uploadError && /* @__PURE__ */ jsx("div", { className: "border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600", children: uploadError }),
    mode === "edit" ? /* @__PURE__ */ jsx(
      "div",
      {
        ref: editorRef,
        contentEditable: true,
        suppressContentEditableWarning: true,
        onInput: syncContent,
        onBlur: syncContent,
        className: "blog-rich-editor min-h-[360px] max-h-[680px] overflow-y-auto p-5 text-zinc-800 outline-none"
      }
    ) : /* @__PURE__ */ jsx("div", { className: "min-h-[360px] bg-white p-6", children: /* @__PURE__ */ jsx("div", { className: "blog-content-preview", dangerouslySetInnerHTML: { __html: sanitizeBlogHtml(value) || '<p class="text-zinc-400">Nothing to preview yet.</p>' } }) })
  ] });
}
const emptyBlogForm = {
  title: "",
  slug: "",
  description: "",
  excerpt: "",
  category: "Digital Operations",
  tags: "",
  author: "Primewayz UK Team",
  readTime: "5 min read",
  image: "",
  content: "",
  seoTitle: "",
  seoDescription: "",
  featured: false,
  status: "draft"
};
const isSuperAdmin = (role) => role === "super_admin" || role === "admin";
const isBlogEditor = (role) => isSuperAdmin(role) || role === "blog_editor" || role === "editor";
const isBlogAuthor = (role) => isBlogEditor(role) || role === "blog_author";
const isOperationsRole = (role) => isSuperAdmin(role) || role === "editor" || role === "viewer";
const getDefaultAdminTab = (role) => isOperationsRole(role) ? "forms" : "blog";
const adminRequest = (path, init = {}) => {
  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: init.headers
  });
};
const getVisitorActivityStatus = (visitorLastSeenAt) => {
  if (!visitorLastSeenAt) {
    return {
      label: "Inactive",
      dotClass: "bg-slate-400",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-600",
      title: "No recent visitor activity recorded"
    };
  }
  const lastSeenTime = new Date(visitorLastSeenAt).getTime();
  if (Number.isNaN(lastSeenTime)) {
    return {
      label: "Inactive",
      dotClass: "bg-slate-400",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-600",
      title: "Visitor activity timestamp is unavailable"
    };
  }
  const ageMs = Date.now() - lastSeenTime;
  const ageSeconds = Math.floor(ageMs / 1e3);
  const ageMinutes = Math.floor(ageSeconds / 60);
  if (ageSeconds <= 60) {
    return {
      label: "Active now",
      dotClass: "bg-green-500",
      badgeClass: "border-green-200 bg-green-50 text-green-700",
      title: "Visitor was active within the last minute"
    };
  }
  if (ageMinutes <= 5) {
    return {
      label: "Recently active",
      dotClass: "bg-amber-500",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      title: `Visitor was active ${ageMinutes || 1} minute(s) ago`
    };
  }
  return {
    label: "Inactive",
    dotClass: "bg-slate-400",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-600",
    title: `Visitor was last active ${ageMinutes} minute(s) ago`
  };
};
const renderVisitorActivityBadge = (visitorLastSeenAt) => {
  const activity = getVisitorActivityStatus(visitorLastSeenAt);
  return /* @__PURE__ */ jsxs(
    "span",
    {
      title: activity.title,
      className: `inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${activity.badgeClass}`,
      children: [
        /* @__PURE__ */ jsx("span", { className: `h-2 w-2 rounded-full ${activity.dotClass}` }),
        activity.label
      ]
    }
  );
};
const AdminPanel = () => {
  var _a;
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [formResponses, setFormResponses] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [chatAppointments, setChatAppointments] = useState([]);
  const [blogComments, setBlogComments] = useState([]);
  const [cmsBlogPosts, setCmsBlogPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [blogForm, setBlogForm] = useState(emptyBlogForm);
  const [blogError, setBlogError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyingToMessageId, setReplyingToMessageId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [activeTab, setActiveTab] = useState("forms");
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [unreadBySession, setUnreadBySession] = useState({});
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("primewayz-admin-sound-alerts") === "true";
  });
  const [adminReplyAttachments, setAdminReplyAttachments] = useState([]);
  const [adminUploadError, setAdminUploadError] = useState("");
  const [isAdminUploading, setIsAdminUploading] = useState(false);
  const [chatAvailability, setChatAvailability] = useState(null);
  const [availabilityMode, setAvailabilityMode] = useState("auto");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState(null);
  const [notificationSummaryError, setNotificationSummaryError] = useState("");
  const [isLoadingNotificationSummary, setIsLoadingNotificationSummary] = useState(false);
  const seenUserMessageIdsRef = useRef(/* @__PURE__ */ new Set());
  const hasInitializedMessageWatchRef = useRef(false);
  const adminFileInputRef = useRef(null);
  const lastHeartbeatAtRef = useRef(0);
  const checkAuth = async () => {
    var _a2;
    try {
      const res = await fetch(apiUrl("/api/admin/check-auth"), { credentials: "include" });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        setUser(data.user);
        setActiveTab(getDefaultAdminTab((_a2 = data.user) == null ? void 0 : _a2.role));
        fetchData(false, data.user);
        fetchChatAvailability();
        fetchNotificationSummary();
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };
  useEffect(() => {
    checkAuth();
  }, []);
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => fetchData(true), 5e3);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotificationSummary();
    const interval = setInterval(fetchNotificationSummary, 3e4);
    return () => clearInterval(interval);
  }, [isAuthenticated]);
  const fetchNotificationSummary = async () => {
    setIsLoadingNotificationSummary(true);
    try {
      const res = await adminRequest("/api/admin/notifications/summary");
      if (!res.ok) {
        if (res.status !== 403) {
          setNotificationSummaryError("Unable to load notification summary.");
        }
        return;
      }
      const data = await res.json();
      setNotificationSummary(data);
      setNotificationSummaryError("");
    } catch (error) {
      console.error("Failed to load notification summary:", error);
      setNotificationSummaryError("Unable to load notification summary.");
    } finally {
      setIsLoadingNotificationSummary(false);
    }
  };
  const fetchChatAvailability = async (syncForm = true) => {
    try {
      const res = await adminRequest("/api/admin/chat/availability");
      if (!res.ok) return;
      const data = await res.json();
      setChatAvailability(data);
      if (syncForm) {
        setAvailabilityMode(data.mode || "auto");
        setAvailabilityMessage(data.customMessage || "");
      }
    } catch (error) {
      console.error("Failed to fetch chat availability:", error);
    }
  };
  const sendPresenceHeartbeat = async (force = false) => {
    if (!isAuthenticated || !user) return;
    const now = Date.now();
    if (!force && now - lastHeartbeatAtRef.current < 3e4) return;
    lastHeartbeatAtRef.current = now;
    try {
      await adminRequest("/api/admin/presence/heartbeat", {
        method: "POST"
      });
      fetchChatAvailability(false);
    } catch (error) {
      console.error("Presence heartbeat failed:", error);
    }
  };
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    sendPresenceHeartbeat(true);
    const interval = setInterval(() => sendPresenceHeartbeat(true), 6e4);
    const activityHandler = () => sendPresenceHeartbeat(false);
    window.addEventListener("focus", activityHandler);
    window.addEventListener("click", activityHandler);
    window.addEventListener("keydown", activityHandler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", activityHandler);
      window.removeEventListener("click", activityHandler);
      window.removeEventListener("keydown", activityHandler);
    };
  }, [isAuthenticated, user]);
  const saveChatAvailability = async () => {
    setAvailabilityError("");
    setIsSavingAvailability(true);
    try {
      const res = await adminRequest("/api/admin/chat/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: availabilityMode, message: availabilityMessage })
      });
      const data = await res.json();
      if (!res.ok) {
        setAvailabilityError(data.error || "Failed to save availability");
        return;
      }
      setChatAvailability(data);
      setAvailabilityMode(data.mode || availabilityMode);
      setAvailabilityMessage(data.customMessage || "");
    } catch (error) {
      setAvailabilityError("Failed to save availability");
    } finally {
      setIsSavingAvailability(false);
    }
  };
  const playNotificationSound = () => {
    if (typeof window === "undefined") return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    const audioContext = new AudioContextCtor();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
    gain.gain.setValueAtTime(1e-4, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(1e-4, audioContext.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };
  const enableSoundAlerts = () => {
    setSoundAlertsEnabled((enabled) => {
      const next = !enabled;
      window.localStorage.setItem("primewayz-admin-sound-alerts", String(next));
      if (next) playNotificationSound();
      return next;
    });
  };
  const fetchData = async (silent = false, currentUser = user) => {
    var _a2, _b, _c, _d, _e, _f, _g;
    if (!silent) setLoading(true);
    try {
      const endpoints = [];
      if (isOperationsRole(currentUser == null ? void 0 : currentUser.role)) {
        endpoints.push(
          fetch(apiUrl("/api/admin/forms"), { credentials: "include" }),
          fetch(apiUrl("/api/admin/chats"), { credentials: "include" }),
          fetch(apiUrl("/api/admin/sessions"), { credentials: "include" }),
          fetch(apiUrl("/api/admin/blog-comments"), { credentials: "include" }),
          fetch(apiUrl("/api/admin/chat/appointments"), { credentials: "include" })
        );
      }
      if (isBlogAuthor(currentUser == null ? void 0 : currentUser.role)) {
        endpoints.push(fetch(apiUrl("/api/admin/blog-posts"), { credentials: "include" }));
      }
      if (isSuperAdmin(currentUser == null ? void 0 : currentUser.role)) {
        endpoints.push(fetch(apiUrl("/api/admin/users"), { credentials: "include" }));
      }
      const results = await Promise.all(endpoints);
      if (results.some((r) => r.status === 401)) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      let resultIndex = 0;
      if (isOperationsRole(currentUser == null ? void 0 : currentUser.role)) {
        if ((_a2 = results[resultIndex]) == null ? void 0 : _a2.ok) setFormResponses(await results[resultIndex].json());
        resultIndex += 1;
        if ((_b = results[resultIndex]) == null ? void 0 : _b.ok) setChatMessages(await results[resultIndex].json());
        resultIndex += 1;
        if ((_c = results[resultIndex]) == null ? void 0 : _c.ok) setChatSessions(await results[resultIndex].json());
        resultIndex += 1;
        if ((_d = results[resultIndex]) == null ? void 0 : _d.ok) setBlogComments(await results[resultIndex].json());
        resultIndex += 1;
        if ((_e = results[resultIndex]) == null ? void 0 : _e.ok) setChatAppointments(await results[resultIndex].json());
        resultIndex += 1;
      }
      if (isBlogAuthor(currentUser == null ? void 0 : currentUser.role)) {
        if ((_f = results[resultIndex]) == null ? void 0 : _f.ok) setCmsBlogPosts(await results[resultIndex].json());
        resultIndex += 1;
      }
      if (isSuperAdmin(currentUser == null ? void 0 : currentUser.role)) {
        if ((_g = results[resultIndex]) == null ? void 0 : _g.ok) setUsers(await results[resultIndex].json());
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = async (e) => {
    var _a2;
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(apiUrl("/api/admin/login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setUser(data.user);
        setActiveTab(getDefaultAdminTab((_a2 = data.user) == null ? void 0 : _a2.role));
        fetchData(false, data.user);
        fetchChatAvailability();
      } else {
        setLoginError(data.error || "Invalid credentials");
      }
    } catch (error) {
      setLoginError("Login failed. Please try again.");
    }
  };
  const handleLogout = async () => {
    try {
      await fetch(apiUrl("/api/admin/logout"), { method: "POST", credentials: "include" });
      setIsAuthenticated(false);
      setUser(null);
      setFormResponses([]);
      setChatMessages([]);
      setChatAppointments([]);
      setBlogComments([]);
      setCmsBlogPosts([]);
      setChatAvailability(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const deleteFormResponse = async (id) => {
    if (!confirm("Are you sure you want to delete this response?")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/forms/${id}`), { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setFormResponses((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };
  const deleteBlogComment = async (id) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/blog-comments/${id}`), { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setBlogComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Delete comment failed:", error);
    }
  };
  const updateUserRole = async (id, role) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${id}`), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
      }
    } catch (error) {
      console.error("Update role failed:", error);
    }
  };
  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${id}`), { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete user failed:", error);
    }
  };
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("viewer");
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/admin/users"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword, role: newUserRole })
      });
      if (res.ok) {
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("viewer");
        fetchData();
      }
    } catch (error) {
      console.error("Create user failed:", error);
    }
  };
  const resetBlogForm = () => {
    setBlogForm(emptyBlogForm);
    setBlogError("");
  };
  const editBlogPost = (post) => {
    setBlogForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      description: post.description,
      excerpt: post.excerpt,
      category: post.category,
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
      author: post.author,
      readTime: post.readTime,
      image: post.image || "",
      content: post.content,
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
      featured: post.featured,
      status: post.status
    });
    setBlogError("");
  };
  const saveBlogPost = async (statusOverride) => {
    setBlogError("");
    const payload = {
      ...blogForm,
      content: sanitizeBlogHtml(blogForm.content),
      status: statusOverride || blogForm.status,
      tags: blogForm.tags
    };
    try {
      const res = await fetch(apiUrl(blogForm.id ? `/api/admin/blog-posts/${blogForm.id}` : "/api/admin/blog-posts"), {
        method: blogForm.id ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setBlogError(data.error || "Failed to save blog post");
        return;
      }
      resetBlogForm();
      fetchData();
    } catch (error) {
      setBlogError("Failed to save blog post");
    }
  };
  const archiveBlogPost = async (id) => {
    if (!confirm("Archive this blog post?")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/blog-posts/${id}`), { method: "DELETE", credentials: "include" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Archive blog post failed:", error);
    }
  };
  const updateBlogStatus = async (id, status) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/blog-posts/${id}`), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Update blog status failed:", error);
    }
  };
  const handleAdminReply = async (sessionId, replyToId) => {
    if (!replyText.trim() && adminReplyAttachments.length === 0) return;
    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "admin",
          text: replyText,
          sessionId,
          replyToId,
          attachmentIds: adminReplyAttachments.map((attachment) => attachment.id)
        })
      });
      if (res.ok) {
        setReplyText("");
        setAdminReplyAttachments([]);
        setReplyingTo(null);
        setReplyingToMessageId(null);
        fetchData();
      }
    } catch (error) {
      console.error("Admin reply failed:", error);
    }
  };
  const uploadAdminChatFile = async (file) => {
    if (!file || !(selectedConversation == null ? void 0 : selectedConversation.sessionId)) return;
    setAdminUploadError("");
    setIsAdminUploading(true);
    const body = new FormData();
    body.append("sessionId", selectedConversation.sessionId);
    body.append("file", file);
    try {
      const res = await fetch(apiUrl("/api/admin/chat/uploads"), {
        method: "POST",
        credentials: "include",
        body
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminUploadError(data.error || "Upload failed.");
        return;
      }
      setAdminReplyAttachments((prev) => [...prev, data]);
    } catch {
      setAdminUploadError("Upload failed. Please try again.");
    } finally {
      setIsAdminUploading(false);
      if (adminFileInputRef.current) adminFileInputRef.current.value = "";
    }
  };
  const updateAppointment = async (id, status, adminNote) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/chat/appointments/${id}`), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote })
      });
      if (res.ok) {
        const updated = await res.json();
        setChatAppointments((prev) => prev.map((appointment) => appointment.id === id ? updated : appointment));
      }
    } catch (error) {
      console.error("Appointment update failed:", error);
    }
  };
  const filteredForms = formResponses.filter(
    (res) => {
      var _a2;
      return res.name.toLowerCase().includes(searchTerm.toLowerCase()) || res.email.toLowerCase().includes(searchTerm.toLowerCase()) || res.message.toLowerCase().includes(searchTerm.toLowerCase()) || (((_a2 = res.phone) == null ? void 0 : _a2.toLowerCase().includes(searchTerm.toLowerCase())) ?? false);
    }
  );
  const chatConversations = useMemo(() => {
    const bySession = /* @__PURE__ */ new Map();
    chatSessions.forEach((session) => {
      var _a2;
      bySession.set(session.id, {
        sessionId: session.id,
        name: session.name,
        email: session.email,
        createdAt: session.createdAt,
        messages: [],
        lastMessage: null,
        lastMessageAt: ((_a2 = session.messages[0]) == null ? void 0 : _a2.timestamp) || session.createdAt,
        status: "open",
        unreadCount: unreadBySession[session.id] || 0
      });
    });
    chatMessages.forEach((message) => {
      var _a2, _b, _c, _d;
      const existing = bySession.get(message.sessionId);
      if (existing) {
        existing.name = existing.name || ((_a2 = message.session) == null ? void 0 : _a2.name) || null;
        existing.email = existing.email || ((_b = message.session) == null ? void 0 : _b.email) || null;
        existing.messages.push(message);
        return;
      }
      bySession.set(message.sessionId, {
        sessionId: message.sessionId,
        name: ((_c = message.session) == null ? void 0 : _c.name) || null,
        email: ((_d = message.session) == null ? void 0 : _d.email) || null,
        createdAt: message.timestamp,
        messages: [message],
        lastMessage: null,
        lastMessageAt: message.timestamp,
        status: "open",
        unreadCount: unreadBySession[message.sessionId] || 0
      });
    });
    return Array.from(bySession.values()).map((conversation) => {
      var _a2;
      const messages = [...conversation.messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const lastMessage = messages[messages.length - 1] || null;
      const lastSender = (_a2 = lastMessage == null ? void 0 : lastMessage.sender) == null ? void 0 : _a2.toLowerCase();
      const status = lastSender === "admin" ? "replied" : lastSender === "bot" ? "bot-replied" : "open";
      return {
        ...conversation,
        messages,
        lastMessage,
        lastMessageAt: (lastMessage == null ? void 0 : lastMessage.timestamp) || conversation.lastMessageAt,
        status,
        unreadCount: unreadBySession[conversation.sessionId] || 0
      };
    }).sort((a, b) => new Date(b.lastMessageAt || b.createdAt || 0).getTime() - new Date(a.lastMessageAt || a.createdAt || 0).getTime());
  }, [chatMessages, chatSessions, unreadBySession]);
  const filteredChatConversations = chatConversations.filter((conversation) => {
    var _a2, _b, _c;
    const term = searchTerm.toLowerCase();
    const lastText = ((_a2 = conversation.lastMessage) == null ? void 0 : _a2.text) || "";
    return conversation.sessionId.toLowerCase().includes(term) || (((_b = conversation.name) == null ? void 0 : _b.toLowerCase().includes(term)) || false) || (((_c = conversation.email) == null ? void 0 : _c.toLowerCase().includes(term)) || false) || lastText.toLowerCase().includes(term);
  });
  const selectedConversation = chatConversations.find(
    (conversation) => conversation.sessionId === selectedConversationId
  ) || filteredChatConversations[0] || null;
  const selectedAppointments = chatAppointments.filter(
    (appointment) => appointment.sessionId === (selectedConversation == null ? void 0 : selectedConversation.sessionId)
  );
  useEffect(() => {
    var _a2;
    if (!selectedConversationId && ((_a2 = filteredChatConversations[0]) == null ? void 0 : _a2.sessionId) && !replyText.trim()) {
      setSelectedConversationId(filteredChatConversations[0].sessionId);
    }
  }, [filteredChatConversations, replyText, selectedConversationId]);
  useEffect(() => {
    if (!selectedConversationId) return;
    setUnreadBySession((prev) => {
      if (!prev[selectedConversationId]) return prev;
      return { ...prev, [selectedConversationId]: 0 };
    });
  }, [selectedConversationId]);
  useEffect(() => {
    const currentUserMessageIds = new Set(
      chatMessages.filter((message) => {
        var _a2;
        return ((_a2 = message.sender) == null ? void 0 : _a2.toLowerCase()) === "user";
      }).map((message) => message.id)
    );
    if (!hasInitializedMessageWatchRef.current) {
      seenUserMessageIdsRef.current = currentUserMessageIds;
      hasInitializedMessageWatchRef.current = true;
      return;
    }
    const newUserMessages = chatMessages.filter(
      (message) => {
        var _a2;
        return ((_a2 = message.sender) == null ? void 0 : _a2.toLowerCase()) === "user" && !seenUserMessageIdsRef.current.has(message.id);
      }
    );
    if (newUserMessages.length > 0) {
      setUnreadBySession((prev) => {
        const next = { ...prev };
        newUserMessages.forEach((message) => {
          if (message.sessionId !== selectedConversationId) {
            next[message.sessionId] = (next[message.sessionId] || 0) + 1;
          }
        });
        return next;
      });
      if (soundAlertsEnabled) {
        playNotificationSound();
      }
    }
    seenUserMessageIdsRef.current = currentUserMessageIds;
  }, [chatMessages, selectedConversationId, soundAlertsEnabled]);
  useEffect(() => {
    if (!isAuthenticated || activeTab !== "chats" || !selectedConversationId) return;
    const refreshSelectedConversation = async () => {
      try {
        const response = await fetch(apiUrl(`/api/chat/${selectedConversationId}`));
        if (!response.ok) return;
        const sessionMessages = await response.json();
        setChatMessages((prev) => [
          ...prev.filter((message) => message.sessionId !== selectedConversationId),
          ...sessionMessages.map((message) => ({
            ...message,
            session: {
              name: (selectedConversation == null ? void 0 : selectedConversation.name) || null,
              email: (selectedConversation == null ? void 0 : selectedConversation.email) || null
            }
          }))
        ]);
      } catch (error) {
        console.error("Failed to refresh selected chat:", error);
      }
    };
    const interval = setInterval(refreshSelectedConversation, 3e3);
    return () => clearInterval(interval);
  }, [activeTab, isAuthenticated, selectedConversation == null ? void 0 : selectedConversation.email, selectedConversation == null ? void 0 : selectedConversation.name, selectedConversationId]);
  const filteredLeads = chatSessions.filter(
    (session) => {
      var _a2, _b;
      return ((_a2 = session.name) == null ? void 0 : _a2.toLowerCase().includes(searchTerm.toLowerCase())) || false || (((_b = session.email) == null ? void 0 : _b.toLowerCase().includes(searchTerm.toLowerCase())) || false) || session.id.toLowerCase().includes(searchTerm.toLowerCase());
    }
  );
  if (isAuthenticated === null) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-zinc-50 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" }) });
  }
  if (!isAuthenticated) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-zinc-50 flex items-center justify-center px-4", children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        className: "max-w-md w-full bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
            /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-4", children: /* @__PURE__ */ jsx(Lock, { className: "w-8 h-8 text-emerald-600" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-zinc-900", children: "Admin Login" }),
            /* @__PURE__ */ jsx("p", { className: "text-zinc-500 text-sm", children: "Enter your credentials to access the dashboard" })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-zinc-700 mb-1", children: "Email Address" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "email",
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    className: "w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all",
                    placeholder: "admin@example.com",
                    required: true
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-zinc-700 mb-1", children: "Password" }),
              /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(
                PasswordInput,
                {
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  className: "w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all",
                  leftIcon: /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" }),
                  toggleLabel: "admin password",
                  autoComplete: "current-password",
                  placeholder: "••••••••",
                  required: true
                }
              ) }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 text-right", children: /* @__PURE__ */ jsx(Link, { to: "/admin/forgot-password", className: "text-sm font-semibold text-emerald-700 hover:text-emerald-800", children: "Forgot password?" }) })
            ] }),
            loginError && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm text-center font-medium", children: loginError }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                className: "w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10",
                children: "Sign In"
              }
            )
          ] })
        ]
      }
    ) });
  }
  const canViewOperations = isOperationsRole(user == null ? void 0 : user.role);
  const availabilityDotClass = (chatAvailability == null ? void 0 : chatAvailability.status) === "online" ? "bg-emerald-500" : (chatAvailability == null ? void 0 : chatAvailability.status) === "away" ? "bg-amber-400" : (chatAvailability == null ? void 0 : chatAvailability.status) === "assistant" ? "bg-indigo-400" : "bg-zinc-400";
  const availabilityLabel = (chatAvailability == null ? void 0 : chatAvailability.status) || "loading";
  const updateChatAlertStatus = async (alertId, status) => {
    try {
      const res = await adminRequest(`/api/admin/chat-alerts/${alertId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update alert status");
        return;
      }
      await fetchNotificationSummary();
    } catch (error) {
      console.error("Failed to update alert status:", error);
      alert("Failed to update alert status");
    }
  };
  const notificationCounts = notificationSummary == null ? void 0 : notificationSummary.counts;
  const notificationToneClass = (notificationSummary == null ? void 0 : notificationSummary.priority) === "high" ? "border-red-200 bg-red-50 shadow-red-900/5" : (notificationSummary == null ? void 0 : notificationSummary.priority) === "medium" ? "border-amber-200 bg-amber-50 shadow-amber-900/5" : "border-emerald-100 bg-white shadow-emerald-900/5";
  const notificationBadgeClass = (notificationSummary == null ? void 0 : notificationSummary.priority) === "high" ? "bg-red-100 text-red-700" : (notificationSummary == null ? void 0 : notificationSummary.priority) === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
  const latestDailySummaryStatus = ((_a = notificationSummary == null ? void 0 : notificationSummary.latestDailySummary) == null ? void 0 : _a.status) || "not_sent";
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-zinc-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-zinc-900", children: "Admin Dashboard" }),
          user && /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isSuperAdmin(user.role) ? "bg-red-100 text-red-600" : isBlogEditor(user.role) ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-600"}`, children: user.role })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-zinc-500", children: "Manage your site responses and chat history" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              fetchData();
              fetchNotificationSummary();
            },
            className: "flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors",
            children: [
              /* @__PURE__ */ jsx(RefreshCcw, { className: `w-4 h-4 ${loading ? "animate-spin" : ""}` }),
              "Refresh"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: enableSoundAlerts,
            className: `flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${soundAlertsEnabled ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`,
            children: [
              soundAlertsEnabled ? /* @__PURE__ */ jsx(Bell, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(BellOff, { className: "w-4 h-4" }),
              soundAlertsEnabled ? "Sound alerts on" : "Enable sound alerts"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleLogout,
            className: "flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors",
            children: [
              /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
              "Sign Out"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: `h-2.5 w-2.5 rounded-full ${availabilityDotClass}` }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-zinc-900", children: [
              "Chat availability: ",
              /* @__PURE__ */ jsx("span", { className: "capitalize", children: availabilityLabel })
            ] }),
            (chatAvailability == null ? void 0 : chatAvailability.mode) === "auto" && /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500", children: [
              "Auto computed ",
              chatAvailability.computedStatus
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-zinc-500", children: [
            (chatAvailability == null ? void 0 : chatAvailability.subtitle) || "Loading chat availability...",
            (chatAvailability == null ? void 0 : chatAvailability.latestAdminSeenAt) && /* @__PURE__ */ jsxs("span", { children: [
              " Last admin heartbeat ",
              format(new Date(chatAvailability.latestAdminSeenAt), "MMM d, h:mm a"),
              "."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: [
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: availabilityMode,
              onChange: (event) => setAvailabilityMode(event.target.value),
              className: "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-emerald-500/20",
              children: [
                /* @__PURE__ */ jsx("option", { value: "auto", children: "Auto" }),
                /* @__PURE__ */ jsx("option", { value: "online", children: "Online" }),
                /* @__PURE__ */ jsx("option", { value: "away", children: "Away" }),
                /* @__PURE__ */ jsx("option", { value: "offline", children: "Offline" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: availabilityMessage,
              onChange: (event) => setAvailabilityMessage(event.target.value),
              placeholder: "Optional public status message",
              maxLength: 180,
              className: "min-w-0 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 sm:w-72"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: saveChatAvailability,
              disabled: isSavingAvailability,
              className: "rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50",
              children: isSavingAvailability ? "Saving..." : "Save status"
            }
          )
        ] })
      ] }),
      availabilityError && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs font-bold text-red-600", children: availabilityError })
    ] }),
    canViewOperations && /* @__PURE__ */ jsxs("div", { className: `mb-8 rounded-2xl border p-4 shadow-sm ${notificationToneClass}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-zinc-900", children: "Operational notifications" }),
            /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${notificationBadgeClass}`, children: (notificationSummary == null ? void 0 : notificationSummary.priority) || "loading" }),
            isLoadingNotificationSummary && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500", children: "Refreshing" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-zinc-500", children: notificationSummary ? `Today ${notificationSummary.dateKey}. ${(notificationCounts == null ? void 0 : notificationCounts.todayVisitorMessages) || 0} visitor message(s), ${(notificationCounts == null ? void 0 : notificationCounts.pendingAppointments) || 0} pending appointment(s), ${(notificationCounts == null ? void 0 : notificationCounts.todayUnansweredAlerts) || 0} unanswered alert(s).` : notificationSummaryError || "Loading notification summary..." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[620px]", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setActiveTab("forms"),
              className: "rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-left shadow-sm transition hover:bg-white",
              children: [
                /* @__PURE__ */ jsx("span", { className: "block text-[10px] font-bold uppercase tracking-wider text-zinc-400", children: "Forms today" }),
                /* @__PURE__ */ jsx("span", { className: "mt-1 block text-lg font-black text-zinc-900", children: (notificationCounts == null ? void 0 : notificationCounts.todayContactForms) ?? "-" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setActiveTab("leads"),
              className: "rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-left shadow-sm transition hover:bg-white",
              children: [
                /* @__PURE__ */ jsx("span", { className: "block text-[10px] font-bold uppercase tracking-wider text-zinc-400", children: "New chats" }),
                /* @__PURE__ */ jsx("span", { className: "mt-1 block text-lg font-black text-zinc-900", children: (notificationCounts == null ? void 0 : notificationCounts.todayChatSessions) ?? "-" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setActiveTab("chats"),
              className: "rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-left shadow-sm transition hover:bg-white",
              children: [
                /* @__PURE__ */ jsx("span", { className: "block text-[10px] font-bold uppercase tracking-wider text-zinc-400", children: "Unanswered" }),
                /* @__PURE__ */ jsx("span", { className: `mt-1 block text-lg font-black ${((notificationCounts == null ? void 0 : notificationCounts.todayUnansweredAlerts) || 0) > 0 ? "text-amber-700" : "text-zinc-900"}`, children: (notificationCounts == null ? void 0 : notificationCounts.todayUnansweredAlerts) ?? "-" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setActiveTab("chats"),
              className: "rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-left shadow-sm transition hover:bg-white",
              children: [
                /* @__PURE__ */ jsx("span", { className: "block text-[10px] font-bold uppercase tracking-wider text-zinc-400", children: "Email failures" }),
                /* @__PURE__ */ jsx("span", { className: `mt-1 block text-lg font-black ${((notificationCounts == null ? void 0 : notificationCounts.todayEmailFailedAlerts) || 0) > 0 ? "text-red-700" : "text-zinc-900"}`, children: (notificationCounts == null ? void 0 : notificationCounts.todayEmailFailedAlerts) ?? "-" })
              ]
            }
          )
        ] })
      ] }),
      (notificationSummary == null ? void 0 : notificationSummary.latestAlerts) && notificationSummary.latestAlerts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-xl border border-white/70 bg-white/70 p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-black uppercase tracking-wider text-zinc-500", children: "Active alert queue" }),
          /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500", children: [
            notificationSummary.latestAlerts.length,
            " latest"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: notificationSummary.latestAlerts.slice(0, 3).map((alert2) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-zinc-900", children: [
                "Session ",
                alert2.sessionId
              ] }),
              /* @__PURE__ */ jsx("span", { className: "rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700", children: alert2.status })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-[11px] text-zinc-400", children: [
              "Message #",
              alert2.messageId,
              " · ",
              format(new Date(alert2.createdAt), "MMM d, h:mm a")
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => updateChatAlertStatus(alert2.id, "reviewed"),
                className: "rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-600 transition hover:bg-zinc-50",
                children: "Review"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => updateChatAlertStatus(alert2.id, "resolved"),
                className: "rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-700",
                children: "Resolve"
              }
            )
          ] })
        ] }, alert2.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-col gap-2 border-t border-white/70 pt-3 text-xs text-zinc-600 md:flex-row md:items-center md:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-white/80 px-2.5 py-1 font-semibold", children: [
            "Pending appointments: ",
            (notificationCounts == null ? void 0 : notificationCounts.pendingAppointments) ?? "-"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-white/80 px-2.5 py-1 font-semibold", children: [
            "Alert emails sent: ",
            (notificationCounts == null ? void 0 : notificationCounts.todayEmailSentAlerts) ?? "-"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-white/80 px-2.5 py-1 font-semibold", children: [
            "Daily summary: ",
            latestDailySummaryStatus
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-[11px] text-zinc-400", children: (notificationSummary == null ? void 0 : notificationSummary.generatedAt) ? `Updated ${format(new Date(notificationSummary.generatedAt), "MMM d, h:mm a")}` : "Waiting for summary" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsxs("div", { className: "relative max-w-md", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Search by name, email, or content...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: "w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs(Tabs.Root, { value: activeTab, onValueChange: setActiveTab, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Tabs.List, { className: "flex flex-wrap gap-2 p-1 bg-zinc-200/50 rounded-2xl w-fit", children: [
        canViewOperations && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            Tabs.Trigger,
            {
              value: "forms",
              className: "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500",
              children: [
                /* @__PURE__ */ jsx(ClipboardList, { className: "w-4 h-4" }),
                "Form Responses",
                /* @__PURE__ */ jsx("span", { className: "ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400", children: formResponses.length })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Tabs.Trigger,
            {
              value: "leads",
              className: "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500",
              children: [
                /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
                "Chat Leads",
                /* @__PURE__ */ jsx("span", { className: "ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400", children: chatSessions.length })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Tabs.Trigger,
            {
              value: "chats",
              className: "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500",
              children: [
                /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4" }),
                "Chat History",
                /* @__PURE__ */ jsx("span", { className: "ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400", children: chatConversations.length })
              ]
            }
          )
        ] }),
        isBlogAuthor(user == null ? void 0 : user.role) && /* @__PURE__ */ jsxs(
          Tabs.Trigger,
          {
            value: "blog",
            className: "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500",
            children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
              "Blog CMS",
              /* @__PURE__ */ jsx("span", { className: "ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400", children: cmsBlogPosts.length })
            ]
          }
        ),
        canViewOperations && /* @__PURE__ */ jsxs(
          Tabs.Trigger,
          {
            value: "comments",
            className: "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500",
            children: [
              /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4" }),
              "Blog Comments",
              /* @__PURE__ */ jsx("span", { className: "ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400", children: blogComments.length })
            ]
          }
        ),
        isSuperAdmin(user == null ? void 0 : user.role) && /* @__PURE__ */ jsxs(
          Tabs.Trigger,
          {
            value: "users",
            className: "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500",
            children: [
              /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
              "User Management",
              /* @__PURE__ */ jsx("span", { className: "ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400", children: users.length })
            ]
          }
        )
      ] }),
      canViewOperations && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Tabs.Content, { value: "forms", className: "outline-none", children: /* @__PURE__ */ jsx("div", { className: "bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-zinc-50 border-bottom border-zinc-100", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Name" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Email" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Phone" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Message" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-zinc-50", children: filteredForms.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-12 text-center text-zinc-400 italic", children: searchTerm ? `No results matching "${searchTerm}"` : "No form responses found." }) }) : filteredForms.map((res) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-zinc-50/50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-zinc-500", children: format(new Date(res.createdAt), "MMM d, h:mm a") }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm font-bold text-zinc-900", children: res.name }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-zinc-600", children: res.email }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-zinc-600 font-mono whitespace-nowrap", children: res.phone || "-" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-zinc-500 max-w-xs truncate", children: res.message }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: (isSuperAdmin(user == null ? void 0 : user.role) || (user == null ? void 0 : user.role) === "editor") && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => deleteFormResponse(res.id),
                className: "p-2 text-zinc-400 hover:text-red-600 transition-colors",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            ) })
          ] }, res.id)) })
        ] }) }) }) }),
        /* @__PURE__ */ jsx(Tabs.Content, { value: "leads", className: "outline-none", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredLeads.length === 0 ? /* @__PURE__ */ jsx("div", { className: "col-span-full py-12 text-center text-zinc-400 italic bg-white rounded-3xl border border-zinc-200", children: searchTerm ? `No results matching "${searchTerm}"` : "No chat leads found." }) : filteredLeads.map((session) => /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-zinc-900", children: session.name || "Anonymous" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-zinc-500", children: session.email || "No email provided" }),
              /* @__PURE__ */ jsx("div", { className: "mt-2", children: renderVisitorActivityBadge(session.visitorLastSeenAt) })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded", children: [
              session.id.slice(0, 8),
              "..."
            ] })
          ] }),
          session.messages[0] && /* @__PURE__ */ jsxs("div", { className: "bg-zinc-50 p-3 rounded-xl", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1 text-[10px]", children: "Last Message" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-zinc-700 line-clamp-2 italic", children: [
              '"',
              session.messages[0].text,
              '"'
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-auto pt-4 border-t border-zinc-100", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-zinc-400", children: [
              "Started ",
              format(new Date(session.createdAt), "MMM d, h:mm a")
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    setReplyingTo(session.id);
                    setSelectedConversationId(session.id);
                    setReplyText("");
                  },
                  className: "text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Send, { className: "w-3 h-3" }),
                    "Reply"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setSearchTerm("");
                    setSelectedConversationId(session.id);
                    setReplyingTo(session.id);
                    setActiveTab("chats");
                  },
                  className: "text-xs font-bold text-zinc-500 hover:text-zinc-900",
                  children: "View Full Chat"
                }
              )
            ] })
          ] }),
          replyingTo === session.id && /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { opacity: 0, height: 0 },
              animate: { opacity: 1, height: "auto" },
              className: "mt-2 space-y-2",
              children: [
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: replyText,
                    onChange: (e) => setReplyText(e.target.value),
                    placeholder: "Type your reply...",
                    className: "w-full p-3 text-sm rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none",
                    rows: 2
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setReplyingTo(null),
                      className: "px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors",
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleAdminReply(session.id),
                      className: "px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm",
                      children: "Send Reply"
                    }
                  )
                ] })
              ]
            }
          )
        ] }, session.id)) }) }),
        /* @__PURE__ */ jsx(Tabs.Content, { value: "chats", className: "outline-none", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)] gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-5 py-4 border-b border-zinc-100 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-zinc-900", children: "Conversations" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-zinc-500", children: "Updates every 5 seconds" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded-lg bg-zinc-100 text-[10px] font-bold text-zinc-500", children: chatConversations.length })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "max-h-[680px] overflow-y-auto divide-y divide-zinc-100", children: filteredChatConversations.length === 0 ? /* @__PURE__ */ jsx("div", { className: "px-5 py-12 text-center text-sm text-zinc-400 italic", children: searchTerm ? `No conversations matching "${searchTerm}"` : "No chat conversations found." }) : filteredChatConversations.map((conversation) => {
              var _a2, _b, _c;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    if (conversation.sessionId !== selectedConversationId) {
                      setReplyText("");
                      setAdminReplyAttachments([]);
                    }
                    setSelectedConversationId(conversation.sessionId);
                    setReplyingTo(conversation.sessionId);
                    setReplyingToMessageId(null);
                    setActiveTab("chats");
                  },
                  className: `w-full text-left px-5 py-4 transition-colors ${(selectedConversation == null ? void 0 : selectedConversation.sessionId) === conversation.sessionId ? "bg-emerald-50" : "bg-white hover:bg-zinc-50"}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-bold text-zinc-900", children: conversation.name || conversation.email || "Anonymous visitor" }),
                          conversation.unreadCount > 0 && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white", children: conversation.unreadCount })
                        ] }),
                        /* @__PURE__ */ jsx("p", { className: "truncate text-xs text-zinc-500", children: conversation.email || `Session ${conversation.sessionId.slice(0, 8)}` })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] text-zinc-400", children: conversation.lastMessageAt ? format(new Date(conversation.lastMessageAt), "MMM d, h:mm a") : "-" })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "mt-3 line-clamp-2 text-sm text-zinc-600", children: ((_a2 = conversation.lastMessage) == null ? void 0 : _a2.text) || "No messages yet." }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between gap-3", children: [
                      /* @__PURE__ */ jsx("span", { className: `rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${conversation.status === "replied" ? "bg-emerald-100 text-emerald-700" : conversation.status === "bot-replied" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`, children: conversation.status }),
                      /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-mono text-zinc-400", children: [
                        conversation.messages.length,
                        " messages",
                        ((_c = (_b = conversation.lastMessage) == null ? void 0 : _b.attachments) == null ? void 0 : _c.length) ? " · attachment" : ""
                      ] })
                    ] })
                  ]
                },
                conversation.sessionId
              );
            }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden min-h-[520px]", children: selectedConversation ? /* @__PURE__ */ jsxs("div", { className: "flex h-full min-h-[520px] flex-col", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-6 py-5 border-b border-zinc-100 flex flex-col gap-3 md:flex-row md:items-start md:justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-zinc-900", children: selectedConversation.name || selectedConversation.email || "Anonymous visitor" }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-zinc-500", children: [
                  selectedConversation.email || "No email provided",
                  " · ",
                  selectedConversation.sessionId
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxs("span", { className: "rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500", children: [
                  selectedConversation.messages.length,
                  " messages"
                ] }),
                /* @__PURE__ */ jsx("span", { className: `rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${selectedConversation.status === "replied" ? "bg-emerald-100 text-emerald-700" : selectedConversation.status === "bot-replied" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`, children: selectedConversation.status })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-4 overflow-y-auto bg-zinc-50 px-6 py-6", children: [
              selectedConversation.messages.map((message) => {
                const sender = message.sender.toLowerCase();
                const isAdminMessage = sender === "admin";
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `flex ${isAdminMessage ? "justify-end" : "justify-start"}`,
                    children: /* @__PURE__ */ jsxs("div", { className: `max-w-[86%] rounded-2xl border px-4 py-3 shadow-sm ${isAdminMessage ? "border-emerald-100 bg-emerald-600 text-white" : sender === "bot" ? "border-blue-100 bg-blue-50 text-zinc-800" : "border-zinc-200 bg-white text-zinc-800"}`, children: [
                      /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx("span", { className: `text-[10px] font-bold uppercase tracking-wider ${isAdminMessage ? "text-emerald-50" : sender === "bot" ? "text-blue-700" : "text-zinc-500"}`, children: sender === "admin" ? "Admin" : sender === "bot" ? "Bot" : "Visitor" }),
                        /* @__PURE__ */ jsx("span", { className: `text-[10px] ${isAdminMessage ? "text-emerald-50/80" : "text-zinc-400"}`, children: format(new Date(message.timestamp), "MMM d, h:mm a") })
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap text-sm leading-relaxed", children: message.text }),
                      message.attachments && message.attachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-2", children: message.attachments.map((attachment) => attachment.kind === "image" ? /* @__PURE__ */ jsx("a", { href: attachment.url, target: "_blank", rel: "noopener noreferrer", className: "block", children: /* @__PURE__ */ jsx("img", { src: attachment.url, alt: attachment.originalName, className: "max-h-48 rounded-xl border border-white/30 object-cover" }) }, attachment.id) : /* @__PURE__ */ jsxs(
                        "a",
                        {
                          href: attachment.url,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          className: `flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${isAdminMessage ? "border-emerald-200 bg-emerald-500 text-white" : "border-zinc-200 bg-white text-zinc-700"}`,
                          children: [
                            /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
                            attachment.originalName
                          ]
                        },
                        attachment.id
                      )) }),
                      message.replyToId && /* @__PURE__ */ jsxs("p", { className: `mt-2 border-l-2 pl-2 text-[10px] ${isAdminMessage ? "border-emerald-200 text-emerald-50/80" : "border-zinc-200 text-zinc-400"}`, children: [
                        "Replying to message ID ",
                        message.replyToId
                      ] })
                    ] })
                  },
                  message.id
                );
              }),
              selectedAppointments.map((appointment) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-start justify-between gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-amber-800", children: [
                      /* @__PURE__ */ jsx(CalendarClock, { className: "h-4 w-4" }),
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold", children: "Appointment request" })
                    ] }),
                    /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-amber-700", children: [
                      appointment.preferredDate || "Date flexible",
                      " ",
                      appointment.preferredTime || "",
                      " · ",
                      appointment.timezone || "Europe/London"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "rounded-lg bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700", children: appointment.status })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid gap-1 text-xs text-zinc-700 sm:grid-cols-2", children: [
                  /* @__PURE__ */ jsxs("p", { children: [
                    /* @__PURE__ */ jsx("strong", { children: "Name:" }),
                    " ",
                    appointment.name || "-"
                  ] }),
                  /* @__PURE__ */ jsxs("p", { children: [
                    /* @__PURE__ */ jsx("strong", { children: "Email:" }),
                    " ",
                    appointment.email || "-"
                  ] }),
                  /* @__PURE__ */ jsxs("p", { children: [
                    /* @__PURE__ */ jsx("strong", { children: "Phone:" }),
                    " ",
                    appointment.phone || "-"
                  ] }),
                  /* @__PURE__ */ jsxs("p", { children: [
                    /* @__PURE__ */ jsx("strong", { children: "Requested:" }),
                    " ",
                    format(new Date(appointment.createdAt), "MMM d, h:mm a")
                  ] })
                ] }),
                appointment.message && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-zinc-700", children: appointment.message }),
                /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: ["confirmed", "completed", "cancelled"].map((status) => /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => updateAppointment(appointment.id, status),
                    className: "rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-amber-100",
                    children: [
                      "Mark ",
                      status
                    ]
                  },
                  status
                )) })
              ] }, `appointment-${appointment.id}`))
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-zinc-100 bg-white p-5", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: adminFileInputRef,
                  type: "file",
                  className: "hidden",
                  accept: "image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
                  onChange: (event) => {
                    var _a2;
                    return uploadAdminChatFile((_a2 = event.target.files) == null ? void 0 : _a2[0]);
                  }
                }
              ),
              adminUploadError && /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-bold text-red-600", children: adminUploadError }),
              isAdminUploading && /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-bold text-zinc-500", children: "Uploading file..." }),
              adminReplyAttachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "mb-3 flex flex-wrap gap-2", children: adminReplyAttachments.map((attachment) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600", children: [
                attachment.kind === "image" ? /* @__PURE__ */ jsx(Image, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(FileText, { className: "h-3 w-3" }),
                attachment.originalName
              ] }, attachment.id)) }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  value: replyingTo === selectedConversation.sessionId ? replyText : "",
                  onChange: (e) => {
                    setReplyingTo(selectedConversation.sessionId);
                    setReplyingToMessageId(null);
                    setReplyText(e.target.value);
                  },
                  placeholder: "Type your reply to this conversation...",
                  className: "w-full rounded-xl border border-zinc-200 p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-emerald-500/20",
                  rows: 3
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs text-zinc-400", children: "Selected thread refreshes every 3 seconds." }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        var _a2;
                        return (_a2 = adminFileInputRef.current) == null ? void 0 : _a2.click();
                      },
                      className: "inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50",
                      children: [
                        /* @__PURE__ */ jsx(Paperclip, { className: "w-4 h-4" }),
                        "Attach"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleAdminReply(selectedConversation.sessionId),
                      disabled: !replyText.trim() && adminReplyAttachments.length === 0 || replyingTo !== selectedConversation.sessionId,
                      className: "inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50",
                      children: [
                        /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }),
                        "Send Reply"
                      ]
                    }
                  )
                ] })
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsx("div", { className: "flex min-h-[520px] items-center justify-center px-6 text-center text-sm text-zinc-400", children: "Select a conversation to view the full thread." }) })
        ] }) })
      ] }),
      isBlogAuthor(user == null ? void 0 : user.role) && /* @__PURE__ */ jsx(Tabs.Content, { value: "blog", className: "outline-none space-y-8", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl border border-zinc-200 shadow-sm p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6 text-emerald-600" }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-zinc-900", children: blogForm.id ? "Edit Blog Post" : "Create Blog Draft" })
            ] }),
            blogForm.id && /* @__PURE__ */ jsx("button", { onClick: resetBlogForm, className: "text-xs font-bold text-zinc-500 hover:text-zinc-900", children: "New Draft" })
          ] }),
          blogError && /* @__PURE__ */ jsx("p", { className: "mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600", children: blogError }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "Title" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  value: blogForm.title,
                  onChange: (e) => setBlogForm((prev) => ({ ...prev, title: e.target.value })),
                  className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none",
                  placeholder: "Article title"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "Slug" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: blogForm.slug,
                    onChange: (e) => setBlogForm((prev) => ({ ...prev, slug: e.target.value })),
                    className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none",
                    placeholder: "auto-created from title"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "Category" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: blogForm.category,
                    onChange: (e) => setBlogForm((prev) => ({ ...prev, category: e.target.value })),
                    className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "Description" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  value: blogForm.description,
                  onChange: (e) => setBlogForm((prev) => ({ ...prev, description: e.target.value })),
                  className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none",
                  rows: 2
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "Excerpt" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  value: blogForm.excerpt,
                  onChange: (e) => setBlogForm((prev) => ({ ...prev, excerpt: e.target.value })),
                  className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none",
                  rows: 2
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "Tags" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: blogForm.tags,
                    onChange: (e) => setBlogForm((prev) => ({ ...prev, tags: e.target.value })),
                    className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none",
                    placeholder: "SEO, CRM, Automation"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "Read Time" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: blogForm.readTime,
                    onChange: (e) => setBlogForm((prev) => ({ ...prev, readTime: e.target.value })),
                    className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "Author" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: blogForm.author,
                    onChange: (e) => setBlogForm((prev) => ({ ...prev, author: e.target.value })),
                    className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "Image URL" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: blogForm.image,
                    onChange: (e) => setBlogForm((prev) => ({ ...prev, image: e.target.value })),
                    className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "Article Content" }),
              /* @__PURE__ */ jsx(
                RichBlogEditor,
                {
                  value: blogForm.content,
                  onChange: (content) => setBlogForm((prev) => ({ ...prev, content }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "SEO Title" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: blogForm.seoTitle,
                    onChange: (e) => setBlogForm((prev) => ({ ...prev, seoTitle: e.target.value })),
                    className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1", children: "SEO Description" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    value: blogForm.seoDescription,
                    onChange: (e) => setBlogForm((prev) => ({ ...prev, seoDescription: e.target.value })),
                    className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  }
                )
              ] })
            ] }),
            isSuperAdmin(user == null ? void 0 : user.role) && /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm font-bold text-zinc-700", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: blogForm.featured,
                  onChange: (e) => setBlogForm((prev) => ({ ...prev, featured: e.target.checked })),
                  className: "h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                }
              ),
              "Featured article"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 pt-2", children: [
              /* @__PURE__ */ jsxs("button", { onClick: () => saveBlogPost("draft"), className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800", children: [
                /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
                "Save Draft"
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: () => saveBlogPost("submitted"), className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700", children: [
                /* @__PURE__ */ jsx(UploadCloud, { className: "w-4 h-4" }),
                "Submit for Review"
              ] }),
              isBlogEditor(user == null ? void 0 : user.role) && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("button", { onClick: () => saveBlogPost("published"), className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700", children: [
                  /* @__PURE__ */ jsx(Star, { className: "w-4 h-4" }),
                  "Publish"
                ] }),
                /* @__PURE__ */ jsx("button", { onClick: () => saveBlogPost("unpublished"), className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 text-sm font-bold hover:bg-zinc-200", children: "Unpublish" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-5 border-b border-zinc-100", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-zinc-900", children: "Blog Workflow" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-zinc-500", children: "Authors see their own posts. Editors and Super Admins can review the queue." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-zinc-50 border-bottom border-zinc-100", children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Post" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Featured" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Updated" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-zinc-50", children: cmsBlogPosts.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "px-6 py-12 text-center text-zinc-400 italic", children: "No CMS blog posts yet." }) }) : cmsBlogPosts.map((post) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-zinc-50/50 transition-colors", children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-sm", children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-zinc-900 line-clamp-1", children: post.title }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-zinc-400 font-mono", children: [
                  "/blog/",
                  post.slug
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${post.status === "published" ? "bg-emerald-100 text-emerald-700" : post.status === "submitted" ? "bg-blue-100 text-blue-700" : post.status === "archived" ? "bg-zinc-200 text-zinc-600" : "bg-amber-100 text-amber-700"}`, children: post.status }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-zinc-500", children: post.featured ? "Yes" : "No" }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-zinc-500", children: format(new Date(post.updatedAt), "MMM d, yyyy") }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
                /* @__PURE__ */ jsx("button", { onClick: () => editBlogPost(post), className: "px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100", children: "Edit" }),
                isBlogEditor(user == null ? void 0 : user.role) && post.status !== "published" && /* @__PURE__ */ jsx("button", { onClick: () => updateBlogStatus(post.id, "published"), className: "px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100", children: "Publish" }),
                isSuperAdmin(user == null ? void 0 : user.role) && /* @__PURE__ */ jsx("button", { onClick: () => archiveBlogPost(post.id), className: "p-2 text-zinc-400 hover:text-red-600 transition-colors", title: "Archive", children: /* @__PURE__ */ jsx(Archive, { className: "w-4 h-4" }) })
              ] }) })
            ] }, post.id)) })
          ] }) })
        ] })
      ] }) }),
      canViewOperations && /* @__PURE__ */ jsx(Tabs.Content, { value: "comments", className: "outline-none", children: /* @__PURE__ */ jsx("div", { className: "bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-zinc-50 border-bottom border-zinc-100", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Post ID" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Name" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Comment" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-zinc-50", children: blogComments.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "px-6 py-12 text-center text-zinc-400 italic", children: "No blog comments found." }) }) : blogComments.map((comment) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-zinc-50/50 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-zinc-500", children: format(new Date(comment.createdAt), "MMM d, h:mm a") }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm font-mono text-zinc-600", children: comment.postId }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm font-bold text-zinc-900", children: comment.name }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-zinc-500 max-w-xs truncate", children: comment.text }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: isBlogEditor(user == null ? void 0 : user.role) && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => deleteBlogComment(comment.id),
              className: "p-2 text-zinc-400 hover:text-red-600 transition-colors",
              children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
            }
          ) })
        ] }, comment.id)) })
      ] }) }) }) }),
      isSuperAdmin(user == null ? void 0 : user.role) && /* @__PURE__ */ jsxs(Tabs.Content, { value: "users", className: "outline-none space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm max-w-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
            /* @__PURE__ */ jsx(UserPlus, { className: "w-6 h-6 text-emerald-600" }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-zinc-900", children: "Create New User" })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleCreateUser, className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "col-span-full md:col-span-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-zinc-700 mb-1", children: "Email" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  value: newUserEmail,
                  onChange: (e) => setNewUserEmail(e.target.value),
                  className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none",
                  placeholder: "user@example.com",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-full md:col-span-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-zinc-700 mb-1", children: "Password" }),
              /* @__PURE__ */ jsx(
                PasswordInput,
                {
                  value: newUserPassword,
                  onChange: (e) => setNewUserPassword(e.target.value),
                  className: "w-full px-4 pr-12 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none",
                  toggleLabel: "new user password",
                  autoComplete: "new-password",
                  placeholder: "••••••••",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-full md:col-span-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-zinc-700 mb-1", children: "Role" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: newUserRole,
                  onChange: (e) => setNewUserRole(e.target.value),
                  className: "w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "super_admin", children: "Super Admin" }),
                    /* @__PURE__ */ jsx("option", { value: "blog_editor", children: "Blog Editor" }),
                    /* @__PURE__ */ jsx("option", { value: "blog_author", children: "Blog Author" }),
                    /* @__PURE__ */ jsx("option", { value: "admin", children: "Legacy Admin" }),
                    /* @__PURE__ */ jsx("option", { value: "editor", children: "Legacy Editor" }),
                    /* @__PURE__ */ jsx("option", { value: "viewer", children: "Viewer" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "col-span-full flex items-end", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                className: "bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10",
                children: "Create User"
              }
            ) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-zinc-50 border-bottom border-zinc-100", children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "User" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Role" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400", children: "Joined" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-zinc-50", children: users.map((u) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-zinc-50/50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-zinc-400" }) }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-zinc-900", children: u.email })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs(
              "select",
              {
                value: u.role,
                onChange: (e) => updateUserRole(u.id, e.target.value),
                disabled: u.email === user.email,
                className: "text-sm border-none bg-transparent focus:ring-0 font-medium text-zinc-600 cursor-pointer disabled:cursor-not-allowed",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "super_admin", children: "Super Admin" }),
                  /* @__PURE__ */ jsx("option", { value: "blog_editor", children: "Blog Editor" }),
                  /* @__PURE__ */ jsx("option", { value: "blog_author", children: "Blog Author" }),
                  /* @__PURE__ */ jsx("option", { value: "admin", children: "Legacy Admin" }),
                  /* @__PURE__ */ jsx("option", { value: "editor", children: "Legacy Editor" }),
                  /* @__PURE__ */ jsx("option", { value: "viewer", children: "Viewer" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-zinc-500", children: format(new Date(u.createdAt), "MMM d, yyyy") }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: u.email !== user.email && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => deleteUser(u.id),
                className: "p-2 text-zinc-400 hover:text-red-600 transition-colors",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            ) })
          ] }, u.id)) })
        ] }) }) })
      ] })
    ] })
  ] }) });
};
const genericForgotMessage = "If an admin account exists for this email, reset instructions have been sent.";
const AdminAuthShell = ({
  title,
  subtitle,
  children
}) => /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-zinc-50 flex items-center justify-center px-4", children: /* @__PURE__ */ jsxs(
  motion.div,
  {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    className: "max-w-md w-full bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl",
    children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-4", children: /* @__PURE__ */ jsx(Lock, { className: "w-8 h-8 text-emerald-600" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-zinc-900", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-zinc-500 text-sm", children: subtitle })
      ] }),
      children
    ]
  }
) });
function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await fetch(apiUrl("/api/admin/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      setMessage(genericForgotMessage);
    } catch {
      setError("We could not process that request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsx(
    AdminAuthShell,
    {
      title: "Reset Admin Password",
      subtitle: "Enter your admin email to receive reset instructions",
      children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "forgot-email", className: "block text-sm font-semibold text-zinc-700 mb-1", children: "Email Address" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "forgot-email",
                type: "email",
                value: email,
                onChange: (event) => setEmail(event.target.value),
                className: "w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all",
                placeholder: "admin@example.com",
                required: true
              }
            )
          ] })
        ] }),
        message && /* @__PURE__ */ jsx("p", { className: "text-emerald-700 text-sm text-center font-medium", children: message }),
        error && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm text-center font-medium", children: error }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: isSubmitting,
            className: "w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60",
            children: isSubmitting ? "Sending..." : "Send Reset Instructions"
          }
        ),
        /* @__PURE__ */ jsx(Link, { to: "/admin", className: "block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800", children: "Back to login" })
      ] })
    }
  );
}
function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!token) {
      setError("This reset link is invalid or expired. Please request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("/api/admin/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "This reset link is invalid or expired. Please request a new one.");
        return;
      }
      setPassword("");
      setConfirmPassword("");
      setMessage("Your password has been reset. You can now sign in.");
    } catch {
      setError("We could not reset your password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsx(
    AdminAuthShell,
    {
      title: "Create New Password",
      subtitle: "Choose a secure password for your admin account",
      children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "new-password", className: "block text-sm font-semibold text-zinc-700 mb-1", children: "New Password" }),
          /* @__PURE__ */ jsx(
            PasswordInput,
            {
              id: "new-password",
              value: password,
              onChange: (event) => setPassword(event.target.value),
              className: "w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all",
              placeholder: "Minimum 8 characters",
              leftIcon: /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" }),
              toggleLabel: "new password",
              autoComplete: "new-password",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "confirm-password", className: "block text-sm font-semibold text-zinc-700 mb-1", children: "Confirm Password" }),
          /* @__PURE__ */ jsx(
            PasswordInput,
            {
              id: "confirm-password",
              value: confirmPassword,
              onChange: (event) => setConfirmPassword(event.target.value),
              className: "w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all",
              placeholder: "Repeat password",
              leftIcon: /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" }),
              toggleLabel: "confirm password",
              autoComplete: "new-password",
              required: true
            }
          )
        ] }),
        message && /* @__PURE__ */ jsx("p", { className: "text-emerald-700 text-sm text-center font-medium", children: message }),
        error && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm text-center font-medium", children: error }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: isSubmitting,
            className: "w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60",
            children: isSubmitting ? "Resetting..." : "Reset Password"
          }
        ),
        /* @__PURE__ */ jsx(Link, { to: "/admin", className: "block text-center text-sm font-semibold text-emerald-700 hover:text-emerald-800", children: "Back to login" })
      ] })
    }
  );
}
const BlogCTA = () => /* @__PURE__ */ jsx("section", { className: "rounded-[2rem] bg-[#000A2D] px-6 py-10 text-white sm:px-10 lg:px-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 md:flex-row md:items-center md:justify-between", children: [
  /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-emerald-400", children: "UK discovery call" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-3 text-2xl font-bold tracking-tight sm:text-3xl", children: "Not sure where your digital systems are leaking time or revenue?" })
  ] }),
  /* @__PURE__ */ jsxs(
    TrackedLink,
    {
      href: "/#contact",
      ctaText: "Book a UK discovery call",
      ctaLocation: "blog_cta",
      eventType: "book_call_click",
      className: "inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#000A2D] transition-colors hover:bg-emerald-50",
      children: [
        "Book a UK discovery call",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
      ]
    }
  )
] }) });
const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(() => getBlogPostById(id) || null);
  const [isPostLoading, setIsPostLoading] = useState(Boolean(id && !getBlogPostById(id)));
  const relatedPosts = useMemo(() => post ? getRelatedBlogPosts(post, 3) : [], [post]);
  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(Boolean(id));
  const [commentsApiEnabled, setCommentsApiEnabled] = useState(true);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  useEffect(() => {
    const localPost = getBlogPostById(id);
    setPost(localPost || null);
    setIsPostLoading(Boolean(id && !localPost));
    if (!id) return;
    const fetchPost = async () => {
      try {
        const res = await fetch(apiUrl(`/api/blog/posts/${id}`));
        if (res.ok) {
          setPost(await res.json());
        } else {
          setPost(localPost || null);
        }
      } catch {
        setPost(localPost || null);
      } finally {
        setIsPostLoading(false);
      }
    };
    fetchPost();
  }, [id]);
  useEffect(() => {
    if (!id) {
      setIsLoadingComments(false);
      return;
    }
    const fetchComments = async () => {
      setIsLoadingComments(true);
      try {
        const res = await fetch(apiUrl(`/api/blog/${id}/comments`));
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        } else {
          setCommentsApiEnabled(false);
        }
      } catch (error) {
        setCommentsApiEnabled(false);
      } finally {
        setIsLoadingComments(false);
      }
    };
    fetchComments();
  }, [id]);
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!id || !name || !commentText || isSubmitting || !commentsApiEnabled) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/blog/${id}/comments`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text: commentText })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setCommentText("");
      } else {
        setCommentsApiEnabled(false);
      }
    } catch (error) {
      setCommentsApiEnabled(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  const shareOnTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this article: ${post == null ? void 0 : post.title}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
  };
  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };
  const shareViaEmail = () => {
    const subject = encodeURIComponent((post == null ? void 0 : post.title) || "");
    const body = encodeURIComponent(`I thought you might find this interesting: ${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  const copyToClipboard = () => {
    var _a;
    (_a = navigator.clipboard) == null ? void 0 : _a.writeText(window.location.href);
  };
  if (isPostLoading) {
    return /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-zinc-50 pt-32 pb-24", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" }),
      /* @__PURE__ */ jsx("p", { className: "font-medium text-zinc-500", children: "Loading article..." })
    ] }) });
  }
  if (!post) {
    return /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-zinc-50 pt-32 pb-24", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs font-bold uppercase tracking-[0.24em] text-emerald-600", children: "Article not found" }),
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight text-zinc-900", children: "This insight is not available" }),
      /* @__PURE__ */ jsx("p", { className: "mx-auto mt-5 max-w-xl text-zinc-600", children: "The article may have moved, or the link may no longer be current." }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/blog",
          className: "mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
            "Back to blog"
          ]
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-white pt-32 pb-24", children: /* @__PURE__ */ jsxs("article", { className: "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx(motion.nav, { initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0 }, className: "mb-10", children: /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/blog",
        className: "inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-emerald-600",
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
          "Primewayz UK Insights"
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs("header", { className: "mb-12", children: [
      /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, className: "mb-6 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700", children: post.category }),
        post.tags.slice(0, 3).map((tag) => /* @__PURE__ */ jsx("span", { className: "rounded-full bg-zinc-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500", children: tag }, tag))
      ] }),
      /* @__PURE__ */ jsx(
        motion.h1,
        {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.05 },
          className: "text-4xl font-bold leading-tight tracking-tight text-zinc-900 md:text-6xl",
          children: post.title
        }
      ),
      /* @__PURE__ */ jsx(
        motion.p,
        {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.1 },
          className: "mt-6 text-xl leading-8 text-zinc-600",
          children: post.description || post.excerpt
        }
      ),
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.15 },
          className: "mt-8 flex flex-wrap items-center gap-6 border-b border-zinc-100 pb-8 text-sm text-zinc-500",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100", children: /* @__PURE__ */ jsx(User, { className: "h-5 w-5 text-zinc-400" }) }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-zinc-900", children: post.author })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
              post.date
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
              post.readTime
            ] })
          ]
        }
      )
    ] }),
    post.image && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay: 0.2 },
        className: "mb-14 aspect-[21/9] overflow-hidden rounded-[2rem] shadow-2xl shadow-emerald-900/10",
        children: /* @__PURE__ */ jsx("img", { src: post.image, alt: post.title, className: "h-full w-full object-cover", referrerPolicy: "no-referrer" })
      }
    ),
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.25 },
        className: "prose prose-lg prose-zinc max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-zinc-900 prose-p:leading-relaxed prose-p:text-zinc-600 prose-strong:text-zinc-900",
        children: /* @__PURE__ */ jsx("div", { className: "blog-content-preview", dangerouslySetInnerHTML: { __html: sanitizeBlogHtml(post.content) } })
      }
    ),
    /* @__PURE__ */ jsx("section", { className: "mt-16", children: /* @__PURE__ */ jsx(BlogCTA, {}) }),
    /* @__PURE__ */ jsx("section", { className: "mt-16 border-t border-zinc-100 pt-10", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col justify-between gap-6 md:flex-row md:items-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: "mr-2 text-xs font-bold uppercase tracking-widest text-zinc-400", children: "Share article" }),
      /* @__PURE__ */ jsx("button", { onClick: shareOnTwitter, className: "rounded-full bg-zinc-50 p-3 text-zinc-600 transition-colors hover:bg-blue-50 hover:text-blue-600", title: "Share on Twitter", children: /* @__PURE__ */ jsx(Twitter, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsx("button", { onClick: shareOnLinkedIn, className: "rounded-full bg-zinc-50 p-3 text-zinc-600 transition-colors hover:bg-blue-50 hover:text-blue-700", title: "Share on LinkedIn", children: /* @__PURE__ */ jsx(Linkedin, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsx("button", { onClick: shareViaEmail, className: "rounded-full bg-zinc-50 p-3 text-zinc-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600", title: "Share via Email", children: /* @__PURE__ */ jsx(Mail, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsx("button", { onClick: copyToClipboard, className: "rounded-full bg-zinc-50 p-3 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900", title: "Copy Link", children: /* @__PURE__ */ jsx(Link$1, { className: "h-5 w-5" }) })
    ] }) }) }),
    relatedPosts.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-20", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-8 text-2xl font-bold tracking-tight text-zinc-900", children: "Related insights" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-3", children: relatedPosts.map((relatedPost) => /* @__PURE__ */ jsx(BlogCard, { post: relatedPost }, relatedPost.id)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mt-20", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(MessageSquare, { className: "h-6 w-6 text-emerald-600" }),
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold text-zinc-900", children: [
          "Comments (",
          comments.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-12 rounded-[2rem] border border-zinc-100 bg-zinc-50 p-6 sm:p-8", children: [
        /* @__PURE__ */ jsx("h3", { className: "mb-6 text-lg font-bold text-zinc-900", children: "Leave a comment" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmitComment, className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400", children: "Your name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                id: "name",
                value: name,
                onChange: (e) => setName(e.target.value),
                placeholder: "John Doe",
                required: true,
                className: "w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-zinc-900 placeholder:text-zinc-300 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "comment", className: "mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400", children: "Comment" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                id: "comment",
                value: commentText,
                onChange: (e) => setCommentText(e.target.value),
                placeholder: "Share your thoughts...",
                required: true,
                rows: 4,
                className: "w-full resize-none rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-zinc-900 placeholder:text-zinc-300 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: isSubmitting || !commentsApiEnabled,
              className: "inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50",
              children: [
                commentsApiEnabled ? isSubmitting ? "Posting..." : "Post comment" : "Comments unavailable",
                /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: isLoadingComments ? /* @__PURE__ */ jsxs("div", { className: "py-10 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-zinc-500", children: "Loading comments..." })
      ] }) : comments.length > 0 ? /* @__PURE__ */ jsx(AnimatePresence, { mode: "popLayout", children: comments.map((comment, index) => /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: index * 0.05 },
          className: "rounded-[1.5rem] border border-zinc-100 bg-white p-6 shadow-sm shadow-zinc-900/5",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50", children: /* @__PURE__ */ jsx(User, { className: "h-5 w-5 text-emerald-600" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-bold text-zinc-900", children: comment.name }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-zinc-400", children: new Date(comment.createdAt).toLocaleDateString("en-GB", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                }) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "leading-relaxed text-zinc-600", children: comment.text })
          ]
        },
        comment.id
      )) }) : /* @__PURE__ */ jsx("div", { className: "rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center", children: /* @__PURE__ */ jsx("p", { className: "font-medium text-zinc-500", children: "No comments yet." }) }) })
    ] })
  ] }) });
};
const BlogLayout = ({ eyebrow = "Insights", title, description, children }) => /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-zinc-50 pt-32 pb-24", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
  /* @__PURE__ */ jsxs("header", { className: "mb-14 max-w-3xl", children: [
    /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs font-bold uppercase tracking-[0.24em] text-emerald-600", children: eyebrow }),
    /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mt-6 text-lg leading-8 text-zinc-600", children: description })
  ] }),
  children
] }) });
const BlogListPage = () => {
  const [posts2, setPosts] = useState(getAllBlogPosts());
  const featuredPost = posts2.find((post) => post.featured) || getFeaturedBlogPost();
  const remainingPosts = posts2.filter((post) => post.id !== featuredPost.id);
  const categories = Array.from(new Set(posts2.map((post) => post.category)));
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(apiUrl("/api/blog/posts"));
        if (res.ok) {
          setPosts(await res.json());
        }
      } catch {
        setPosts(getAllBlogPosts());
      }
    };
    fetchPosts();
  }, []);
  return /* @__PURE__ */ jsxs(
    BlogLayout,
    {
      title: "Primewayz UK Insights",
      description: "Practical guidance on AI automation, digital systems, SEO, CRM, websites, and operational stability for UK SMEs.",
      children: [
        /* @__PURE__ */ jsx("div", { className: "mb-8 flex flex-wrap gap-2", children: categories.map((category) => /* @__PURE__ */ jsx(
          "span",
          {
            className: "rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700",
            children: category
          },
          category
        )) }),
        featuredPost && /* @__PURE__ */ jsxs("section", { className: "mb-14", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-5 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-zinc-200" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-[0.24em] text-zinc-400", children: "Featured" }),
            /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-zinc-200" })
          ] }),
          /* @__PURE__ */ jsx(BlogCard, { post: featuredPost, featured: true })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3", children: remainingPosts.map((post) => /* @__PURE__ */ jsx(BlogCard, { post }, post.id)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-16", children: /* @__PURE__ */ jsx(BlogCTA, {}) })
      ]
    }
  );
};
const businessName = "Primewayz UK";
const contactEmail = "info@primewayz.com";
const pageContent = {
  privacy: {
    icon: ShieldCheck,
    title: "Privacy Policy",
    updated: "Last updated: May 2026",
    intro: "This Privacy Policy explains how Primewayz UK collects, uses, stores, and protects personal information when UK businesses visit our website, contact us, request a digital audit, or discuss our subscription-based digital services.",
    sections: [
      {
        title: "1. Who this policy applies to",
        body: "This policy applies to visitors, business owners, decision-makers, prospective clients, and client representatives based in the United Kingdom who interact with the Primewayz UK website or contact us about our services."
      },
      {
        title: "2. Information we may collect",
        body: "We may collect your name, business name, work email address, phone number, website URL, business sector, enquiry details, digital challenges, messages submitted through forms, call booking details, and technical website usage information such as pages visited, device type, browser type, approximate location, and referral source."
      },
      {
        title: "3. How we collect information",
        body: "We collect information when you submit a contact form, request a free digital audit, book a call, email us, speak with us, use our website, or interact with our analytics and security tools."
      },
      {
        title: "4. Why we use your information",
        body: "We use your information to respond to enquiries, understand your business requirements, prepare audit findings, suggest suitable subscription plans, provide proposals, deliver agreed services, improve website performance, monitor security, and maintain appropriate business records."
      },
      {
        title: "5. Lawful basis for processing",
        body: "Depending on the situation, we may process your information because it is necessary to respond before entering into a contract, to perform a contract with you, to comply with legal obligations, because we have a legitimate business interest in managing enquiries and improving our services, or because you have given consent, for example for certain marketing or non-essential cookies."
      },
      {
        title: "6. Marketing communication",
        body: "We may contact UK business representatives about relevant Primewayz UK services where permitted by law. You can ask us to stop marketing communication at any time by contacting us or using any unsubscribe option provided."
      },
      {
        title: "7. Sharing information",
        body: "We do not sell personal information. We may share limited information with trusted service providers who help us operate our website, analytics, hosting, email, CRM, call booking, security, or project delivery systems. These providers are only allowed to use information as needed to support our services."
      },
      {
        title: "8. International processing",
        body: "Primewayz may use delivery, hosting, software, or support resources outside the United Kingdom. Where personal information is processed outside the UK, we aim to use appropriate safeguards and suitable service providers to protect that information."
      },
      {
        title: "9. How long we keep information",
        body: "We keep enquiry information only for as long as needed to respond, manage the business relationship, maintain records, improve services, and meet legal or accounting requirements. If no business relationship begins, enquiry records may be periodically reviewed and deleted when no longer required."
      },
      {
        title: "10. Your UK data protection rights",
        body: "Subject to applicable conditions, you may have the right to access your personal information, ask for correction, request deletion, restrict processing, object to processing, request data portability, and withdraw consent where consent is the lawful basis."
      },
      {
        title: "11. Security",
        body: "We use reasonable technical and organisational measures to protect information from unauthorised access, loss, misuse, or disclosure. No website or online transmission can be guaranteed completely secure, but we work to keep information protected."
      },
      {
        title: "12. Contact us",
        body: `For privacy questions or requests, contact ${businessName} at ${contactEmail}.`
      }
    ]
  },
  terms: {
    icon: FileText,
    title: "Terms of Service",
    updated: "Last updated: May 2026",
    intro: "These Terms of Service explain the basic conditions for using the Primewayz UK website and discussing or engaging our subscription-based digital services for UK businesses.",
    sections: [
      {
        title: "1. About Primewayz UK",
        body: "Primewayz UK provides subscription-based digital services for UK small and medium businesses, including website and platform development, digital audits, SEO support, CRM and tool integrations, automation, maintenance, and ongoing digital improvement work."
      },
      {
        title: "2. Website use",
        body: "You may use this website to learn about our services, submit enquiries, request a digital audit, or contact us. You must not misuse the website, attempt unauthorised access, introduce malware, scrape content at scale, or interfere with the website operation."
      },
      {
        title: "3. Information on this website",
        body: "The content on this website is provided for general business information. It does not create a binding service agreement until a proposal, subscription plan, statement of work, order confirmation, or written agreement has been accepted by both parties."
      },
      {
        title: "4. Free audit or consultation",
        body: "Any free digital audit, discovery call, or initial recommendation is provided to help understand your business needs. It is not a guarantee of specific search ranking, traffic, revenue, lead volume, or business outcome."
      },
      {
        title: "5. Subscription services",
        body: "Where you engage Primewayz UK on a monthly subscription plan, the work will be based on the agreed plan, available monthly capacity, priorities, technical feasibility, and any written scope agreed between both parties."
      },
      {
        title: "6. Plan changes, pause, or cancellation",
        body: "Plan changes, pauses, cancellation terms, notice periods, and maintenance mode terms will be governed by the specific proposal or agreement accepted for your engagement. Unless agreed otherwise, changes should be requested in writing."
      },
      {
        title: "7. Third-party costs",
        body: "Third-party costs such as domain registration, hosting, cloud services, paid plugins, SaaS tools, CRM licences, payment gateways, SMS, WhatsApp Business, advertising spend, stock images, fonts, or APIs are not included unless clearly stated in writing."
      },
      {
        title: "8. Client responsibilities",
        body: "Clients are responsible for providing accurate information, approvals, access credentials, brand assets, content, third-party account access, and timely feedback needed to deliver the agreed work."
      },
      {
        title: "9. Ownership",
        body: "Unless agreed otherwise in writing, clients retain ownership of their business content, domain, hosting accounts, and third-party accounts. Ownership of custom deliverables, code, design files, or configuration work will follow the accepted proposal or written agreement."
      },
      {
        title: "10. Acceptable use",
        body: "Primewayz UK may refuse work involving unlawful activity, harmful content, deceptive practices, spam, malware, unauthorised data access, or activities that could damage users, businesses, or public trust."
      },
      {
        title: "11. Limitation of outcomes",
        body: "We work professionally and aim to improve digital performance, but we do not guarantee specific rankings, sales, revenue, leads, uptime from third-party providers, or platform approvals unless expressly stated in writing."
      },
      {
        title: "12. Contact",
        body: `For questions about these terms, contact ${businessName} at ${contactEmail}.`
      }
    ]
  },
  cookies: {
    icon: Cookie,
    title: "Cookie Policy",
    updated: "Last updated: May 2026",
    intro: "This Cookie Policy explains how Primewayz UK may use cookies and similar technologies on our website for visitors in the United Kingdom.",
    sections: [
      {
        title: "1. What cookies are",
        body: "Cookies are small text files stored on your device when you visit a website. Similar technologies may include pixels, tags, local storage, scripts, and analytics identifiers."
      },
      {
        title: "2. How we use cookies",
        body: "We may use cookies to keep the website working, improve security, understand how visitors use the website, measure performance, remember preferences, and improve our marketing and user experience."
      },
      {
        title: "3. Essential cookies",
        body: "Essential cookies are required for the website to operate properly. These may support security, page loading, forms, session handling, and basic functionality. These cookies cannot usually be switched off through our website."
      },
      {
        title: "4. Analytics cookies",
        body: "Analytics cookies help us understand website traffic, popular pages, visitor journeys, and conversion performance. We use this information to improve the website and make our UK business content more useful."
      },
      {
        title: "5. Marketing cookies",
        body: "Marketing cookies or similar technologies may be used to understand campaign performance or support relevant advertising. Where required, these should only be used after you have given consent."
      },
      {
        title: "6. Third-party cookies",
        body: "Some cookies may be placed by third-party tools used for analytics, security, embedded content, booking, forms, or advertising. These third parties may process limited information according to their own policies."
      },
      {
        title: "7. Cookie consent",
        body: "For non-essential cookies, we aim to request consent where required under UK cookie rules. You should be able to accept, reject, or manage non-essential cookies when a cookie banner or settings tool is available."
      },
      {
        title: "8. Managing cookies in your browser",
        body: "You can block or delete cookies through your browser settings. If you block all cookies, some website features may not work as intended."
      },
      {
        title: "9. Changes to this policy",
        body: "We may update this Cookie Policy if our website, analytics setup, advertising tools, or legal requirements change."
      },
      {
        title: "10. Contact",
        body: `For questions about cookies, contact ${businessName} at ${contactEmail}.`
      }
    ]
  }
};
function LegalPage({ type }) {
  const content = pageContent[type];
  const Icon = content.icon;
  return /* @__PURE__ */ jsx("main", { className: "min-h-screen bg-zinc-950 text-white", children: /* @__PURE__ */ jsx("section", { className: "px-6 py-10 md:py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl", children: [
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/",
        className: "inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-10",
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
          "Back to Home"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 md:p-10 shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-blue-500/10 p-4 text-blue-400", children: /* @__PURE__ */ jsx(Icon, { className: "h-7 w-7" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm uppercase tracking-widest text-blue-400", children: "Primewayz UK" }),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mt-2", children: content.title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-zinc-500 mt-2", children: content.updated })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-lg leading-8 text-zinc-300 border-b border-zinc-800 pb-8", children: content.intro }),
      /* @__PURE__ */ jsx("div", { className: "mt-8 space-y-8", children: content.sections.map((section) => /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-white mb-3", children: section.title }),
        /* @__PURE__ */ jsx("p", { className: "leading-7 text-zinc-400", children: section.body })
      ] }, section.title)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-10 rounded-2xl bg-zinc-950 border border-zinc-800 p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-2", children: "Important note" }),
        /* @__PURE__ */ jsx("p", { className: "text-zinc-400 leading-7", children: "This page is written for Primewayz UK website visitors and business enquiries in the United Kingdom. It is not intended for India, the EU, the USA, or any other region." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-2xl bg-zinc-950 border border-zinc-800 p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-2", children: "Contact" }),
        /* @__PURE__ */ jsxs("p", { className: "text-zinc-400 leading-7", children: [
          "Email:",
          " ",
          /* @__PURE__ */ jsx(
            "a",
            {
              href: `mailto:${contactEmail}`,
              className: "text-blue-400 hover:text-blue-300",
              children: contactEmail
            }
          )
        ] })
      ] })
    ] })
  ] }) }) });
}
function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
  }, []);
  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(path);
  }, [location.pathname, location.search, location.hash]);
  return null;
}
const includedItems = [
  "Website and landing page improvements",
  "CRM setup, workflow support, and integration planning",
  "Business automation and reporting improvements",
  "SEO foundation support and technical cleanup",
  "Maintenance, bug fixes, and controlled feature updates",
  "Delivery planning, prioritisation, testing, and release support"
];
const fitItems = [
  "You need regular technical progress without hiring a full in-house team.",
  "Your website, CRM, automation, or internal systems need ongoing improvement.",
  "You prefer clear monthly capacity over scattered one-off projects.",
  "You want delivery to stay practical, measurable, and commercially focused."
];
const steps = [
  {
    title: "Understand",
    text: "We review your current website, systems, business goals, bottlenecks, and delivery priorities."
  },
  {
    title: "Prioritise",
    text: "We agree what should be handled first, what can wait, and what needs third-party coordination."
  },
  {
    title: "Deliver",
    text: "We work through a clear monthly delivery rhythm with updates, testing, and controlled releases."
  },
  {
    title: "Improve",
    text: "We review outcomes and keep improving the website, CRM, automation, SEO foundations, and systems over time."
  }
];
const SoftwareDevelopmentSubscriptionUkPage = () => {
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("main", { className: "min-h-screen bg-white text-slate-950", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden bg-[#000A2D] px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_34%)]" }),
      /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-6xl", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/",
            className: "mb-10 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
              "Back to Primewayz UK"
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300", children: "UK SME Software Delivery" }),
            /* @__PURE__ */ jsx("h1", { className: "max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl", children: "Software development subscription for UK SMEs" }),
            /* @__PURE__ */ jsx("p", { className: "mt-6 max-w-3xl text-lg leading-8 text-slate-200", children: "Build, maintain, and improve your digital systems through a practical monthly delivery model. Primewayz UK supports websites, CRM integrations, automation, SEO foundations, dashboards, maintenance, and ongoing software improvements without forcing every need into a large one-off project." }),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col gap-3 sm:flex-row", children: [
              /* @__PURE__ */ jsx(
                TrackedLink,
                {
                  href: "/#contact",
                  ctaText: "Book a 30-minute discovery call",
                  ctaLocation: "service_page_hero",
                  eventType: "book_call_click",
                  className: "inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300",
                  children: "Book a 30-minute discovery call"
                }
              ),
              /* @__PURE__ */ jsx(
                TrackedLink,
                {
                  href: "/#pricing",
                  ctaText: "View monthly plans",
                  ctaLocation: "service_page_hero",
                  eventType: "pricing_plan_click",
                  className: "inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10",
                  children: "View monthly plans"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: "Best suited for" }),
            /* @__PURE__ */ jsx("div", { className: "mt-5 space-y-4", children: fitItems.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "mt-0.5 h-5 w-5 shrink-0 text-emerald-300" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm leading-6 text-slate-100", children: item })
            ] }, item)) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "px-4 py-20 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-3xl", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600", children: "What the subscription covers" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl", children: "Monthly software delivery capacity for the work UK SMEs actually need" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg leading-8 text-slate-600", children: "Instead of treating every improvement as a separate project, we help you maintain a steady delivery rhythm across your website, CRM, automation, integrations, reporting, and system improvements." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: includedItems.map((item) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 p-5", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-emerald-600" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm font-semibold leading-6 text-slate-800", children: item })
      ] }, item)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-slate-50 px-4 py-20 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600", children: "Delivery rhythm" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight text-slate-950", children: "A clearer alternative to scattered one-off development" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-base leading-7 text-slate-600", children: "The subscription model works best when your business needs continuous improvement, not a single isolated build. We keep priorities visible and move through work in a controlled sequence." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: steps.map((step, index) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white", children: index + 1 }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-950", children: step.title })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-6 text-slate-600", children: step.text })
      ] }, step.title)) })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "px-4 py-20 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-6xl gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-slate-200 p-6", children: [
        /* @__PURE__ */ jsx(Layers3, { className: "h-8 w-8 text-emerald-600" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-5 text-xl font-bold", children: "Websites and systems" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: "Improve websites, landing pages, CMS areas, dashboards, admin panels, and business-facing applications." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-slate-200 p-6", children: [
        /* @__PURE__ */ jsx(Workflow, { className: "h-8 w-8 text-emerald-600" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-5 text-xl font-bold", children: "CRM and automation" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: "Support lead capture, enquiry routing, workflow automation, integrations, reporting, and operational visibility." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-slate-200 p-6", children: [
        /* @__PURE__ */ jsx(Wrench, { className: "h-8 w-8 text-emerald-600" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-5 text-xl font-bold", children: "Maintenance and support" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: "Keep the system stable with bug fixes, updates, technical cleanup, monitoring support, and controlled improvements." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-[#000A2D] px-4 py-20 text-white sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-6xl gap-8 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur lg:grid-cols-[1fr_0.7fr] lg:items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "h-10 w-10 text-emerald-300" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-5 text-3xl font-bold tracking-tight", children: "Start with clarity, then move into monthly delivery" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-base leading-7 text-slate-200", children: "If the scope is unclear, start with a Foundation Sprint. If priorities are already clear, move straight into a monthly plan and begin improving the workstream." })
      ] }),
      /* @__PURE__ */ jsx(
        TrackedLink,
        {
          href: "/#contact",
          ctaText: "Discuss software subscription",
          ctaLocation: "service_page_final_cta",
          eventType: "book_call_click",
          className: "inline-flex min-h-[52px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300",
          children: "Discuss your delivery needs"
        }
      )
    ] }) })
  ] }) });
};
const supportItems = [
  "Website content updates, CMS edits, and landing page improvements",
  "Bug fixes, broken layout fixes, form fixes, and CTA improvements",
  "Technical SEO checks, metadata cleanup, redirects, and indexability support",
  "Speed, performance, mobile UX, and basic accessibility improvements",
  "Analytics, GA4 event checks, Search Console review, and conversion tracking support",
  "Monthly improvement backlog, priority planning, testing, and release support"
];
const painPoints = [
  "Small website changes keep waiting for weeks.",
  "Your website is live, but nobody clearly owns ongoing improvement.",
  "Forms, CTAs, analytics, or SEO basics are not regularly checked.",
  "You need reliable monthly progress without hiring a full-time developer."
];
const processSteps$1 = [
  {
    title: "Review",
    text: "We review your current website, CMS, analytics, Search Console, forms, speed, SEO basics, and priority issues."
  },
  {
    title: "Prioritise",
    text: "We create a practical monthly backlog covering urgent fixes, quick improvements, and commercially useful updates."
  },
  {
    title: "Maintain",
    text: "We handle approved website updates, fixes, checks, and improvements through a controlled delivery rhythm."
  },
  {
    title: "Improve",
    text: "We review what changed, what still blocks conversion, and what should be improved in the next cycle."
  }
];
const WebsiteMaintenanceSubscriptionUkPage = () => /* @__PURE__ */ jsxs("main", { className: "min-h-screen bg-white text-slate-950", children: [
  /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden bg-[#000A2D] px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_34%)]" }),
    /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-6xl", children: [
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "mb-10 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white",
          children: "Back to Primewayz UK"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300", children: "UK SME Website Support" }),
          /* @__PURE__ */ jsx("h1", { className: "max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl", children: "Website maintenance subscription for UK SMEs" }),
          /* @__PURE__ */ jsx("p", { className: "mt-6 max-w-3xl text-lg leading-8 text-slate-200", children: "Keep your website stable, updated, measurable, and improving every month. Primewayz UK supports website updates, bug fixes, technical SEO checks, landing page improvements, analytics, and ongoing conversion-focused maintenance without forcing every small change into a separate project." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col gap-3 sm:flex-row", children: [
            /* @__PURE__ */ jsx(
              TrackedLink,
              {
                href: "/#contact",
                ctaText: "Book a UK website maintenance review",
                ctaLocation: "website_maintenance_hero",
                eventType: "book_call_click",
                className: "inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300",
                children: "Book a UK website maintenance review"
              }
            ),
            /* @__PURE__ */ jsx(
              TrackedLink,
              {
                href: "/#pricing",
                ctaText: "View monthly plans",
                ctaLocation: "website_maintenance_hero",
                eventType: "pricing_plan_click",
                className: "inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10",
                children: "View monthly plans"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: "Best suited for" }),
          /* @__PURE__ */ jsx("div", { className: "mt-5 space-y-4", children: painPoints.map((item) => /* @__PURE__ */ jsx("p", { className: "rounded-2xl bg-white/10 p-4 text-sm leading-6 text-slate-100", children: item }, item)) })
        ] })
      ] })
    ] })
  ] }),
  /* @__PURE__ */ jsx("section", { className: "px-4 py-20 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-3xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600", children: "What is included" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl", children: "Monthly website maintenance that protects performance and supports conversion" }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg leading-8 text-slate-600", children: "The aim is not only to “keep the site running”. The aim is to keep the website useful, updated, technically healthy, and aligned with your lead-generation priorities." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: supportItems.map((item) => /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 p-5", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold leading-6 text-slate-800", children: item }) }, item)) })
  ] }) }),
  /* @__PURE__ */ jsx("section", { className: "bg-slate-50 px-4 py-20 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600", children: "Delivery rhythm" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight text-slate-950", children: "A practical alternative to delayed website fixes" }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-base leading-7 text-slate-600", children: "Instead of waiting for one-off website tasks to become urgent, we help you maintain a clear monthly improvement rhythm with priorities, delivery, testing, and review." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: processSteps$1.map((step, index) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white", children: index + 1 }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-950", children: step.title })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-6 text-slate-600", children: step.text })
    ] }, step.title)) })
  ] }) }) }),
  /* @__PURE__ */ jsx("section", { className: "px-4 py-20 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-6xl gap-6 lg:grid-cols-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-slate-200 p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold", children: "For existing websites" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: "Best for UK SMEs that already have a live website and need consistent updates, checks, and improvements." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-slate-200 p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold", children: "For lead generation" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: "Improve landing pages, contact forms, CTAs, tracking, technical SEO basics, and conversion journeys." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-slate-200 p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold", children: "For controlled support" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: "Use a predictable monthly support model instead of scattered fixes, unclear ownership, or delayed changes." })
    ] })
  ] }) }),
  /* @__PURE__ */ jsx("section", { className: "bg-[#000A2D] px-4 py-20 text-white sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-6xl gap-8 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur lg:grid-cols-[1fr_0.7fr] lg:items-center", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight", children: "Start with a maintenance review" }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-base leading-7 text-slate-200", children: "We will review what is stable, what needs fixing, what affects visibility, and what should be improved first." })
    ] }),
    /* @__PURE__ */ jsx(
      TrackedLink,
      {
        href: "/#contact",
        ctaText: "Book website maintenance review",
        ctaLocation: "website_maintenance_final_cta",
        eventType: "book_call_click",
        className: "inline-flex min-h-[52px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300",
        children: "Book a website maintenance review"
      }
    )
  ] }) })
] });
const services = [
  {
    title: "Data Synchronization",
    description: "Keep your CRM data in sync with accounting software, email platforms, and other business tools in real-time."
  },
  {
    title: "Workflow Automation",
    description: "Automate lead routing, follow-up emails, task creation, and other repetitive processes to save time and reduce errors."
  },
  {
    title: "Third-Party Integrations",
    description: "Connect your CRM with marketing automation, e-commerce platforms, project management tools, and more."
  },
  {
    title: "Sales Process Optimization",
    description: "Streamline your sales pipeline with custom integrations that improve visibility and accelerate deal closure."
  },
  {
    title: "Data Migration",
    description: "Safely migrate your customer data from spreadsheets or legacy systems to your new CRM without data loss."
  },
  {
    title: "Custom API Development",
    description: "Build custom integrations when off-the-shelf solutions do not meet your specific business requirements."
  }
];
const platforms = ["Salesforce", "HubSpot", "Zoho CRM", "Pipedrive", "Monday.com", "Freshworks"];
const benefits = [
  {
    title: "Eliminate Data Entry Duplication",
    description: "Stop manually entering the same data in multiple systems. Automated sync keeps everything up-to-date."
  },
  {
    title: "Improve Sales Team Productivity",
    description: "Sales reps spend less time on admin and more time selling with automated workflows and instant data access."
  },
  {
    title: "Better Customer Insights",
    description: "Get a 360-degree view of your customers by combining data from all your business systems."
  },
  {
    title: "Faster Response Times",
    description: "Automated lead routing and notifications ensure no opportunity falls through the cracks."
  },
  {
    title: "Accurate Reporting",
    description: "Make better decisions with real-time, accurate reports that pull data from all integrated systems."
  },
  {
    title: "Scalable Solutions",
    description: "Integrations that grow with your business, from startup to enterprise-level operations."
  }
];
const processSteps = [
  {
    title: "Discovery",
    description: "We analyze your current systems, workflows, and business requirements."
  },
  {
    title: "Planning",
    description: "We design the integration architecture and create a detailed implementation plan."
  },
  {
    title: "Implementation",
    description: "We build, test, and deploy the integrations with thorough quality assurance."
  },
  {
    title: "Support",
    description: "Ongoing monitoring, maintenance, and optimization to ensure peak performance."
  }
];
function CrmIntegrationSupportUkPage() {
  return /* @__PURE__ */ jsxs("main", { className: "min-h-screen bg-white", children: [
    /* @__PURE__ */ jsx("section", { className: "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6", children: "CRM Integration Support UK" }),
      /* @__PURE__ */ jsx("p", { className: "text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto", children: "Connect your CRM with other business tools, automate workflows, and streamline your sales processes with expert integration services for UK SMEs." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center", children: [
        /* @__PURE__ */ jsx(
          TrackedLink,
          {
            href: "/#contact",
            ctaText: "Book a free CRM integration consultation",
            ctaLocation: "crm_integration_hero",
            eventType: "book_call_click",
            className: "inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-blue-600 shadow-lg transition hover:bg-blue-50",
            children: "Book a Free Consultation"
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "#services",
            className: "inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10",
            children: "Learn More"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { id: "services", className: "py-20 bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: "Comprehensive CRM Integration Services" }),
        /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "We help UK businesses connect their CRM systems with other tools to eliminate data silos, automate repetitive tasks, and improve team productivity." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8", children: services.map((service, index) => /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-gray-900 mb-3", children: service.title }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: service.description })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: "CRM Platforms We Support" }),
        /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "We work with all major CRM platforms popular among UK businesses." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8", children: platforms.map((platform) => /* @__PURE__ */ jsx("div", { className: "text-center p-6 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors", children: /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: platform }) }, platform)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-gradient-to-br from-blue-50 to-indigo-50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: "Benefits for UK SMEs" }),
        /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Proper CRM integration delivers measurable improvements to your business operations." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-8", children: benefits.map((benefit, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1", children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-gray-900 mb-2", children: benefit.title }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: benefit.description })
        ] })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: "Our Integration Process" }),
        /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "A proven methodology that ensures successful CRM integration with minimal disruption." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-4 gap-8", children: processSteps.map((step, index) => /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4", children: index + 1 }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-gray-900 mb-2", children: step.title }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: step.description })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-6", children: "Ready to Streamline Your CRM?" }),
      /* @__PURE__ */ jsx("p", { className: "text-xl mb-8 text-blue-100", children: "Let us discuss how we can integrate your CRM with other business tools to improve efficiency and drive growth." }),
      /* @__PURE__ */ jsx(
        TrackedLink,
        {
          href: "/#contact",
          ctaText: "Book CRM integration consultation",
          ctaLocation: "crm_integration_final_cta",
          eventType: "book_call_click",
          className: "inline-flex min-h-[52px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50",
          children: "Book Your Free Consultation"
        }
      )
    ] }) })
  ] });
}
const challengeItems = [
  "Enquiries arrive through phone, website forms, email, WhatsApp, Google Business Profile, and referrals.",
  "Follow-ups depend on memory, spreadsheets, or scattered inboxes.",
  "Quote requests are not always captured with the right service and location details.",
  "The business has limited visibility into which channels generate real enquiries.",
  "Website updates, tracking, and small technical fixes are delayed."
];
const deliverables = [
  {
    title: "Service pages that convert",
    description: "Clear pages for key trade services, service areas, trust signals, quote CTAs, and mobile-friendly enquiry journeys.",
    icon: Globe2
  },
  {
    title: "Quote request workflow",
    description: "Structured forms that capture service type, postcode, urgency, contact details, and customer notes.",
    icon: ClipboardList
  },
  {
    title: "Call, email and WhatsApp capture",
    description: "Prominent CTAs and tracking-ready interaction points for customers who prefer quick contact.",
    icon: Smartphone
  },
  {
    title: "CRM or email lead routing",
    description: "Route enquiries into a simple CRM pipeline, shared inbox, or follow-up workflow so no lead gets lost.",
    icon: Mail
  },
  {
    title: "GA4 conversion tracking",
    description: "Track form submissions, call clicks, WhatsApp clicks, quote requests, and key service page actions.",
    icon: BarChart3
  },
  {
    title: "Maintenance and improvement rhythm",
    description: "Monthly support for updates, fixes, performance checks, basic SEO, backups, and reporting.",
    icon: Wrench
  }
];
const kpis = [
  { label: "New enquiries", value: "84", detail: "monthly dashboard example" },
  { label: "Quote requests", value: "31", detail: "captured with service details" },
  { label: "Call clicks", value: "126", detail: "tracked from service pages" },
  { label: "Conversion rate", value: "18.6%", detail: "from enquiry actions" }
];
const technicalScope = [
  "Responsive React / website frontend updates",
  "Quote request and contact form flow",
  "CRM, email, or spreadsheet-based enquiry capture",
  "GA4 event tracking for forms, calls, WhatsApp, and CTA clicks",
  "Local service area structure and SEO metadata",
  "Basic technical SEO checks: titles, descriptions, canonical URLs, sitemap visibility",
  "Monthly maintenance checklist for updates, backups, page speed, and issue review"
];
const LocalTradesLeadCapturePage = () => {
  return /* @__PURE__ */ jsxs("main", { className: "bg-white text-[#000A2D]", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-12 pb-20", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 h-72 w-72 rounded-full bg-[#2FA8DF]/10 blur-3xl" }),
      /* @__PURE__ */ jsx("div", { className: "absolute left-0 bottom-0 h-72 w-72 rounded-full bg-[#E4005A]/10 blur-3xl" }),
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/#success-stories",
            className: "inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#0057C8]",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
              "Back to UK SME project examples"
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-12 grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(
              motion.p,
              {
                initial: { opacity: 0, y: 18 },
                animate: { opacity: 1, y: 0 },
                className: "text-sm font-black uppercase tracking-[0.24em] text-[#E4005A]",
                children: "UK Local Trades"
              }
            ),
            /* @__PURE__ */ jsx(
              motion.h1,
              {
                initial: { opacity: 0, y: 18 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.08 },
                className: "mt-5 text-4xl font-black tracking-tight text-[#000A2D] sm:text-5xl lg:text-6xl",
                children: "Local Trades Website & Lead Capture Setup"
              }
            ),
            /* @__PURE__ */ jsx(
              motion.p,
              {
                initial: { opacity: 0, y: 18 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.16 },
                className: "mt-6 max-w-2xl text-lg leading-8 text-slate-600",
                children: "A practical website and enquiry-flow setup for plumbers, electricians, roofing firms, builders, cleaners, landscapers, and local service businesses that need clearer quote requests, faster follow-ups, and better visibility into lead sources."
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col gap-3 sm:flex-row", children: [
              /* @__PURE__ */ jsxs(
                Link,
                {
                  to: "/#contact",
                  className: "inline-flex items-center justify-center gap-2 rounded-full bg-[#000A2D] px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-[#0057C8]",
                  children: [
                    "Discuss your UK requirements",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                Link,
                {
                  to: "/website-maintenance-subscription-uk",
                  className: "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-[#000A2D] transition hover:border-[#2FA8DF]/40 hover:text-[#0057C8]",
                  children: "View maintenance support"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { opacity: 0, scale: 0.96 },
              animate: { opacity: 1, scale: 1 },
              transition: { delay: 0.18 },
              className: "rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10",
              children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: "/images/localTradesWbsite.png",
                  alt: "Local Trades Website and Lead Capture dashboard mockup",
                  className: "h-full w-full rounded-[1.5rem] object-cover",
                  loading: "eager"
                }
              )
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: kpis.map((item) => /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "text-3xl font-black text-[#0057C8]", children: item.value }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm font-black text-[#000A2D]", children: item.label }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs leading-5 text-slate-500", children: item.detail })
        ] }, item.label)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-12 lg:grid-cols-[0.9fr_1.1fr]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-black uppercase tracking-[0.24em] text-[#E4005A]", children: "Business challenge" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-4 text-3xl font-black tracking-tight text-[#000A2D] sm:text-4xl", children: "Missed enquiries usually happen after the first customer action." }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg leading-8 text-slate-600", children: "For many local trades, the website may be visible, but the follow-up process is not connected. Calls, forms, WhatsApp messages, and email enquiries need to become one cleaner lead flow." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: challengeItems.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "mt-0.5 h-5 w-5 flex-none text-[#0057C8]" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm leading-6 text-slate-700", children: item })
      ] }, item)) })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-slate-50 py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-black uppercase tracking-[0.24em] text-[#E4005A]", children: "What we deliver" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-4 text-3xl font-black tracking-tight text-[#000A2D] sm:text-4xl", children: "A practical setup for clearer local customer acquisition." }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg leading-8 text-slate-600", children: "The goal is not just a nicer website. The goal is a digital flow that captures enquiries, supports follow-up, and gives the business better visibility." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: deliverables.map((item) => {
        const Icon = item.icon;
        return /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0057C8]/10 text-[#0057C8]", children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }),
          /* @__PURE__ */ jsx("h3", { className: "mt-5 text-xl font-black text-[#000A2D]", children: item.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: item.description })
        ] }, item.title);
      }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Target, { className: "h-6 w-6 text-[#E4005A]" }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-[#000A2D]", children: "Typical outcomes" })
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-6 space-y-4 text-sm leading-6 text-slate-700", children: [
          /* @__PURE__ */ jsx("li", { children: "Better enquiry visibility across calls, forms, WhatsApp, email, and referrals." }),
          /* @__PURE__ */ jsx("li", { children: "Faster follow-up process with clearer lead ownership." }),
          /* @__PURE__ */ jsx("li", { children: "Improved local service page structure and quote request flow." }),
          /* @__PURE__ */ jsx("li", { children: "More useful reporting through GA4 conversion events and source tracking." }),
          /* @__PURE__ */ jsx("li", { children: "Stable monthly support for updates, technical fixes, and SEO foundation upkeep." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] border border-slate-200 bg-[#000A2D] p-8 text-white shadow-xl", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "h-6 w-6 text-[#2FA8DF]" }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black", children: "Technical and delivery scope" })
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-4 text-sm leading-6 text-slate-200", children: technicalScope.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "mt-0.5 h-4 w-4 flex-none text-[#2FA8DF]" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-slate-50 py-20", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-6 text-center lg:px-8", children: [
      /* @__PURE__ */ jsx(MapPin, { className: "mx-auto h-8 w-8 text-[#E4005A]" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-5 text-3xl font-black tracking-tight text-[#000A2D] sm:text-4xl", children: "Built for UK local service businesses that need practical digital support." }),
      /* @__PURE__ */ jsx("p", { className: "mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600", children: "Start with a focused Foundation Sprint, then continue with Essential or Maintenance Mode depending on how much monthly support your business needs." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col justify-center gap-3 sm:flex-row", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/#contact",
            className: "inline-flex items-center justify-center gap-2 rounded-full bg-[#E4005A] px-7 py-3 text-sm font-black text-white shadow-lg shadow-pink-900/20 transition hover:-translate-y-0.5 hover:bg-[#c90050]",
            children: [
              "Book a UK discovery call",
              /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/software-development-subscription-uk",
            className: "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-black text-[#000A2D] transition hover:border-[#2FA8DF]/40 hover:text-[#0057C8]",
            children: [
              "View subscription model",
              /* @__PURE__ */ jsx(Search, { className: "h-4 w-4" })
            ]
          }
        )
      ] })
    ] }) })
  ] });
};
const scopeItems$1 = [
  "Website form to CRM integration",
  ,
  "Lead pipeline stages",
  ,
  "Follow-up reminders",
  ,
  "Lead source tagging",
  ,
  "Email notifications",
  ,
  "Weekly lead summary",
  ,
  "CRM cleanup and reporting"
];
const resultItems$1 = [
  "Cleaner enquiry capture from website forms",
  ,
  "Better visibility across every lead stage",
  ,
  "Fewer missed follow-ups and handoff gaps",
  ,
  "Clearer source reporting for marketing decisions",
  ,
  "Simple weekly summaries for owners and teams"
];
const bestForItems$1 = [
  "Consultants and advisory firms",
  ,
  "Accountants and finance consultants",
  ,
  "Recruitment agencies",
  ,
  "Legal and insurance advisors",
  ,
  "B2B service teams with scattered lead tracking"
];
const ProfessionalServicesCrmCleanupPage = () => /* @__PURE__ */ jsxs("main", { className: "min-h-screen bg-white text-slate-950", children: [
  /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-sky-50/70 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute -right-24 top-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" }),
    /* @__PURE__ */ jsx("div", { className: "absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" }),
    /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-7xl px-6 py-8 lg:px-8", children: [
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/#success-stories",
          className: "inline-flex items-center text-sm font-semibold text-slate-600 transition hover:text-sky-700",
          children: "← Back to success stories"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "mb-5 inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-700 shadow-sm", children: "UK Professional Services" }),
          /* @__PURE__ */ jsx("h1", { className: "max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl", children: "CRM & Lead Flow Cleanup for UK Professional Services" }),
          /* @__PURE__ */ jsx("p", { className: "mt-6 max-w-2xl text-lg leading-8 text-slate-600", children: "Primewayz UK helps consultants, accountants, recruitment firms, advisors, and B2B service teams clean up CRM workflows, website forms, lead tracking, follow-up tasks, and reporting visibility." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/#contact",
                className: "rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800",
                children: "Discuss your UK requirements"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/#pricing",
                className: "rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700",
                children: "View support plans"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "/images/professional-services-crm-cleanup.png",
            alt: "CRM and lead-flow cleanup dashboard for UK professional services showing website forms, lead stages, reminders, source tagging, and reporting.",
            className: "aspect-[16/10] w-full rounded-[1.5rem] object-cover",
            loading: "eager"
          }
        ) }) })
      ] })
    ] })
  ] }),
  /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-6 py-16 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-slate-950", children: "What we clean up" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-4", children: scopeItems$1.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3 text-sm leading-6 text-slate-600", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-black text-sky-700", children: "✓" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-[1.75rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-sm", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-black", children: "Expected outcome" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-4", children: resultItems$1.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3 text-sm leading-6 text-slate-200", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500 text-xs font-black text-white", children: "→" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-[1.75rem] border border-slate-200 bg-sky-50 p-7 shadow-sm", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-slate-950", children: "Best fit for" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-4", children: bestForItems$1.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3 text-sm leading-6 text-slate-700", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-sky-700", children: "•" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-10 rounded-[2rem] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-8 text-white shadow-xl shadow-slate-900/10 lg:p-10", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold uppercase tracking-[0.22em] text-sky-200", children: "Primewayz UK support sprint" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 text-2xl font-black tracking-tight sm:text-3xl", children: "Clean lead flow creates better follow-up visibility." }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-3xl text-sm leading-7 text-slate-300", children: "Start with a focused cleanup sprint, then continue with monthly support for improvements, reporting, tracking checks, and practical website updates." })
      ] }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/#contact",
          className: "inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-50",
          children: "Book a UK discovery call"
        }
      )
    ] }) })
  ] })
] });
const scopeItems = [
  "Product page updates",
  ,
  "Campaign landing pages",
  ,
  "Checkout flow checks",
  ,
  "GA4 conversion tracking",
  ,
  "Technical SEO checks",
  ,
  "Speed and mobile checks",
  ,
  "Backups and monthly support"
];
const resultItems = [
  "More reliable product and catalogue pages",
  ,
  "Smoother checkout checks during campaigns",
  ,
  "Cleaner conversion and campaign tracking",
  ,
  "Faster promotional and offer updates",
  ,
  "Monthly stability checks for store confidence"
];
const bestForItems = [
  "Small online stores",
  ,
  "Independent boutiques",
  ,
  "Specialist product sellers",
  ,
  "Subscription stores",
  ,
  "Catalogue-led e-commerce businesses"
];
const EcommerceStoreStabilitySupportPage = () => /* @__PURE__ */ jsxs("main", { className: "min-h-screen bg-white text-slate-950", children: [
  /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-sky-50/70 to-white", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute -right-24 top-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" }),
    /* @__PURE__ */ jsx("div", { className: "absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" }),
    /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-7xl px-6 py-8 lg:px-8", children: [
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/#success-stories",
          className: "inline-flex items-center text-sm font-semibold text-slate-600 transition hover:text-sky-700",
          children: "← Back to success stories"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "mb-5 inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-700 shadow-sm", children: "UK E-commerce SMEs" }),
          /* @__PURE__ */ jsx("h1", { className: "max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl", children: "E-commerce Store Stability & Support for UK SMEs" }),
          /* @__PURE__ */ jsx("p", { className: "mt-6 max-w-2xl text-lg leading-8 text-slate-600", children: "Primewayz UK supports small online stores, boutiques, specialist sellers, subscription stores, and catalogue-led businesses with stable product pages, reliable checkout journeys, clean campaign tracking, fast offer updates, and monthly website support." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/#contact",
                className: "rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800",
                children: "Discuss your UK requirements"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/#pricing",
                className: "rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700",
                children: "View support plans"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "/images/ecommerce-store-stability-support.png",
            alt: "E-commerce store stability and support dashboard showing product page reliability, checkout flow checks, campaign tracking, maintenance updates, and support for UK online stores.",
            className: "aspect-[16/10] w-full rounded-[1.5rem] object-cover",
            loading: "eager"
          }
        ) }) })
      ] })
    ] })
  ] }),
  /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-6 py-16 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-slate-950", children: "What we clean up" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-4", children: scopeItems.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3 text-sm leading-6 text-slate-600", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-black text-sky-700", children: "✓" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-[1.75rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-sm", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-black", children: "Expected outcome" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-4", children: resultItems.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3 text-sm leading-6 text-slate-200", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500 text-xs font-black text-white", children: "→" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-[1.75rem] border border-slate-200 bg-sky-50 p-7 shadow-sm", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-slate-950", children: "Best fit for" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-4", children: bestForItems.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3 text-sm leading-6 text-slate-700", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-sky-700", children: "•" }),
          /* @__PURE__ */ jsx("span", { children: item })
        ] }, item)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-10 rounded-[2rem] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-8 text-white shadow-xl shadow-slate-900/10 lg:p-10", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold uppercase tracking-[0.22em] text-sky-200", children: "Primewayz UK support sprint" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 text-2xl font-black tracking-tight sm:text-3xl", children: "Stable stores help teams focus on selling, not fixing." }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-3xl text-sm leading-7 text-slate-300", children: "Start with a focused cleanup sprint, then continue with monthly support for improvements, reporting, tracking checks, and practical website updates." })
      ] }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/#contact",
          className: "inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-50",
          children: "Book a UK discovery call"
        }
      )
    ] }) })
  ] })
] });
const ClientOnly = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return /* @__PURE__ */ jsx(Fragment, { children });
};
const MainContent = () => /* @__PURE__ */ jsxs("main", { children: [
  /* @__PURE__ */ jsx(Hero, {}),
  /* @__PURE__ */ jsx(UKTrustStrip, {}),
  /* @__PURE__ */ jsx(Philosophy, {}),
  /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true, margin: "-100px" }, transition: { duration: 1 }, children: /* @__PURE__ */ jsx(HowItWorks, {}) }),
  /* @__PURE__ */ jsx(InteractiveDemo, {}),
  /* @__PURE__ */ jsx(TechStack, {}),
  /* @__PURE__ */ jsx(Experience, {}),
  /* @__PURE__ */ jsx(Stats, {}),
  /* @__PURE__ */ jsx(ServicePathCards, {}),
  /* @__PURE__ */ jsx(Pricing, {}),
  /* @__PURE__ */ jsx(FAQ, {}),
  /* @__PURE__ */ jsx(SuccessStories, {}),
  /* @__PURE__ */ jsx(Testimonials, {}),
  /* @__PURE__ */ jsx(BlogSection, {}),
  /* @__PURE__ */ jsx(ContactForm, {}),
  /* @__PURE__ */ jsx("section", { className: "py-24 bg-emerald-600", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center", children: [
    /* @__PURE__ */ jsxs(motion.h2, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, className: "text-3xl md:text-5xl font-bold tracking-tight text-white mb-8", children: [
      "Ready to plan your next ",
      /* @__PURE__ */ jsx("br", {}),
      " delivery phase?"
    ] }),
    /* @__PURE__ */ jsx(motion.p, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: 0.1 }, className: "text-xl text-emerald-50 mb-12", children: "Start with Foundation Sprint, then move into the monthly delivery capacity that fits your roadmap." }),
    /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true }, transition: { delay: 0.2 }, children: /* @__PURE__ */ jsx(
      TrackedLink,
      {
        href: "#contact",
        ctaText: "Book a UK discovery call",
        ctaLocation: "final_cta",
        eventType: "book_call_click",
        className: "inline-block bg-white text-emerald-600 px-10 py-5 rounded-full text-xl font-bold hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-900/20",
        children: "Book a UK discovery call"
      }
    ) })
  ] }) })
] });
const App = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  return /* @__PURE__ */ jsxs("div", { className: "relative min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900", children: [
    /* @__PURE__ */ jsx(AnalyticsTracker, {}),
    !isAdmin && /* @__PURE__ */ jsx(Navbar, {}),
    !isAdmin && /* @__PURE__ */ jsx(ScrollToTop, {}),
    /* @__PURE__ */ jsxs(Routes, { children: [
      /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(MainContent, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/admin", element: /* @__PURE__ */ jsx(AdminPanel, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/admin/forgot-password", element: /* @__PURE__ */ jsx(AdminForgotPassword, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/admin/reset-password", element: /* @__PURE__ */ jsx(AdminResetPassword, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/blog", element: /* @__PURE__ */ jsx(BlogListPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/blog/:id", element: /* @__PURE__ */ jsx(BlogPost, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/software-development-subscription-uk", element: /* @__PURE__ */ jsx(SoftwareDevelopmentSubscriptionUkPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/website-maintenance-subscription-uk", element: /* @__PURE__ */ jsx(WebsiteMaintenanceSubscriptionUkPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/crm-integration-support-uk", element: /* @__PURE__ */ jsx(CrmIntegrationSupportUkPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/success-stories/local-trades-lead-capture", element: /* @__PURE__ */ jsx(LocalTradesLeadCapturePage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/success-stories/professional-services-crm-cleanup", element: /* @__PURE__ */ jsx(ProfessionalServicesCrmCleanupPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/success-stories/ecommerce-store-stability-support", element: /* @__PURE__ */ jsx(EcommerceStoreStabilitySupportPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/privacy-policy", element: /* @__PURE__ */ jsx(LegalPage, { type: "privacy" }) }),
      /* @__PURE__ */ jsx(Route, { path: "/terms-of-service", element: /* @__PURE__ */ jsx(LegalPage, { type: "terms" }) }),
      /* @__PURE__ */ jsx(Route, { path: "/cookie-policy", element: /* @__PURE__ */ jsx(LegalPage, { type: "cookies" }) })
    ] }),
    !isAdmin && /* @__PURE__ */ jsx(Footer, {}),
    !isAdmin && /* @__PURE__ */ jsx(ClientOnly, { children: /* @__PURE__ */ jsx(LiveChat, {}) })
  ] });
};
function render(url, basePath = "/") {
  const cleanBase = basePath === "/" ? "" : basePath.replace(/\/$/, "");
  const pathForRouter = cleanBase && url.startsWith(cleanBase) ? url.slice(cleanBase.length) || "/" : url || "/";
  const html = renderToString(
    /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(MemoryRouter, { initialEntries: [pathForRouter], children: /* @__PURE__ */ jsx(App, {}) }) })
  );
  return { html };
}
export {
  render
};
