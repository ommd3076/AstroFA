/**
 * TokenInput's editing: what the browser is about to do, and what it did,
 * turned into edits of the value. Typing at a caret goes through natively, so
 * spelling, autocorrect and input methods keep working, and the input event
 * reads it back. Everything that would touch a token, every deletion, new
 * lines, paste, drop, cut and undo are cancelled and applied to the value, so
 * one keystroke removes one token in every engine and the history is ours.
 *
 * Adapted from vercel-labs/ui, packages/core/src/components/
 * token-input/token-input-editing.ts at commit 724a7d6c2d0c. Changes: BoardUI
 * formatting, talks to the React component through `EditingHost`, ignores
 * the synthetic blur React Aria's virtual focus sends, and has a one-line mode.
 * Copyright 2026 Vercel, Inc. Licensed under the Apache License, Version 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0); modified by BoardUI as noted.
 */
import {
  fromText,
  lineBoundary,
  offsetText,
  replaceRange,
  sliceValue,
  toLabel,
  toText,
  tokenAt,
  valueLength,
  wordBoundary,
  type TextRange,
  type Token,
  type TokenCodec,
  type TokenInputValue,
} from "./token-input-model";
import type { TokenView } from "./token-input-view";

export type TokenInputChangeReason = "input-change" | "paste" | "drop" | "cut" | "undo" | "redo" | "item-press" | "imperative";

export type EditDetails = {
  reason: TokenInputChangeReason;
  event?: Event;
  inputType?: string;
  /** The caret or selection after the edit. */
  selection?: TextRange;
  /** Edits of one group join one undo step, like typing. */
  group?: string;
};

/** What the editing layer needs from the component that owns the value. */
export type EditingHost = {
  /** The latest value, which a controlled owner may not have passed back yet. */
  latest: () => TokenInputValue;
  editable: () => boolean;
  codec: () => TokenCodec;
  tokenDeletion: () => "whole" | "select" | "revert";
  copy: () => "codec" | "label";
  submitShortcut: () => "enter" | "mod+enter";
  /** False for a one-line field: Enter never breaks the line. */
  multiline: () => boolean;
  describe: (token: Token) => string;
  commit: (next: TokenInputValue, details: EditDetails) => boolean;
  /** Ends the open undo group. */
  seal: () => void;
  undo: (event?: Event) => void;
  redo: (event?: Event) => void;
  canSubmit: () => boolean;
  submit: (event: Event) => void;
  say: (message: string) => void;
  composing: () => boolean;
  setComposing: (next: boolean) => void;
  setSelection: (range: TextRange | null) => void;
  setFocused: (focused: boolean) => void;
};

const isApple = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const isComposing = (event: KeyboardEvent) => event.isComposing || event.keyCode === 229;
const isRTL = (el: Element) => getComputedStyle(el).direction === "rtl";

const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);
const unescapeHtml = (text: string) =>
  text.replace(/&(#\d+|quot|amp|lt|gt);/g, (_, code: string) =>
    code[0] === "#" ? String.fromCharCode(Number(code.slice(1))) : { quot: '"', amp: "&", lt: "<", gt: ">" }[code]!,
  );

const caretAt = (offset: number) => ({ start: offset, end: offset });

// How many offsets a character before or after `offset` spans: two for a surrogate pair.
function charLength(text: string, offset: number, direction: -1 | 1) {
  const code = text.charCodeAt(direction < 0 ? offset - 1 : offset);
  const surrogate = direction < 0 ? code >= 0xdc00 && code <= 0xdfff : code >= 0xd800 && code <= 0xdbff;
  return surrogate ? 2 : 1;
}

// Where a deletion from `at` ends: a character, a word or a line away.
function deletionTarget(type: string, value: TokenInputValue, at: number, direction: -1 | 1) {
  if (type.includes("Word")) return wordBoundary(value, at, direction);
  if (type.includes("Line")) return lineBoundary(value, at, direction);
  return at + direction * charLength(offsetText(value), at, direction);
}

export function bindTokenEditing(el: HTMLElement, view: TokenView, host: EditingHost) {
  const doc = el.ownerDocument;
  // Where the last typing or deletion left the caret. An edit anywhere else starts a new undo step.
  let lastEnd = -1;
  let afterSpace = false;
  // The selection a drag started from inside the editor.
  let dragged: TextRange | null = null;
  // A token the first Backspace selected, for `tokenDeletion: "select"`.
  let armed: string | null = null;

  const value = () => host.latest();

  function edit(next: TokenInputValue, selection: TextRange, details: EditDetails & { at?: number }) {
    if (details.group && details.at !== undefined && details.at !== lastEnd) host.seal();
    host.commit(next, { ...details, selection });
    lastEnd = details.group ? selection.end : -1;
  }

  // Backspace, Delete and their word and line forms, applied to the value.
  function remove(type: string, range: TextRange, event: InputEvent) {
    const current = value();
    if (range.start !== range.end) {
      armed = null;
      return edit(replaceRange(current, range, []), caretAt(range.start), {
        reason: type === "deleteByCut" ? "cut" : "input-change",
        event,
        inputType: type,
      });
    }
    const direction = type.includes("Backward") ? -1 : 1;
    const at = range.start;
    const neighbour = direction < 0 ? at - 1 : at;
    const token = tokenAt(current, neighbour);
    if (token && /^delete(Content|Word)/.test(type)) return removeToken(token, neighbour, event, type);
    armed = null;
    const target = Math.max(0, Math.min(deletionTarget(type, current, at, direction), valueLength(current)));
    if (target === at) return;
    const start = Math.min(at, target);
    edit(replaceRange(current, { start, end: Math.max(at, target) }, []), caretAt(start), {
      reason: "input-change",
      event,
      inputType: type,
      group: "delete",
      at,
    });
  }

  // One keystroke on a token: removes it, selects it first, or turns it back into its text.
  function removeToken(token: Token, offset: number, event: InputEvent, inputType: string) {
    const current = value();
    const tokenId = token.id!;
    const policy = host.tokenDeletion();
    const range = { start: offset, end: offset + 1 };
    if (policy === "select" && armed !== tokenId) {
      armed = tokenId;
      view.select(range);
      host.say(`${token.label}, ${host.describe(token)}, selected. Press Backspace again to remove it`);
      return;
    }
    armed = null;
    // Reverted, a token is its trigger and label again, so a trigger menu opens on it.
    const text = policy === "revert" ? `${(token.data?.trigger as string | undefined) ?? ""}${token.label}` : "";
    const replacement = text ? [text] : [];
    edit(replaceRange(current, range, replacement), caretAt(offset + text.length), {
      reason: "input-change",
      event,
      inputType,
    });
  }

  function onBeforeInput(event: InputEvent) {
    const type = event.inputType;
    if (!host.editable()) return event.preventDefault();
    if (type === "historyUndo" || type === "historyRedo") {
      event.preventDefault();
      return type === "historyUndo" ? host.undo(event) : host.redo(event);
    }
    // Composition is never cancelled: the input method owns it until it ends.
    if (type === "insertCompositionText" || host.composing()) return;
    const range = view.selection();
    if (!range) return;
    const anchor = doc.getSelection()?.anchorNode ?? null;
    if (type === "insertText" || type === "insertReplacementText") {
      const text = event.data ?? event.dataTransfer?.getData("text/plain") ?? "";
      const target = targetRange(event) ?? range;
      // Typing at a caret in text goes through, so the input event reads it.
      if (type === "insertText" && target.start === target.end && !view.inHost(anchor)) return;
      event.preventDefault();
      return insertText(text, target, event);
    }
    event.preventDefault();
    if (type === "insertParagraph" || type === "insertLineBreak") {
      return host.multiline() ? insertText("\n", range, event) : undefined;
    }
    if (type.startsWith("delete")) return remove(type, range, event);
    // Paste, drop and cut have events of their own. Formatting and anything else stays out.
    if (type === "insertFromYank") insertText(event.data ?? "", range, event);
  }

  // The range an input event replaces, like an autocorrected word, when it isn't the selection.
  function targetRange(event: InputEvent) {
    const [target] = event.getTargetRanges?.() ?? [];
    if (!target) return null;
    return {
      start: view.offsetAt(target.startContainer, target.startOffset),
      end: view.offsetAt(target.endContainer, target.endOffset),
    };
  }

  function insertText(text: string, range: TextRange, event: InputEvent) {
    // A new word starts a new undo step.
    if (afterSpace && /\S/.test(text)) host.seal();
    afterSpace = /\s$/.test(text);
    edit(replaceRange(value(), range, [text]), caretAt(range.start + text.length), {
      reason: "input-change",
      event,
      inputType: event.inputType,
      group: "insert",
      at: range.start,
    });
  }

  // Typing the browser applied: read it back.
  function onInput(event: Event) {
    if (host.composing() || (event as InputEvent).isComposing) return;
    reconcile(event as InputEvent);
  }

  function reconcile(event?: InputEvent) {
    // What an input method committed into a read-only input comes back out.
    if (!host.editable()) return view.render(value());
    const next = view.read();
    const selection = view.selection() ?? caretAt(valueLength(next));
    const text = event?.data ?? "";
    if (afterSpace && /\S/.test(text)) host.seal();
    if (text) afterSpace = /\s$/.test(text);
    edit(next, selection, {
      reason: "input-change",
      event,
      inputType: event?.inputType,
      group: event ? "insert" : undefined,
      at: selection.end - text.length,
    });
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || isComposing(event)) return;
    const mod = isApple() ? event.metaKey : event.ctrlKey;
    const key = event.key.toLowerCase();
    if (mod && !event.altKey && key === "z") {
      event.preventDefault();
      if (!host.editable()) return;
      return event.shiftKey ? host.redo(event) : host.undo(event);
    }
    if (!isApple() && event.ctrlKey && key === "y") {
      event.preventDefault();
      if (host.editable()) host.redo(event);
      return;
    }
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && !event.shiftKey && !mod && !event.altKey) {
      return crossToken(event);
    }
    // Formatting has no place in plain text, and WebKit and Firefox send no beforeinput for it.
    if (mod && (key === "b" || key === "i" || key === "u")) return event.preventDefault();
    if (event.key === "Enter" && !host.multiline()) {
      // A one-line field sends on Enter, with or without Shift, like an input.
      event.preventDefault();
      if (host.canSubmit()) host.submit(event);
      return;
    }
    if (event.key === "Enter") {
      const shortcut = host.submitShortcut();
      const submits = shortcut === "enter" ? !event.shiftKey && !mod && !event.altKey : mod && !event.shiftKey;
      // With nothing to submit, Enter is left to start a new line.
      if (!submits || !host.canSubmit()) return;
      event.preventDefault();
      host.submit(event);
    }
  }

  // An arrow next to a token moves past it in one press. The anchors around a
  // host are caret stops of their own to the browser, which would cost one more.
  function crossToken(event: KeyboardEvent) {
    const range = view.selection();
    if (!range || range.start !== range.end) return;
    const forward = (event.key === "ArrowRight") !== isRTL(el);
    const target = forward ? range.end : range.start - 1;
    if (!tokenAt(value(), target)) return;
    event.preventDefault();
    view.select(caretAt(forward ? target + 1 : target));
  }

  function writeClipboard(data: DataTransfer | null, range: TextRange) {
    if (!data) return;
    const part = sliceValue(value(), range.start, range.end);
    const text = toText(part, host.codec());
    data.setData("text/plain", host.copy() === "label" ? toLabel(part) : text);
    // The codec text rides in an attribute, so a paste into a token input gets the tokens back.
    data.setData("text/html", `<span data-boardui-tokens="${escapeHtml(text)}">${escapeHtml(toLabel(part))}</span>`);
  }

  function readClipboard(data: DataTransfer | null) {
    if (!data) return [];
    const tokens = /data-boardui-tokens="([^"]*)"/.exec(data.getData("text/html"));
    return fromText(tokens ? unescapeHtml(tokens[1]) : data.getData("text/plain"), host.codec());
  }

  function onCopy(event: ClipboardEvent) {
    const range = view.selection();
    if (!range || range.start === range.end) return;
    event.preventDefault();
    writeClipboard(event.clipboardData, range);
  }

  function onCut(event: ClipboardEvent) {
    const range = view.selection();
    if (!range || range.start === range.end) return;
    event.preventDefault();
    if (!host.editable()) return;
    writeClipboard(event.clipboardData, range);
    edit(replaceRange(value(), range, []), caretAt(range.start), { reason: "cut", event });
  }

  function onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const range = view.selection();
    if (!range || !host.editable()) return;
    const content = readClipboard(event.clipboardData);
    // An image or a file has no text, and leaves the selection alone.
    if (!content.length) return;
    edit(replaceRange(value(), range, content), caretAt(range.start + valueLength(content)), {
      reason: "paste",
      event,
    });
  }

  function onDragStart(event: DragEvent) {
    const range = view.selection();
    if (!range || range.start === range.end) return;
    dragged = range;
    writeClipboard(event.dataTransfer, range);
  }

  // A drag that ends outside the editor, or is cancelled, moves nothing here.
  function onDragEnd() {
    dragged = null;
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    const source = dragged;
    dragged = null;
    if (!host.editable()) return;
    const point = pointFrom(event);
    let at = point ? view.offsetAt(point[0], point[1]) : valueLength(value());
    const content = readClipboard(event.dataTransfer);
    let current = value();
    // A drag inside the editor moves the text, unless it's dropped onto itself.
    if (source && !(event.ctrlKey || event.altKey)) {
      if (at > source.start && at < source.end) return;
      current = replaceRange(current, source, []);
      if (at >= source.end) at -= source.end - source.start;
    }
    edit(replaceRange(current, caretAt(at), content), caretAt(at + valueLength(content)), { reason: "drop", event });
  }

  // The DOM point under the pointer, in whichever form the engine offers.
  function pointFrom(event: DragEvent): [Node, number] | null {
    const position = (
      doc as Document & {
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
      }
    ).caretPositionFromPoint?.(event.clientX, event.clientY);
    if (position) return [position.offsetNode, position.offset];
    const range = doc.caretRangeFromPoint?.(event.clientX, event.clientY);
    return range ? [range.startContainer, range.startOffset] : null;
  }

  function onCompositionStart() {
    host.setComposing(true);
  }

  // The committed text is read back as one step of its own.
  function onCompositionEnd() {
    host.setComposing(false);
    host.seal();
    reconcile();
    host.seal();
  }

  // A caret inside a token's host moves to its edge, and a selection that
  // touches a token covers all of it.
  function onSelectionChange() {
    const selected = doc.getSelection();
    if (!selected?.rangeCount || !el.contains(selected.anchorNode)) return;
    const range = view.selection();
    if (!range) return;
    if (view.inHost(selected.anchorNode) || view.inHost(selected.focusNode)) view.select(range);
    if (armed && !(range.end - range.start === 1 && tokenAt(value(), range.start)?.id === armed)) armed = null;
    host.setSelection(range);
  }

  function onFocus() {
    host.setFocused(true);
    host.setSelection(view.selection());
  }

  // A dropped compositionend can't leave the editor stuck composing. React
  // Aria's virtual focus sends the field a synthetic blur when the menu's
  // highlight moves while real focus stays here; that one is not a blur.
  function onBlur() {
    if (doc.activeElement === el) return;
    if (host.composing()) host.setComposing(false);
    host.setFocused(false);
  }

  const listeners: [EventTarget, string, EventListener][] = [
    [el, "beforeinput", onBeforeInput as EventListener],
    [el, "input", onInput],
    [el, "keydown", onKeyDown as EventListener],
    [el, "copy", onCopy as EventListener],
    [el, "cut", onCut as EventListener],
    [el, "paste", onPaste as EventListener],
    [el, "dragstart", onDragStart as EventListener],
    [el, "dragend", onDragEnd],
    [el, "drop", onDrop as EventListener],
    [el, "compositionstart", onCompositionStart],
    [el, "compositionend", onCompositionEnd],
    [el, "focus", onFocus],
    [el, "blur", onBlur],
    [doc, "selectionchange", onSelectionChange],
  ];
  for (const [target, type, listener] of listeners) target.addEventListener(type, listener);
  if (doc.activeElement === el) onFocus();
  return () => {
    for (const [target, type, listener] of listeners) target.removeEventListener(type, listener);
  };
}
