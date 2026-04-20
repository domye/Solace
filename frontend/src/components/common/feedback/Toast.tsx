import { useState, useEffect, useCallback } from "react";
import { SafeIcon } from "@/components/common/ui";

interface Toast {
	id: number;
	message: string;
	type: "error" | "warning" | "success";
}

let toastId = 0;
const listeners: Set<(toasts: Toast[]) => void> = new Set();
let currentToasts: Toast[] = [];

export function showToast(message: string, type: Toast["type"] = "error") {
	const id = ++toastId;
	currentToasts = [...currentToasts, { id, message, type }];
	listeners.forEach((listener) => listener(currentToasts));

	setTimeout(() => {
		currentToasts = currentToasts.filter((t) => t.id !== id);
		listeners.forEach((listener) => listener(currentToasts));
	}, 4000);
}

export function ToastContainer() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	useEffect(() => {
		listeners.add(setToasts);
		return () => {
			listeners.delete(setToasts);
		};
	}, []);

	const removeToast = useCallback((id: number) => {
		currentToasts = currentToasts.filter((t) => t.id !== id);
		setToasts(currentToasts);
	}, []);

	if (toasts.length === 0) return null;

	return (
		<div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg fade-in-up max-w-sm ${
						toast.type === "error"
							? "bg-red-500 text-white"
							: toast.type === "warning"
								? "bg-yellow-500 text-white"
								: "bg-green-500 text-white"
					}`}
				>
					<SafeIcon
						icon={
							toast.type === "error"
								? "material-symbols:error-outline-rounded"
								: toast.type === "warning"
									? "material-symbols:warning-outline-rounded"
									: "material-symbols:check-circle-outline-rounded"
						}
						size="1.25rem"
					/>
					<span className="text-sm flex-1">{toast.message}</span>
					<button
						onClick={() => removeToast(toast.id)}
						className="opacity-70 hover:opacity-100"
					>
						<SafeIcon icon="material-symbols:close-rounded" size="1rem" />
					</button>
				</div>
			))}
		</div>
	);
}
