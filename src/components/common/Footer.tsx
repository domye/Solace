/**
 * 页脚组件 - Fuwari 风格
 * 统一用于归档页和管理页
 */

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full">
      {/* 虚线分隔线 */}
      <div className="transition border-t border-black/10 dark:border-white/15 my-8 border-dashed" />

      {/* 版权信息容器 */}
      <div className="transition rounded-2xl mb-8 flex flex-col items-center justify-center px-6">
        <div className="transition text-50 text-sm text-center leading-relaxed">
          &copy; {currentYear} Blog. All Rights Reserved. /
          <a
            className="transition link text-[var(--primary)] font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com"
          >
            GitHub
          </a>
          {' '}
          /
          {' '}
          Powered by
          {' '}
          <a
            className="transition link text-[var(--primary)] font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            href="https://react.dev"
          >
            React
          </a>
          {' '}
          &
          {' '}
          <a
            className="transition link text-[var(--primary)] font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/saicaca/fuwari"
          >
            Fuwari
          </a>
        </div>
      </div>
    </footer>
  );
}