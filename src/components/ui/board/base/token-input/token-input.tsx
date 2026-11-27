"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  Autocomplete as AriaAutocomplete,
  FieldInputContext,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  Popover as AriaPopover,
  useContextProps,
  useFilter,
} from "react-aria-components";
import { MENU_POPOVER_COMPACT, MENU_POPOVER_SURFACE } from "../dropdown/menu-styles";
import { useDirection } from "../../foundations/direction/direction";
import { ScrollFade, useScrollFade } from "../../foundations/scroll-fade/scroll-fade";
import { cx } from "../../utils/cx";
import { useDismissOnOutsidePress } from "../../utils/use-dismiss-on-outside-press";
import { bindTokenEditing, type EditDetails, type TokenInputChangeReason } from "./token-input-editing";
import {
  defaultCodec,
  isToken,
  normalizeValue,
  offsetText,
  removedTokens,
  replaceRange,
  sameValue,
  textDiff,
  valueLength,
  type TextRange,
  type Token,
  type TokenCodec,
  type TokenInputValue,
} from "./token-input-model";
import { createTokenView, type TokenHost, type TokenView } from "./token-input-view";
import { findTriggerMatch, lookBehind, mapDismissed, type DismissedMatch, type TriggerMatch, type TriggerRule } from "./trigger-match";
import { createUndoStack, type UndoStackOptions } from "./undo-stack";

export { defaultCodec, fromText, toLabel, toText } from "./token-input-model";
export type { Token, TokenCodec, TokenInputValue } from "./token-input-model";
export type { TriggerBoundary } from "./trigger-match";

/**
 * Token Input: a text field with atomic tokens, like the files, people and
 * commands in an AI prompt, and suggestion menus that open on "@", "/" or any
 * trigger you define.
 *
 *   <TokenInput
 *     aria-label="Message"
 *     placeholder="Ask anything, @ to add files, / for commands"
 *     triggers={[
 *       { char: "@", type: "file", title: "Files", items: files },
 *       { char: "/", type: "command", title: "Commands", boundary: "start", tone: "accent", items: commands },
 *     ]}
 *     onSubmit={(value) => send(toText(value))}
 *   />
 *
 * The value is text and tokens in order (`TokenInputValue`); `toText` writes
 * it as `[@label](type:value)` text for a request, a form or a draft, and
 * `fromText` reads that back. A token is one character to the caret: arrows
 * cross it in one press, Backspace removes it whole (or selects it first, or
 * turns it back into its text, with `tokenDeletion`), and copy and paste keep
 * it. Typing, deleting, pasting and undo run through the field's own history,
 * so Cmd+Z restores a removed token, and input methods compose as usual.
 *
 * A trigger opens its menu when a person types it at a word start (or only at
 * the very start, with `boundary: "start"`), filters as they type, and closes
 * when nothing matches, the caret leaves the match, or they press outside.
 * Arrows move the highlight while focus and caret stay in the field, Enter
 * or Tab inserts the highlighted item, and Escape dismisses that match until
 * its trigger is retyped; Ctrl+Space opens it again.
 *
 * The behaviour is ported from vercel-labs/ui's TokenInput and TriggerMenu
 * at commit 724a7d6c2d0c: the value model, matching, undo stack,
 * contenteditable view and editing layer live in the sibling files, each
 * headed with its source, and createTokenEngine below follows its
 * token-input-api.ts and trigger-menu-levels.ts. The menu is React Aria's
 * Autocomplete, Menu and Popover, so virtual focus, keyboard navigation and
 * placement are React Aria's, styled as BoardUI's compact dropdown.
 *
 * Copyright 2026 Vercel, Inc. Licensed under the Apache License, Version 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0); modified by BoardUI.
 */

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

/** One suggestion in a trigger's menu. */
export interface TokenSuggestion {
  /** Becomes the token's `value`. */
  id: string;
  /** What the row and the token show. Matched against the query. */
  label: string;
  /** Muted text at the end of the row, like a folder or a shortcut. */
  description?: string;
  /** Remix Icon shown in the row and on the token. */
  icon?: IconComponent;
  /** More words the query matches. */
  keywords?: string[];
  isDisabled?: boolean;
}

// Method-shaped, so a trigger of your own item type fits where a TokenTrigger is expected.
type Bivariant<F extends (...args: never[]) => unknown> = { method(...args: Parameters<F>): ReturnType<F> }["method"];

export interface TokenTrigger<T extends TokenSuggestion = TokenSuggestion> extends TriggerRule {
  /** The kind of token an insertion creates, like `"file"` or `"command"`. */
  type: string;
  /** The suggestions, or a loader called with the query and an AbortSignal once typing pauses. */
  items: readonly T[] | Bivariant<(query: string, signal: AbortSignal) => Promise<readonly T[]>>;
  /** How typing narrows `items` given as data. Default "contains", ignoring case and accents. Loaded items are not filtered. */
  filter?: "contains" | "startsWith" | Bivariant<(item: T, query: string) => boolean>;
  /** The menu's heading and accessible name, like "Files". */
  title?: string;
  /** How its tokens look: a grey chip, or one in the accent colour. Default "neutral". */
  tone?: "neutral" | "accent";
  /** Shown when nothing matches; without it the menu closes instead. */
  emptyState?: ReactNode;
  /** The token an item inserts. Default: this trigger's type, the item's id and label, its icon and the tone. */
  toToken?: Bivariant<(item: T) => Omit<Token, "id">>;
  /** Custom row content. Default: icon, label and description. */
  renderItem?: Bivariant<(item: T) => ReactNode>;
}

export interface TokenInputChangeDetails {
  reason: TokenInputChangeReason;
  /** Tokens the change removed. */
  removed: Token[];
  event?: Event;
}

export interface TokenInputHandle {
  /** The editable element. */
  element: HTMLDivElement | null;
  focus: (options?: { at?: "start" | "end" }) => void;
  /** Inserts text, a token (with a space after it) or a value at the caret, or at the end. One undo step. */
  insert: (content: string | Omit<Token, "id"> | TokenInputValue, options?: { at?: "caret" | "end" }) => boolean;
  clear: () => boolean;
  getValue: () => TokenInputValue;
  undo: () => boolean;
  redo: () => boolean;
}

export interface TokenInputProps {
  /** Controlled value. */
  value?: TokenInputValue;
  defaultValue?: TokenInputValue;
  onValueChange?: (value: TokenInputValue, details: TokenInputChangeDetails) => void;
  /** Runs on the submit shortcut, never while an input method composes or a menu is open. */
  onSubmit?: (value: TokenInputValue) => void;
  /** "enter": Enter submits and Shift+Enter breaks the line. "mod+enter": Cmd/Ctrl+Enter submits. Default "enter". */
  submitShortcut?: "enter" | "mod+enter";
  /**
   * False makes a one-line field, like an input in a pill composer: Enter
   * always submits, pasted line breaks become spaces, and long text scrolls
   * sideways with the caret kept in view. Default true.
   */
  multiline?: boolean;
  /** Backspace or Delete next to a token: removes it, selects it first, or turns it back into its text. Default "whole". */
  tokenDeletion?: "whole" | "select" | "revert";
  /** What a copy puts in plain text: codec text that pastes back as tokens, or the labels. Default "codec". */
  copy?: "codec" | "label";
  /** Token ↔ text conversion. Default `[@label](type:value)`. */
  codec?: TokenCodec;
  /** The suggestion menus, one per trigger character. */
  triggers?: TokenTrigger[];
  /** Custom content inside each token's chip. Default: its icon and label. */
  renderToken?: (token: Token) => ReactNode;
  /** What screen readers hear after a token's label. Default its type, like "file". */
  getTokenDescription?: (token: Token) => string;
  /** Undo depth and how long typing joins one step. */
  history?: UndoStackOptions;
  placeholder?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  autoFocus?: boolean;
  /** The editable box: size, padding, max height. */
  className?: string;
  /** The suggestion menu's panel. */
  menuClassName?: string;
  ref?: Ref<TokenInputHandle>;
}

type Menu = { rule: number; match: TriggerMatch };
type Loaded = { query: string; items: readonly TokenSuggestion[]; loading: boolean; rule: number };

// Reasons a person caused, which a trigger menu follows.
const userReasons = new Set<string>(["input-change", "paste", "drop", "cut"]);

// A controlled value passed back as the same array keeps its normalized form,
// so tokens keep their ids and hosts.
const normalized = new WeakMap<TokenInputValue, TokenInputValue>();
function normalizedOnce(value: TokenInputValue) {
  let result = normalized.get(value);
  if (!result) normalized.set(value, (result = normalizeValue(value)));
  return result;
}

const caretAt = (offset: number): TextRange => ({ start: offset, end: offset });
const defaultDescription = (token: Token) => token.type;

const TOKEN_BASE =
  "mx-px inline-flex max-w-full items-center gap-1 rounded-md px-1 align-bottom text-body-medium whitespace-nowrap select-none transition-shadow duration-150 data-[selected]:ring-2 data-[selected]:ring-border-focus-ring";
// The grey chip wears the menu's highlighted-row fill: neutral-100 on light
// cards, and a step lighter than the card in dark, never darker.
const TOKEN_TONE = {
  neutral: "bg-dropdown-item-hover-background text-text-primary",
  accent: "bg-button-ghost-background text-button-ghost-foreground",
};

type EngineProps = {
  onValueChange?: TokenInputProps["onValueChange"];
  onSubmit?: TokenInputProps["onSubmit"];
  submitShortcut: "enter" | "mod+enter";
  multiline: boolean;
  tokenDeletion: "whole" | "select" | "revert";
  copy: "codec" | "label";
  codec: TokenCodec;
  triggers?: TokenTrigger[];
  getTokenDescription?: (token: Token) => string;
  historyOptions?: UndoStackOptions;
  isDisabled: boolean;
  isReadOnly: boolean;
};

/**
 * The editor's state and behaviour, outside React: the DOM is the editor's,
 * and edits arrive from native events faster than renders. React hears
 * about what it shows: the hosts, emptiness, the open match and the status.
 */
function createTokenEngine({
  initial,
  props,
  viewRef,
  elementRef,
  setEmpty,
  setMenu,
  setStatus,
}: {
  initial: TokenInputValue;
  props: RefObject<EngineProps>;
  viewRef: RefObject<TokenView | null>;
  elementRef: RefObject<HTMLDivElement | null>;
  setEmpty: (empty: boolean) => void;
  setMenu: (menu: Menu | null) => void;
  setStatus: (update: (previous: string) => string) => void;
}) {
  let committed = initial;
  let selection: TextRange | null = null;
  let focused = false;
  let composing = false;
  let current: Menu | null = null;
  let dismissed: DismissedMatch[] = [];
  let messages: string[] = [];
  const history = createUndoStack<{ value: TokenInputValue; selection: TextRange | null }>(
    { value: committed, selection: null },
    () => props.current.historyOptions,
  );

  const rules = (): TriggerRule[] => props.current.triggers ?? [];
  const describe = (token: Token) => (props.current.getTokenDescription ?? defaultDescription)(token);
  const editable = () => !props.current.isDisabled && !props.current.isReadOnly;

  // Says what happened to tokens, joined, so several changes at once are one message.
  function say(message: string) {
    messages.push(message);
    setStatus((previous) => {
      const next = messages.join(". ");
      return next === previous ? `${next} ` : next;
    });
    queueMicrotask(() => (messages = []));
  }

  function render(after?: TextRange) {
    const view = viewRef.current;
    if (!view) return;
    view.render(committed);
    const length = valueLength(committed);
    const target = after ?? (focused ? selection : null);
    if (target && focused) {
      view.select({ start: Math.min(target.start, length), end: Math.min(target.end, length) });
      if (!props.current.multiline) revealCaret(Math.min(target.end, length));
    }
    markSelected();
  }

  // A one-line field scrolls sideways: after a programmatic caret move, like
  // a chip landing at the end, the caret is brought back into view.
  function revealCaret(offset: number) {
    const element = elementRef.current;
    const rect = viewRef.current?.rectAt(offset);
    if (!element || !rect) return;
    const box = element.getBoundingClientRect();
    const margin = 8;
    if (rect.x > box.right - margin) element.scrollLeft += rect.x - box.right + margin;
    else if (rect.x < box.left + margin) element.scrollLeft -= box.left + margin - rect.x;
  }

  // Tokens inside the selection, or the one Backspace selected, carry data-selected.
  function markSelected() {
    const element = elementRef.current;
    if (!element) return;
    const range = selection && selection.start !== selection.end ? selection : null;
    let at = 0;
    const inside = new Set<string>();
    for (const segment of committed) {
      if (isToken(segment) && range && at >= range.start && at < range.end) inside.add(segment.id!);
      at += isToken(segment) ? 1 : segment.length;
    }
    element.querySelectorAll<HTMLElement>("[data-token-id]").forEach((host) => {
      host.toggleAttribute("data-selected", inside.has(host.getAttribute("data-token-id")!));
    });
  }

  function commit(next: TokenInputValue, { reason, event, selection: after, group, record = true }: EditDetails & { record?: boolean }) {
    const before = committed;
    // A one-line field holds no line breaks: pasted or dropped ones become spaces.
    const value = normalizeValue(
      props.current.multiline ? next : next.map((segment) => (typeof segment === "string" ? segment.replace(/\r?\n/g, " ") : segment)),
    );
    normalized.set(value, value);
    if (sameValue(before, value)) {
      if (after) setSelection(after);
      return false;
    }
    const removed = removedTokens(before, value);
    committed = value;
    if (after) selection = after;
    render(after);
    if (record) history.record({ value, selection: after ?? null }, { group });
    setEmpty(valueLength(value) === 0);
    props.current.onValueChange?.(value, { reason, removed, event });
    const diff = textDiff(offsetText(before), offsetText(value));
    onInput(diff.range, diff.inserted.length, userReasons.has(reason));
    for (const token of removed) say(`Removed ${describe(token)} ${token.label}`);
    return true;
  }

  function setSelection(next: TextRange | null) {
    selection = next;
    if (next && viewRef.current && focused) viewRef.current.select(next);
    markSelected();
    onSelection();
  }

  // Inserts at a range: text, a token followed by a space unless one follows, or a value.
  function insertAt(range: TextRange, content: string | Omit<Token, "id"> | TokenInputValue, reason: TokenInputChangeReason) {
    const inserted: TokenInputValue = Array.isArray(content)
      ? normalizeValue(content)
      : typeof content === "string"
        ? [content]
        : normalizeValue([content as Token]);
    const token = inserted.length === 1 && isToken(inserted[0]) ? inserted[0] : undefined;
    const following = offsetText(committed)[range.end];
    if (token && (following === undefined || !/\s/.test(following))) inserted.push(" ");
    const end = range.start + valueLength(inserted);
    if (!commit(replaceRange(committed, range, inserted), { reason, selection: caretAt(end) })) return false;
    if (token) say(`Inserted ${describe(token)} ${token.label}`);
    return true;
  }

  function undo(event?: Event) {
    const entry = history.undo();
    return !!entry && commit(entry.value, { reason: "undo", event, selection: entry.selection ?? undefined, record: false });
  }

  function redo(event?: Event) {
    const entry = history.redo();
    return !!entry && commit(entry.value, { reason: "redo", event, selection: entry.selection ?? undefined, record: false });
  }

  /* ---------------------------------------------- the match and its menu */

  // The caret, or null while unfocused or with a selection.
  const caret = () => (focused && selection && selection.start === selection.end ? selection.end : null);

  function matchAtCaret() {
    const at = caret();
    if (at === null) return null;
    const offset = Math.max(0, at - lookBehind(rules()));
    return findTriggerMatch(offsetText(committed).slice(offset, at), offset, rules());
  }

  function enter(found: { rule: number; match: TriggerMatch }) {
    current = found;
    setMenu(found);
  }

  // Ends the match. Escape also remembers it as dismissed, so it stays
  // closed until its trigger is deleted or retyped.
  function end({ dismiss = false } = {}) {
    if (!current) return;
    if (dismiss) {
      const at = caret() ?? current.match.end;
      dismissed.push({ trigger: current.match.trigger, start: current.match.start, end: Math.max(at, current.match.end) });
    }
    current = null;
    setMenu(null);
  }

  // Opens the match at the caret, even a dismissed one, for Ctrl+Space.
  function reopen() {
    const found = matchAtCaret();
    if (!found) return false;
    dismissed = dismissed.filter((entry) => entry.start !== found.match.start);
    enter(found);
    return true;
  }

  // An edit moves dismissed matches, then finds the match at the caret. A
  // match opens only when a person's edit touched it: never on focus, a
  // caret move or a program's edit.
  function onInput(range: TextRange, inserted: number, user: boolean) {
    dismissed = dismissed.flatMap((entry) => mapDismissed(entry, range, inserted) ?? []);
    if (composing) return;
    const found = matchAtCaret();
    const isDismissed =
      !!found && dismissed.some((entry) => entry.start === found.match.start && entry.trigger === found.match.trigger);
    const editEnd = range.start + inserted;
    const touched = !!found && range.start <= found.match.end && editEnd >= found.match.start;
    const same = !!found && current?.match.start === found.match.start && current.match.trigger === found.match.trigger;
    if (!found || isDismissed || (!same && !(user && touched))) return end();
    enter(found);
  }

  // The caret left the match: it closes. A caret still in the same match stays.
  function onSelection() {
    if (!current) return;
    const at = caret();
    if (at === null || at < current.match.start + current.match.trigger.length) return end();
    if (matchAtCaret()?.match.start !== current.match.start) end();
  }

  function choose(item: TokenSuggestion) {
    if (!current || item.isDisabled) return;
    const trigger = props.current.triggers?.[current.rule];
    const at = caret();
    if (!trigger || at === null) return;
    const token = trigger.toToken?.(item) ?? {
      type: trigger.type,
      value: item.id,
      label: item.label,
      data: { icon: item.icon, tone: trigger.tone ?? "neutral", trigger: trigger.char },
    };
    const range = { start: current.match.start, end: at };
    end();
    insertAt(range, token, "item-press");
  }

  return {
    latest: () => committed,
    editable,
    codec: () => props.current.codec,
    tokenDeletion: () => props.current.tokenDeletion,
    copy: () => props.current.copy,
    submitShortcut: () => props.current.submitShortcut,
    multiline: () => props.current.multiline,
    describe,
    commit,
    seal: history.seal,
    undo,
    redo,
    canSubmit: () => !!props.current.onSubmit,
    submit: () => props.current.onSubmit?.(committed),
    say,
    composing: () => composing,
    setComposing(next: boolean) {
      composing = next;
    },
    setSelection,
    setFocused(next: boolean) {
      focused = next;
      if (!next) onSelection();
    },
    // Menu and component plumbing.
    render,
    insertAt,
    choose,
    end,
    reopen,
    current: () => current,
    selection: () => (focused ? selection : null),
    // A value from outside, like a controlled reset after sending, is its own undo step.
    // Chips get their label from React a commit later, which widens them;
    // a one-line field checks the caret is still in view once they have.
    revealSelection() {
      if (!props.current.multiline && focused && selection) revealCaret(selection.end);
    },
    setFromOutside(value: TokenInputValue) {
      if (value === committed) return;
      if (!sameValue(value, committed)) history.record({ value, selection: null });
      committed = value;
      render();
      setEmpty(valueLength(value) === 0);
    },
    focus(at: "start" | "end" = "end") {
      const element = elementRef.current;
      if (!element) return;
      element.focus({ preventScroll: true });
      focused = true;
      setSelection(caretAt(at === "start" ? 0 : valueLength(committed)));
    },
    undoRedo: { undo: () => undo(), redo: () => redo() },
  };
}

type Engine = ReturnType<typeof createTokenEngine>;

export function TokenInput({
  value: controlledValue,
  defaultValue,
  onValueChange,
  onSubmit,
  submitShortcut = "enter",
  multiline = true,
  tokenDeletion = "whole",
  copy = "codec",
  codec = defaultCodec,
  triggers,
  renderToken,
  getTokenDescription,
  history: historyOptions,
  placeholder,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  isDisabled = false,
  isReadOnly = false,
  autoFocus,
  className,
  menuClassName,
  ref,
}: TokenInputProps) {
  // Props read from long-lived callbacks.
  const props = useRef({ onValueChange, onSubmit, submitShortcut, multiline, tokenDeletion, copy, codec, triggers, getTokenDescription, historyOptions, isDisabled, isReadOnly });
  props.current = { onValueChange, onSubmit, submitShortcut, multiline, tokenDeletion, copy, codec, triggers, getTokenDescription, historyOptions, isDisabled, isReadOnly };

  const elementRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const viewRef = useRef<TokenView | null>(null);
  const [hosts, setHosts] = useState<TokenHost[]>([]);
  const [empty, setEmpty] = useState(() => valueLength(normalizedOnce(controlledValue ?? defaultValue ?? [])) === 0);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [status, setStatus] = useState("");

  // The editor's state lives outside React; see createTokenEngine.
  const engine = useState(() =>
    createTokenEngine({
      initial: normalizedOnce(controlledValue ?? defaultValue ?? []),
      props,
      viewRef,
      elementRef,
      setEmpty,
      setMenu,
      setStatus,
    }),
  )[0];

  useLayoutEffect(() => engine.revealSelection(), [hosts, engine]);

  // A controlled value that differs from what the field last committed.
  useLayoutEffect(() => {
    if (controlledValue === undefined) return;
    engine.setFromOutside(normalizedOnce(controlledValue));
  }, [controlledValue, engine]);

  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return elementRef.current;
      },
      focus: (options) => engine.focus(options?.at),
      insert: (content, options) => {
        const length = valueLength(engine.latest());
        const range = options?.at === "end" ? caretAt(length) : (engine.selection() ?? caretAt(length));
        return engine.insertAt(range, content, "imperative");
      },
      clear: () => engine.commit([], { reason: "imperative", selection: caretAt(0) }),
      getValue: () => engine.latest(),
      undo: engine.undoRedo.undo,
      redo: engine.undoRedo.redo,
    }),
    [engine],
  );

  const hostClassName = useCallback(
    (token: Token) => cx(TOKEN_BASE, TOKEN_TONE[(token.data?.tone as "neutral" | "accent" | undefined) ?? "neutral"]),
    [],
  );

  const trigger = menu ? triggers?.[menu.rule] : undefined;
  const loaded = useSuggestions(trigger, menu);
  const visible = !!menu && !!trigger && (loaded.items.length > 0 || loaded.loading || !!trigger.emptyState);

  const editor = (
    <TokenEditor
      elementRef={elementRef}
      viewRef={viewRef}
      engine={engine}
      hostClassName={hostClassName}
      setHosts={setHosts}
      menuOpen={visible}
      multiline={multiline}
      hasTriggers={!!triggers?.length}
      query={menu?.match.query ?? null}
      empty={empty}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      ariaLabelledby={ariaLabelledby}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      autoFocus={autoFocus}
      className={className}
    />
  );

  return (
    <div className="relative min-w-0" data-slot="token-input">
      {triggers?.length ? (
        <AriaAutocomplete>
          {editor}
          <SuggestionMenu
            anchorRef={anchorRef}
            elementRef={elementRef}
            viewRef={viewRef}
            menu={menu}
            trigger={trigger}
            loaded={loaded}
            isOpen={visible}
            onChoose={engine.choose}
            onDismiss={() => engine.end()}
            className={menuClassName}
          />
        </AriaAutocomplete>
      ) : (
        editor
      )}
      <span ref={anchorRef} aria-hidden className="pointer-events-none absolute w-0" />
      {hosts.map(({ id, token, host }) => createPortal(renderToken ? renderToken(token) : <DefaultToken token={token} />, host, id))}
      <span role="status" className="sr-only">
        {status}
      </span>
    </div>
  );
}

function DefaultToken({ token }: { token: Token }) {
  const Icon = token.data?.icon as IconComponent | undefined;
  return (
    <>
      {Icon ? <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden /> : null}
      <span className="truncate">{token.label}</span>
    </>
  );
}


/* ------------------------------------------------------------------ editor */

const MENU_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp"]);

function TokenEditor({
  elementRef,
  viewRef,
  engine,
  hostClassName,
  setHosts,
  menuOpen,
  multiline,
  hasTriggers,
  query,
  empty,
  placeholder,
  ariaLabel,
  ariaLabelledby,
  isDisabled,
  isReadOnly,
  autoFocus,
  className,
}: {
  elementRef: RefObject<HTMLDivElement | null>;
  viewRef: RefObject<TokenView | null>;
  engine: Engine;
  hostClassName: (token: Token) => string;
  setHosts: (hosts: TokenHost[]) => void;
  menuOpen: boolean;
  multiline: boolean;
  hasTriggers: boolean;
  query: string | null;
  empty: boolean;
  placeholder?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  isDisabled: boolean;
  isReadOnly: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  // Inside an Autocomplete, React Aria hands the field its keyboard and ARIA
  // wiring: virtual focus in the list, aria-activedescendant, aria-controls.
  const [field, fieldRef] = useContextProps({}, elementRef as RefObject<HTMLDivElement>, FieldInputContext);
  const {
    onKeyDown: ariaKeyDown,
    onKeyUp: ariaKeyUp,
    onChange: ariaChange,
    onFocus: ariaFocus,
    onBlur: ariaBlur,
    "aria-activedescendant": activeDescendant,
    "aria-controls": controls,
  } = field as {
    onKeyDown?: (event: React.KeyboardEvent) => void;
    onKeyUp?: (event: React.KeyboardEvent) => void;
    onChange?: (value: string) => void;
    onFocus?: (event: React.FocusEvent) => void;
    onBlur?: (event: React.FocusEvent) => void;
    "aria-activedescendant"?: string;
    "aria-controls"?: string;
  };

  // Binds the view and the editing layer once the element exists.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const view = createTokenView(element, {
      describe: engine.describe,
      hostClassName,
      onHosts: () => setHosts(view.hosts()),
    });
    viewRef.current = view;
    engine.render();
    const unbind = bindTokenEditing(element, view, engine);
    return () => {
      unbind();
      view.destroy();
      viewRef.current = null;
    };
  }, [elementRef, viewRef, engine, hostClassName, setHosts]);

  useEffect(() => {
    if (autoFocus) engine.focus("end");
  }, [autoFocus, engine]);

  // The query goes to the Autocomplete as if typed, so it highlights the
  // first suggestion after typing forward and clears after a deletion.
  const lastQuery = useRef<string | null>(null);
  useEffect(() => {
    if (!menuOpen || query === null) {
      lastQuery.current = null;
      return;
    }
    if (lastQuery.current === query) return;
    lastQuery.current = query;
    ariaChange?.(query);
  }, [menuOpen, query, ariaChange]);

  // An open menu's keys win over the editor's own, like Enter sending a
  // prompt: caught in the capture phase, before the editing layer sees them.
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !hasTriggers) return;
    const onKey = (event: KeyboardEvent) => {
      if (!element.contains(event.target as Node) || event.isComposing || event.keyCode === 229) return;
      if (event.key === " " && event.ctrlKey && !event.metaKey) {
        if (engine.reopen()) event.preventDefault();
        return;
      }
      if (!engine.current() || !menuOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        return engine.end({ dismiss: true });
      }
      if (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey)) {
        // The highlighted row, read from the list: React Aria sets
        // aria-activedescendant a beat late after typing, so screen readers
        // say the typed letter first. Nothing highlighted means the first row.
        const listId = element.getAttribute("aria-controls");
        const list = listId ? element.ownerDocument.getElementById(listId) : null;
        const row =
          list?.querySelector<HTMLElement>('[role="menuitem"][data-focused]') ??
          list?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])');
        if (!row) return;
        event.preventDefault();
        event.stopPropagation();
        row.click();
      }
    };
    const doc = element.ownerDocument;
    doc.addEventListener("keydown", onKey, true);
    return () => doc.removeEventListener("keydown", onKey, true);
  }, [elementRef, engine, hasTriggers, menuOpen]);

  return (
    <div
      ref={fieldRef as RefObject<HTMLDivElement>}
      role="textbox"
      aria-multiline={multiline}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-placeholder={placeholder}
      aria-disabled={isDisabled || undefined}
      aria-readonly={isReadOnly || undefined}
      aria-autocomplete={hasTriggers ? "list" : undefined}
      aria-haspopup={hasTriggers ? "menu" : undefined}
      aria-controls={menuOpen ? controls : undefined}
      aria-activedescendant={menuOpen ? activeDescendant : undefined}
      contentEditable={!isDisabled}
      suppressContentEditableWarning
      spellCheck
      tabIndex={isDisabled ? -1 : 0}
      data-empty={empty || undefined}
      data-disabled={isDisabled || undefined}
      onKeyDown={(event) => {
        if (menuOpen && MENU_KEYS.has(event.key)) ariaKeyDown?.(event);
      }}
      onKeyUp={(event) => {
        if (menuOpen && MENU_KEYS.has(event.key)) ariaKeyUp?.(event);
      }}
      onFocus={ariaFocus}
      onBlur={(event) => {
        ariaBlur?.(event);
        // Like an input, a one-line field shows its start again once left.
        if (!multiline && event.currentTarget.ownerDocument.activeElement !== event.currentTarget) {
          event.currentTarget.scrollLeft = 0;
        }
      }}
      className={cx(
        "relative min-h-5 w-full cursor-text text-body-regular text-text-primary caret-accent-500 outline-none",
        multiline
          ? "overflow-y-auto break-words whitespace-pre-wrap"
          : "h-5 overflow-x-auto overflow-y-hidden whitespace-pre [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "data-[empty]:before:pointer-events-none data-[empty]:before:absolute data-[empty]:before:text-text-tertiary data-[empty]:before:content-[attr(aria-placeholder)]",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
    />
  );
}

/* -------------------------------------------------------------------- menu */

/** The items a trigger shows for its query: filtered data at once, or a loader's results once typing pauses. */
function useSuggestions(trigger: TokenTrigger | undefined, menu: Menu | null): Loaded {
  const { contains, startsWith } = useFilter({ sensitivity: "base" });
  const query = menu?.match.query ?? "";
  const rule = menu?.rule ?? -1;
  const items = trigger?.items;
  const filter = trigger?.filter ?? "contains";

  const filtered = useMemo(() => {
    if (!items || typeof items === "function") return null;
    const words = (item: TokenSuggestion) => [item.label, ...(item.keywords ?? [])];
    return items.filter((item) =>
      typeof filter === "function"
        ? filter(item, query)
        : words(item).some((word) => (filter === "startsWith" ? startsWith(word, query) : contains(word, query))),
    );
  }, [items, filter, query, contains, startsWith]);

  // The last results a loader gave. Within one trigger they stay up while
  // the next query loads; a new trigger starts empty.
  const [loaded, setLoaded] = useState<{ query: string; items: readonly TokenSuggestion[]; rule: number }>({
    query: "",
    items: [],
    rule: -1,
  });
  const open = !!menu;
  useEffect(() => {
    if (!open || typeof items !== "function") return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      items(query, controller.signal).then(
        (result) => !controller.signal.aborted && setLoaded({ query, items: result, rule }),
        () => !controller.signal.aborted && setLoaded({ query, items: [], rule }),
      );
    }, 150);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, items, query, rule]);

  if (filtered) return { query, items: filtered, loading: false, rule };
  const same = loaded.rule === rule;
  return { query, items: same ? loaded.items : [], loading: open && (!same || loaded.query !== query), rule };
}

function SuggestionMenu({
  anchorRef,
  elementRef,
  viewRef,
  menu,
  trigger,
  loaded,
  isOpen,
  onChoose,
  onDismiss,
  className,
}: {
  anchorRef: RefObject<HTMLSpanElement | null>;
  elementRef: RefObject<HTMLDivElement | null>;
  viewRef: RefObject<TokenView | null>;
  menu: Menu | null;
  trigger: TokenTrigger | undefined;
  loaded: Loaded;
  isOpen: boolean;
  onChoose: (item: TokenSuggestion) => void;
  onDismiss: () => void;
  className?: string;
}) {
  const direction = useDirection();
  const popoverRef = useRef<HTMLElement | null>(null);
  const fade = useScrollFade();
  const outsideRefs = useMemo(() => [elementRef, popoverRef] as RefObject<HTMLElement | null>[], [elementRef]);
  useDismissOnOutsidePress(isOpen, onDismiss, outsideRefs);

  // The menu hangs under the trigger character, so it stays put while the
  // query grows. The anchor is a zero-width span at the trigger's caret box.
  const start = menu?.match.start ?? null;
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const view = viewRef.current;
    if (start === null || !anchor || !view) return;
    const rect = view.rectAt(start);
    const box = anchor.offsetParent?.getBoundingClientRect();
    if (!rect || !box) return;
    anchor.style.left = `${rect.x - box.x}px`;
    anchor.style.top = `${rect.y - box.y}px`;
    anchor.style.height = `${rect.height}px`;
  }, [start, anchorRef, viewRef]);

  const items = loaded.items;
  return (
    <AriaPopover
      ref={popoverRef as RefObject<HTMLElement>}
      triggerRef={anchorRef}
      isOpen={isOpen}
      isNonModal
      placement="bottom start"
      offset={6}
      className={cx(MENU_POPOVER_SURFACE, MENU_POPOVER_COMPACT, "flex w-72 flex-col overflow-hidden", className)}
    >
      {/* A press in the menu must not take focus or the caret from the field. */}
      <div dir={direction} className="relative flex min-h-0 flex-col" onMouseDown={(event) => event.preventDefault()}>
        {trigger?.title ? (
          <div aria-hidden className="shrink-0 px-2 pt-1 pb-1 text-body-2-medium text-text-tertiary">
            {trigger.title}
          </div>
        ) : null}
        <div className="relative flex min-h-0 flex-col">
        {/* A Menu rather than a ListBox: its rows take the highlight on hover,
            so the pointer and the arrows share one highlighted row. */}
        <AriaMenu
          autoFocus="first"
          aria-label={trigger?.title ?? "Suggestions"}
          aria-busy={loaded.loading || undefined}
          items={items}
          onAction={(key) => {
            const item = items.find((entry) => entry.id === key);
            if (item) onChoose(item);
          }}
          onScroll={fade.onScroll}
          disabledKeys={items.filter((item) => item.isDisabled).map((item) => item.id)}
          renderEmptyState={() => (
            <div className="px-2 py-1.5 text-body-2-regular text-text-tertiary">
              {loaded.loading ? "Searching…" : (trigger?.emptyState ?? null)}
            </div>
          )}
          className="flex max-h-72 min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-contain outline-none [scrollbar-width:thin]"
        >
          {(item: TokenSuggestion) => (
            <AriaMenuItem
              id={item.id}
              textValue={item.label}
              className={cx(
                "flex w-full shrink-0 cursor-pointer items-center gap-2 rounded-[10px] px-2 py-1.5 text-start outline-none transition-colors duration-100 ease-out",
                "data-[focused]:bg-dropdown-item-hover-background",
                "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
              )}
            >
              {trigger?.renderItem ? (
                trigger.renderItem(item)
              ) : (
                <>
                  {item.icon ? <item.icon className="size-4 shrink-0 text-foreground-icon-secondary" aria-hidden /> : null}
                  <span className="min-w-0 flex-1 truncate text-body-medium text-text-primary">{item.label}</span>
                  {item.description ? (
                    <span className="max-w-[45%] shrink-0 truncate text-body-2-regular text-text-tertiary">{item.description}</span>
                  ) : null}
                </>
              )}
            </AriaMenuItem>
          )}
        </AriaMenu>
        <ScrollFade progress={fade.progress} />
        </div>
      </div>
    </AriaPopover>
  );
}

