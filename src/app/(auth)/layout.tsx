// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex">
            {/* Left: Form panel */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-sm">{children}</div>
            </div>

            {/* Right: Decorative panel — hidden on mobile */}
            <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 relative overflow-hidden">
                {/* Abstract background circles */}
                <div className="absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full bg-white/5" />
                <div className="absolute bottom-[-5%] left-[-5%] w-96 h-96 rounded-full bg-white/5" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.03]" />

                <div className="relative z-10 text-center max-w-md space-y-6">
                    {/* Fake Kanban preview */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-8">
                        <div className="flex gap-3">
                            {["To Do", "In Progress", "Done"].map((col, ci) => (
                                <div key={col} className="flex-1 space-y-2">
                                    <div className="text-white/70 text-xs font-medium px-1">{col}</div>
                                    {[...Array(ci === 1 ? 3 : 2)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="bg-white/15 rounded-lg p-2 space-y-1"
                                        >
                                            <div
                                                className="h-2 rounded bg-white/40"
                                                style={{ width: `${60 + (i * 15 + ci * 10) % 35}%` }}
                                            />
                                            <div
                                                className="h-1.5 rounded bg-white/20"
                                                style={{ width: `${40 + (i * 20 + ci * 5) % 40}%` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white leading-tight">
                        Organise anything,<br />together.
                    </h2>
                    <p className="text-blue-200 text-base leading-relaxed">
                        Boards, lists, and cards give you a clear visual to tackle your biggest work challenges.
                    </p>

                    <div className="flex items-center justify-center gap-6 pt-4">
                        {["Boards", "Lists", "Cards", "Teams"].map((f) => (
                            <div key={f} className="text-center">
                                <div className="h-1 w-8 rounded-full bg-blue-300 mx-auto mb-2" />
                                <span className="text-blue-200 text-xs">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}