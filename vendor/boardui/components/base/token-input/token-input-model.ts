/**
 * TokenInput's value as plain data: strings and atomic tokens, with offsets
 * where a token counts as one, the codec that turns a value into text and
 * back, and edits by range. Pure, so the round trip and every edit rule are
 * unit tested (tests/token-input-model.test.ts).
 *
 * Adapted from vercel-labs/ui, packages/core/src/components/
 * token-input/token-input-model.ts and foundation/text/text-editor.ts at
 * commit 724a7d6c2d0c. Changes: BoardUI formatting, types gathered here.
 * Copyright 2026 Vercel, Inc. Licensed under the Apache License, Version 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0); modified by BoardUI as noted.
 */

/** An atomic token: a mention, a file, a command. */
export type Token = {
  /** Kind, like `"mention"`, `"file"` or `"command"`. */
  type: string;
  /** The id it stands for. */
  value: string;
  /** The text it shows, reads as and falls back to. */
  label: string;
  /** Stable identity, generated when missing. */
  id?: string;
  /** `"pending"` while it loads, `"unresolved"` when it needs the user, like an ambiguous mention. */
  status?: "pending" | "unresolved";
  /** What the chip renders from, like an icon or a tone. Never serialized. */
  data?: Record<string, unknown>;
};

/** A range of offsets, start inclusive and end exclusive. A token counts as one. */
export type TextRange = { start: number; end: number };

/** A token input's value: text and tokens in order. Adjacent strings are merged and empty ones dropped. */
export type TokenInputValue = (string | Token)[];

/** How tokens become text and back, for the clipboard, forms and drafts. */
export type TokenCodec = {
  /** The text a token is written as. */
  format: (token: Token) => string;
  /** Text back into a value, with tokens wherever their text appears. */
  parse: (text: string) => TokenInputValue;
  /** How plain text is written so `parse` reads it back as text. `next` is the token that follows it, if any. */
  escape?: (text: string, next: Token | undefined) => string;
};

/** A token reads as this in offsets and in what a trigger matches. */
export const TOKEN_CHAR = "￼";

let lastId = 0;
const nextId = () => `t${++lastId}`;
// A supplied id shaped like a generated one moves the count past it, so no generated id repeats it.
const reserveId = (id: string) => {
  if (/^t\d{1,15}$/.test(id)) lastId = Math.max(lastId, Number(id.slice(1)));
};

export const isToken = (segment: string | Token | undefined): segment is Token =>
  typeof segment === "object" && segment !== null;

/**
 * Merges adjacent strings, drops empty ones and gives tokens without one an
 * id. Tokens that have an id keep it, except one repeating an earlier
 * token's id, which gets a new one.
 */
export function normalizeValue(value: readonly (string | Token)[]): TokenInputValue {
  for (const segment of value) if (isToken(segment) && segment.id) reserveId(segment.id);
  const ids = new Set<string>();
  const result: TokenInputValue = [];
  for (const segment of value) {
    if (isToken(segment)) {
      const token = segment.id && !ids.has(segment.id) ? segment : { ...segment, id: nextId() };
      ids.add(token.id!);
      result.push(token);
      continue;
    }
    if (!segment) continue;
    const last = result.length - 1;
    if (typeof result[last] === "string") result[last] += segment;
    else result.push(segment);
  }
  return result;
}

/** How many offsets a value spans. A token is one. */
export function valueLength(value: TokenInputValue) {
  let length = 0;
  for (const segment of value) length += isToken(segment) ? 1 : segment.length;
  return length;
}

/** The value as text with every token as U+FFFC, so offsets line up. */
export function offsetText(value: TokenInputValue) {
  return value.map((segment) => (isToken(segment) ? TOKEN_CHAR : segment)).join("");
}

/** The part of a value between two offsets. */
export function sliceValue(value: TokenInputValue, start: number, end = Infinity) {
  const result: TokenInputValue = [];
  let at = 0;
  for (const segment of value) {
    const length = isToken(segment) ? 1 : segment.length;
    const from = Math.max(start - at, 0);
    const to = Math.min(end - at, length);
    if (from < to) result.push(isToken(segment) ? segment : segment.slice(from, to));
    at += length;
    if (at >= end) break;
  }
  return result;
}

/**
 * Replaces a range with `content`. Offsets never split a token, so an edit
 * that covers part of a token's range covers all of it.
 */
export function replaceRange(value: TokenInputValue, range: TextRange, content: TokenInputValue) {
  return normalizeValue([...sliceValue(value, 0, range.start), ...content, ...sliceValue(value, range.end)]);
}

/** The token at an offset, if one starts there. */
export function tokenAt(value: TokenInputValue, offset: number) {
  const segment = sliceValue(value, offset, offset + 1)[0];
  return isToken(segment) ? segment : undefined;
}

/** Where a token starts, or -1. */
export function offsetOfToken(value: TokenInputValue, id: string) {
  let at = 0;
  for (const segment of value) {
    if (isToken(segment) && segment.id === id) return at;
    at += isToken(segment) ? 1 : segment.length;
  }
  return -1;
}

/** The tokens of a value. */
export const tokensOf = (value: TokenInputValue) => value.filter(isToken);

/** Tokens in `before` that `after` no longer has. */
export function removedTokens(before: TokenInputValue, after: TokenInputValue) {
  const kept = new Set(tokensOf(after).map((token) => token.id));
  return tokensOf(before).filter((token) => !kept.has(token.id));
}

/** Whether two values hold the same text and the same tokens. */
export function sameValue(a: TokenInputValue, b: TokenInputValue) {
  if (a.length !== b.length) return false;
  return a.every((segment, index) => {
    const other = b[index];
    if (!isToken(segment) || !isToken(other)) return segment === other;
    return (
      segment.id === other.id &&
      segment.type === other.type &&
      segment.value === other.value &&
      segment.label === other.label &&
      segment.status === other.status &&
      segment.data === other.data
    );
  });
}

/**
 * Where a word deletion from `offset` stops, going back or forward: past
 * spaces, then past the word. A token is a word of its own, so the deletion
 * stops at it, or removes just it when it's next.
 */
export function wordBoundary(value: TokenInputValue, offset: number, direction: -1 | 1) {
  const text = offsetText(value);
  let at = offset;
  const charAt = (index: number) => text[direction < 0 ? index - 1 : index];
  const inside = (index: number) => (direction < 0 ? index > 0 : index < text.length);
  if (charAt(at) === TOKEN_CHAR) return at + direction;
  while (inside(at) && /\s/.test(charAt(at)) && charAt(at) !== "\n") at += direction;
  if (charAt(at) === TOKEN_CHAR && at !== offset) return at;
  while (inside(at) && !/\s/.test(charAt(at)) && charAt(at) !== TOKEN_CHAR) at += direction;
  return at === offset && inside(at) ? at + direction : at;
}

/** Where the line around `offset` starts or ends. */
export function lineBoundary(value: TokenInputValue, offset: number, direction: -1 | 1) {
  const text = offsetText(value);
  if (direction < 0) {
    const start = text.lastIndexOf("\n", offset - 1) + 1;
    return start === offset && offset > 0 ? offset - 1 : start;
  }
  const end = text.indexOf("\n", offset);
  return end === -1 ? text.length : end === offset ? offset + 1 : end;
}

// The default codec writes `[@label](type:value)`, like a markdown link.
// Inside the brackets `\`, `[` and `]` are escaped, inside the parentheses
// `\`, `(` and `)`. In plain text, `[@` is escaped by an odd run of
// backslashes before it, so text that looks like a token stays text.
const escapeIn = (text: string, special: RegExp) => text.replace(special, (char) => `\\${char}`);
const unescape = (text: string) => text.replace(/\\([\s\S])/g, "$1");
const linkPattern = /\[@((?:\\[\s\S]|[^\\\]])*)\]\(([\w-]+):((?:\\[\s\S]|[^\\()])*)\)/y;

/** The codec TokenInput uses unless you pass your own: `[@label](type:value)`. */
export const defaultCodec: TokenCodec = {
  format: (token) =>
    `[@${escapeIn(token.label, /[\\[\]]/g)}](${token.type}:${escapeIn(token.value, /[\\()]/g)})`,
  // Backslashes before `[@` double, plus one more when the bracket is literal.
  // A run of backslashes at the end of text before a token doubles too.
  escape(text, next) {
    let result = text.replace(/(\\*)\[@/g, (_, slashes: string) => `${slashes}${slashes}\\[@`);
    if (next) result = result.replace(/(\\+)$/, "$1$1");
    return result;
  },
  parse(text) {
    const value: TokenInputValue = [];
    let plain = "";
    let index = 0;
    while (index < text.length) {
      const bracket = text.indexOf("[@", index);
      if (bracket === -1) break;
      // An odd run of backslashes before the bracket makes it literal; each pair is one backslash.
      let slashes = 0;
      while (bracket - slashes - 1 >= index && text[bracket - slashes - 1] === "\\") slashes++;
      plain += text.slice(index, bracket - slashes) + "\\".repeat(Math.floor(slashes / 2));
      if (slashes % 2) {
        plain += "[@";
        index = bracket + 2;
        continue;
      }
      linkPattern.lastIndex = bracket;
      const link = linkPattern.exec(text);
      if (!link) {
        plain += "[@";
        index = bracket + 2;
        continue;
      }
      value.push(plain, { type: link[2], value: unescape(link[3]), label: unescape(link[1]) });
      plain = "";
      index = linkPattern.lastIndex;
    }
    value.push(plain + text.slice(index));
    return normalizeValue(value);
  },
};

/** A value as codec text, for the clipboard, a form or a draft. */
export function toText(value: TokenInputValue, codec: TokenCodec = defaultCodec) {
  return value
    .map((segment, index) => {
      if (isToken(segment)) return codec.format(segment);
      const next = value[index + 1];
      return codec.escape ? codec.escape(segment, isToken(next) ? next : undefined) : segment;
    })
    .join("");
}

/** A value as people read it: text with each token's label. */
export function toLabel(value: TokenInputValue) {
  return value.map((segment) => (isToken(segment) ? segment.label : segment)).join("");
}

/** Codec text back into a value. Text that isn't a well-formed token stays text. */
export function fromText(text: string, codec: TokenCodec = defaultCodec) {
  return codec.parse(text);
}

/**
 * The smallest edit that turns `before` into `after`: the range it replaced
 * and the text it put in. A trigger menu follows edits through this.
 */
export function textDiff(before: string, after: string) {
  let start = 0;
  const shortest = Math.min(before.length, after.length);
  while (start < shortest && before[start] === after[start]) start++;
  let end = 0;
  while (
    end < shortest - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  )
    end++;
  return {
    range: { start, end: before.length - end },
    inserted: after.slice(start, after.length - end),
  };
}
