// Source: https://raw.githubusercontent.com/BoardUI/boardui/main/utils/directional-icon.ts
// BoardUI free utility; MIT license: https://github.com/BoardUI/boardui/blob/main/LICENSE
import {
  RiArrowLeftLine,
  RiArrowLeftSLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiSidebarFoldLine,
  RiSidebarUnfoldLine,
} from "@remixicon/react";

/** Navigation glyphs mirror; logos, media controls and trend arrows do not. */
const directionalIcons: ReadonlySet<unknown> = new Set([
  RiArrowLeftLine, RiArrowLeftSLine, RiArrowRightLine, RiArrowRightSLine,
  RiSidebarFoldLine, RiSidebarUnfoldLine,
]);

export function directionalIconClass(icon: unknown): string | undefined {
  return directionalIcons.has(icon) ? "rtl:rotate-180" : undefined;
}
