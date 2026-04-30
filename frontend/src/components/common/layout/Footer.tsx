/** 页脚组件 - Mizuki 风格 */
import { getSiteName } from "@/config/runtime";

export function Footer() {
	const currentYear = new Date().getFullYear();
	const siteName = getSiteName();

	return (
		<footer className="w-full mt-auto">
			<div className="border-t border-black/10 dark:border-white/15 my-4 border-dashed mx-4" />
			<div className="rounded-2xl mb-4 flex flex-col items-center justify-center px-4">
				<p className="text-50 text-xs md:text-sm text-center leading-relaxed space-y-1">
					<span className="block">
						&copy; {currentYear}{" "}
						<FooterLink href="https://github.com/HSJ-BanFan">
							{siteName}
						</FooterLink>{" "}
						By HSJ-BanFan . All Rights Reserved.
					</span>
					<span className="block">
						<FooterLink href="https://beian.miit.gov.cn">
							皖ICP备2024052746号
						</FooterLink>
						/
						<FooterLink href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=34130202000763">
							皖公网安备34130202000763号
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
