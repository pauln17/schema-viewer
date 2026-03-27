import { useMutation, useQueryClient } from "@tanstack/react-query";
import router from "next/router";
import { toast } from "react-toastify";

export const useNewToken = (token: string | undefined) => {
    const queryClient = useQueryClient();

    const { mutate: newToken, isPending: isGenerating } = useMutation({
        mutationFn: async () => {
            if (!token) throw new Error("No token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/schemas/token`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error("Regenerate Token Failed");
            const data = await res.json();
            return data.token;
        },
        onSuccess: (newToken) => {
            queryClient.removeQueries({ queryKey: ["schema", token] });
            localStorage.setItem("OPEN_SHARE_AFTER_SAVE", "true");
            router.push(`/editor/${newToken}`);
        },
        onError: (error) => {
            toast.error(`Regenerate Token Failed: ${error instanceof Error ? error.message : "Unknown Error"}`);
        },
    });

    return { newToken, isGenerating };
}