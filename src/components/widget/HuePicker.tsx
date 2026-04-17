/**
 * 色相选择器组件
 */

import { useThemeStore } from "@/stores/theme";
import { SafeIcon } from "@/components/common/ui";

export function HuePicker({ isOpen }: { isOpen: boolean }) {
	const { hue, setHue } = useThemeStore();
	const defaultHue = 250;

	return (
		<div
			className={`float-panel absolute right-0 top-12 w-72 px-4 py-3 z-50 transition-all ${isOpen ? "" : "float-panel-closed"}`}
		>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2 font-bold text-base text-90">
					主题颜色
					<button
						onClick={() => setHue(defaultHue)}
						className={`btn-regular w-6 h-6 rounded scale-animation ${hue === defaultHue ? "opacity-0 pointer-events-none" : ""}`}
						aria-label="重置"
					>
						<SafeIcon icon="fa6-solid:arrow-rotate-left" size="0.75rem" />
					</button>
				</div>
				<div className="bg-[var(--btn-regular-bg)] w-8 h-6 rounded flex justify-center font-bold text-xs items-center text-[var(--btn-content)]">
					{hue}
				</div>
			</div>
			<div className="w-full h-5 px-1 rounded select-none">
				<input
					type="range"
					min="0"
					max="360"
					step="5"
					value={hue}
					onChange={(e) => setHue(Number(e.target.value))}
					className="hue-slider w-full cursor-pointer"
					aria-label="主题颜色色相"
				/>
			</div>
		</div>
	);
}
