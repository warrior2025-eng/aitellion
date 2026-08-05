interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

const textSizeMap = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

const iconSizeMap = {
  sm: 'h-7 w-7',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function Logo({ size = 'md', showPulse = true }: LogoProps) {
  return (
    <div className="inline-flex flex-col gap-1.5">
      <div className={`flex items-center gap-2 font-display font-semibold tracking-tight ${textSizeMap[size]}`}>
        <img src="/logo.png" alt="AITELLION" className={iconSizeMap[size]} />
        <span className="text-text">AITELLION</span>
      </div>
      {showPulse && <div className="voltage-line rounded-full" />}
    </div>
  );
}

export function BrandFooter() {
  return (
    <p className="text-xs text-text-faint font-mono">
      Built with <span aria-hidden="true">❤️</span> by <span className="text-text-muted">Team StackVolt</span>
      <span aria-hidden="true">⚡</span>
    </p>
  );
}