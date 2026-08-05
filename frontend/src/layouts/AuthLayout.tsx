import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Users, Sparkles, ShieldCheck, UserPlus, Settings2, Rocket } from 'lucide-react';
import { Logo, BrandFooter } from '../components/Logo';

const HIGHLIGHTS = [
  { icon: Users, text: 'CRM, HR, Finance and Inventory in one workspace' },
  { icon: Sparkles, text: 'An AI assistant that actually takes action on your data' },
  { icon: ShieldCheck, text: 'Role-based access so every teammate sees only what they need' },
];

const GETTING_STARTED = [
  { icon: UserPlus, title: 'Create your workspace', copy: 'Tell us your company name and which departments will use AITELLION.' },
  { icon: Settings2, title: 'Sidebar sets itself up', copy: 'Only the modules your departments need get enabled automatically.' },
  { icon: Rocket, title: 'Invite your team', copy: 'Bring your teammates in and assign them one of eight built-in roles.' },
];

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-ink">
      {/* branding panel - scrolls on its own, independent of the form panel */}
      <div className="relative hidden h-full w-[42%] shrink-0 overflow-y-auto border-r border-border bg-surface lg:block">
        <div
          className="pointer-events-none fixed inset-y-0 left-0 w-[42%] opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-volt) 1px, transparent 1px), linear-gradient(90deg, var(--color-volt) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-volt), transparent 70%)' }}
        />

        <div className="relative z-10 flex min-h-full flex-col px-12 py-14">
          <Link to="/">
            <Logo size="lg" />
          </Link>

          <h2 className="mt-10 font-display text-3xl font-semibold leading-tight text-text">
            The AI operating system for growing businesses
          </h2>

          <div className="mt-8">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-text-faint">
              What is AITELLION?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              AITELLION brings CRM, HR, finance, and inventory into a single workspace, built for teams that
              are done switching between five different tools to run one business. Pick the departments that
              apply to you at signup and your sidebar adapts to match — nothing to configure by hand.
            </p>
          </div>

          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-volt/15 text-volt-soft">
                  <Icon size={16} />
                </span>
                <span className="text-sm text-text-muted">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-text-faint">
              Getting started
            </h3>
            <ul className="mt-4 flex flex-col gap-5">
              {GETTING_STARTED.map(({ icon: Icon, title, copy }, index) => (
                <li key={title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-volt/15 text-volt-soft">
                      <Icon size={16} />
                    </span>
                    {index < GETTING_STARTED.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-medium text-text">{title}</p>
                    <p className="mt-0.5 text-sm text-text-muted">{copy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto pt-10">
            <BrandFooter />
          </div>
        </div>
      </div>

      {/* form panel - scrolls independently so long forms never get clipped */}
      <div className="h-full w-full flex-1 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center px-4 py-10 sm:px-6 lg:items-center lg:py-14">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 flex justify-center lg:hidden">
              <Logo size="lg" />
            </Link>

            <div className="rounded-2xl border border-border bg-surface/80 p-6 shadow-2xl backdrop-blur sm:p-8">
              <h1 className="font-display text-xl font-semibold text-text">{title}</h1>
              <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
              <div className="mt-6">{children}</div>
            </div>

            <div className="mt-6 flex justify-center lg:hidden">
              <BrandFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}