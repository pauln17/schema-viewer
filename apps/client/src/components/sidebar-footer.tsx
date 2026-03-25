import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "react-toastify";

import { schemaToSql } from "@/lib/schema-to-sql";
import { sqlToSchema } from "@/lib/sql-to-schema";
import type { Schema } from "@/types/schema";

export function SidebarFooter({ schema, token }: { schema: Schema; token: string | undefined }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { tables, enums } = schema.definition;
  const columnCount = tables.reduce((n, t) => n + (t.columns?.length ?? 0), 0);

  return (
    <div className="shrink-0 px-4 py-3 border-t border-white/[0.06] space-y-2">
      <p className="text-[10px] text-neutral-600 text-center">
        {[
          `${tables.length} Table${tables.length !== 1 ? "s" : ""}`,
          `${enums.length} Enum${enums.length !== 1 ? "s" : ""}`,
          ...(tables.length > 0 ? [`${columnCount} Columns`] : []),
        ].join(" · ")}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] text-xs text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 640 640" fill="currentColor">
            <path d="M352 173.3V384c0 17.7-14.3 32-32 32s-32-14.3-32-32V173.3l-41.4 41.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l96-96c12.5 12.5 32.8 12.5 45.3 0l96 96c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM320 464c44.2 0 80-35.8 80-80h80c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H160c-35.3 0-64-28.7-64-64v-32c0-35.3 28.7-64 64-64h80c0 44.2 35.8 80 80 80m144 24c13.3 0 24-10.7 24-24s-10.7-24-24-24s-24-10.7-24-24s10.7-24 24-24" />
          </svg>
          Import
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".sql"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.name.toLowerCase().endsWith(".sql")) {
              toast.warn("Invalid File Type", {
                position: "bottom-center",
                autoClose: 3000,
                pauseOnHover: false,
                closeOnClick: true,
                theme: "dark",
              });
              e.target.value = "";
              return;
            }
            const MAX_SIZE_BYTES = 5 * 1024 * 1024;
            if (file.size > MAX_SIZE_BYTES) {
              toast.error("Max 5MB Allowed", {
                position: "bottom-center",
                autoClose: 3000,
                pauseOnHover: false,
                closeOnClick: true,
                theme: "dark",
              });
              e.target.value = "";
              return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
              const text = ev.target?.result as string;
              try {
                queryClient.setQueryData(["schema", token], sqlToSchema(text));
              } catch (err) {
                toast.error("Invalid SQL", {
                  position: "bottom-center",
                  autoClose: 3000,
                  pauseOnHover: false,
                  closeOnClick: true,
                  theme: "dark",
                });
                console.error(err);
              }
            };
            reader.readAsText(file);
          }}
        />
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] text-xs text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
          onClick={() => {
            if (tables.length === 0 && enums.length === 0) {
              toast.warn("Empty Database", {
                position: "bottom-center",
                autoClose: 3000,
                pauseOnHover: false,
                closeOnClick: true,
                theme: "dark",
              });
              return;
            }
            try {
              const sql = schemaToSql(schema, "postgres");
              const blob = new Blob([sql], { type: "text/sql" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${schema.name.toLowerCase().trim().split(/\s+/).join("-")}-postgres.sql`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (err) {
              toast.error("Failed to export schema", {
                position: "bottom-center",
                autoClose: 3000,
                pauseOnHover: false,
                closeOnClick: true,
                theme: "dark",
              });
              console.error(err);
            }
          }}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 640 640" fill="currentColor">
            <path d="M352 96c0-17.7-14.3-32-32-32s-32 14.3-32 32v210.7l-41.4-41.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5-32.8 0-45.3l96-96c12.5 12.5 32.8 12.5 45.3 0l96-96c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L352 306.7zM160 384c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64v-32c0-35.3-28.7-64-64-64h-46.9l-56.6 56.6c-31.2 31.2-81.9 31.2-113.1 0L206.9 384zm304 56c13.3 0 24 10.7 24 24s-10.7 24-24 24s-24-10.7-24-24s10.7-24 24-24" />
          </svg>
          Export
        </button>
      </div>
    </div>
  );
}
