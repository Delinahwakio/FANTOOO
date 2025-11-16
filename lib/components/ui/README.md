# UI Components - Feedback & Navigation

This directory contains the base UI components for the Fantooo platform, implementing the glassmorphism design system.

## Task 23 Components

### Modal Component

A modal dialog component with glassmorphism effects and smooth animations using Headless UI.

**Features:**
- Multiple size options (sm, md, lg, xl, full)
- Smooth enter/exit animations
- Optional close button
- Configurable overlay click behavior
- Backdrop blur effect
- Accessible with ARIA attributes

**Usage:**
```tsx
import { Modal } from '@/lib/components/ui';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        description="Are you sure you want to proceed?"
        size="md"
      >
        <p>Modal content goes here</p>
        <button onClick={() => setIsOpen(false)}>Close</button>
      </Modal>
    </>
  );
}
```

### Toast Component

A notification toast system with multiple variants and auto-dismiss functionality.

**Features:**
- Four variants: success, error, warning, info
- Auto-dismiss with configurable duration
- Manual close button
- Smooth slide-in/slide-out animations
- Configurable positioning
- Toast container for managing multiple toasts

**Usage:**
```tsx
import { ToastContainer } from '@/lib/components/ui';
import { useToast } from '@/lib/hooks/useToast';

function MyComponent() {
  const { toasts, success, error, removeToast } = useToast();

  const handleAction = async () => {
    try {
      await someAction();
      success('Action completed successfully!');
    } catch (err) {
      error('Action failed. Please try again.');
    }
  };

  return (
    <>
      <button onClick={handleAction}>Do Something</button>
      <ToastContainer toasts={toasts} position="top-right" onClose={removeToast} />
    </>
  );
}
```

### Navigation Component

A role-based navigation component that displays menu items based on user permissions.

**Features:**
- Role-based menu filtering
- Horizontal and vertical layouts
- Active route highlighting
- Badge support for notifications
- Icon support
- Mobile-responsive with hamburger menu
- Smooth transitions

**Usage:**
```tsx
import { Navigation, NavItem } from '@/lib/components/ui';

const navItems: NavItem[] = [
  { 
    label: 'Home', 
    href: '/', 
    icon: <HomeIcon />, 
    roles: ['guest', 'user', 'operator', 'admin'] 
  },
  { 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: <DashboardIcon />, 
    roles: ['user', 'operator', 'admin'],
    badge: 5
  },
  { 
    label: 'Admin', 
    href: '/admin', 
    icon: <AdminIcon />, 
    roles: ['admin'] 
  },
];

function MyComponent() {
  const userRole = 'user'; // Get from auth context

  return (
    <Navigation 
      role={userRole} 
      items={navItems} 
      orientation="horizontal"
    />
  );
}
```

**Mobile Navigation:**
```tsx
import { MobileNavigation } from '@/lib/components/ui';

function MyComponent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <MobileNavigation
      role="user"
      items={navItems}
      isOpen={isMenuOpen}
      onToggle={() => setIsMenuOpen(!isMenuOpen)}
    />
  );
}
```

### Dropdown Component

A dropdown menu component using Headless UI with glassmorphism effects.

**Features:**
- Smooth animations
- Icon support
- Danger variant for destructive actions
- Disabled state support
- Dividers between items
- Left/right alignment
- Accessible with keyboard navigation

**Usage:**
```tsx
import { Dropdown, DropdownItem } from '@/lib/components/ui';

const menuItems: DropdownItem[] = [
  { 
    label: 'Profile', 
    icon: <UserIcon />, 
    onClick: () => router.push('/profile') 
  },
  { 
    label: 'Settings', 
    icon: <SettingsIcon />, 
    onClick: () => router.push('/settings') 
  },
  { 
    label: 'Logout', 
    icon: <LogoutIcon />, 
    onClick: handleLogout, 
    variant: 'danger',
    divider: true 
  },
];

function MyComponent() {
  return (
    <Dropdown
      trigger={<button>Menu</button>}
      items={menuItems}
      align="right"
    />
  );
}
```

**User Dropdown:**
```tsx
import { UserDropdown } from '@/lib/components/ui';

function MyComponent() {
  return (
    <UserDropdown
      user={{
        name: 'John Doe',
        email: 'john@fantooo.com',
        avatar: '/avatar.jpg',
        role: 'user'
      }}
      items={menuItems}
      align="right"
    />
  );
}
```

## Custom Hook: useToast

A custom hook for managing toast notifications throughout the application.

**Features:**
- Centralized toast state management
- Convenience methods for each variant
- Auto-dismiss support
- Clear all toasts functionality

**Usage:**
```tsx
import { useToast } from '@/lib/hooks/useToast';

function MyComponent() {
  const { toasts, success, error, warning, info, removeToast } = useToast();

  return (
    <>
      <button onClick={() => success('Success!')}>Success</button>
      <button onClick={() => error('Error!')}>Error</button>
      <button onClick={() => warning('Warning!')}>Warning</button>
      <button onClick={() => info('Info!')}>Info</button>
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
```

## Design System Integration

All components follow the Fantooo design system:

- **Glassmorphism effects**: Using `glass`, `glass-elevated`, and `glass-subtle` classes
- **Color palette**: Passion (red), Luxury (purple), Trust (blue), Neutral (grayscale)
- **Typography**: Playfair Display for headings, Inter for body text
- **Animations**: Smooth transitions with fade, slide, and scale effects
- **Accessibility**: ARIA attributes, keyboard navigation, focus states

## Dependencies

- `@headlessui/react`: For accessible, unstyled UI components (Modal, Dropdown)
- `clsx`: For conditional class names
- `tailwind-merge`: For merging Tailwind classes

## Demo

A comprehensive demo component is available at `lib/components/ui/__demo__/FeedbackNavigationDemo.tsx` showcasing all four components with interactive examples.

## Requirements

These components fulfill the requirements for Task 23:
- ✅ Modal component with animations using Headless UI
- ✅ Toast notification system with variants (success, error, warning, info)
- ✅ Navigation component with role-based menu items
- ✅ Dropdown component for user menus

## Related Components

- `GlassCard`: Base card component with glassmorphism
- `GlassButton`: Styled button component
- `GlassInput`: Form input component
- `LoadingSpinner`: Loading state indicator
