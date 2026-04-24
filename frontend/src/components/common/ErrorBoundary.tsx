/**
 * 错误边界组件
 * 捕获子组件树中的 JavaScript 错误，显示备用 UI
 */

import { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
		this.props.onError?.(error, errorInfo);
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: undefined });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
					<div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
						<span className="text-3xl">⚠️</span>
					</div>
					<h2 className="text-lg font-bold text-90 mb-2">出错了</h2>
					<p className="text-sm text-50 mb-4 max-w-md">
						{this.state.error?.message || "页面加载失败，请稍后重试"}
					</p>
					<button
						onClick={this.handleRetry}
						className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
					>
						重试
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
	return (
		<ErrorBoundary
			fallback={
				<div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
					<div className="w-20 h-20 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
						<span className="text-4xl">😢</span>
					</div>
					<h1 className="text-2xl font-bold text-90 mb-2">页面加载失败</h1>
					<p className="text-50 mb-6">请刷新页面或返回首页</p>
					<div className="flex gap-3">
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
						>
							刷新页面
						</button>
						<a
							href="/"
							className="px-4 py-2 border border-[var(--border-medium)] rounded-lg hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
						>
							返回首页
						</a>
					</div>
				</div>
			}
		>
			{children}
		</ErrorBoundary>
	);
}
