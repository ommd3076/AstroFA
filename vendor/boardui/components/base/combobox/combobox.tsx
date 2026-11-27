"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode, Ref, RefObject } from "react";
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  ComboBoxStateContext as AriaComboBoxStateContext,
  ComboBoxValue as AriaComboBoxValue,
  Group as AriaGroup,
  Header as AriaHeader,
  Input as AriaInput,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  Popover as AriaPopover,
} from "react-aria-components";
import type {
  ComboBoxProps as AriaComboBoxProps,
  Key,
  ListBoxItemProps as AriaListBoxItemProps,
  ListBoxSectionProps as AriaListBoxSectionProps,
} from "react-aria-components";
import { RiCheckLine, RiCloseLine } from "@remixicon/react";
import { CHIP_COLORS } from "@/components/base/badges/chip";
import type { ChipColor } from "@/components/base/badges/chip";
import { CheckboxGlyph } from "@/components/base/checkbox/checkbox-glyph";
import {
  MENU_ITEM,
  MENU_ITEM_ACTIVE,
  MENU_ITEM_COMPACT,
  MENU_ITEMS_CONTAINER,
  MENU_POPOVER_COMPACT,
  MENU_POPOVER_SURFACE,
} from "@/components/base/dropdown/menu-styles";
import { HintText } from "@/components/base/input/hint-text";
import { InputBase, inputElementClassName, inputFieldClassName, type InputSize } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { useDirection } from "@/components/foundations/direction/direction";
import { ChevronDownSmall } from "@/components/foundations/icons/chevrons";
import { ScrollFade, useScrollFade } from "@/components/foundations/scroll-fade/scroll-fade";
import { cx } from "@/utils/cx";

/**
 * ComboBox — a text field that filters a list as you type: pick an assignee,
 * a country, a timezone. Built on React Aria's ComboBox, so the list is a
 * real listbox with arrow-key navigation, typeahead filtering, and
 * screen-reader announcements.
 *
 *   <ComboBox label="Assignee" placeholder="Search people" defaultItems={people}>
 *     {(person) => <ComboBoxItem textValue={person.name}>…</ComboBoxItem>}
 *   </ComboBox>
 *
 * The field is Input's own InputBase (same surface, hover and focus rings,
 * invalid and disabled states), with the toggle in its trailing slot. The
 * list is Select's compact dropdown: the shared menu surface and motion, a
 * 14px panel over px-2 py-1.5 rows 4px apart, the hover surface on the
 * focused row, and a check on the selected one. It opens under the whole
 * field at the field's width, rather than under the bare input React Aria
 * would anchor to.
 *
 * The panel's 4px padding belongs to the scrolling list, not to the panel
 * around it, so a long list scrolls right to the panel's edge (under the
 * shared progressive top blur) instead of being cut off short of it.
 *
 * `selectionMode="multiple"` is the pick-several variant:
 *
 *   <ComboBox label="Assignees" selectionMode="multiple" defaultValue={["maya"]} defaultItems={people}>
 *     {(person) => <ComboBoxItem textValue={person.name}>…</ComboBoxItem>}
 *   </ComboBox>
 *
 * Every row leads with a checkbox, the list stays open while you pick, and
 * each pick becomes a tag in the field, which grows to wrap them. The input
 * is then only a search: it clears after each pick. A tag shows its remove
 * button on hover (always, on touch screens) and leaves with a short collapse;
 * Backspace in the empty input removes the last one. Tags are neutral pills
 * by default; `tagColor` gives them Chip's colour pairs, the table's status
 * chips, as one colour or per row. Read the picks with `value` / `onChange`
 * (an array of keys). It picks from the list only:
 * `allowsCustomValue` is ignored in this mode, where React Aria would clear
 * the whole selection on blur.
 */

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

export type ComboBoxSelectionMode = "single" | "multiple";

/** Rows follow the field's size, as Select's do. */
const SizeContext = createContext<InputSize>("medium");

export interface ComboBoxProps<T extends object, M extends ComboBoxSelectionMode = "single">
  extends Omit<AriaComboBoxProps<T, M>, "children" | "className"> {
  label?: ReactNode;
  /** Help text under the field; shown in the error colour while invalid. */
  hint?: ReactNode;
  placeholder?: string;
  leadingIcon?: IconComponent;
  /** `medium` (default, 36px) or `small` (32px), as Input. Small rows take the smaller type too. */
  size?: InputSize;
  /** Shown in the list when nothing matches. */
  emptyMessage?: ReactNode;
  /**
   * Multiple only: a tag's content, for rows that come from `items` or
   * `defaultItems`. Tags show the row's text when omitted, and always for
   * rows written by hand.
   */
  renderTag?: (item: T, text: string) => ReactNode;
  /**
   * Multiple only: one of Chip's colours for the tags, or a function of the
   * row to colour each its own way (rows from `items` or `defaultItems`).
   * Tags are neutral pills when omitted.
   */
  tagColor?: ChipColor | ((item: T) => ChipColor | undefined);
  /** Multiple only: names a tag's remove button for assistive technology. */
  removeTagLabel?: (text: string) => string;
  className?: string;
  /** Classes on the list's popover. */
  popoverClassName?: string;
  children: ReactNode | ((item: T) => ReactNode);
  ref?: Ref<HTMLDivElement>;
}

const defaultRemoveTagLabel = (text: string) => `Remove ${text}`;

export function ComboBox<T extends object, M extends ComboBoxSelectionMode = "single">({
  label,
  hint,
  placeholder,
  leadingIcon,
  size,
  emptyMessage = "No results",
  renderTag,
  tagColor,
  removeTagLabel = defaultRemoveTagLabel,
  className,
  popoverClassName,
  children,
  ref,
  ...props
}: ComboBoxProps<T, M>) {
  const direction = useDirection();
  const fieldRef = useRef<HTMLDivElement>(null);
  const fade = useScrollFade();
  const [fieldWidth, setFieldWidth] = useState<number>();
  const isMultiple = props.selectionMode === "multiple";

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const observer = new ResizeObserver(() => setFieldWidth(field.offsetWidth));
    observer.observe(field);
    return () => observer.disconnect();
  }, []);

  return (
    <SizeContext.Provider value={size ?? "medium"}>
      <AriaComboBox
        ref={ref}
        allowsEmptyCollection
        {...props}
        // Free text has nowhere to go among tags, and React Aria would empty
        // the selection when the field blurs with unmatched text in it.
        allowsCustomValue={isMultiple ? false : props.allowsCustomValue}
        className={cx("group flex flex-col gap-1", className)}
        onOpenChange={(isOpen, trigger) => {
          // Each opening starts the list at the top, so the fade starts hidden.
          if (isOpen) fade.reset();
          props.onOpenChange?.(isOpen, trigger);
        }}
      >
        {({ isOpen, isRequired, isInvalid, isDisabled, isReadOnly }) => {
          const toggle = (
            <AriaButton
              className={({ isFocusVisible }) =>
                cx(
                  "-m-1 flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1 text-text-secondary outline-none",
                  isFocusVisible && "ring-2 ring-border-focus-ring",
                )
              }
            >
              <ChevronDownSmall className={cx("size-4 transition-transform duration-200 ease", isOpen && "rotate-180")} />
            </AriaButton>
          );

          return (
            <>
              {label ? <Label isRequired={isRequired}>{label}</Label> : null}
              {isMultiple ? (
                <TagField
                  fieldRef={fieldRef}
                  size={size}
                  placeholder={placeholder}
                  leadingIcon={leadingIcon}
                  renderTag={renderTag}
                  tagColor={tagColor}
                  removeTagLabel={removeTagLabel}
                  isLocked={isDisabled || isReadOnly}
                  isDisabled={isDisabled}
                  toggle={toggle}
                />
              ) : (
                <InputBase
                  groupRef={fieldRef}
                  size={size}
                  placeholder={placeholder}
                  leadingIcon={leadingIcon}
                  trailingAddon={toggle}
                />
              )}
              {hint ? <HintText isInvalid={isInvalid}>{hint}</HintText> : null}
              <AriaPopover
                triggerRef={fieldRef}
                dir={direction}
                offset={4}
                style={{ width: fieldWidth }}
                className={cx(MENU_POPOVER_SURFACE, MENU_POPOVER_COMPACT, "flex flex-col overflow-hidden p-0", popoverClassName)}
              >
                <div className="relative flex min-h-0 flex-col">
                  <AriaListBox
                    onScroll={fade.onScroll}
                    renderEmptyState={() => (
                      <div className={cx(MENU_ITEM_COMPACT, "text-body-medium text-text-tertiary")}>{emptyMessage}</div>
                    )}
                    className={cx(
                      MENU_ITEMS_CONTAINER,
                      // Six rows and half of the seventh, so a longer list
                      // reads as one that scrolls. Rows the keyboard scrolls
                      // to land clear of the top blur.
                      "max-h-[236px] min-h-0 scroll-pt-6 scroll-pb-1 overflow-y-auto overscroll-contain p-1",
                    )}
                  >
                    {children}
                  </AriaListBox>
                  <ScrollFade progress={fade.progress} />
                </div>
              </AriaPopover>
            </>
          );
        }}
      </AriaComboBox>
    </SizeContext.Provider>
  );
}

/* --------------------------------------------------------- multiple: field */

interface TagFieldProps<T extends object> {
  fieldRef: RefObject<HTMLDivElement | null>;
  size?: InputSize;
  placeholder?: string;
  leadingIcon?: IconComponent;
  renderTag?: (item: T, text: string) => ReactNode;
  tagColor?: ChipColor | ((item: T) => ChipColor | undefined);
  removeTagLabel: (text: string) => string;
  /** Disabled or read-only: tags stay, but cannot be removed. */
  isLocked: boolean;
  isDisabled: boolean;
  toggle: ReactNode;
}

/**
 * The multiple variant's field: Input's shell, grown to wrap a tag per pick
 * ahead of the input. Tags are 24px, so the shell's padding drops to keep
 * an empty or one-line field at Input's own height.
 */
function TagField<T extends object>({
  fieldRef,
  size = "medium",
  placeholder,
  leadingIcon: Leading,
  renderTag,
  tagColor,
  removeTagLabel,
  isLocked,
  isDisabled,
  toggle,
}: TagFieldProps<T>) {
  const state = useContext(AriaComboBoxStateContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected: TagSource<T>[] = (state?.selectedItems ?? []).map((node) => ({
    key: node.key,
    text: node.textValue,
    item: (node.value as T | null | undefined) ?? null,
  }));
  const { tags, onExited } = useTagPresence(selected);
  const current = new Map(selected.map((source) => [source.key, source]));

  const remove = (key: Key) => {
    if (!state || isLocked) return;
    state.setValue(selected.map((source) => source.key).filter((selectedKey) => selectedKey !== key));
  };

  const hasTags = tags.length > 0;

  return (
    <AriaGroup
      ref={fieldRef}
      className={(fieldState) =>
        cx(
          inputFieldClassName(fieldState, size),
          "cursor-text items-start gap-2",
          size === "small" ? "h-auto min-h-8 py-1" : "py-1.5",
          isDisabled && "cursor-not-allowed",
        )
      }
      // The gaps between and after tags are the field too: a press there goes
      // to the input rather than nowhere.
      onMouseDown={(event) => {
        if (event.target instanceof Element && event.target.closest("input, button")) return;
        event.preventDefault();
        inputRef.current?.focus();
      }}
    >
      <div className="flex min-w-0 flex-1 items-start gap-1.5">
        {Leading ? <Leading className="my-0.5 size-5 shrink-0" aria-hidden /> : null}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {tags.map((tag) => {
            // A tag still selected shows its row as it is now; one on its way
            // out shows what it last held.
            const { text, item } = current.get(tag.key) ?? tag;
            const color = typeof tagColor === "function" ? (item != null ? tagColor(item) : undefined) : tagColor;
            return (
              <SelectedTag
                key={tag.key}
                tagKey={tag.key}
                isLeaving={tag.isLeaving}
                animatesIn={tag.animatesIn}
                onExited={onExited}
                onRemove={isLocked || tag.isLeaving ? undefined : remove}
                removeLabel={removeTagLabel(text)}
                color={color}
                isDisabled={isDisabled}
              >
                {renderTag && item != null ? renderTag(item, text) : <span className="truncate">{text}</span>}
              </SelectedTag>
            );
          })}
          <AriaInput
            ref={inputRef}
            placeholder={hasTags ? undefined : placeholder}
            onKeyDown={(event) => {
              // Backspace with nothing typed takes the last tag. Not on key
              // repeat, so holding it to clear the text stops at the tags.
              if (event.key !== "Backspace" || event.repeat || event.currentTarget.value !== "" || isLocked) return;
              const last = selected[selected.length - 1];
              if (last) remove(last.key);
            }}
            className={cx(inputElementClassName, "h-6 min-w-12 text-start", hasTags || !Leading ? "ps-1" : "ps-0")}
          />
        </div>
      </div>
      {/* The picks as one phrase, which React Aria has the input described by. */}
      <AriaComboBoxValue className="sr-only" />
      <div className="flex h-6 shrink-0 items-center">{toggle}</div>
    </AriaGroup>
  );
}

/* ---------------------------------------------------------- multiple: tags */

/** A selected row, as a tag needs it. */
interface TagSource<T> {
  key: Key;
  text: string;
  /** The row's object when the list is built from `items`, else null. */
  item: T | null;
}

interface PresentTag<T> extends TagSource<T> {
  /** Removed from the selection and playing its exit. */
  isLeaving: boolean;
  /** Picked after the field first rendered, so it plays an entrance. */
  animatesIn: boolean;
}

/**
 * The tags to render for a selection: its rows in the order they were picked,
 * plus any just removed, which stay in place until their exit has played.
 */
function useTagPresence<T>(selected: TagSource<T>[]) {
  const [tags, setTags] = useState<PresentTag<T>[]>(() =>
    selected.map((source) => ({ ...source, isLeaving: false, animatesIn: false })),
  );

  // Reconciled while rendering, and only when the set of keys has changed, so
  // rows rebuilt on every render do not loop it.
  const sources = new Map(selected.map((source) => [source.key, source]));
  const present = tags.filter((tag) => !tag.isLeaving);
  if (present.length !== sources.size || present.some((tag) => !sources.has(tag.key))) {
    const known = new Set(tags.map((tag) => tag.key));
    setTags([
      ...tags.map((tag) => ({ ...tag, ...sources.get(tag.key), isLeaving: !sources.has(tag.key) })),
      ...selected.filter((source) => !known.has(source.key)).map((source) => ({ ...source, isLeaving: false, animatesIn: true })),
    ]);
  }

  const onExited = useCallback((key: Key) => {
    setTags((current) => current.filter((tag) => !(tag.key === key && tag.isLeaving)));
  }, []);

  return { tags, onExited };
}

/** The gap-1 between tags, which a tag takes with it as it collapses. */
const TAG_GAP = 4;
const TAG_EASING = "cubic-bezier(0.2, 0, 0, 1)";

function tagKeyframes(width: number): Keyframe[] {
  return [
    { width: "0px", marginInlineEnd: `-${TAG_GAP}px`, opacity: 0, filter: "blur(2px)" },
    { width: `${width}px`, marginInlineEnd: "0px", opacity: 1, filter: "blur(0px)" },
  ];
}

/**
 * Plays a tag in (or, reversed, out) by its width, so its neighbours and the
 * input slide rather than jump. The pill inside is pinned to its full width
 * for the duration, so it is clipped by the collapsing wrapper instead of
 * re-truncating its text on every frame.
 */
function animateTag(wrapper: HTMLElement, direction: "in" | "out") {
  if (typeof wrapper.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const pill = wrapper.firstElementChild instanceof HTMLElement ? wrapper.firstElementChild : null;
  const unpin = () => {
    if (!pill) return;
    pill.style.width = "";
    pill.style.maxWidth = "";
  };
  // A tag unpicked mid-entrance (or picked again mid-exit) starts over from
  // its full width, not from wherever the last animation had it.
  for (const running of wrapper.getAnimations()) running.cancel();
  unpin();
  const width = wrapper.offsetWidth;
  if (pill) {
    pill.style.width = `${width}px`;
    pill.style.maxWidth = "none";
  }
  const keyframes = tagKeyframes(width);
  const animation = wrapper.animate(direction === "in" ? keyframes : keyframes.reverse(), {
    duration: direction === "in" ? 200 : 180,
    easing: TAG_EASING,
    fill: direction === "in" ? "none" : "forwards",
  });
  return { animation, unpin };
}

interface SelectedTagProps {
  tagKey: Key;
  isLeaving: boolean;
  animatesIn: boolean;
  onExited: (key: Key) => void;
  /** Omitted while the field is locked or the tag is already leaving. */
  onRemove?: (key: Key) => void;
  removeLabel: string;
  /** One of Chip's colour pairs; a neutral pill without it. */
  color?: ChipColor;
  isDisabled: boolean;
  children: ReactNode;
}

function SelectedTag({ tagKey, isLeaving, animatesIn, onExited, onRemove, removeLabel, color, isDisabled, children }: SelectedTagProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const wrapper = ref.current;
    if (!wrapper || !animatesIn) return;
    const running = animateTag(wrapper, "in");
    if (!running) return;
    running.animation.finished.then(running.unpin, () => {});
    return () => {
      running.animation.cancel();
      running.unpin();
    };
  }, [animatesIn]);

  useLayoutEffect(() => {
    const wrapper = ref.current;
    if (!wrapper || !isLeaving) return;
    const running = animateTag(wrapper, "out");
    if (!running) {
      onExited(tagKey);
      return;
    }
    let isCurrent = true;
    running.animation.finished.then(() => {
      if (isCurrent) onExited(tagKey);
    }, () => {});
    // Picked again before it finished leaving: back to rest.
    return () => {
      isCurrent = false;
      running.animation.cancel();
      running.unpin();
    };
  }, [isLeaving, onExited, tagKey]);

  return (
    // overflow-hidden (not clip) is what lets a flex item collapse below its
    // content's width.
    <span ref={ref} className="inline-flex max-w-full shrink-0 overflow-hidden rounded-md">
      <span
        className={cx(
          "group/tag relative inline-flex h-6 max-w-full min-w-0 shrink-0 cursor-default items-center rounded-md px-1.5 text-body-2-medium",
          color ? CHIP_COLORS[color] : "bg-background-primary-default text-text-primary ring-1 ring-border-button-default ring-inset",
          onRemove && "pointer-coarse:pe-0.5",
          isDisabled && "opacity-50",
        )}
      >
        <span
          className={cx(
            "flex min-w-0 items-center gap-1 overflow-hidden",
            // On hover the label fades out under the remove button. A mask,
            // not a painted fade, so it holds on any tag colour, including
            // dark mode's translucent chips. The fade waits just past the
            // trailing edge and slides in, which a gradient alone cannot
            // animate.
            onRemove && [
              "[mask-image:linear-gradient(to_left,transparent_14px,black_26px)] [mask-size:calc(100%+26px)_100%] [mask-repeat:no-repeat]",
              "[mask-position:0_0] transition-[mask-position] duration-150 ease-out group-hover/tag:[mask-position:-26px_0]",
              "rtl:[mask-image:linear-gradient(to_right,transparent_14px,black_26px)] rtl:[mask-position:-26px_0] rtl:group-hover/tag:[mask-position:0_0]",
              "pointer-coarse:[mask-image:none]",
            ],
          )}
        >
          {children}
        </span>
        {onRemove ? (
          <button
            type="button"
            // Out of the tab order: by keyboard, Backspace takes the last tag
            // and the list unchecks any of them.
            tabIndex={-1}
            aria-label={removeLabel}
            // Keeps focus in the input, so the list stays open.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onRemove(tagKey)}
            className={cx(
              "absolute inset-y-0 end-0 flex cursor-pointer items-center pe-1 text-current/60 opacity-0 outline-none",
              "transition-[opacity,color] duration-150 ease-out group-hover/tag:opacity-100 hover:text-current",
              // No hover on a touch screen: the button is always there, in the tag's own flow.
              "pointer-coarse:static pointer-coarse:ps-0.5 pointer-coarse:pe-0 pointer-coarse:opacity-100",
            )}
          >
            <RiCloseLine aria-hidden className="size-3.5" />
          </button>
        ) : null}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------- rows */

export interface ComboBoxItemProps extends Omit<AriaListBoxItemProps, "children"> {
  children?: ReactNode;
}

/**
 * A row in the list. Content is free-form: an avatar and a name, a flag and
 * a country. A single combobox marks the chosen row with a check at its end;
 * a multiple one leads every row with a checkbox.
 */
export function ComboBoxItem({ className, children, ...props }: ComboBoxItemProps) {
  const size = useContext(SizeContext);
  return (
    <AriaListBoxItem
      {...props}
      className={(state) =>
        cx(
          MENU_ITEM,
          MENU_ITEM_COMPACT,
          size === "small" ? "text-body-2-medium" : "text-body-medium",
          state.isFocused && MENU_ITEM_ACTIVE,
          state.isDisabled && "cursor-not-allowed text-text-disabled",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {({ isSelected, selectionMode, isHovered, isFocused, isDisabled }) =>
        selectionMode === "multiple" ? (
          <>
            <CheckboxGlyph
              size={size === "small" ? "sm" : "md"}
              state={{ isSelected, isIndeterminate: false, isFocusVisible: false, isDisabled, isHovered: isHovered || isFocused }}
            />
            <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
          </>
        ) : (
          <>
            <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
            {isSelected ? <RiCheckLine className="size-4 shrink-0 text-accent-500" aria-hidden /> : null}
          </>
        )
      }
    </AriaListBoxItem>
  );
}

export interface ComboBoxSectionProps<T extends object> extends Omit<AriaListBoxSectionProps<T>, "className" | "children"> {
  /** Muted heading above the section's rows. */
  title?: ReactNode;
  className?: string;
  /** ComboBoxItems, or a React Aria Collection for a dynamic section. */
  children: ReactNode;
}

export function ComboBoxSection<T extends object>({ title, className, children, ...props }: ComboBoxSectionProps<T>) {
  return (
    <AriaListBoxSection {...props} className={cx("flex flex-col gap-1 [&:not(:first-child)]:pt-2", className)}>
      {title ? <AriaHeader className="px-2 pt-1 pb-0.5 text-body-2-medium text-text-tertiary">{title}</AriaHeader> : null}
      {children}
    </AriaListBoxSection>
  );
}
