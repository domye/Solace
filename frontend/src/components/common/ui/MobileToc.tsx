/**
 * 移动端目录浮动按钮
 * 在移动端显示，点击展开目录面板
 * 位置在 BackToTop 按钮上方
 */

import {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo,
	forwardRef,
} from "react";
import { createPortal } from "react-dom";
import { SafeIcon } from "./SafeIcon";
import { useTocStore } from "@/stores";
import { useTocScroll, useClickOutside, useEscapeKey } from "@/hooks";

const ANIMATION_DURATION = 250;

export function MobileToc() {
	const { headings, isArticleLoading } = useTocStore();
	const [isOpen, setIsOpen] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const previousActiveElement = useRef<HTMLElement | null>(null);

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

	const { activeId, handleClick } = useTocScroll({
		headings: filteredHeadings,
	});

	const closePanel = useCallback(() => {
		setIsVisible(false);
		setTimeout(() => setIsOpen(false), ANIMATION_DURATION);
		previousActiveElement.current?.focus();
	}, []);

	const openPanel = useCallback(() => {
		previousActiveElement.current = document.activeElement as HTMLElement;
		setIsOpen(true);
		requestAnimationFrame(() => setIsVisible(true));
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
		document.body.style.overflow = isOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	useEffect(() => {
		if (isOpen && isVisible && activeId && listRef.current) {
			const el = listRef.current.querySelector(`[data-id="${activeId}"]`);
			el?.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [isOpen, isVisible, activeId]);

	useEffect(() => {
		if (isOpen && containerRef.current) {
			const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
				'button, a[href], [tabindex]:not([tabindex="-1"])'
			);
			const firstEl = focusableElements[0];
			if (firstEl) {
				firstEl.focus();
			}
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Tab") return;

			const container = containerRef.current;
			if (!container) return;

			const focusableElements = container.querySelectorAll<HTMLElement>(
				'button, a[href], [tabindex]:not([tabindex="-1"])'
			);
			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (e.shiftKey && document.activeElement === firstElement && lastElement) {
				e.preventDefault();
				lastElement.focus();
			} else if (!e.shiftKey && document.activeElement === lastElement && firstElement) {
				e.preventDefault();
				firstElement.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen]);

	if (filteredHeadings.length === 0 || isArticleLoading) return null;

	return (
		<>
			<TocButton onClick={openPanel} />

			{isOpen &&
				createPortal(
					<div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="文章目录">
						<div
							className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-[250ms] ${isVisible ? "opacity-100" : "opacity-0"}`}
							onClick={closePanel}
						/>
						<div
							ref={containerRef}
							className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl h-[70vh] flex flex-col overflow-hidden transition-transform duration-[250ms] ease-out ${isVisible ? "translate-y-0" : "translate-y-full"}`}
						>
							<TocHeader onClose={closePanel} />
							<TocList
								ref={listRef}
								headings={filteredHeadings}
								activeId={activeId}
								minDepth={minDepth}
								onItemClick={handleItemClick}
							/>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}

function TocButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			className="fixed bottom-[4.5rem] right-6 z-50 w-10 h-10 rounded-full bg-[var(--card-bg)] border border-[var(--border-medium)] shadow-lg flex items-center justify-center hover:bg-[var(--btn-regular-bg-hover)] hover:border-[var(--primary)] transition-all duration-300 group lg:hidden"
			aria-label="打开目录"
		>
			<SafeIcon
				icon="material-symbols:toc"
				size="1.25rem"
				className="text-[var(--text-75)] group-hover:text-[var(--primary)] transition-colors"
			/>
		</button>
	);
}

function TocHeader({ onClose }: { onClose: () => void }) {
	return (
		<div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
			<div className="flex items-center gap-1.5">
				<SafeIcon
					icon="material-symbols:toc"
					size="1rem"
					className="text-[var(--primary)]"
				/>
				<span className="font-bold text-sm text-90">目录</span>
			</div>
			<button
				onClick={onClose}
				className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--btn-plain-bg-hover)] hover:bg-[var(--border-light)] transition-colors"
				aria-label="关闭目录"
			>
				<SafeIcon
					icon="material-symbols:close"
					size="1rem"
					className="text-[var(--text-75)]"
				/>
			</button>
		</div>
	);
}

interface TocListProps {
	headings: { id: string; text: string; depth: number }[];
	activeId: string;
	minDepth: number;
	onItemClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
}

const TocList = forwardRef<HTMLDivElement, TocListProps>(
	({ headings, activeId, minDepth, onItemClick }, ref) => (
		<nav ref={ref} className="relative flex flex-col px-3 py-2 overflow-y-auto" aria-label="文章目录">
			{headings.map((heading) => {
				const isActive = activeId === heading.id;
				const indentLevel = heading.depth - minDepth;

				return (
					<a
						key={heading.id}
						data-id={heading.id}
						href={`#${heading.id}`}
						onClick={(e) => onItemClick(e, heading.id)}
						className={`w-full py-2 px-2 rounded-lg transition-all flex items-center ${
							isActive
								? "text-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
								: "text-75 hover:bg-[var(--btn-plain-bg-hover)] hover:text-[var(--primary)]"
						}`}
						style={{ paddingLeft: `${indentLevel * 1 + 0.5}rem` }}
					>
						{indentLevel > 0 && (
							<span className="w-[2px] h-3 bg-[var(--primary)] rounded-full mr-2 flex-shrink-0 opacity-40" />
						)}
						<span
							className={`truncate text-xs leading-relaxed ${
								isActive ? "font-bold" : "font-medium"
							} ${heading.depth > minDepth ? "text-[0.7rem] opacity-90" : ""}`}
						>
							{heading.text}
						</span>
					</a>
				);
			})}
		</nav>
	),
);
