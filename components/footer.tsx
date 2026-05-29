import Link from 'next/link';
import { Logo } from './logo/greencirlce-logo';
import { Rule } from './editorial/rule';

export function Footer() {
  return (
    <footer className="dark border-t border-rule bg-paper-tint text-ink">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-10">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ink-muted text-pretty">
              The central directory for Ethiopian innovation. Built so
              founders can be discovered, understood, and reached.
            </p>
          </div>

          <FooterColumn title="Platform">
            <FooterLink href="/startups">Directory</FooterLink>
            <FooterLink href="/submit/verify">Submit a startup</FooterLink>
            <FooterLink href="/pulse">Updates</FooterLink>
          </FooterColumn>

          <FooterColumn title="About">
            {/* <FooterLink href="/about">Who we are</FooterLink> */}
            <FooterLink href="mailto:hello@greencircle.et">Contact</FooterLink>
          </FooterColumn>

          <FooterColumn title="Legal">
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-16">
          <Rule />
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-ink-faint">
          <p>
            &copy; {new Date().getFullYear()} Green Circle. Built in Addis
            Ababa.
          </p>
          <p className="uppercase tracking-[0.14em] font-semibold">
            Discoverable · Browsable · Reachable
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </h4>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-ink-muted hover:text-forest transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

