import React, { useState } from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { BreadcrumbsProps, BreadcrumbItemData } from './types';

const BreadcrumbLink: React.FC<{
  to: string;
  className?: string;
  children: React.ReactNode;
}> = ({ to, className, children }) => {
  let inRouter = false;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    inRouter = useInRouterContext();
  } catch {
    inRouter = false;
  }

  if (inRouter) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={to} className={className}>
      {children}
    </a>
  );
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items = [],
  separator = <ChevronRight className="w-4 h-4 text-content-subtle flex-shrink-0" />,
  showHome = true,
  homeHref = '/',
  maxItems = 0,
  className,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  let effectiveItems: BreadcrumbItemData[] = [...items];
  if (showHome && (effectiveItems.length === 0 || effectiveItems[0].href !== homeHref)) {
    effectiveItems = [{ label: 'Trang chủ', href: homeHref, icon: <Home className="w-4 h-4" /> }, ...effectiveItems];
  }

  const shouldTruncate = maxItems > 2 && effectiveItems.length > maxItems && !isExpanded;
  let renderList = effectiveItems;
  if (shouldTruncate) {
    const head = effectiveItems.slice(0, 1);
    const tail = effectiveItems.slice(-2);
    renderList = [...head, { label: '...', href: undefined } as BreadcrumbItemData, ...tail];
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
      <ol className="flex items-center flex-wrap gap-1.5 text-content-muted">
        {effectiveItems.length > 0 ? (
          renderList.map((item, index) => {
            const isLast = index === renderList.length - 1;
            const isEllipsis = item.label === '...' && !item.href;

            return (
              <li key={index} className="flex items-center gap-1.5">
                {index > 0 && <span aria-hidden="true">{separator}</span>}

                {isEllipsis ? (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="p-1 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle cursor-pointer"
                    aria-label="Hiển thị thêm danh mục"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                ) : isLast ? (
                  <span
                    aria-current="page"
                    className="font-medium text-content-main flex items-center gap-1.5"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                ) : item.href ? (
                  <BreadcrumbLink
                    to={item.href}
                    className="hover:text-content-main hover:underline transition-colors flex items-center gap-1.5"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </BreadcrumbLink>
                ) : (
                  <span className="flex items-center gap-1.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
            );
          })
        ) : (
          children
        )}
      </ol>
    </nav>
  );
};

Breadcrumbs.displayName = 'Breadcrumbs';
