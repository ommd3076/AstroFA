import React from 'react';
import { Button as BoardButton } from '../../components/ui/board/base/buttons/button';
import { Input as BoardInput } from '../../components/ui/board/base/input/input';
import { Select as BoardSelect, SelectItem as BoardSelectItem } from '../../components/ui/board/base/select/select';
import { Switch as BoardSwitch } from '../../components/ui/board/base/switch/switch';

/** Feature-local bridge: keeps the simulation views' public props stable while
 * moving their controls onto the vendored Board UI primitives. */
export const Button = ({ variant = 'default', size = 'default', ...props }: any) => (
  <BoardButton
    variant={variant === 'outline' ? 'secondary' : variant === 'default' ? 'primary' : variant}
    size={size === 'default' ? 'medium' : size === 'sm' ? 'small' : size}
    {...props}
  />
);

type FeatureInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: 'sm' | 'md' | 'small' | 'medium';
  label?: React.ReactNode;
  hint?: React.ReactNode;
};
export const Input = ({ size: _size, ...props }: FeatureInputProps) => <BoardInput size="small" {...props as any} />;

export const Card = ({ className = '', children, ...props }: any) => (
  <section className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] ${className}`} {...props}>
    {children}
  </section>
);

export const Alert = ({ className = '', children, ...props }: any) => (
  <div role="status" className={`rounded-xl border border-[var(--signal-surface)] bg-[var(--bg-pill-active)] p-3 ${className}`} {...props}>{children}</div>
);
export const AlertDescription = ({ children, ...props }: any) => <div className="text-xs text-[var(--ink-secondary)]" {...props}>{children}</div>;
export const AlertTitle = ({ children, ...props }: any) => <div className="text-sm font-semibold text-[var(--ink-primary)]" {...props}>{children}</div>;

export const Select = ({ value, onValueChange, children, ...props }: { value?: string; onValueChange?: (value: string) => void; children?: React.ReactNode; [key: string]: any }) => {
  const items = React.Children.toArray(children).flatMap((child: any) =>
    React.Children.toArray(child?.props?.children).filter((item: any) => item?.type === SelectItem).map((item: any) => item.props),
  );
  return <BoardSelect selectedKey={value} onSelectionChange={key => onValueChange?.(String(key))} items={items} {...props}>
    {items.map((item: any) => <BoardSelectItem key={item.value} id={item.value}>{item.children}</BoardSelectItem>)}
  </BoardSelect>;
};
export const SelectItem = ({ children, ...props }: any) => <span {...props}>{children}</span>;
export const SelectTrigger = ({ children, ...props }: any) => <span {...props}>{children}</span>;
export const SelectValue = ({ children }: { children?: React.ReactNode | ((value: string) => React.ReactNode); [key: string]: any }) => <>{typeof children === 'function' ? children('') : children}</>;
export const SelectPopup = ({ children }: any) => <>{children}</>;

export const Table = ({ className = '', children, ...props }: any) => <div className="w-full overflow-x-auto rounded-xl border border-[var(--border-subtle)]"><table className={`w-full text-left ${className}`} {...props}>{children}</table></div>;
export const TableHeader = (props: any) => <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-tray)]" {...props} />;
export const TableBody = (props: any) => <tbody {...props} />;
export const TableRow = (props: any) => <tr className="border-b border-[var(--border-subtle)] last:border-0" {...props} />;
export const TableHead = (props: any) => <th className="p-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]" {...props} />;
export const TableCell = (props: any) => <td className="p-2 text-xs" {...props} />;
export const Switch = (props: { checked?: boolean; onCheckedChange?: (checked: boolean) => void; [key: string]: any }) => <BoardSwitch size="sm" isSelected={props.checked} onChange={props.onCheckedChange} {...props} />;
export const ToggleGroup = ({ children, onValueChange, ...props }: { children?: React.ReactNode; onValueChange?: (values: string[]) => void; [key: string]: any }) => <div role="group" className="inline-flex rounded-lg border border-[var(--border-subtle)] p-0.5" {...props}>{children}</div>;
export const ToggleGroupItem = ({ children, className = '', ...props }: any) => <button type="button" className={`px-2 py-1 text-xs rounded-md ${className}`} {...props}>{children}</button>;
export const Empty = ({ children, className = '', ...props }: any) => <div className={`rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-center ${className}`} {...props}>{children}</div>;
export const EmptyHeader = (props: any) => <div className="space-y-1" {...props} />;
export const EmptyTitle = (props: any) => <h3 className="text-sm font-semibold" {...props} />;
export const EmptyDescription = (props: any) => <p className="text-xs text-[var(--ink-muted)]" {...props} />;
