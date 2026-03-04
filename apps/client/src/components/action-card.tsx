import Image from "next/image";
import Link from "next/link";

interface ActionCard {
  icon: string;
  title: string;
  description: string;
  size: number;
  href: string;
}

export default function ActionCard({ icon, title, description, size, href }: ActionCard) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-neutral-500 px-12 py-10 transition-colors hover:border-neutral-300 cursor-pointer">
      <div className="flex h-20 items-center justify-center">
        <Image src={icon} alt={title} width={size} height={size} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-neutral-400">{description}</p>
      <Link
        href={href}
        className="mt-2 w-full rounded-lg border border-neutral-400 px-6 py-2.5 text-center text-sm text-white transition-colors hover:border-neutral-200 hover:bg-neutral-800"
      >
        {title} &rarr;
      </Link>
    </div>
  );
}
