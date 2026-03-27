import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import { Schema } from "@/types/schema";

export const useQuerySchema = (token: string | undefined) => {
    const router = useRouter();
    const { data, isFetching } = useQuery<Schema | undefined>({
        queryKey: ["schema", token],
        queryFn: async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/schemas`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                if (res.status >= 400) {
                    router.push("/editor");
                    return;
                }
                const data = await res.json();
                return data;
            } catch (e) {
                toast.error(`Server Error: ${e instanceof Error ? e.message : "Unknown Error"}`, {
                    onClose: () => router.push("/editor"),
                });
            }
        },
        enabled: !!token && router.isReady
    });

    return { data, isFetching };
}