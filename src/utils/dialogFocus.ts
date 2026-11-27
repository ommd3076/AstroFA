import type React from 'react';

const POPUP_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Returns keyboard-tabbable controls inside a modal popup, skipping focus guards and inert subtrees.
 */
export function getPopupFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(POPUP_FOCUSABLE_SELECTOR)).filter(el => {
    if (el.hasAttribute('data-base-ui-focus-guard')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.closest('[inert]')) return false;
    if (el.getAttribute('data-slot') === 'scroll-area-viewport') return false;
    return el.getClientRects().length > 0;
  });
}

/**
 * Synchronously wraps Tab and Shift+Tab inside a modal DialogPopup to prevent focus escape.
 */
export function handlePopupTabKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
  if (event.key !== 'Tab') return;
  const focusables = getPopupFocusableElements(event.currentTarget);
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey) {
    if (!active || active === first || !event.currentTarget.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (!active || active === last || !event.currentTarget.contains(active)) {
    event.preventDefault();
    first.focus();
  }
}
