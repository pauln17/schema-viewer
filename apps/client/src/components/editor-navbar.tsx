import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/modal";
import { Schema } from "@/types/schema";
import { useRouter } from "next/navigation";

interface EditorNavbarProps {
  schema: Schema | null;
  token: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  saveSchema: () => void;
  isPending: boolean;
  isSaved: boolean;
}

export default function EditorNavbar({
  schema,
  token,
  activeTab,
  onTabChange,
  saveSchema,
  isPending,
  isSaved,
}: EditorNavbarProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `localhost:3000/editor/${token}`;

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No token");
      const res = await fetch("http://localhost:5001/schemas/token", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to generate new token");
      }
      const data = await res.json();
      return data.token as string;
    },
    onSuccess: (newToken) => {
      queryClient.removeQueries({ queryKey: ["schema", token] });
      router.push(`/editor/${newToken}`);
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGenerateLink = () => {
    if (!token) return;
    if (!isSaved) {
      const ok = window.confirm(
        "You have unsaved changes. Generate a new link anyway?"
      );
      if (!ok) return;
    }
    generateLinkMutation.mutate();
  };

  useEffect(() => {
    if (localStorage.getItem("OPEN_SHARE_AFTER_SAVE")) {
      setIsShareOpen(true);
      localStorage.removeItem("OPEN_SHARE_AFTER_SAVE");
    }
  }, []);

  return (
    <div className="flex items-center justify-between px-4 border-b border-white/[0.06] bg-black">
      {/* Left: Tabs */}
      <div className="flex items-center">
        {/* Editor */}
        <button
          onClick={() => onTabChange("editor")}
          className={`relative px-5 py-3.5 text-base font-medium cursor-pointer transition-colors ${activeTab === "editor"
            ? "text-white"
            : "text-neutral-500 hover:text-neutral-300"
            }`}
        >
          Editor
          {activeTab === "editor" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
          )}
        </button>

        {/* SQL */}
        <button
          onClick={() => onTabChange("sql")}
          className={`relative px-5 py-3.5 text-base font-medium cursor-pointer transition-colors ${activeTab === "sql"
            ? "text-white"
            : "text-neutral-500 hover:text-neutral-300"
            }`}
        >
          SQL
          {activeTab === "sql" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Undo */}
        <button
          className="p-3 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
          title="Undo"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4"
            />
          </svg>
        </button>
        {/* Redo */}
        <button
          className="p-3 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
          title="Redo"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4"
            />
          </svg>
        </button>

        <div className="w-px h-5 bg-white/[0.1] mx-2" />

        {/* Save */}
        <button
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium min-w-[5rem] cursor-pointer transition-colors disabled:opacity-80 ${token && isSaved && !isPending
            ? "text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 cursor-default"
            : "text-white bg-blue-600 hover:bg-blue-500"
            }`}
          title={token ? (isSaved ? "All Changes Saved" : "Save Changes") : "Save and Get Shareable Link"}
          onClick={
            token
              ? isSaved
                ? undefined
                : saveSchema
              : () => {
                saveSchema();
                localStorage.setItem("OPEN_SHARE_AFTER_SAVE", "true");
              }
          }
          disabled={isPending}
        >
          {isPending ? (
            <span className="w-3.5 h-3.5 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : token && isSaved ? (
            <>
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Saved
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save
            </>
          )}
        </button>
        {/* Share */}
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-neutral-300 border border-white/[0.1] hover:text-white hover:bg-white/[0.06] hover:border-white/[0.2] cursor-pointer transition-colors"
          title="Share"
          onClick={
            token ? () => setIsShareOpen(true) : (() => { saveSchema(); localStorage.setItem("OPEN_SHARE_AFTER_SAVE", "true") })
          }
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </button>
      </div>
      <Modal open={isShareOpen} onClose={() => setIsShareOpen(false)}>
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">Share Schema</h2>
            <p className="text-xs text-neutral-400">
              Generate a shareable link so others can view this schema.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
              Share link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 h-8 px-2 text-xs font-mono rounded-md bg-black/40 border border-white/10 text-neutral-200 placeholder-neutral-600 outline-none focus:border-blue-500/60"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 h-8 text-xs font-medium rounded-md border border-white/12 text-neutral-200 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div className="pt-1 space-y-1.5">
            <button
              type="button"
              className="w-full h-9 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer transition-colors"
              disabled={!schema || generateLinkMutation.isPending}
              onClick={handleGenerateLink}
            >
              {generateLinkMutation.isPending
                ? "Generating…"
                : "Generate New Link"}
            </button>
            <p className="text-[11px] text-neutral-500">
              Generating a new link will invalidate the previous one.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
