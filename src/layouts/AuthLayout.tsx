/**
 * 认证布局组件
 *
 * 用于登录、注册等页面
 * 居中显示内容
 */

import { Outlet } from "react-router-dom";
import { Navbar, Footer } from "@/components/common";

export function AuthLayout() {
	return (
		<div className="min-h-screen flex flex-col">
			<Navbar />

			<div className="flex-1 flex items-center justify-center px-4 py-8">
				<Outlet />
			</div>

			<Footer />
		</div>
	);
}
