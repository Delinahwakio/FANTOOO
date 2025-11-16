# Fantooo Design System

## Overview

The Fantooo design system is built on Tailwind CSS with custom configurations for colors, typography, spacing, and animations. It emphasizes glassmorphism aesthetics, smooth animations, and a premium feel.

## Color Palette

### Passion (Red) - Primary Brand Color
Represents romance, excitement, and emotional connection.

```css
passion-50  to passion-950
Primary: passion-500 (#ef4444)
Secondary: passion-600 (#dc2626)
```

**Usage:**
- Primary CTAs
- Important notifications
- Romantic/emotional elements
- Featured badges

### Luxury (Purple) - Premium Feel
Represents exclusivity, premium features, and sophistication.

```css
luxury-50 to luxury-950
Primary: luxury-500 (#a855f7)
Secondary: luxury-600 (#9333ea)
```

**Usage:**
- Premium features
- VIP indicators
- Featured profiles
- Upgrade prompts

### Trust (Blue) - Reliability
Represents security, reliability, and professionalism.

```css
trust-50 to trust-950
Primary: trust-500 (#3b82f6)
Secondary: trust-600 (#2563eb)
```

**Usage:**
- Security features
- Payment elements
- Admin interfaces
- Informational messages

### Neutral - Grayscale
For text, backgrounds, and UI elements.

```css
neutral-50 to neutral-950
Light: neutral-50 (#fafafa)
Dark: neutral-900 (#171717)
```

## Typography

### Font Families

**Display Font: Playfair Display**
- Used for: Headings, hero text, emotional content
- Weights: 400, 500, 600, 700, 800, 900
- Class: `font-display`

**Body Font: Inter**
- Used for: Body text, UI elements, forms
- Weights: 300, 400, 500, 600, 700, 800, 900
- Class: `font-sans`

### Font Sizes

```css
text-xs   (12px)  - Small labels, captions
text-sm   (14px)  - Secondary text
text-base (16px)  - Body text (default)
text-lg   (18px)  - Emphasized body text
text-xl   (20px)  - Small headings
text-2xl  (24px)  - Section headings
text-3xl  (30px)  - Page headings
text-4xl  (36px)  - Hero headings
text-5xl  (48px)  - Large hero text
text-6xl+ (60px+) - Extra large displays
```

### Text Gradients

```tsx
<h1 className="text-gradient-passion">Passionate Heading</h1>
<h1 className="text-gradient-luxury">Luxury Heading</h1>
<h1 className="text-gradient-trust">Trustworthy Heading</h1>
```

## Spacing System

Based on a 4px base unit:

```css
spacing-xs   (4px)   - Tight spacing
spacing-sm   (8px)   - Small spacing
spacing-md   (16px)  - Default spacing
spacing-lg   (24px)  - Medium spacing
spacing-xl   (32px)  - Large spacing
spacing-2xl  (48px)  - Extra large spacing
spacing-3xl  (64px)  - Section spacing
spacing-4xl  (96px)  - Page spacing
spacing-5xl  (128px) - Hero spacing
```

**Tailwind Classes:**
- `p-4` = 16px padding
- `m-8` = 32px margin
- `gap-6` = 24px gap
- Custom: `p-18` (72px), `p-88` (352px), `p-128` (512px)

## Glass Morphism

### Glass Variants

**Default Glass**
```tsx
<div className="glass p-6 rounded-2xl">
  Content
</div>
```
- Background: rgba(255, 255, 255, 0.1)
- Blur: 10px
- Border: rgba(255, 255, 255, 0.2)

**Elevated Glass**
```tsx
<div className="glass-elevated p-6 rounded-2xl">
  Content
</div>
```
- Background: rgba(255, 255, 255, 0.15)
- Blur: 12px
- Border: rgba(255, 255, 255, 0.25)
- Shadow: 0 8px 32px rgba(0, 0, 0, 0.1)

**Subtle Glass**
```tsx
<div className="glass-subtle p-6 rounded-2xl">
  Content
</div>
```
- Background: rgba(255, 255, 255, 0.05)
- Blur: 8px
- Border: rgba(255, 255, 255, 0.1)

**Dark Glass**
```tsx
<div className="glass-dark p-6 rounded-2xl">
  Content
</div>
```
- Background: rgba(0, 0, 0, 0.3)
- Blur: 10px
- Border: rgba(255, 255, 255, 0.1)

## Animations

### Built-in Animations

**Fade In**
```tsx
<div className="animate-fade-in">Content</div>
<div className="animate-fade-in-slow">Slower fade</div>
```

**Slide In**
```tsx
<div className="animate-slide-in">From top</div>
<div className="animate-slide-in-up">From bottom</div>
<div className="animate-slide-in-down">From top</div>
<div className="animate-slide-in-left">From left</div>
<div className="animate-slide-in-right">From right</div>
```

**Pulse**
```tsx
<div className="animate-pulse">Standard pulse</div>
<div className="animate-pulse-slow">Slow pulse</div>
```

**Bounce**
```tsx
<div className="animate-bounce">Standard bounce</div>
<div className="animate-bounce-slow">Slow bounce</div>
```

**Shimmer**
```tsx
<div className="shimmer">Shimmer effect</div>
```

**Scale**
```tsx
<div className="animate-scale-in">Scale in</div>
<div className="animate-scale-out">Scale out</div>
```

### Custom Keyframes

All animations are defined in `tailwind.config.ts` and can be customized:

```typescript
keyframes: {
  shimmer: { /* ... */ },
  pulse: { /* ... */ },
  bounce: { /* ... */ },
  slideIn: { /* ... */ },
  fadeIn: { /* ... */ },
  // ... more
}
```

## Interactive Elements

### Hover Effects

**Lift Effect**
```tsx
<button className="hover-lift">
  Lifts on hover
</button>
```

**Scale Effect**
```tsx
<button className="hover-scale">
  Scales on hover
</button>
```

### Transitions

```tsx
<div className="transition-fast">150ms transition</div>
<div className="transition-smooth">200ms transition (default)</div>
<div className="transition-slow">300ms transition</div>
```

### Focus Styles

```tsx
<input className="focus-ring" />
```
- Adds 2px outline on focus
- Color: passion-500

## Background Gradients

```tsx
<div className="bg-gradient-passion">Passion gradient</div>
<div className="bg-gradient-luxury">Luxury gradient</div>
<div className="bg-gradient-trust">Trust gradient</div>
<div className="bg-gradient-radial">Radial gradient</div>
```

## Shadows

### Standard Shadows
```css
shadow-sm    - Subtle shadow
shadow-md    - Medium shadow
shadow-lg    - Large shadow
shadow-xl    - Extra large shadow
shadow-2xl   - Huge shadow
```

### Glass Shadows
```css
shadow-glass    - Glass effect shadow
shadow-glass-lg - Large glass shadow
```

### Colored Shadows
```css
shadow-passion  - Red glow
shadow-luxury   - Purple glow
shadow-trust    - Blue glow
```

## Border Radius

```css
rounded-sm   (4px)
rounded-md   (6px)
rounded-lg   (8px)
rounded-xl   (12px)
rounded-2xl  (16px)
rounded-3xl  (24px)
rounded-4xl  (32px)
rounded-5xl  (40px)
rounded-full (9999px)
```

## Responsive Breakpoints

```css
xs:   475px  - Extra small devices
sm:   640px  - Small devices
md:   768px  - Medium devices (tablets)
lg:   1024px - Large devices (desktops)
xl:   1280px - Extra large devices
2xl:  1536px - 2X large devices
3xl:  1920px - 3X large devices (4K)
```

**Usage:**
```tsx
<div className="text-base md:text-lg lg:text-xl">
  Responsive text
</div>
```

## Scrollbar Styling

### Thin Scrollbar
```tsx
<div className="scrollbar-thin overflow-auto">
  Content with styled scrollbar
</div>
```

### Hidden Scrollbar
```tsx
<div className="scrollbar-hide overflow-auto">
  Content with hidden scrollbar
</div>
```

## CSS Variables

All design tokens are available as CSS variables:

```css
/* Colors */
var(--passion-500)
var(--luxury-500)
var(--trust-500)
var(--neutral-900)

/* Spacing */
var(--spacing-md)
var(--spacing-xl)

/* Typography */
var(--font-display)
var(--font-body)
var(--text-2xl)

/* Glass */
var(--glass-bg)
var(--glass-border)

/* Transitions */
var(--transition-base)

/* Z-Index */
var(--z-modal)
var(--z-dropdown)
```

## Best Practices

### 1. Use Semantic Colors
- `passion` for primary actions and emotional content
- `luxury` for premium features
- `trust` for security and reliability
- `neutral` for text and backgrounds

### 2. Maintain Hierarchy
- Use `font-display` for headings
- Use `font-sans` for body text
- Follow the font size scale

### 3. Consistent Spacing
- Use the spacing scale (4px base)
- Maintain consistent gaps and padding
- Use responsive spacing

### 4. Glass Effects
- Use on cards, modals, and overlays
- Ensure sufficient contrast
- Test on different backgrounds

### 5. Animations
- Keep animations subtle and purposeful
- Use `transition-smooth` for most interactions
- Avoid excessive animation

### 6. Accessibility
- Maintain color contrast ratios
- Use `focus-ring` for keyboard navigation
- Test with screen readers

## Component Examples

### Card Component
```tsx
<div className="glass-elevated p-6 rounded-2xl hover-lift transition-smooth">
  <h3 className="font-display text-2xl font-bold mb-2 text-neutral-900">
    Card Title
  </h3>
  <p className="font-sans text-neutral-700">
    Card content goes here
  </p>
</div>
```

### Button Component
```tsx
<button className="bg-gradient-passion text-white px-6 py-3 rounded-xl hover-lift transition-smooth font-semibold shadow-passion">
  Click Me
</button>
```

### Input Component
```tsx
<input 
  className="glass px-4 py-3 rounded-lg focus-ring transition-smooth w-full"
  placeholder="Enter text..."
/>
```

### Modal Component
```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-modal">
  <div className="glass-elevated p-8 rounded-3xl max-w-md mx-auto mt-20 animate-scale-in">
    <h2 className="font-display text-3xl font-bold mb-4">Modal Title</h2>
    <p className="text-neutral-700 mb-6">Modal content</p>
    <button className="bg-gradient-passion text-white px-6 py-3 rounded-xl w-full">
      Confirm
    </button>
  </div>
</div>
```

## Testing

A test component is available at `lib/design-system-test.tsx` that demonstrates all design system features.

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Playfair Display Font](https://fonts.google.com/specimen/Playfair+Display)
- [Inter Font](https://fonts.google.com/specimen/Inter)
- [Glassmorphism Generator](https://hype4.academy/tools/glassmorphism-generator)
