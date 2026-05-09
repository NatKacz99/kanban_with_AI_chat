"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { moveCard, type BoardData } from "@/lib/kanban";
import { createCard, deleteCard, getBoard, moveCardApi, renameColumn } from "@/lib/api";

export const KanbanBoard = () => {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const cardsById = useMemo(() => board?.cards ?? {}, [board?.cards]);

  useEffect(() => {
    let isMounted = true;
    getBoard()
      .then((data) => {
        if (isMounted) {
          setBoard(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Failed to load board data.");
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false;
      }
  }, []);

  const findColumnId = (columns: BoardData["columns"], id: string) => {
    if (columns.some((column) => column.id === id)) {
      return id;
    }
    return columns.find((column) => column.cardIds.includes(id))?.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || !board || active.id === over.id) {
      return;
    }

    const nextColumns = moveCard(
      board.columns,
      active.id as string,
      over.id as string
    );
    const destinationColumnId = findColumnId(
      nextColumns,
      active.id as string
    );
    if (!destinationColumnId) {
      return;
    }

    const destinationColumn = nextColumns.find(
      (column) => column.id === destinationColumnId
    );
    const toPosition = destinationColumn 
      ? destinationColumn.cardIds.indexOf(active.id as string)
      : 0;

    try {
      const updated = await moveCardApi(
        active.id as string,
        destinationColumnId,
        toPosition
      );
      setBoard(updated);
    } catch {
      setError("Failed to move card.")
    }
  };

const handleRenameColumn = async (columnId: string, title: string) => {
  try {
    const updated = await renameColumn(columnId, title);
    setBoard(updated);
  } catch {
    setError("Failed to rename column.")
  }
};

const handleAddCard = async (
  columnId: string,
  title: string,
  details: string
) => {
  try {
    const updated = await createCard(
      columnId,
      title,
      details || "No details yet."
    );
    setBoard(updated);
  } catch {
    setError("Failed to create card.")
  }
};

const handleDeleteCard = async (_columnId: string, cardId: string) => {
  try {
    const updated = await deleteCard(cardId);
    setBoard(updated);
  } catch {
    setError("Failed to delete card.");
  }
};

const activeCard = activeCardId ? cardsById[activeCardId] : null;

if (isLoading) {
  return (
    <main className="flex min-h-screen items-center justify-center text-sm text-[var(--gray-text)]">
      Loading board...
    </main>
  );
}

if (error) {
  return (
    <main className="flex min-h-screen items-center justify-center text-sm text-[var(--gray-text)]">
      {error}
    </main>
  )
}

if (!board) {
  return null;
}

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-10 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
                Single Board Kanban
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--navy-dark)]">
                Kanban Studio
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]">
                Keep momentum visible. Rename columns, drag cards between stages,
                and capture quick notes without getting buried in settings.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
                Focus
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--primary-blue)]">
                One board. Five columns. Zero clutter.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
                {column.title}
              </div>
            ))}
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section className="grid gap-6 lg:grid-cols-5">
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={column.cardIds.map((cardId) => board.cards[cardId])}
                onRename={handleRenameColumn}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
              />
            ))}
          </section>
          <DragOverlay>
            {activeCard ? (
              <div className="w-[260px]">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
};
