# Frontend architecture breakdown

## Overview

The `frontend/` app is a Next.js App Router project that renders a single Kanban board UI at `/`. It is a client-heavy MVP with in-memory state only, no backend API integration yet.

## Entry points

- `src/app/layout.tsx`
  - Defines the global HTML shell, sets fonts (`Space Grotesk` for display, `Manrope` for body), and imports `globals.css`.
  - Exports `metadata` for the app title and description.
- `src/app/page.tsx`
  - The homepage route. Renders the `KanbanBoard` component.

## Styling system

- `src/app/globals.css`
  - Uses Tailwind CSS v4 via `@import "tailwindcss"`.
  - Defines CSS variables for the product color scheme and surfaces.
  - Sets base typography and background using the body font.

The UI uses a utility-first approach with Tailwind classes, augmented by CSS variables for palette consistency.

## Kanban UI composition

- `src/components/KanbanBoard.tsx`
  - Client component (`"use client"`). Owns board state using `useState` with `initialData` from `src/lib/kanban.ts`.
  - Manages drag-and-drop using `@dnd-kit/core`.
  - Key handlers:
    - `handleDragStart` / `handleDragEnd` to track active card and update column ordering via `moveCard`.
    - `handleRenameColumn` to update column titles in local state.
    - `handleAddCard` to create a card and append it to a column.
    - `handleDeleteCard` to remove a card from the board and the column.
  - Renders:
    - A header with board summary and column labels.
    - A `DndContext` containing five `KanbanColumn` components.
    - A `DragOverlay` with `KanbanCardPreview`.

- `src/components/KanbanColumn.tsx`
  - Uses `useDroppable` to enable column drop targets.
  - Uses `SortableContext` with `verticalListSortingStrategy` for card reordering.
  - Renders the column title as an editable input.
  - Renders each `KanbanCard` and a `NewCardForm`.

- `src/components/KanbanCard.tsx`
  - Uses `useSortable` for drag handles and styles.
  - Displays card title, details, and a remove action.

- `src/components/KanbanCardPreview.tsx`
  - Pure presentational component for the drag overlay preview.

- `src/components/NewCardForm.tsx`
  - Local state for a small create-card form.
  - Supports opening/closing, validation on title, and resets after submission.

## Data model and board logic

- `src/lib/kanban.ts`
  - Defines `Card`, `Column`, and `BoardData` types.
  - Provides `initialData` (five columns, sample cards).
  - `moveCard` handles:
    - reordering within a column,
    - moving between columns,
    - dropping onto a column to append.
  - `createId` creates time-based unique IDs for cards.

## Testing

- Unit tests (Vitest + Testing Library)
  - `src/components/KanbanBoard.test.tsx`: validates rendering, column renaming, card add/remove flows.
  - `src/lib/kanban.test.ts`: validates `moveCard` behavior.
- E2E tests (Playwright)
  - `tests/kanban.spec.ts`: verifies board rendering, card creation, and drag-and-drop across columns.

## Build and tooling

- Scripts in `package.json`:
  - `dev`, `build`, `start` for Next.js.
  - `test:unit` (Vitest) and `test:e2e` (Playwright), plus `test:all`.
- ESLint configured via `eslint.config.mjs` and `eslint-config-next`.
- TypeScript configured via `tsconfig.json`.
- Playwright uses `playwright.config.ts`.

## Current limitations

- No persistence (in-memory state only).
- No authentication or backend API usage.
- Single-page UI with a single board.
