import type { ReactNode } from 'react';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* メインコンテンツ */}
      <main className={showNav ? 'pb-16' : ''}>{children}</main>

      {/* ナビゲーション */}
      {showNav && <Navigation />}
    </div>
  );
}
