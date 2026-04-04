import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import { Schema } from "@/types/schema";

export const useCreateSchema = (token: string | undefined) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const schema = queryClient.getQueryData<Schema>(["schema", token]) ?? {
    name: "Untitled",
    definition: { tables: [], enums: [] },
  };

  const { mutate: createSchema, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/schemas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schema),
      });
      if (!res.ok) throw new Error("Create Schema Failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["schema", token], {
        name: "",
        definition: { tables: [], enums: [] },
      });
      router.push(`/editor/${data.token}`);
    },
    onError: (error) => {
      toast.error(
        `${error instanceof Error ? error.message : "Unknown Error"}`,
      );
    },
  });

  return { createSchema, isCreating };
};
