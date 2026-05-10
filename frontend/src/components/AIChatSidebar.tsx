"use client";

import {useMemo, useState} from "react";

export type AIChatMessage = {
    role: "user" | "assistant";
    content: string
};

type AIChatSidebarProps = {
    messages: AIChatMessage[];
    isLoading: boolean;
    error: string | null;
    onSend: (message: string) => void;
};

export const AIChatSidebar = ({
    messages,
    isLoading,
    error,
    onSend
}: AIChatSidebarProps) => {
    const [draft, setDraft] = useState("");
    const canSend = useMemo(() => draft.trim().length > 0 && !isLoading, [draft, isLoading]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSend) return;
      onSend(draft.trim());
      setDraft("");
    };

    return (
    <aside className="flex h-full flex-col gap-4 rounded-[28px] border border-[var(--stroke)] bg-white/90 p-6 shadow-[var(--shadow)] backdrop-blur">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
          AI Companion
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--navy-dark)]">
          Chat & updates
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--gray-text)]">
          Ask for changes and let the assistant suggest board updates.
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--stroke)] p-4 text-sm text-[var(--gray-text)]">
            Start the conversation to see suggestions here.
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-10 rounded-2xl bg-[var(--primary-blue)]/10 p-4 text-sm text-[var(--navy-dark)]"
                  : "mr-10 rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--navy-dark)]"
              }
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
                {message.role === "user" ? "You" : "Assistant"}
              </p>
              <p className="mt-2 whitespace-pre-wrap leading-6">{message.content}</p>
            </div>
          ))
        )}
        {isLoading ? (
          <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm text-[var(--gray-text)]">
            Assistant is thinking...
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder="Ask the assistant to adjust the board..."
          className="w-full resize-none rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm text-[var(--navy-dark)] shadow-sm outline-none transition focus:border-[var(--primary-blue)]"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="w-full rounded-2xl bg-[var(--secondary-purple)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send request
        </button>
      </form>
    </aside>
    );
};
