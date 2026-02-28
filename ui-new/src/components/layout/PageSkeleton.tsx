type PageSkeletonProps = {
    cards?: number
}

export const PageSkeleton = ({cards = 4}: PageSkeletonProps) => {
    return (
        <div className="space-y-5 p-4 md:p-6">
            <div className="animate-pulse overflow-hidden rounded-2xl border border-cyan-900/20 bg-gradient-to-br from-[#12518b] via-[#1d6c88] to-[#2f8a6b] p-5 md:p-6">
                <div className="h-7 w-52 rounded bg-white/30"/>
                <div className="mt-3 h-4 w-80 max-w-full rounded bg-white/20"/>
                <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[0, 1, 2, 3].map((entry) => (
                        <div key={entry} className="h-16 rounded-lg bg-black/15"/>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="animate-pulse space-y-3">
                    {[...Array(cards)].map((_, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="h-4 w-40 rounded bg-gray-200"/>
                            <div className="mt-2 h-3 w-24 rounded bg-gray-200"/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
