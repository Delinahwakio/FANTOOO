import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export type UserRole = 'guest' | 'user' | 'operator' | 'admin';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles: UserRole[];
  badge?: string | number;
}

export interface NavigationProps {
  role: UserRole;
  items: NavItem[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  onItemClick?: (item: NavItem) => void;
}

/**
 * Navigation Component
 * 
 * A role-based navigation component that displays menu items based on user permissions.
 * 
 * @param role - Current user role: 'guest', 'user', 'operator', or 'admin'
 * @param items - Array of navigation items with role restrictions
 * @param className - Additional CSS classes
 * @param orientation - Layout direction: 'horizontal' or 'vertical'
 * @param onItemClick - Callback when navigation item is clicked
 * 
 * @example
 * ```tsx
 * const navItems: NavItem[] = [
 *   { label: 'Home', href: '/', icon: <HomeIcon />, roles: ['guest', 'user'] },
 *   { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon />, roles: ['user'] },
 *   { label: 'Admin', href: '/admin', icon: <AdminIcon />, roles: ['admin'] },
 * ];
 * 
 * <Navigation role="user" items={navItems} />
 * ```
 */
export const Navigation: React.FC<NavigationProps> = ({
  role,
  items,
  className,
  orientation = 'horizontal',
  onItemClick,
}) => {
  const pathname = usePathname();

  // Filter items based on user role
  const visibleItems = items.filter((item) => item.roles.includes(role));

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'flex gap-2',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
        className
      )}
    >
      {visibleItems.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onItemClick?.(item)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl',
              'font-medium text-sm transition-smooth',
              'hover:bg-neutral-100 hover:text-neutral-900',
              'focus-ring',
              active
                ? 'bg-gradient-passion text-white shadow-passion'
                : 'text-neutral-700',
              orientation === 'vertical' && 'w-full'
            )}
          >
            {item.icon && (
              <span className={cn('flex-shrink-0', active ? 'text-white' : 'text-neutral-500')}>
                {item.icon}
              </span>
            )}
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  'flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-passion-100 text-passion-700'
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

Navigation.displayName = 'Navigation';

/**
 * MobileNavigation Component
 * 
 * A mobile-optimized navigation component with hamburger menu.
 * 
 * @param role - Current user role
 * @param items - Array of navigation items
 * @param isOpen - Controls mobile menu visibility
 * @param onToggle - Callback to toggle menu
 * @param onItemClick - Callback when navigation item is clicked
 * 
 * @example
 * ```tsx
 * <MobileNavigation
 *   role="user"
 *   items={navItems}
 *   isOpen={isMenuOpen}
 *   onToggle={() => setIsMenuOpen(!isMenuOpen)}
 * />
 * ```
 */
export interface MobileNavigationProps {
  role: UserRole;
  items: NavItem[];
  isOpen: boolean;
  onToggle: () => void;
  onItemClick?: (item: NavItem) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  role,
  items,
  isOpen,
  onToggle,
  onItemClick,
}) => {
  const handleItemClick = (item: NavItem) => {
    onItemClick?.(item);
    onToggle(); // Close menu after clicking
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={onToggle}
        className="p-2 rounded-lg hover:bg-neutral-100 transition-smooth focus-ring lg:hidden"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <svg
          className="h-6 w-6 text-neutral-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
          <div className="fixed top-0 right-0 bottom-0 w-64 glass-elevated z-50 lg:hidden animate-slide-in-right">
            <div className="flex flex-col h-full p-6">
              {/* Close Button */}
              <button
                onClick={onToggle}
                className="self-end p-2 rounded-lg hover:bg-neutral-100 transition-smooth focus-ring mb-6"
                aria-label="Close menu"
              >
                <svg
                  className="h-6 w-6 text-neutral-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Navigation Items */}
              <Navigation
                role={role}
                items={items}
                orientation="vertical"
                onItemClick={handleItemClick}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

MobileNavigation.displayName = 'MobileNavigation';
