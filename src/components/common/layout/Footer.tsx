/** 页脚组件 - Mizuki 风格 */
export function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="w-full">
			{/* 虚线分隔线 - Mizuki 风格 */}
			<div className="border-t border-black/10 dark:border-white/15 my-8 md:my-10 border-dashed mx-4 md:mx-32" />

			{/* 页脚内容 */}
			<div className="rounded-2xl mb-8 md:mb-12 flex flex-col items-center justify-center px-4 md:px-6">
				<p className="text-50 text-sm text-center leading-relaxed space-y-2">
					{/* 版权信息 */}
					<span className="block">
						&copy; {currentYear} Blog. All Rights Reserved. /
						<FooterLink href="/sitemap.xml">Sitemap</FooterLink>
					</span>

					{/* Powered by */}
					<span className="block">
						Powered by
						<FooterLink href="https://react.dev">React</FooterLink>&
						<FooterLink href="https://github.com/saicaca/fuwari">
							Fuwari
						</FooterLink>
					</span>
				</p>
			</div>
		</footer>
	);
}

function FooterLink({
	href,
	children,
}: {
	href: string;
	children: React.ReactNode;
}) {
	const isExternal = href.startsWith("http");
	return (
		<a
			className="text-[var(--primary)] font-medium hover:underline mx-1"
			target={isExternal ? "_blank" : undefined}
			rel={isExternal ? "noopener noreferrer" : undefined}
			href={href}
		>
			{children}
		</a>
	);
}
