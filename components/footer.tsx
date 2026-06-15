import Link from 'next/link';
import { Logo } from './logo/greencirlce-logo';

export function Footer() {
  return (
    <footer className="dark border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-10">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Logo showTagline />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-neutral-400 text-pretty">
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

        <div className="mt-16 border-t border-neutral-800" />

        <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-neutral-500">
          <p>
            &copy; {new Date().getFullYear()} Green Circle. Built in Addis
            Ababa.
          </p>
          <p className="uppercase tracking-[0.14em] font-semibold text-neutral-400">
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
      <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
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
        className="text-sm text-neutral-400 hover:text-forest transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

