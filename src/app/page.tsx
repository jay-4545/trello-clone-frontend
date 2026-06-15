"use client";
import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Zap,
  ArrowRight,
  Star,
  Globe,
  Shield,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { APP_NAME } from "@/lib/brand";

export default function HomePage() {
  const isLoggedIn = useAuthToken();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-600 shadow-sm shadow-blue-300 shrink-0">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight truncate">
              {APP_NAME}
            </span>
          </div>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              How it works
            </a>
            {!isLoggedIn && (
              <a
                href="#pricing"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Pricing
              </a>
            )}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {isLoggedIn ? (
              <Link
                href="/workspaces"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3 sm:px-4 py-2.5 rounded-lg shadow-sm transition-colors"
              >
                <span className="hidden sm:inline">Go to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors px-3 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3 sm:px-4 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                  <span className="hidden sm:inline">Get started free</span>
                  <span className="sm:hidden">Sign up</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1">
            <a
              href="#features"
              onClick={() => setMobileNavOpen(false)}
              className="px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileNavOpen(false)}
              className="px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              How it works
            </a>
            {!isLoggedIn && (
              <a
                href="#pricing"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Pricing
              </a>
            )}
            {!isLoggedIn && (
              <Link
                href="/login"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                Log in
              </Link>
            )}
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-15%] right-[-8%] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-blue-100 text-xs font-medium mb-6 border border-white/20">
                <Star className="h-3 w-3 fill-blue-200 text-blue-200" />
                Trusted by 10,000+ teams worldwide
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
                Organise your
                <br />
                <span className="text-blue-200">team&apos;s work,</span>
                <br />
                visually.
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed mb-10 max-w-md">
                Boards, lists and cards help you manage tasks with total clarity.
                From sprint planning to launch day — {APP_NAME} keeps your team
                aligned.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {isLoggedIn ? (
                  <Link
                    href="/workspaces"
                    className="inline-flex items-center gap-2 text-base font-semibold text-blue-700 bg-white hover:bg-blue-50 active:bg-blue-100 px-6 py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-colors"
                  >
                    Open Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 text-base font-semibold text-blue-700 bg-white hover:bg-blue-50 active:bg-blue-100 px-6 py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-colors"
                    >
                      Start for free
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-base font-medium text-white/90 hover:text-white border border-white/30 hover:border-white/60 px-6 py-3.5 rounded-xl transition-all"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/15">
                {[
                  { label: "Active boards", value: "50K+" },
                  { label: "Tasks completed", value: "2M+" },
                  { label: "Teams", value: "10K+" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-blue-200 text-xs mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Kanban preview */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-2xl shadow-blue-900/30">
                {/* Board header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-300" />
                    <span className="text-white/80 text-sm font-medium">
                      Product Roadmap
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c) => (
                      <div key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />
                    ))}
                  </div>
                </div>

                {/* Columns */}
                <div className="flex gap-3">
                  {[
                    {
                      name: "To Do",
                      cards: [
                        { title: "Design system audit", priority: "high", tag: "Design" },
                        { title: "API documentation", priority: "medium", tag: "Backend" },
                      ],
                    },
                    {
                      name: "In Progress",
                      cards: [
                        { title: "User auth flow", priority: "critical", tag: "Frontend" },
                        { title: "Database schema", priority: "high", tag: "Backend" },
                        { title: "Dashboard layout", priority: "medium", tag: "Design" },
                      ],
                    },
                    {
                      name: "Done",
                      cards: [
                        { title: "Project setup", priority: "low", tag: "Dev" },
                        { title: "Team onboarding", priority: "medium", tag: "People" },
                      ],
                    },
                  ].map((col) => (
                    <div key={col.name} className="flex-1">
                      <div className="text-white/60 text-xs font-semibold uppercase tracking-wider px-1 mb-2">
                        {col.name}
                        <span className="ml-1.5 text-white/40">{col.cards.length}</span>
                      </div>
                      <div className="space-y-2">
                        {col.cards.map((card) => (
                          <div
                            key={card.title}
                            className="bg-white/15 hover:bg-white/20 rounded-xl p-3 border border-white/10 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                  card.priority === "critical"
                                    ? "bg-red-500/30 text-red-200"
                                    : card.priority === "high"
                                    ? "bg-orange-500/30 text-orange-200"
                                    : "bg-blue-400/30 text-blue-200"
                                }`}
                              >
                                {card.priority}
                              </span>
                              <span className="text-[9px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded-full">
                                {card.tag}
                              </span>
                            </div>
                            <p className="text-white/85 text-xs leading-snug">
                              {card.title}
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              {[...Array(3)].map((_, i) => (
                                <div
                                  key={i}
                                  className="h-4 w-4 rounded-full bg-white/20 border border-white/10"
                                  style={{ marginLeft: i > 0 ? "-4px" : "0" }}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Everything your team needs
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              From simple task tracking to complex project management — {APP_NAME}
              adapts to your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: LayoutDashboard,
                color: "bg-blue-100 text-blue-600",
                title: "Boards & Lists",
                desc: "Visualise your workflow with customisable Kanban boards. Move cards between lists with drag-and-drop.",
              },
              {
                icon: CheckSquare,
                color: "bg-green-100 text-green-600",
                title: "Checklists & Due Dates",
                desc: "Break tasks into sub-items. Set deadlines and get notified before things slip through the cracks.",
              },
              {
                icon: Users,
                color: "bg-purple-100 text-purple-600",
                title: "Team Collaboration",
                desc: "Invite members to workspaces. Assign roles, mention teammates, and discuss in card comments.",
              },
              {
                icon: Zap,
                color: "bg-amber-100 text-amber-600",
                title: "Real-time Updates",
                desc: "See changes instantly across your team via WebSocket. No more refreshing to see the latest status.",
              },
              {
                icon: Globe,
                color: "bg-indigo-100 text-indigo-600",
                title: "Multiple Workspaces",
                desc: "Manage several projects or clients in isolated workspaces. Switch context without losing focus.",
              },
              {
                icon: Shield,
                color: "bg-rose-100 text-rose-600",
                title: "Secure by Default",
                desc: "JWT tokens with auto-rotation, account lock protection, and role-based access control.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
              >
                <div
                  className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${f.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-slate-900 font-semibold text-base mb-2">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Up and running in minutes
            </h2>
            <p className="text-slate-500 text-lg">
              Three simple steps to get your team organised.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create a workspace",
                desc: "Sign up and set up your first workspace for your team or project in seconds.",
              },
              {
                step: "02",
                title: "Build your board",
                desc: "Add lists and cards to map out your workflow. Customise colours and labels.",
              },
              {
                step: "03",
                title: "Invite your team",
                desc: "Add team members, assign tasks, and track progress together in real time.",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-start">
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px border-t-2 border-dashed border-slate-200 -translate-x-4 z-0" />
                )}
                <div className="relative z-10 flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-600 text-white font-bold text-sm mb-5 shadow-md shadow-blue-200">
                  {s.step}
                </div>
                <h3 className="text-slate-900 font-semibold text-base mb-2">
                  {s.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-500 text-lg">
              Start free. Upgrade when your team grows.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                desc: "For individuals and small teams getting started.",
                features: ["Unlimited boards", "Workspaces & members", "Real-time sync", "Card attachments"],
                cta: "Get started free",
                highlight: false,
              },
              {
                name: "Team",
                price: "$8",
                period: "per user / month",
                desc: "For growing teams that need more control.",
                features: ["Everything in Free", "Advanced permissions", "Board stats", "Priority support"],
                cta: "Start team trial",
                highlight: true,
              },
              {
                name: "Business",
                price: "$12",
                period: "per user / month",
                desc: "For organisations with advanced needs.",
                features: ["Everything in Team", "Admin dashboard", "Audit logs", "SSO ready"],
                cta: "Contact sales",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-blue-500 bg-white shadow-lg shadow-blue-100 ring-1 ring-blue-500"
                    : "border-slate-200 bg-white"
                }`}
              >
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-3 mb-2">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500 ml-1">{plan.period}</span>
                </div>
                <p className="text-sm text-slate-500 mb-6">{plan.desc}</p>
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-slate-600 flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-blue-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${
                    plan.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      {!isLoggedIn && (
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to get organised?
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Join thousands of teams already using {APP_NAME}. Free forever for
              small teams.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-base font-semibold text-blue-700 bg-white hover:bg-blue-50 px-8 py-4 rounded-xl shadow-lg transition-colors"
            >
              Create your free account
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-md bg-blue-600">
              <LayoutDashboard className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">{APP_NAME}</span>
          </div>
          <p className="text-xs">
            © {new Date().getFullYear()} {APP_NAME}. Built with ❤️ for productive teams.
          </p>
          <div className="flex items-center gap-4 text-xs">
            {isLoggedIn ? (
              <Link href="/workspaces" className="hover:text-white transition-colors">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/register" className="hover:text-white transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
