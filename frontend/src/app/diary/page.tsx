import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DiaryPage } from '@/components/diary/DiaryPage';

export const metadata: Metadata = {
  title: '我的日记 — 全球数据地图',
  description: '记录每一天的足迹与故事',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a]" />}>
      <DiaryPage />
    </Suspense>
  );
}
