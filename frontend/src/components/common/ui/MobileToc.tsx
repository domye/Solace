/**
 * 移动端目录浮动按钮
 * 在移动端显示，点击展开目录面板
 * 位置在 BackToTop 按钮上方
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { SafeIcon } from "./SafeIcon";
import { useTocStore } from "@/stores";
import { useTocScroll, useClickOutside, useEscapeKey } from "@/hooks";
import { useMemo } from "react";

export function MobileToc() {
	const { headings, isArticleLoading } = useTocStore();
	const [isOpen, setIsOpen] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const filteredHeadings = useMemo(
		() => headings.filter((h) => h.depth <= 3),
		[headings],
	);

	const minDepth = useMemo(
		() =>
			filteredHeadings.length > 0
				? Math.min(...filteredHeadings.map((h) => h.depth))
				: 1,
		[filteredHeadings],
	);

	const { activeId, handleClick } = useTocScroll({ headings: filteredHeadings });

	const closePanel = useCallback(() => {
		setIsClosing(true);
		setTimeout(() => {
			setIsOpen(false);
			setIsClosing(false);
			setIsAnimating(false);
		}, 250);
	}, []);

	const openPanel = useCallback(() => {
		setIsOpen(true);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setIsAnimating(true);
			});
		});
	}, []);

	useClickOutside(containerRef, closePanel);
	useEscapeKey(closePanel);

	const handleItemClick = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
			handleClick(e, id);
			closePanel();
		},
		[handleClick, closePanel],
	);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	useEffect(() => {
		if (isOpen && !isClosing && activeId && listRef.current) {
			const activeElement = listRef.current.querySelector(`[data-id="${activeId}"]`);
			if (activeElement) {
				activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
	}, [isOpen, isClosing, activeId]);

	if (filteredHeadings.length === 0 || isArticleLoading) return null;

	return (
		<>
			<button
				onClick={openPanel}
				className="fixed bottom-[4.5rem] right-6 z-50 w-10 h-10 rounded-full bg-[var(--card-bg)] border border-[var(--border-medium)] shadow-lg flex items-center justify-center hover:bg-[var(--btn-regular-bg-hover)] hover:border-[var(--primary)] transition-all duration-300 group lg:hidden"
				aria-label="目录"
			>
				<SafeIcon
					icon="material-symbols:toc"
					size="1.25rem"
					className="text-[var(--text-75)] group-hover:text-[var(--primary)] transition-colors"
				/>
			</button>

			{isOpen &&
				createPortal(
					<div className="fixed inset-0 z-[60] lg:hidden">
						<div
							className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-250 ${isClosing || !isAnimating ? "opacity-0" : "opacity-100"}`}
							onClick={closePanel}
						/>

						<div
							ref={containerRef}
							className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col transition-transform duration-250 ease-out ${isClosing || !isAnimating ? "translate-y-full" : "translate-y-0"}`}
						>
							<div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
								<div className="flex items-center gap-2">
									<SafeIcon icon="material-symbols:toc" size="1.25rem" className="text-[var(--primary)]" />
									<span className="font-bold text-lg text-90">目录</span>
								</div>
								<button
									onClick={closePanel}
									className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--btn-plain-bg-hover)] hover:bg-[var(--border-light)] transition-colors"
									aria-label="关闭"
								>
									<SafeIcon icon="material-symbols:close" size="1.25rem" className="text-[var(--text-75)]" />
								</button>
							</div>

							<nav ref={listRef} className="relative flex flex-col px-4 py-3 overflow-y-auto">
								{filteredHeadings.map((heading) => {
									const isActive = activeId === heading.id;
									const indentLevel = heading.depth - minDepth;

									return (
										<a
											key={heading.id}
											data-id={heading.id}
											href={`#${heading.id}`}
											onClick={(e) => handleItemClick(e, heading.id)}
											className={`
                        w-full py-3 px-3 rounded-xl transition-all
                        flex items-center group
                        ${
													isActive
														? "text-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
														: "text-75 hover:bg-[var(--btn-plain-bg-hover)] hover:text-[var(--primary)]"
												}
                      `}
											style={{ paddingLeft: `${indentLevel * 1.25 + 0.75}rem` }}
										>
											{indentLevel > 0 && (
												<span className="w-[2px] h-4 bg-[var(--primary)] rounded-full mr-3 flex-shrink-0 opacity-40" />
											)}
											<span
												className={`
                          overflow-hidden text-left whitespace-nowrap overflow-ellipsis text-[0.95rem] leading-relaxed
                          ${isActive ? "font-bold" : "font-medium"}
                          ${heading.depth > minDepth ? "text-[0.875rem] opacity-90" : ""}
                        `}
											>
												{heading.text}
											</span>
										</a>
									);
								})}
							</nav>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}
