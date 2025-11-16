import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils/cn';

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Dropdown Component
 * 
 * A dropdown menu component using Headless UI with glassmorphism effects.
 * 
 * @param trigger - Element that triggers the dropdown (e.g., button, avatar)
 * @param items - Array of dropdown menu items
 * @param align - Dropdown alignment: 'left' or 'right'
 * @param className - Additional CSS classes for dropdown container
 * 
 * @example
 * ```tsx
 * const menuItems: DropdownItem[] = [
 *   { label: 'Profile', icon: <UserIcon />, onClick: () => router.push('/profile') },
 *   { label: 'Settings', icon: <SettingsIcon />, onClick: () => router.push('/settings') },
 *   { label: 'Logout', icon: <LogoutIcon />, onClick: handleLogout, variant: 'danger' },
 * ];
 * 
 * <Dropdown
 *   trigger={<button>Menu</button>}
 *   items={menuItems}
 *   align="right"
 * />
 * ```
 */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className,
}) => {
  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      <Menu.Button as={Fragment}>{trigger}</Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={cn(
            'absolute mt-2 w-56 origin-top-right glass-elevated rounded-2xl p-2 shadow-2xl focus:outline-none z-50',
            align === 'left' ? 'left-0' : 'right-0'
          )}
        >
          {items.map((item, index) => (
            <Fragment key={index}>
              {item.divider && <div className="my-1 border-t border-neutral-200" />}
              <Menu.Item disabled={item.disabled}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-smooth',
                      'focus-ring',
                      item.disabled && 'opacity-50 cursor-not-allowed',
                      !item.disabled && active && 'bg-neutral-100',
                      item.variant === 'danger'
                        ? 'text-passion-600 hover:bg-passion-50'
                        : 'text-neutral-700 hover:text-neutral-900'
                    )}
                  >
                    {item.icon && (
                      <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                    )}
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                )}
              </Menu.Item>
            </Fragment>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

Dropdown.displayName = 'Dropdown';

/**
 * UserDropdown Component
 * 
 * A specialized dropdown for user menus with avatar and user info.
 * 
 * @param user - User information to display
 * @param items - Array of dropdown menu items
 * @param align - Dropdown alignment
 * 
 * @example
 * ```tsx
 * <UserDropdown
 *   user={{ name: 'John Doe', email: 'john@example.com', avatar: '/avatar.jpg' }}
 *   items={userMenuItems}
 * />
 * ```
 */
export interface UserDropdownProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  items,
  align = 'right',
}) => {
  const trigger = (
    <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-neutral-100 transition-smooth focus-ring">
      {/* Avatar */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-passion flex items-center justify-center">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-semibold text-sm">
            {user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </span>
        )}
      </div>

      {/* User Info */}
      <div className="hidden md:flex flex-col items-start">
        <span className="text-sm font-semibold text-neutral-900">
          {user.name}
        </span>
        {user.role && (
          <span className="text-xs text-neutral-500 capitalize">{user.role}</span>
        )}
      </div>

      {/* Chevron */}
      <svg
        className="w-4 h-4 text-neutral-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as={Fragment}>{trigger}</Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={cn(
            'absolute mt-2 w-64 origin-top-right glass-elevated rounded-2xl p-2 shadow-2xl focus:outline-none z-50',
            align === 'left' ? 'left-0' : 'right-0'
          )}
        >
          {/* User Info Header */}
          <div className="px-4 py-3 mb-2 border-b border-neutral-200">
            <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
            {user.email && (
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            )}
          </div>

          {/* Menu Items */}
          {items.map((item, index) => (
            <Fragment key={index}>
              {item.divider && <div className="my-1 border-t border-neutral-200" />}
              <Menu.Item disabled={item.disabled}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-smooth',
                      'focus-ring',
                      item.disabled && 'opacity-50 cursor-not-allowed',
                      !item.disabled && active && 'bg-neutral-100',
                      item.variant === 'danger'
                        ? 'text-passion-600 hover:bg-passion-50'
                        : 'text-neutral-700 hover:text-neutral-900'
                    )}
                  >
                    {item.icon && (
                      <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                    )}
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                )}
              </Menu.Item>
            </Fragment>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

UserDropdown.displayName = 'UserDropdown';
