import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLogin } from "@/hooks";
import { LoadingButton, InputField, SafeIcon } from "@/components";

export function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const loginMutation = useLogin();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const from = (location.state as { from?: string })?.from || "/admin";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!email || !password) {
			setError("请填写所有字段");
			return;
		}

		try {
			await loginMutation.mutateAsync({ email, password });
			navigate(from, { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : "登录失败");
		}
	};

	return (
		<div className="card-base card-hover-lift w-full max-w-md p-6 md:p-8 fade-in-up">
			{/* 头部 */}
			<div className="text-center mb-6">
				<div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--klein-blue)] to-[var(--sky-blue)] mx-auto mb-4 flex items-center justify-center breathing">
					<SafeIcon
						icon="material-symbols:login-rounded"
						size="1.875rem"
						className="text-white"
					/>
				</div>
				<h1 className="text-90 text-2xl font-bold">欢迎回来</h1>
				<p className="text-50 text-sm mt-1">登录您的账户</p>
			</div>

			{/* 错误信息 */}
			{error && (
				<div className="bg-red-500/10 text-red-500 rounded-[var(--radius-medium)] p-3 mb-4 text-sm text-center">
					{error}
				</div>
			)}

			{/* 表单 */}
			<form onSubmit={handleSubmit} className="space-y-4">
				<InputField
					label="邮箱"
					type="email"
					value={email}
					onChange={setEmail}
					placeholder="your@email.com"
					required
				/>

				<InputField
					label="密码"
					type="password"
					value={password}
					onChange={setPassword}
					placeholder="请输入密码"
					required
				/>

				<LoadingButton
					type="submit"
					loading={loginMutation.isPending}
					className="w-full py-3 bg-gradient-to-r from-[var(--klein-blue)] to-[var(--klein-blue-light)] text-white rounded-[var(--radius-medium)] font-medium hover:shadow-lg transition-shadow ripple"
				>
					登录
				</LoadingButton>
			</form>

			{/* 底部 */}
			<div className="text-center mt-6 text-50 text-sm">
				还没有账户？{" "}
				<Link
					to="/register"
					className="text-[var(--primary)] font-medium hover:underline"
				>
					立即注册
				</Link>
			</div>
		</div>
	);
}
