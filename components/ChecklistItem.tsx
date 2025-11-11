import React, { useEffect, useRef, useState } from 'react';
import { ChecklistItemType } from '../types.ts';
import TrashIcon from './icons/TrashIcon.tsx';

type ChecklistItemProps = {
  item: ChecklistItemType;
  onToggleComplete: (id: number) => void;
  onTextChange: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onIndentChange: (id: number, direction: 'increase' | 'decrease') => void;
  dragHandlers: {
    onDragStart: (event: React.DragEvent<HTMLDivElement>, id: number) => void;
    onDrop: (event: React.DragEvent<HTMLDivElement>, id: number) => void;
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd: () => void;
  };
};

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggleComplete,
  onTextChange,
  onDelete,
  onIndentChange,
  dragHandlers,
}) => {
  const [isEditing, setIsEditing] = useState(item.text.trim().length === 0);
  const [draftText, setDraftText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setDraftText(item.text);
  }, [item.text]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitText();
      setIsEditing(false);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraftText(item.text);
      setIsEditing(false);
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      onIndentChange(item.id, event.shiftKey ? 'decrease' : 'increase');
    }
  };

  const commitText = () => {
    const value = draftText.trim();
    onTextChange(
      item.id,
      value.length ? value : item.type === 'section' ? 'Section' : 'Untitled item'
    );
  };

  const contentPadding = item.type === 'item' ? 16 * item.indentation : 0;

  const containerClasses = [
    'group flex items-start gap-3 rounded-md px-2 py-2 transition hover:bg-slate-100',
    item.type === 'section' ? 'border-t border-slate-300 mt-3 pt-3' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      draggable
      onDragStart={(event) => dragHandlers.onDragStart(event, item.id)}
      onDrop={(event) => dragHandlers.onDrop(event, item.id)}
      onDragOver={dragHandlers.onDragOver}
      onDragEnd={dragHandlers.onDragEnd}
      className={containerClasses}
      style={{ paddingLeft: `${contentPadding}px` }}
    >
      {item.type === 'item' ? (
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-800"
          checked={item.completed}
          onChange={() => onToggleComplete(item.id)}
        />
      ) : (
        <span className="mt-1 h-4 w-4" aria-hidden />
      )}
      <div className="flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            onBlur={() => {
              commitText();
              setIsEditing(false);
            }}
            onKeyDown={handleKeyDown}
            className="w-full border-b border-slate-300 bg-transparent px-1 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
          />
        ) : (
          <p
            className={`checklist-item-text cursor-text text-sm text-slate-800 ${
              item.type === 'section'
                ? 'checklist-section-label font-semibold uppercase tracking-wide'
                : item.completed
                ? 'line-through decoration-slate-400'
                : ''
            }`}
            onDoubleClick={() => setIsEditing(true)}
          >
            {item.text || (item.type === 'section' ? 'Section' : 'Untitled item')}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="no-print rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 group-hover:opacity-100 md:opacity-0"
        aria-label="Delete entry"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ChecklistItem;
