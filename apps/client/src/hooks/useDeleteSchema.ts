import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

export const useDeleteSchema = (token: string | undefined) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: deleteSchema, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No Token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/schemas`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Delete Schema Failed");
      if (res.status === 204) return;
    },
    onSuccess: async () => {
      if (token) queryClient.removeQueries({ queryKey: ["schema", token] });
      router.push("/editor");
      toast.success("Schema Deleted Successfully");
    },
    onError: (error) => {
      toast.error(
        `${error instanceof Error ? error.message : "Unknown Error"}`,
      );
    },
  });

  return { deleteSchema, isDeleting };
};
