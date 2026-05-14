import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '全球数据地图 — 嵌入式',
  description: '可嵌入的数据地图可视化',
  // Allow embedding in iframes
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="h-screen w-screen overflow-hidden m-0 p-0">
        {children}
      </body>
    </html>
  );
}
