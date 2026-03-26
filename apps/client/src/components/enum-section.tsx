import { useState } from "react";
import { type Socket } from "socket.io-client";

import { useSchemaActions } from "@/hooks/useSchemaActions";
import { normalizeIdentifier } from "@/lib/schema-to-sql";
import type { Enum, Schema } from "@/types/schema";

export function EnumSection({ enum: enumItem, schema, token, socket }: { enum: Enum; schema: Schema; token: string | undefined, socket: Socket | undefined }) {
  const { deleteEnum, renameEnum, renameEnumOption, addEnumOption, removeEnumOption } = useSchemaActions(schema, token, socket);
  const [expanded, setExpanded] = useState(false);
  const [editingEnumName, setEditingEnumName] = useState(false);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const enumOptions = enumItem.options ?? [];

  return (
    <div
      className={`rounded-lg overflow-hidden border transition-colors ${expanded ? "border-white/[0.1] bg-white/[0.02]" : "border-white/[0.06]"}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
          )
            return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className={`cursor-pointer group w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${expanded ? "bg-white/[0.05] border-b border-white/[0.06]" : "hover:bg-white/[0.04]"}`}
      >
        <svg
          className={`w-3 h-3 text-neutral-500 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <svg
          className="w-4 h-4 text-emerald-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        <div
          className="flex items-center shrink-0 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {editingEnumName ? (
            <input
              type="text"
              defaultValue={enumItem.name}
              className="min-w-[80px] h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-blue-500/50 box-border text-sm"
              onBlur={(e) => {
                const newName = normalizeIdentifier(e.target.value);
                if (newName && newName !== enumItem.name)
                  renameEnum(enumItem.name, newName);
                setEditingEnumName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingEnumName(false);
              }}
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingEnumName(true);
              }}
              className={`text-left text-sm truncate max-w-[180px] transition-colors cursor-pointer hover:text-white ${expanded ? "text-white font-medium" : "text-neutral-200"}`}
            >
              {enumItem.name}
            </button>
          )}
        </div>
        <div
          className="ml-auto flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-neutral-500 font-mono">
            {enumOptions.length}
          </span>
          <button
            type="button"
            onClick={() => deleteEnum(enumItem.name)}
            className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
            title="Delete Enum"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
          </button>
        </div>
      </div>
      {expanded && (
        <div>
          {enumOptions.map((value) => (
            <div
              key={value}
              className="flex items-center gap-2 px-3 py-1.5 ml-3 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0" />
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {editingValue === value ? (
                  <input
                    type="text"
                    defaultValue={value}
                    className="flex-1 min-w-0 h-5 px-1.5 text-[10px] font-mono leading-none bg-white/[0.06] border border-white/[0.08] rounded text-neutral-300 placeholder-neutral-600 outline-none focus:border-emerald-500/50 box-border text-xs"
                    onBlur={(e) => {
                      const newValue = normalizeIdentifier(e.target.value);
                      if (newValue && newValue !== value) {
                        renameEnumOption(enumItem.name, value, newValue);
                      }
                      setEditingValue(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingValue(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingValue(value)}
                    className="text-left text-xs text-neutral-300 font-mono truncate cursor-pointer hover:text-white transition-colors"
                  >
                    {value}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeEnumOption(enumItem.name, value)}
                className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0 cursor-pointer"
                title="Delete Value"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12" /></svg>
              </button>
            </div>
          ))}

          <button
            onClick={() => addEnumOption(enumItem.name)}
            className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-2 text-neutral-500 hover:text-emerald-400 hover:bg-white/[0.04] transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-xs">Add Value</span>
          </button>
        </div>
      )}
    </div>
  );
}
