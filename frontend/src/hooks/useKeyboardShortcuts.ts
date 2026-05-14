'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

/**
 * 全局键盘快捷键
 * 参考 Notion: Ctrl+S 保存, Esc 关闭, / 搜索, Ctrl+N 新建
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // 在输入框中不触发快捷键（除了 Escape）
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Escape 始终生效
      if (e.key === 'Escape') {
        if (shortcuts['Escape']) {
          e.preventDefault();
          shortcuts['Escape']();
        }
        return;
      }

      if (isInput) return;

      // Ctrl/Cmd 组合键
      if (e.ctrlKey || e.metaKey) {
        const key = `${e.ctrlKey || e.metaKey}+${e.key.toLowerCase()}`;
        if (shortcuts[key]) {
          e.preventDefault();
          shortcuts[key]();
        }
        return;
      }

      // 单键快捷键
      if (shortcuts[e.key]) {
        e.preventDefault();
        shortcuts[e.key]();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
