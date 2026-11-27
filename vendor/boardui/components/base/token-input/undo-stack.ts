/**
 * An undo stack whose entries group: typing runs into one entry until a
 * pause, a new word, or an edit of another kind.
 *
 * Adapted from vercel-labs/ui, packages/core/src/foundation/
 * kernel/undo-stack.ts at commit 724a7d6c2d0c. Changes: BoardUI formatting.
 * Copyright 2026 Vercel, Inc. Licensed under the Apache License, Version 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0); modified by BoardUI as noted.
 */

export type UndoStackOptions = {
  /** How many entries are kept. Default 100. */
  limit?: number;
  /** Milliseconds of pause after which typing starts a new entry. Default 500. */
  groupDelay?: number;
};

/**
 * `options` can be a getter, read on every edit, so a limit or delay set
 * after creation applies.
 */
export function createUndoStack<State>(
  initial: State,
  options: UndoStackOptions | (() => UndoStackOptions | undefined) = {},
) {
  const settings = () => (typeof options === "function" ? options() : options) ?? {};
  let entries = [initial];
  let index = 0;
  // The kind and time of the last edit that can take more into its entry.
  let open: { group: string; time: number } | null = null;

  return {
    /**
     * Records the state after an edit. Edits of the same `group`, like
     * "insert" or "delete", join the last entry while they come within
     * `groupDelay` of each other. Without a group, the edit is its own entry.
     */
    record(state: State, { group, time = Date.now() }: { group?: string; time?: number } = {}) {
      const { limit = 100, groupDelay = 500 } = settings();
      entries = entries.slice(0, index + 1);
      const joins = !!group && open?.group === group && time - open.time < groupDelay;
      if (joins) {
        entries[index] = state;
      } else {
        entries.push(state);
        if (entries.length > limit + 1) entries.shift();
        index = entries.length - 1;
      }
      open = group ? { group, time } : null;
    },
    /** Ends the open group, so the next edit starts an entry, like after a caret jump. */
    seal() {
      open = null;
    },
    /** Steps back, and returns the state to show, or `undefined` at the first entry. */
    undo() {
      open = null;
      if (index === 0) return undefined;
      return entries[--index];
    },
    /** Steps forward again, and returns the state to show, or `undefined` at the last entry. */
    redo() {
      open = null;
      if (index === entries.length - 1) return undefined;
      return entries[++index];
    },
    canUndo: () => index > 0,
    canRedo: () => index < entries.length - 1,
    /** Rewrites every entry, like a token's data changing everywhere without an entry of its own. */
    map(update: (state: State) => State) {
      entries = entries.map(update);
    },
    /** Starts over from `state`, like after a controlled value from outside. */
    reset(state: State) {
      entries = [state];
      index = 0;
      open = null;
    },
  };
}
