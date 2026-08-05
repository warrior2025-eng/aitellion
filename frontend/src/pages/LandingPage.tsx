import { Link } from 'react-router-dom';
import { ArrowRight, Users, Handshake, Sparkles, ShieldCheck, UserPlus, Settings2, Rocket, Boxes, Clock } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui';

const NAV_LINKS = [
  { href: '#modules', label: 'Modules' },
  { href: '#how-it-works', label: 'How it works' },
];

const MODULES = [
  { icon: Users, name: 'CRM', copy: 'Customers, leads, and deals in one pipeline your whole team can see.' },
  { icon: Handshake, name: 'Deals & Tasks', copy: 'Move opportunities through your pipeline and never drop a follow-up.' },
  { icon: Sparkles, name: 'AI Assistant', copy: 'Ask it to look things up, or hand it a task on your data. It actually gets things done.' },
  { icon: ShieldCheck, name: 'Roles & Permissions', copy: 'Eight built-in roles so every teammate sees exactly what they should.' },
];

const STEPS = [
  { icon: UserPlus, step: '01', title: 'Create your workspace', copy: 'Sign up and tell us which departments will use AITELLION.' },
  { icon: Settings2, step: '02', title: 'Sidebar sets itself up', copy: 'Only the modules your departments need get enabled. Nothing else gets in the way.' },
  { icon: Rocket, step: '03', title: 'Start running your business', copy: 'Invite your team and pick up where the demo data leaves off.' },
];

const STATS = [
  { icon: Boxes, value: '4', label: 'Core modules: CRM, HR, Finance, Inventory' },
  { icon: ShieldCheck, value: '8', label: 'Built-in roles for granular access control' },
  { icon: Clock, value: '<5 min', label: 'From signup to a working workspace' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink text-text">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-ink/80 px-6 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo size="lg" showPulse={false} />
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-text-muted hover:text-text">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-text-muted hover:text-text">
              Sign in
            </Link>
            <Link to="/signup">
              <Button>Start free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-volt), transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:px-8">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            The AI operating system<br /> for growing businesses
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-text-muted">
            CRM, operations, and an AI assistant that actually takes action, not just answers questions.
            Run your business from one workspace.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/signup">
              <Button>
                Create your workspace <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
          </div>
          <div className="voltage-line mx-auto mt-16 w-full max-w-md rounded-full" />
        </div>
      </section>

      {/* stats */}
      <section className="mx-auto max-w-5xl px-6 pb-20 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 transition hover:border-volt/40"
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
                style={{ background: 'radial-gradient(circle, var(--color-volt), transparent 70%)' }}
              />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-volt/15 text-volt-soft">
                <Icon size={18} />
              </div>
              <p className="relative mt-4 font-display text-3xl font-semibold text-text">{value}</p>
              <p className="relative mt-1.5 text-sm text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* modules */}
      <section id="modules" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-2xl font-semibold text-text sm:text-3xl">Everything runs from one place</h2>
          <p className="mt-3 text-sm text-text-muted">Turn on only what your departments need. Everything else stays out of the way.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map(({ icon: Icon, name, copy }) => (
            <div key={name} className="rounded-xl border border-border bg-surface p-5 transition hover:border-volt/40">
              <Icon size={20} className="text-volt-soft" />
              <h3 className="mt-3 font-display text-sm font-semibold text-text">{name}</h3>
              <p className="mt-1.5 text-sm text-text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-border bg-surface/40">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-2xl font-semibold text-text sm:text-3xl">Up and running in three steps</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, step, title, copy }) => (
              <div key={step} className="relative">
                <span className="font-display text-xs font-semibold text-text-faint">{step}</span>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-volt/15 text-volt-soft">
                  <Icon size={18} />
                </div>
                <h3 className="mt-4 font-display text-sm font-semibold text-text">{title}</h3>
                <p className="mt-1.5 text-sm text-text-muted">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-5xl px-6 py-24 sm:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-8 py-14 text-center">
          <div
            className="pointer-events-none absolute -bottom-24 right-1/2 h-72 w-72 translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-volt), transparent 70%)' }}
          />
          <div className="relative">
            <h2 className="font-display text-2xl font-semibold text-text sm:text-3xl">Ready to set up your workspace?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">
              Pick your departments at signup and AITELLION shows only the modules your team needs.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/signup">
                <Button>
                  Create your workspace <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Logo size="md" showPulse={false} />
              <p className="mt-4 max-w-xs text-sm text-text-muted">
                The AI operating system for growing businesses. CRM, HR, finance, and inventory in one workspace.
              </p>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-text-faint">Product</h4>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                <li>
                  <a href="#modules" className="text-text-muted hover:text-text">Modules</a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-text-muted hover:text-text">How it works</a>
                </li>
                <li>
                  <Link to="/signup" className="text-text-muted hover:text-text">Create workspace</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-text-faint">Account</h4>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                <li>
                  <Link to="/login" className="text-text-muted hover:text-text">Sign in</Link>
                </li>
                <li>
                  <Link to="/signup" className="text-text-muted hover:text-text">Sign up</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-2 border-t border-border pt-8 text-center">
            <p className="text-xs text-text-faint">&copy; {new Date().getFullYear()} AITELLION. All rights reserved.</p>
            <p className="text-xs text-text-faint">
              Built with <span aria-hidden="true">❤️</span> by <span className="text-text-muted">Team StackVolt</span>
              <span aria-hidden="true">⚡</span>
            </p>
            <p className="text-xs text-text-faint">
              Made in India <span aria-hidden="true">🇮🇳</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}