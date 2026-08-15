import type { ElementType, ReactNode } from 'react';

interface PageContainerProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

// Single source of truth for the app's main content width.
export function PageContainer({ as: Tag = 'div', className = '', children }: PageContainerProps) {
  return <Tag className={`mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</Tag>;
}
