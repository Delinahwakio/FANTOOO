/**
 * Design System Test Component
 * This file demonstrates the usage of the Fantooo design system
 */

import React from 'react';

export function DesignSystemTest() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      {/* Color Palette Test */}
      <section className="mb-12">
        <h2 className="font-display text-4xl font-bold mb-6 text-neutral-900">
          Color Palette
        </h2>
        
        {/* Passion Colors */}
        <div className="mb-6">
          <h3 className="font-sans text-xl font-semibold mb-3 text-neutral-800">
            Passion (Red)
          </h3>
          <div className="flex gap-2">
            <div className="w-16 h-16 bg-passion-500 rounded-lg shadow-passion" />
            <div className="w-16 h-16 bg-passion-600 rounded-lg" />
            <div className="w-16 h-16 bg-passion-700 rounded-lg" />
          </div>
        </div>
        
        {/* Luxury Colors */}
        <div className="mb-6">
          <h3 className="font-sans text-xl font-semibold mb-3 text-neutral-800">
            Luxury (Purple)
          </h3>
          <div className="flex gap-2">
            <div className="w-16 h-16 bg-luxury-500 rounded-lg shadow-luxury" />
            <div className="w-16 h-16 bg-luxury-600 rounded-lg" />
            <div className="w-16 h-16 bg-luxury-700 rounded-lg" />
          </div>
        </div>
        
        {/* Trust Colors */}
        <div className="mb-6">
          <h3 className="font-sans text-xl font-semibold mb-3 text-neutral-800">
            Trust (Blue)
          </h3>
          <div className="flex gap-2">
            <div className="w-16 h-16 bg-trust-500 rounded-lg shadow-trust" />
            <div className="w-16 h-16 bg-trust-600 rounded-lg" />
            <div className="w-16 h-16 bg-trust-700 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Typography Test */}
      <section className="mb-12">
        <h2 className="font-display text-4xl font-bold mb-6 text-neutral-900">
          Typography
        </h2>
        <h1 className="font-display text-6xl font-bold mb-4">
          Display Font - Playfair Display
        </h1>
        <p className="font-sans text-lg text-neutral-700 mb-4">
          Body Font - Inter. This is a paragraph demonstrating the body font with proper spacing and line height.
        </p>
        <div className="text-gradient-passion text-3xl font-display font-bold mb-2">
          Gradient Text - Passion
        </div>
        <div className="text-gradient-luxury text-3xl font-display font-bold mb-2">
          Gradient Text - Luxury
        </div>
        <div className="text-gradient-trust text-3xl font-display font-bold">
          Gradient Text - Trust
        </div>
      </section>

      {/* Glass Morphism Test */}
      <section className="mb-12">
        <h2 className="font-display text-4xl font-bold mb-6 text-neutral-900">
          Glass Morphism
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-2xl">
            <h3 className="font-display text-xl font-semibold mb-2">Glass Default</h3>
            <p className="text-neutral-700">Standard glass effect with blur</p>
          </div>
          <div className="glass-elevated p-6 rounded-2xl">
            <h3 className="font-display text-xl font-semibold mb-2">Glass Elevated</h3>
            <p className="text-neutral-700">Elevated glass with more blur</p>
          </div>
          <div className="glass-subtle p-6 rounded-2xl">
            <h3 className="font-display text-xl font-semibold mb-2">Glass Subtle</h3>
            <p className="text-neutral-700">Subtle glass with less blur</p>
          </div>
        </div>
      </section>

      {/* Animation Test */}
      <section className="mb-12">
        <h2 className="font-display text-4xl font-bold mb-6 text-neutral-900">
          Animations
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-2xl animate-fade-in">
            <p className="text-center font-semibold">Fade In</p>
          </div>
          <div className="glass p-6 rounded-2xl animate-slide-in">
            <p className="text-center font-semibold">Slide In</p>
          </div>
          <div className="glass p-6 rounded-2xl animate-pulse">
            <p className="text-center font-semibold">Pulse</p>
          </div>
          <div className="glass p-6 rounded-2xl animate-bounce">
            <p className="text-center font-semibold">Bounce</p>
          </div>
        </div>
        <div className="mt-6 glass p-6 rounded-2xl shimmer">
          <p className="text-center font-semibold">Shimmer Effect</p>
        </div>
      </section>

      {/* Spacing Test */}
      <section className="mb-12">
        <h2 className="font-display text-4xl font-bold mb-6 text-neutral-900">
          Spacing System
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium">xs (4px)</div>
            <div className="h-8 bg-passion-500 rounded" style={{ width: 'var(--spacing-xs)' }} />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium">sm (8px)</div>
            <div className="h-8 bg-passion-500 rounded" style={{ width: 'var(--spacing-sm)' }} />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium">md (16px)</div>
            <div className="h-8 bg-passion-500 rounded" style={{ width: 'var(--spacing-md)' }} />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium">lg (24px)</div>
            <div className="h-8 bg-passion-500 rounded" style={{ width: 'var(--spacing-lg)' }} />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium">xl (32px)</div>
            <div className="h-8 bg-passion-500 rounded" style={{ width: 'var(--spacing-xl)' }} />
          </div>
        </div>
      </section>

      {/* Interactive Elements Test */}
      <section className="mb-12">
        <h2 className="font-display text-4xl font-bold mb-6 text-neutral-900">
          Interactive Elements
        </h2>
        <div className="flex flex-wrap gap-4">
          <button className="glass-elevated px-6 py-3 rounded-xl hover-lift transition-smooth font-semibold">
            Hover Lift
          </button>
          <button className="glass-elevated px-6 py-3 rounded-xl hover-scale transition-smooth font-semibold">
            Hover Scale
          </button>
          <button className="bg-gradient-passion text-white px-6 py-3 rounded-xl hover-lift transition-smooth font-semibold">
            Passion Button
          </button>
          <button className="bg-gradient-luxury text-white px-6 py-3 rounded-xl hover-lift transition-smooth font-semibold">
            Luxury Button
          </button>
          <button className="bg-gradient-trust text-white px-6 py-3 rounded-xl hover-lift transition-smooth font-semibold">
            Trust Button
          </button>
        </div>
      </section>
    </div>
  );
}
