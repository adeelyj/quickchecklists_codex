import React, { useState } from 'react';
import { ChecklistStateType, ChecklistItemType } from '../types';
import ChecklistItem from './ChecklistItem';
import PlusIcon from './icons/PlusIcon';
import XIcon from './icons/XIcon';

interface ChecklistProps {
  checklist: ChecklistStateType;
  onUpdate: (checklist: ChecklistStateType) => void;
  onRemove: () => void;
  isRemovable: boolean;
}

const Checklist: React.FC<ChecklistProps> = ({ checklist, onUpdate, onRemove, isRemovable }) => {
  const [newItemText, setNewItemText] = useState('');
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const updateItems = (items: ChecklistItemType[]) => {
    onUpdate({ ...checklist, items });
  };

  const handleToggleComplete = (id: number) => {
    updateItems(
      checklist.items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleTextChange = (id: number, text: string) => {
    updateItems(
      checklist.items.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const handleIndentChange = (id: number, direction: 'increase' | 'decrease') => {
    updateItems(
      checklist.items.map((item) => {
        if (item.id !== id || item.type !== 'item') {
          return item;
        }
        const delta = direction === 'increase' ? 1 : -1;
        const nextIndent = Math.min(5, Math.max(0, item.indentation + delta));
        return { ...item, indentation: nextIndent };
      })
    );
  };

  const handleDelete = (id: number) => {
    updateItems(checklist.items.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed.length) return;
    const nextId = Date.now();
    const newItem: ChecklistItemType = {
      id: nextId,
      text: trimmed,
      type: 'item',
      completed: false,
      indentation: 0,
    };
    updateItems([...checklist.items, newItem]);
    setNewItemText('');
  };

  const handleAddSection = () => {
    const nextId = Date.now() + Math.random();
    const newItem: ChecklistItemType = {
      id: nextId,
      text: 'New Section',
      type: 'section',
      completed: false,
      indentation: 0,
    };
    updateItems([...checklist.items, newItem]);
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: number) => {
    setDraggingId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(id));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetId: number) => {
    event.preventDefault();
    if (draggingId === null || draggingId === targetId) return;
    const updated = checklist.items.slice();
    const fromIndex = updated.findIndex((item) => item.id === draggingId);
    const toIndex = updated.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    updateItems(updated);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDropToEnd = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (draggingId === null) return;
    const updated = checklist.items.slice();
    const fromIndex = updated.findIndex((item) => item.id === draggingId);
    if (fromIndex === -1) return;
    const [moved] = updated.splice(fromIndex, 1);
    updated.push(moved);
    updateItems(updated);
  };

  const dragHandlers = {
    onDragStart: handleDragStart,
    onDrop: handleDrop,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
  };

  return (
    <div className="relative flex h-full flex-col rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm">
      {isRemovable && (
        <button
          type="button"
          onClick={onRemove}
          className="no-print absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          aria-label="Remove checklist"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
      <div className="flex flex-col gap-4">
        <input
          className="text-2xl font-semibold uppercase tracking-wide text-slate-800 focus:outline-none"
          value={checklist.title}
          placeholder="Title"
          onChange={(event) => onUpdate({ ...checklist, title: event.target.value })}
        />
        <div className="flex flex-col gap-3 text-sm text-slate-700 lg:flex-row lg:items-center lg:gap-6">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
            <select
              value={checklist.checklistType}
              onChange={(event) =>
                onUpdate({ ...checklist, checklistType: event.target.value as ChecklistStateType['checklistType'] })
              }
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">Select type</option>
              <option value="DO-CONFIRM">DO-CONFIRM</option>
              <option value="READ-DO">READ-DO</option>
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Context</span>
            <input
              value={checklist.context}
              onChange={(event) => onUpdate({ ...checklist, context: event.target.value })}
              placeholder="Description of checklist"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-auto pr-1">
        {checklist.items.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
            Start adding items or sections to build your checklist.
          </p>
        ) : (
          <div>
            {checklist.items.map((item) => (
              <ChecklistItem
                key={item.id}
                item={item}
                onToggleComplete={handleToggleComplete}
                onTextChange={handleTextChange}
                onDelete={handleDelete}
                onIndentChange={handleIndentChange}
                dragHandlers={dragHandlers}
              />
            ))}
          </div>
        )}
        <div
          className="h-6"
          onDragOver={handleDragOver}
          onDrop={handleDropToEnd}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 gap-2">
          <input
            value={newItemText}
            onChange={(event) => setNewItemText(event.target.value)}
            placeholder="Add a new item..."
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddItem();
              }
            }}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAddSection}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          Add Section
        </button>
      </div>

      <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-2 checklist-meta">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checklist created by</span>
          <input
            value={checklist.createdBy}
            onChange={(event) => onUpdate({ ...checklist, createdBy: event.target.value })}
            placeholder="<Name>"
            className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checklist completed by</span>
          <input
            value={checklist.completedBy}
            onChange={(event) => onUpdate({ ...checklist, completedBy: event.target.value })}
            placeholder="<Name>"
            className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </label>
      </div>
    </div>
  );
};

export default Checklist;
