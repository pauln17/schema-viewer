import Image from "next/image";
import Link from "next/link";

export default function Root() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex justify-between items-center p-4 text-white border-b-1">
        <div className="flex items-center gap-16">
          <div className="flex items-center gap-4">
            <a href="/"><Image src="/logo.png" alt="Schema" width={45} height={45} /></a>
            <Link href="/" className="text-2xl">Schema Studio</Link>
          </div>
        </div>
        <a href="https://github.com/pauln17/schema-viewer" target="_blank" rel="noopener noreferrer">
          <Image src="/github.png" alt="GitHub" width={40} height={40} className="cursor-pointer" />
        </a>
      </div>
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 pb-32">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-3 text-center">
          <a href="/"><Image src="/logo.png" alt="Schema Studio" width={100} height={100} className="mb-12" /></a>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Visualize Your Database Schema
          </h1>
          <p className="text-lg text-neutral-300">
            Create from scratch or parse an existing SQL file.
          </p>
        </div>
        {/* Action Cards */}
        <div className="flex flex-wrap justify-center gap-8">
          <Link
            href="/editor"
            className="flex flex-col items-center gap-4 rounded-xl border-2 border-neutral-500 px-12 py-10 transition-colors hover:border-neutral-300 cursor-pointer"
          >
            <div className="flex h-20 items-center justify-center">
              <Image src="/folder.png" alt="Create Schema" width={100} height={100} />
            </div>
            <h3 className="text-lg font-semibold text-white">Create Schema</h3>
            <p className="text-sm text-neutral-400">Start with Empty Canvas</p>
            <span className="mt-2 w-full rounded-lg border border-neutral-400 px-6 py-2.5 text-center text-sm text-white transition-colors hover:border-neutral-200 hover:bg-neutral-800">
              Create Schema →
            </span>
          </Link>
          <Link
            href="/editor"
            className="flex flex-col items-center gap-4 rounded-xl border-2 border-neutral-500 px-12 py-10 transition-colors hover:border-neutral-300 cursor-pointer"
          >
            <div className="flex h-20 items-center justify-center">
              <Image src="/upload.png" alt="Parse SQL File" width={85} height={85} />
            </div>
            <h3 className="text-lg font-semibold text-white">Parse SQL File</h3>
            <p className="text-sm text-neutral-400">Upload or Paste SQL</p>
            <span className="mt-2 w-full rounded-lg border border-neutral-400 px-6 py-2.5 text-center text-sm text-white transition-colors hover:border-neutral-200 hover:bg-neutral-800">
              Parse SQL File →
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
