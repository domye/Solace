/**
 * 目录滚动逻辑 Hook
 *
 * 处理目录滚动同步和位置检测
 */

import { useEffect, useRef, useState } from "react";
import type { TocHeading } from "@/components/widget/TableOfContents";

interface UseTocScrollOptions {
	headings: TocHeading[];
	offset?: number;
}

export function useTocScroll({ headings, offset = 80 }: UseTocScrollOptions) {
	const [activeId, setActiveId] = useState<string>("");
	const visibleHeadingsRef = useRef<Set<string>>(new Set());
	const observerRef = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		if (headings.length === 0) return;

		if (observerRef.current) observerRef.current.disconnect();

		observerRef.current = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						visibleHeadingsRef.current.add(entry.target.id);
					} else {
						visibleHeadingsRef.current.delete(entry.target.id);
					}
				});

				const visible = visibleHeadingsRef.current;
				if (visible.size > 0) {
					const visibleIds = Array.from(visible);
					const firstVisible =
						headings.find((h) => visibleIds.includes(h.id))?.id ||
						visibleIds[0];
					if (firstVisible) setActiveId(firstVisible);
				}
			},
			{ rootMargin: "-15% 0px -60% 0px", threshold: [0, 1] },
		);

		headings.forEach((h) => {
			const el = document.getElementById(h.id);
			if (el) observerRef.current?.observe(el);
		});

		return () => observerRef.current?.disconnect();
	}, [headings]);

	useEffect(() => {
		let scrollTimeout: ReturnType<typeof setTimeout>;

		const handleScroll = () => {
			if (scrollTimeout) clearTimeout(scrollTimeout);

			scrollTimeout = setTimeout(() => {
				if (headings.length === 0) return;

				const scrollPosition = window.scrollY + offset + 20;

				let currentId = headings[0]?.id;
				let minDistance = Infinity;

				headings.forEach((h) => {
					const el = document.getElementById(h.id);
					if (el) {
						const distance = scrollPosition - el.offsetTop;
						if (distance >= 0 && distance < minDistance) {
							minDistance = distance;
							currentId = h.id;
						}
					}
				});

				if (visibleHeadingsRef.current.size === 0 && currentId) {
					setActiveId(currentId);
				}
			}, 50);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (scrollTimeout) clearTimeout(scrollTimeout);
		};
	}, [headings, offset]);

	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
		e.preventDefault();
		const element = document.getElementById(id);
		if (element) {
			const bodyRect = document.body.getBoundingClientRect().top;
			const elementRect = element.getBoundingClientRect().top;
			const elementPosition = elementRect - bodyRect;
			const offsetPosition = elementPosition - offset;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});

			setActiveId(id);
			window.history.pushState(null, "", `#${id}`);
		}
	};

	return { activeId, handleClick };
}
