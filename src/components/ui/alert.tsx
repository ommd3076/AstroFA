import type { ComponentProps } from 'react';

type AlertVariant = 'default' | 'destructive' | 'info' | 'success' | 'warning';

interface AlertProps extends ComponentProps<'div'> {
  variant?: AlertVariant;
}

// Adapted from ReUI base-nova Alert: https://raw.githubusercontent.com/keenthemes/reui/main/public/r/styles/base-nova/alert.json
// Copyright (c) 2025 Keenthemes Inc. ReUI is MIT-licensed; this adaptation uses local project styling.
export function Alert({ className = '', variant = 'default', ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role="alert"
      className={`reui-alert ${className}`.trim()}
      {...props}
    />
  );
}

export function AlertTitle(props: ComponentProps<'div'>) {
  return <div data-slot="alert-title" className="reui-alert-title" {...props} />;
}

export function AlertDescription(props: ComponentProps<'div'>) {
  return <div data-slot="alert-description" className="reui-alert-description" {...props} />;
}
