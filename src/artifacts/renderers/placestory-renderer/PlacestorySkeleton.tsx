export const PlacestorySkeleton = () => {
  return (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="w-48 h-4 bg-gray-100 rounded animate-pulse" />
            <div className="w-24 h-3 bg-gray-50 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-50 rounded animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
        <div className="w-full h-[75vh] bg-gray-50 relative flex flex-col justify-end p-16 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent" />
          <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center gap-6">
            <div className="w-3/4 h-16 bg-gray-200 rounded-lg" />
            <div className="w-1/2 h-6 bg-gray-200 rounded-md" />
            <div className="w-1/3 h-4 bg-gray-200 rounded-md mt-4" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-12 space-y-8">
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
            <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-gray-100 rounded animate-pulse" />
          </div>

          <div className="w-full aspect-video bg-gray-50 rounded-xl animate-pulse flex items-center justify-center">
            <div className="text-gray-200">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
            <div className="w-5/6 h-4 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="w-full h-[600px] bg-gray-50 flex relative animate-pulse mt-8">
          <div className="absolute inset-0 bg-gray-100" />

          <div className="relative z-10 w-1/3 h-full p-6 space-y-4 overflow-hidden">
            <div className="w-full h-48 bg-white/80 backdrop-blur rounded-lg shadow-sm p-4 space-y-3">
              <div className="w-1/2 h-5 bg-gray-200 rounded" />
              <div className="w-full h-3 bg-gray-100 rounded" />
              <div className="w-3/4 h-3 bg-gray-100 rounded" />
            </div>
            <div className="w-full h-48 bg-white/60 backdrop-blur rounded-lg p-4 space-y-3 opacity-50">
              <div className="w-1/2 h-5 bg-gray-200 rounded" />
              <div className="w-full h-3 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-50">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-full px-6 py-3 flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-full h-full bg-indigo-400 rounded-full animate-ping opacity-20" />
            <div className="w-2 h-2 bg-indigo-500 rounded-full relative z-10" />
          </div>
          <span className="text-sm font-medium text-gray-600 animate-pulse">
            Designing Layout...
          </span>
        </div>
      </div>
    </div>
  );
};
