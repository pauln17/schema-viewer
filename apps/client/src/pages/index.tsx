import Image from 'next/image';
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen p-2">
      <nav className="text-white px-2 py-2 flex justify-end items-center">
        <Link href="/register" className="px-4 py-2 sm:py-3 rounded-lg border-white border-1 text-1xl flex items-end transition-all duration-100 ease-in-out hover:bg-gray-200 hover:text-black">
          <span>Launch App</span>
        </Link>
      </nav>
      <div className="flex flex-col justify-center items-center gap-4">
        <div className="flex flex-col text-white gap-1 items-center justify-center text-center">
          <h1 className="text-4xl sm:text-7xl">Schema Viewer</h1>
          <h2 className="text-2xl sm:text-4xl sm:mt-1">Infrastructure Modeled</h2>
          <p className="text-sm sm:text-xl max-w-2/3 sm:mt-2">Visualize, validate, and version your schemas in real time. Catch structural flaws early, collaborate safely, and ship with confidence.</p>
          <Link href="/register" className="border-white border-1 mt-8 px-4 py-2 sm:py-3 rounded-lg text-1xl sm:text-2xl flex items-end transition-all duration-100 ease-in-out hover:bg-gray-200 hover:text-black">
            <span>Get Started</span>
          </Link>
        </div>
        <div className="mt-8 border-white border-1 px-16 py-4 rounded-lg flex justify-center items-center">
          <Image
            src="/techstack.png"
            alt="Technology Stack"
            width={850}
            height={850}
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
