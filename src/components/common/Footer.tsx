import { Icon } from '@iconify/react';

export function Footer() {
  return (
    <footer className="card-base rounded-t-none p-6 mt-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-50 text-sm">
          Powered by React + TypeScript
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-plain rounded-lg h-9 w-9"
          >
            <Icon icon="fa6-brands:github" className="text-lg" />
          </a>
        </div>
      </div>
    </footer>
  );
}