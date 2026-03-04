import Image from "next/image";
import Navbar from "@/components/navbar";
import ActionCard from "@/components/action-card";

export default function Root() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
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
          <ActionCard
            icon="/folder.png"
            title="Create Schema"
            description="Start with Empty Canvas"
            size={100}
            href="/editor"
          />
          <ActionCard
            icon="/upload.png"
            title="Parse SQL File"
            description="Upload or Paste SQL"
            size={85}
            href="/editor?parse=true"
          />
        </div>
      </main>
    </div>
  );
}
