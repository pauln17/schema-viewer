import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { Schema } from "@/types/schema";

export const useUpdateSchema = (token: string | undefined) => {
    const queryClient = useQueryClient();

    const schema = queryClient.getQueryData<Schema>(["schema", token]);

    const { mutate: updateSchema, isPending: isUpdating } = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/schemas`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(schema),
            });
            if (!res.ok) throw new Error("Update Schema Failed");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["schema", token], data);
        },
        onError: (error) => {
            toast.error(`${error instanceof Error ? error.message : "Unknown Error"}`);
        },
    });

    return { updateSchema, isUpdating };
}