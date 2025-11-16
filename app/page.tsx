import Link from 'next/link';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassCard } from '@/lib/components/ui/GlassCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-passion-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-luxury-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-trust-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-passion rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold text-xl">F</span>
            </div>
            <span className="font-display font-bold text-2xl text-gradient-passion">Fantooo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/get-started">
              <GlassButton variant="outline" size="md">
                Sign In
              </GlassButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 md:py-32 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl mb-6 animate-fade-in">
              <span className="text-gradient-passion">Connect.</span>{' '}
              <span className="text-gradient-luxury">Chat.</span>{' '}
              <span className="text-gradient-trust">Feel.</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-700 mb-8 leading-relaxed animate-fade-in-slow">
              Experience meaningful conversations with exciting people who understand you. 
              Every chat is a new adventure waiting to unfold.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-in-up">
              <Link href="/get-started">
                <GlassButton variant="passion" size="xl">
                  Start Chatting Now
                </GlassButton>
              </Link>
              <Link href="#how-it-works">
                <GlassButton variant="ghost" size="xl">
                  Learn More
                </GlassButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard variant="elevated" hover className="text-center animate-slide-in-up">
              <div className="w-16 h-16 bg-gradient-passion rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-2xl mb-3 text-neutral-900">Real-Time Conversations</h3>
              <p className="text-neutral-700 leading-relaxed">
                Engage in instant, flowing conversations that feel natural and exciting. 
                Every message brings you closer.
              </p>
            </GlassCard>

            <GlassCard variant="elevated" hover className="text-center animate-slide-in-up animation-delay-200">
              <div className="w-16 h-16 bg-gradient-luxury rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-2xl mb-3 text-neutral-900">Diverse Personalities</h3>
              <p className="text-neutral-700 leading-relaxed">
                Discover a world of fascinating people with unique stories, interests, and perspectives 
                that match your vibe.
              </p>
            </GlassCard>

            <GlassCard variant="elevated" hover className="text-center animate-slide-in-up animation-delay-400">
              <div className="w-16 h-16 bg-gradient-trust rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-2xl mb-3 text-neutral-900">Safe & Secure</h3>
              <p className="text-neutral-700 leading-relaxed">
                Your privacy matters. Chat with confidence knowing your conversations 
                are protected and secure.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 px-6 py-20 md:px-12 bg-white/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-4xl md:text-5xl text-center mb-16 text-gradient-passion">
            How It Works
          </h2>
          
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-8 animate-slide-in-left">
              <div className="flex-shrink-0 w-20 h-20 bg-gradient-passion rounded-2xl flex items-center justify-center text-white font-display font-bold text-3xl shadow-passion">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-2xl mb-2 text-neutral-900">Create Your Account</h3>
                <p className="text-lg text-neutral-700 leading-relaxed">
                  Sign up in seconds with just a few details. Tell us what you're looking for, 
                  and we'll help you find the perfect match.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 animate-slide-in-right">
              <div className="flex-shrink-0 w-20 h-20 bg-gradient-luxury rounded-2xl flex items-center justify-center text-white font-display font-bold text-3xl shadow-luxury">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-2xl mb-2 text-neutral-900">Browse & Connect</h3>
                <p className="text-lg text-neutral-700 leading-relaxed">
                  Explore profiles of interesting people who share your interests. 
                  When someone catches your eye, start a conversation instantly.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 animate-slide-in-left">
              <div className="flex-shrink-0 w-20 h-20 bg-gradient-trust rounded-2xl flex items-center justify-center text-white font-display font-bold text-3xl shadow-trust">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-2xl mb-2 text-neutral-900">Chat & Enjoy</h3>
                <p className="text-lg text-neutral-700 leading-relaxed">
                  Dive into engaging conversations that flow naturally. 
                  Your first few messages are free, then choose a plan that works for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20 md:py-32 md:px-12">
        <div className="max-w-4xl mx-auto">
          <GlassCard variant="elevated" className="text-center p-12">
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-6 text-gradient-passion">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-neutral-700 mb-8 leading-relaxed">
              Join thousands of people already having amazing conversations. 
              Your next great connection is just a click away.
            </p>
            <Link href="/get-started">
              <GlassButton variant="passion" size="xl">
                Get Started Free
              </GlassButton>
            </Link>
            <p className="text-sm text-neutral-600 mt-4">
              No credit card required • First 3 messages free
            </p>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 md:px-12 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-passion rounded-lg flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">F</span>
              </div>
              <span className="font-display font-bold text-xl text-neutral-900">Fantooo</span>
            </div>
            <div className="flex gap-8 text-neutral-600">
              <Link href="/about" className="hover:text-passion-600 transition-smooth">
                About
              </Link>
              <Link href="/privacy" className="hover:text-passion-600 transition-smooth">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-passion-600 transition-smooth">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-passion-600 transition-smooth">
                Contact
              </Link>
            </div>
            <p className="text-neutral-600 text-sm">
              © 2024 Fantooo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
