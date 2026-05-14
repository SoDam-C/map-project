'use client';

import { useCallback } from 'react';
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Link2, Minus, Undo2, Redo2
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

const TOOLBAR_GROUPS: ToolbarAction[][] = [
  [
    { icon: <Bold size={16} />, label: '粗体', prefix: '**', suffix: '**' },
    { icon: <Italic size={16} />, label: '斜体', prefix: '*', suffix: '*' },
    { icon: <Heading1 size={16} />, label: '标题1', prefix: '# ', suffix: '', block: true },
    { icon: <Heading2 size={16} />, label: '标题2', prefix: '## ', suffix: '', block: true },
    { icon: <Heading3 size={16} />, label: '标题3', prefix: '### ', suffix: '', block: true },
  ],
  [
    { icon: <List size={16} />, label: '无序列表', prefix: '- ', suffix: '', block: true },
    { icon: <ListOrdered size={16} />, label: '有序列表', prefix: '1. ', suffix: '', block: true },
    { icon: <Quote size={16} />, label: '引用', prefix: '> ', suffix: '', block: true },
    { icon: <Code size={16} />, label: '代码', prefix: '`', suffix: '`' },
    { icon: <Link2 size={16} />, label: '链接', prefix: '[', suffix: '](url)' },
    { icon: <Minus size={16} />, label: '分割线', prefix: '\n---\n', suffix: '', block: true },
  ],
];

export function MarkdownToolbar({ value, onChange, textareaRef }: Props) {
  const insert = useCallback((prefix: string, suffix: string, block?: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    let insertion: string;
    let newCursorPos: number;

    if (block) {
      // 块级元素：在行首插入
      const lineStart = before.lastIndexOf('\n') + 1;
      const lineBefore = before.slice(0, lineStart);
      const currentLine = before.slice(lineStart) + selected;
      insertion = lineBefore + prefix + currentLine + suffix + after;
      newCursorPos = lineStart + prefix.length + currentLine.length + suffix.length;
    } else {
      insertion = before + prefix + selected + suffix + after;
      newCursorPos = start + prefix.length + selected.length + suffix.length;
    }

    onChange(insertion);

    // 恢复光标位置
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length,
      );
    });
  }, [value, onChange, textareaRef]);

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b border-white/10 pb-2 mb-2">
      {TOOLBAR_GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="w-px h-5 bg-white/10 mx-1" />}
          {group.map((action) => (
            <button
              key={action.label}
              onClick={() => insert(action.prefix, action.suffix, action.block)}
              className="p-1.5 rounded hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
