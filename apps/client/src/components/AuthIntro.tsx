import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthIntro(): ReactNode {
  return (
    <div className="hidden md:grid grid-rows-[50%_50%] place-items-center h-full bg-[radial-gradient(ellipse_250%_150%_at_bottom,_black_30%,_#6D28D9_40%,_#A855F7_50%,_#E0B4FF_75%,_#D4C4E0_95%)] rounded-4xl shadow-[inset_0_0_30px_rgba(0,0,0,0.75)]">
      <div></div>
      <div className="flex flex-col items-center justify-center max-w-md">
        <Link href="/" className="text-white text-4xl mb-2">
          Schema Viewer
        </Link>
        <p className="text-center mb-8">
          Expose invisible schema problems before they surface in production
        </p>
        <div className="flex flex-col gap-4 w-fit">
          <div className="w-full p-4 rounded-lg bg-gray-200 text-black items-start justify-start flex gap-3 pr-16 font-bold">
            <span className="rounded-full w-6 h-6 bg-black text-white text-xs flex items-center justify-center">
              1
            </span>
            <p>Access your account</p>
          </div>
          <div className="w-full px-4 py-4 rounded-lg bg-gray-800 text-white items-center justify-start flex gap-3 pr-16">
            <span className="rounded-full w-6 h-6 bg-gray-700 text-white text-xs flex items-center justify-center">
              2
            </span>
            <p>Build, share and collaborate</p>
          </div>
          <div className="w-full px-4 py-4 rounded-lg bg-gray-800 text-white items-center justify-start flex gap-3 pr-16">
            <span className="rounded-full w-6 h-6 bg-gray-700 text-white text-xs flex items-center justify-center">
              3
            </span>
            <p>Refine and ship</p>
          </div>
        </div>
      </div>
    </div>
  );
}
