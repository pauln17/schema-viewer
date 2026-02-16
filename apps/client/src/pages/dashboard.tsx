import { useRouter } from "next/router";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session) router.replace("/login");
  }, [session]);

  return (
    <nav className="text-white px-6 py-4 border-b-2 border-gray-800 flex justify-between items-center">
      <div className="">Schema Explorer</div>
    </nav>
  );
}
