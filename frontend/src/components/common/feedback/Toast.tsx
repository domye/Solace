import { create } from "zustand";

interface Toast {
	id: number;
	message: string;
	type: "error" | "warning" | "success";
}

interface ToastStore {
	toasts: Toast[];
	addToast: (message: string, type: Toast["type"]) => void;
	removeToast: (id: number) => void;
}

let toastId = 0;

export const useToastStore = create<ToastStore>((set) => ({
	toasts: [],
	addToast: (message, type) => {
		const id = ++toastId;
		set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));

		setTimeout(() => {
			set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
		}, 4000);
	},
	removeToast: (id) => {
		set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
	},
}));

export function showToast(message: string, type: Toast["type"] = "error") {
	useToastStore.getState().addToast(message, type);
}

export function ToastContainer() {
	const { toasts, removeToast } = useToastStore();

	if (toasts.length === 0) return null;

	return (
		<div
			className="fixed top-4 right-4 z-[200] flex flex-col gap-2"
			role="alert"
			aria-live="polite"
		>
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
					<span className="text-sm flex-1">{toast.message}</span>
					<button
						onClick={() => removeToast(toast.id)}
						className="opacity-70 hover:opacity-100"
						aria-label="关闭提示"
					>
						×
					</button>
				</div>
			))}
		</div>
	);
}
