/**
 * TokenInput's DOM: renders a value into a contenteditable element and turns
 * what the browser does back into edits of the value. This module owns the
 * editor's children; React renders only inside token hosts (through portals),
 * which keep their identity across renders.
 *
 * The shape follows what the three browser engines need: text nodes; a host
 * per token, `span[contenteditable=false]`; a zero-width space on both sides
 * of every host, without which Firefox can't place the caret between two
 * tokens or after a final one; and a trailing <br> when the text ends in a
 * new line or a token. Offsets skip the zero-width spaces.
 *
 * Adapted from vercel-labs/ui, packages/core/src/components/
 * token-input/token-input-view.ts at commit 724a7d6c2d0c. Changes: BoardUI
 * formatting, hosts always carry framework content, no static HTML render.
 * Copyright 2026 Vercel, Inc. Licensed under the Apache License, Version 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0); modified by BoardUI as noted.
 */
import { isToken, type TextRange, type Token, type TokenInputValue } from "./token-input-model";

const ANCHOR = "​";
// Hidden from sight, never from assistive technology.
const visuallyHidden =
  "position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap";
const HOST = "data-token-id";
const SENTINEL_ATTRIBUTE = "data-token-sentinel";
// A symbol, so no text can be mistaken for it.
const SENTINEL = Symbol("sentinel");

type Desired = string | Token | typeof SENTINEL;

// What a value renders as, child by child.
function layout(value: TokenInputValue) {
  const nodes: Desired[] = [];
  value.forEach((segment, index) => {
    if (isToken(segment)) {
      // An anchor before the host, in the text before it or on its own.
      const last = nodes.length - 1;
      if (typeof nodes[last] === "string") nodes[last] += ANCHOR;
      else nodes.push(ANCHOR);
      nodes.push(segment, ANCHOR);
      return;
    }
    const last = nodes.length - 1;
    if (index > 0 && typeof nodes[last] === "string") nodes[last] += segment;
    else nodes.push(segment);
  });
  const last = value.at(-1);
  if (isToken(last) || (typeof last === "string" && last.endsWith("\n"))) nodes.push(SENTINEL);
  return nodes;
}

const isHost = (node: Node | null | undefined): node is HTMLElement =>
  node?.nodeType === Node.ELEMENT_NODE && (node as Element).hasAttribute(HOST);
const isSentinel = (node: Node | null) =>
  node?.nodeType === Node.ELEMENT_NODE && (node as Element).hasAttribute(SENTINEL_ATTRIBUTE);
const realLength = (text: string) => text.replaceAll(ANCHOR, "").length;

export type TokenHost = { id: string; token: Token; host: HTMLElement };

export function createTokenView(
  el: HTMLElement,
  {
    describe,
    hostClassName,
    onHosts,
  }: {
    /** The visually hidden kind each host carries for screen readers. */
    describe: (token: Token) => string;
    /** Classes for a token's host, the chip's outer box. */
    hostClassName: (token: Token) => string;
    /** Hosts were added or removed, so React renders into the new ones. */
    onHosts: () => void;
  },
) {
  const doc = el.ownerDocument;
  type Entry = { host: HTMLElement; content: HTMLElement; label: HTMLElement; token: Token };
  const hosts = new Map<string, Entry>();
  let hostCount = 0;

  function hostFor(token: Token) {
    let entry = hosts.get(token.id!);
    if (!entry) {
      const host = doc.createElement("span");
      host.setAttribute(HOST, token.id!);
      host.setAttribute("contenteditable", "false");
      host.setAttribute("spellcheck", "false");
      host.setAttribute("data-slot", "token-input-token");
      const content = doc.createElement("span");
      content.setAttribute("data-slot", "token-input-token-content");
      // The chip's own row: icon and label side by side, cut at the chip's width.
      content.className = "inline-flex min-w-0 items-center gap-1";
      const label = doc.createElement("span");
      label.style.cssText = visuallyHidden;
      host.append(content, label);
      entry = { host, content, label, token };
      hosts.set(token.id!, entry);
    }
    entry.token = token;
    const description = ` ${describe(token)}`;
    if (entry.label.textContent !== description) entry.label.textContent = description;
    entry.host.setAttribute("data-token-type", token.type);
    const className = hostClassName(token);
    if (entry.host.className !== className) entry.host.className = className;
    return entry.host;
  }

  // Patches the children to match the value, reusing text nodes and hosts, so
  // the caret, spelling marks and React content survive.
  function render(value: TokenInputValue) {
    const wanted = layout(value);
    const used = new Set<string>();
    let cursor = el.firstChild;
    for (const item of wanted) {
      if (item === SENTINEL) {
        if (isSentinel(cursor)) cursor = cursor!.nextSibling;
        else el.insertBefore(doc.createElement("br"), cursor).setAttribute(SENTINEL_ATTRIBUTE, "");
        continue;
      }
      if (typeof item === "string") {
        if (cursor?.nodeType === Node.TEXT_NODE) {
          if ((cursor as Text).data !== item) (cursor as Text).data = item;
          cursor = cursor.nextSibling;
        } else {
          el.insertBefore(doc.createTextNode(item), cursor);
        }
        continue;
      }
      const element = hostFor(item);
      used.add(item.id!);
      if (cursor === element) cursor = cursor.nextSibling;
      else el.insertBefore(element, cursor);
    }
    while (cursor) {
      const next = cursor.nextSibling;
      cursor.remove();
      cursor = next;
    }
    let changed = false;
    for (const [id, entry] of hosts) {
      if (!used.has(id)) {
        entry.host.remove();
        hosts.delete(id);
        changed = true;
      }
    }
    if (changed || used.size !== hostCount) {
      hostCount = used.size;
      onHosts();
    }
  }

  // The value the DOM holds now: text without anchors, and a token per known
  // host. A host the browser removed or emptied is a removed token. Anything
  // else, like a <div> an engine wrapped a line in, becomes its text.
  function read() {
    const value: TokenInputValue = [];
    const walk = (parent: Node, nested: boolean) => {
      parent.childNodes.forEach((node, index) => {
        if (node.nodeType === Node.TEXT_NODE) {
          value.push((node as Text).data.replaceAll(ANCHOR, ""));
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (isHost(node)) {
          const entry = hosts.get(node.getAttribute(HOST)!);
          if (entry && entry.host === node && node.isConnected) value.push(entry.token);
          return;
        }
        if (isSentinel(node)) return;
        const name = (node as Element).localName;
        if (name === "br") return void value.push("\n");
        const block = name === "div" || name === "p";
        if (block && (index > 0 || nested)) value.push("\n");
        walk(node, nested || block);
      });
    };
    walk(el, false);
    return value;
  }

  // The host a node is in, if any.
  function hostOf(node: Node | null) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement;
    const host = element?.closest<HTMLElement>(`[${HOST}]`);
    return host && el.contains(host) ? host : null;
  }

  // Where a node starts, in offsets: the length of everything before it.
  function startOf(node: Node) {
    let total = 0;
    for (let current: Node | null = node; current && current !== el; current = current.parentNode) {
      for (let sibling = current.previousSibling; sibling; sibling = sibling.previousSibling) total += lengthOf(sibling);
    }
    return total;
  }

  // A DOM point as an offset. Inside a host, the token's start, or its end
  // with `after`, since nothing inside a token is a caret position.
  function offsetOf(node: Node, offset: number, after = false) {
    const host = hostOf(node);
    if (host) return startOf(host) + (after || (host === node && offset > 0) ? 1 : 0);
    if (node.nodeType === Node.TEXT_NODE) return startOf(node) + realLength((node as Text).data.slice(0, offset));
    let total = node === el ? 0 : startOf(node);
    for (let index = 0; index < offset && index < node.childNodes.length; index++) total += lengthOf(node.childNodes[index]);
    return total;
  }

  function lengthOf(node: Node): number {
    if (node.nodeType === Node.TEXT_NODE) return realLength((node as Text).data);
    if (isHost(node)) return 1;
    if (isSentinel(node)) return 0;
    if ((node as Element).localName === "br") return 1;
    let total = 0;
    node.childNodes.forEach((child) => (total += lengthOf(child)));
    return total;
  }

  // An offset as a DOM point: inside a text node, after the anchor that
  // follows a host and before the one that precedes the next.
  function pointAt(offset: number): [Node, number] {
    let remaining = offset;
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const data = (child as Text).data;
        const length = realLength(data);
        if (remaining <= length) {
          let index = data.startsWith(ANCHOR) && data.length > 1 ? 1 : 0;
          for (let counted = 0; counted < remaining; index++) if (data[index] !== ANCHOR) counted++;
          return [child, index];
        }
        remaining -= length;
      } else {
        remaining -= lengthOf(child);
      }
    }
    return [el, el.childNodes.length - (isSentinel(el.lastChild) ? 1 : 0)];
  }

  function selection(): TextRange | null {
    const selected = doc.getSelection();
    if (!selected || !selected.rangeCount || !el.contains(selected.anchorNode)) return null;
    const range = selected.getRangeAt(0);
    const start = offsetOf(range.startContainer, range.startOffset);
    const end = offsetOf(range.endContainer, range.endOffset, !range.collapsed);
    return { start: Math.min(start, end), end: Math.max(start, end) };
  }

  function select({ start, end }: TextRange) {
    const selected = doc.getSelection();
    if (!selected) return;
    const [startNode, startOffset] = pointAt(start);
    const [endNode, endOffset] = start === end ? [startNode, startOffset] : pointAt(end);
    const current = selected.rangeCount ? selected.getRangeAt(0) : null;
    if (
      current &&
      current.startContainer === startNode &&
      current.startOffset === startOffset &&
      current.endContainer === endNode &&
      current.endOffset === endOffset
    )
      return;
    selected.setBaseAndExtent(startNode, startOffset, endNode, endOffset);
  }

  // The caret's rectangle at an offset. A collapsed range in a non-empty text
  // node measures in every engine; an empty line or a point next to a host
  // measures zero, so the neighbouring character or host stands in.
  function rectAt(offset: number) {
    if (!el.isConnected) return null;
    const [node, index] = pointAt(offset);
    const range = doc.createRange();
    range.setStart(node, index);
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    if (rect.height) return { x: rect.x, y: rect.y, height: rect.height };
    if (node.nodeType === Node.TEXT_NODE && index > 0) {
      range.setStart(node, index - 1);
      range.setEnd(node, index);
      const before = range.getBoundingClientRect();
      if (before.height) return { x: before.right, y: before.y, height: before.height };
    }
    const previous = node.nodeType === Node.TEXT_NODE ? node.previousSibling : node.childNodes[index - 1];
    if (isHost(previous)) {
      const box = previous.getBoundingClientRect();
      return { x: box.right, y: box.y, height: box.height };
    }
    const box = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const rtl = style.direction === "rtl";
    return {
      x: rtl
        ? box.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth)
        : box.x + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth),
      y: box.y + parseFloat(style.paddingTop) + parseFloat(style.borderTopWidth),
      height: parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2,
    };
  }

  return {
    render,
    read,
    selection,
    select,
    rectAt,
    offsetAt: (node: Node, offset: number) => offsetOf(node, offset),
    /** Whether a DOM point is inside a token's host. */
    inHost: (node: Node | null) => !!hostOf(node),
    hosts: (): TokenHost[] => [...hosts].map(([id, { token, content }]) => ({ id, token, host: content })),
    destroy() {
      hosts.clear();
      onHosts();
    },
  };
}

export type TokenView = ReturnType<typeof createTokenView>;
