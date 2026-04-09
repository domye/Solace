/** 页脚组件 - Fuwari 风格 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full">
      <div className="border-t border-black/10 dark:border-white/15 my-8 border-dashed" />
      <div className="rounded-2xl mb-8 flex flex-col items-center justify-center px-6">
        <p className="text-50 text-sm text-center leading-relaxed">
          &copy; {currentYear} Blog. All Rights Reserved. /
          <FooterLink href="https://github.com">GitHub</FooterLink>
          / Powered by
          <FooterLink href="https://react.dev">React</FooterLink>
          &
          <FooterLink href="https://github.com/saicaca/fuwari">Fuwari</FooterLink>
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      className="text-[var(--primary)] font-medium hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      href={href}
    >
      {children}
    </a>
  );
}