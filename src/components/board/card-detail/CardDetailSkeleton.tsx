"use client";

export default function CardDetailSkeleton() {
    return (
        <div className="flex flex-col flex-1 min-h-[480px] animate-pulse">
            <div className="h-24 sm:h-28 bg-slate-100 shrink-0" />
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                <div className="flex-1 p-4 sm:p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-200">
                    <div className="flex gap-3">
                        <div className="h-5 w-5 rounded-full bg-slate-100 mt-2" />
                        <div className="h-8 flex-1 bg-slate-100 rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-8 w-20 bg-slate-100 rounded-lg" />
                        ))}
                    </div>
                    <div className="h-6 w-24 bg-slate-100 rounded" />
                    <div className="h-20 w-full bg-slate-100 rounded-lg" />
                    <div className="h-16 w-full bg-slate-100 rounded-lg" />
                </div>
                <div className="lg:w-[42%] p-4 sm:p-6 space-y-4">
                    <div className="h-5 w-40 bg-slate-100 rounded" />
                    <div className="h-10 w-full bg-slate-100 rounded-lg" />
                    <div className="h-24 w-full bg-slate-100 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
