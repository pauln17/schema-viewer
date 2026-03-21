import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Editor from '../editor';
import { Schema } from '@/types/schema';

export default function EditorWithToken() {
  const router = useRouter();
  const token = router.query.token as string | undefined;
  const queryClient = useQueryClient();

  const { data: schema, isLoading } = useQuery<Schema | null>({
    queryKey: ["schema", token],
    queryFn: async () => {
      try {
        const res = await fetch("http://localhost:5001/schemas", {
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
        const msg = e instanceof Error ? e.message.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown Error";
        toast.error(`Server Error: ${msg}`, {
          position: "bottom-center",
          autoClose: 3000,
          pauseOnHover: false,
          closeOnClick: true,
          theme: "dark",
          onClose: () => router.push("/editor"),
        });
      }
    },
    enabled: !!token && router.isReady
  });

  const { mutate: saveSchema, isPending } = useMutation({
    mutationFn: async () => {
      const raw = queryClient.getQueryData<Schema>(["schema", token]);
      const cacheData = {
        name: raw?.name ?? "Untitled",
        definition: raw?.definition ?? { enums: [], tables: [] },
      };
      if (token === undefined) {
        const res = await fetch("http://localhost:5001/schemas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cacheData),
        });
        if (!res.ok) throw new Error("Failed to Create Schema");
        return res.json();
      } else {
        const res = await fetch("http://localhost:5001/schemas", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cacheData),
        });
        if (!res.ok) throw new Error("Failed to Save Schema");
        return res.json();
      }
    },
    onSuccess: (data) => {
      if (data.token) {
        queryClient.setQueryData(["schema", undefined], {
          name: "Untitled",
          definition: { tables: [], enums: [] },
        });
        router.push(`/editor/${data.token}`);
      }
      // PUT Returns Schema Directly; POST Returns { Schema, Token }
      const saved = data.schema ?? data;
      if (token) {
        queryClient.setQueryData(["schema", token], saved);
      }
    },
  });

  const updateQueryCache = useCallback(
    (data: Schema) => {
      queryClient.setQueryData(["schema", token], data);
    },
    [queryClient, token],
  );

  return <Editor schema={schema ?? null} token={token ?? undefined} isLoading={isLoading} saveSchema={saveSchema} isPending={isPending} updateQueryCache={updateQueryCache} />;
}