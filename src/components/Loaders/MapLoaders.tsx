import { Loader2 } from "lucide-react";

export const InitialLoadingCircle = () => {
  return (
    <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-99">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#2f45ff]" />
        <h3 className="text-xl mt-4">Loading...</h3>
      </div>
    </div>
  );
};
