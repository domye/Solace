import { useEffect, useState } from "react";
import { ErrorDisplay, InputField, LoadingButton } from "@/components";
import { useImageSettings, useUpdateImageSettings } from "@/hooks";

const MIN_IMAGE_WIDTH = 100;
const MAX_IMAGE_WIDTH = 2000;

export function ImageSettingsPage() {
	const { data: settings, isLoading, error } = useImageSettings();
	const updateMutation = useUpdateImageSettings();
	const [defaultWidth, setDefaultWidth] = useState("720");
	const [maxWidth, setMaxWidth] = useState("1000");
	const [appendWidth, setAppendWidth] = useState(true);
	const [formError, setFormError] = useState("");
	const [savedMessage, setSavedMessage] = useState("");

	useEffect(() => {
		if (!settings) {
			return;
		}
		setDefaultWidth(String(settings.defaultWidth));
		setMaxWidth(String(settings.maxWidth));
		setAppendWidth(settings.appendWidthToPastedImages);
	}, [settings]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFormError("");
		setSavedMessage("");

		const parsedDefaultWidth = Number(defaultWidth);
		const parsedMaxWidth = Number(maxWidth);

		if (!Number.isInteger(parsedDefaultWidth) || !Number.isInteger(parsedMaxWidth)) {
			setFormError("图片宽度必须是整数");
			return;
		}
		if (parsedDefaultWidth < MIN_IMAGE_WIDTH || parsedDefaultWidth > MAX_IMAGE_WIDTH) {
			setFormError(`默认图片宽度必须在 ${MIN_IMAGE_WIDTH} 到 ${MAX_IMAGE_WIDTH} 之间`);
			return;
		}
		if (parsedMaxWidth < MIN_IMAGE_WIDTH || parsedMaxWidth > MAX_IMAGE_WIDTH) {
			setFormError(`最大图片宽度必须在 ${MIN_IMAGE_WIDTH} 到 ${MAX_IMAGE_WIDTH} 之间`);
			return;
		}
		if (parsedDefaultWidth > parsedMaxWidth) {
			setFormError("默认图片宽度不能大于最大图片宽度");
			return;
		}

		try {
			await updateMutation.mutateAsync({
				defaultWidth: parsedDefaultWidth,
				maxWidth: parsedMaxWidth,
				appendWidthToPastedImages: appendWidth,
			});
			setSavedMessage("图片设置已保存");
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "保存失败");
		}
	};

	if (error) {
		return <ErrorDisplay message="加载图片设置失败" />;
	}

	return (
		<div className="card-base p-6 fade-in-up">
			<div className="mb-6">
				<h1 className="text-90 text-xl font-bold mb-2">图片设置</h1>
				<p className="text-50 text-sm">
					控制粘贴上传图片插入 Markdown 时的默认显示宽度，以及文章渲染时允许的最大宽度。
				</p>
			</div>

			{formError && (
				<div role="alert" className="bg-red-500/10 text-red-500 rounded-[var(--radius-medium)] p-3 mb-4 text-sm">
					{formError}
				</div>
			)}
			{savedMessage && (
				<div role="status" className="bg-green-500/10 text-green-600 rounded-[var(--radius-medium)] p-3 mb-4 text-sm">
					{savedMessage}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-1" aria-busy={isLoading || updateMutation.isPending}>
				<InputField
					id="image-default-width"
					label="默认插入宽度（px）"
					type="number"
					value={defaultWidth}
					onChange={setDefaultWidth}
					placeholder="720"
					required
				/>
				<InputField
					id="image-max-width"
					label="最大显示宽度（px）"
					type="number"
					value={maxWidth}
					onChange={setMaxWidth}
					placeholder="1000"
					required
				/>

				<label className="mb-4 flex items-center gap-3 text-75 text-sm">
					<input
						type="checkbox"
						checked={appendWidth}
						onChange={(event) => setAppendWidth(event.target.checked)}
						className="h-4 w-4 rounded border-[var(--border-light)] accent-[var(--primary)]"
					/>
					<span>粘贴上传后自动写入图片宽度</span>
				</label>

				<LoadingButton
					type="submit"
					loading={isLoading || updateMutation.isPending}
					className="btn-sm py-1.5 px-4"
				>
					保存设置
				</LoadingButton>
			</form>
		</div>
	);
}
