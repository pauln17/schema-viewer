import { memo } from "react";

import { useSchemaActions } from "@/hooks/useSchemaActions";
import type { Schema } from "@/types/schema";

import { EnumSection } from "./enum-section";
import { SidebarFooter } from "./sidebar-footer";
import { TableSection } from "./table-section";

function EditorSidebar({ schema, token }: { schema: Schema; token: string | undefined }) {
  const { tables, enums } = schema.definition;
  const { createTable, createEnum } = useSchemaActions(schema, token);

  return (
    <div className="w-full min-w-0 h-full bg-[#070707] flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="shrink-0 w-full min-w-0 px-4 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
            Tables
          </h3>
          <button
            onClick={createTable}
            className="cursor-pointer text-neutral-500 hover:text-blue-400 transition-colors p-1 rounded-md hover:bg-white/[0.06]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-4 pb-4">
          <div className="space-y-2">
            {tables.map((table) => (
              <TableSection
                key={table.name}
                table={table}
                schema={schema}
                token={token}
              />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
                Enums
              </h3>
              <button
                onClick={createEnum}
                className="cursor-pointer text-neutral-500 hover:text-emerald-400 transition-colors p-1 rounded-md hover:bg-white/[0.06]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 pb-2">
              {enums.map((enumItem) => (
                <EnumSection
                  key={enumItem.name}
                  enum={enumItem}
                  schema={schema}
                  token={token}
                />
              ))}
            </div>
          </div>
        </div>

        <SidebarFooter schema={schema} token={token} />
      </div>
    </div>
  );
}

export default memo(EditorSidebar);
