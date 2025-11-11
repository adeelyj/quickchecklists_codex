export type ChecklistItemKind = 'item' | 'section';

export interface ChecklistItemType {
  id: number;
  text: string;
  type: ChecklistItemKind;
  completed: boolean;
  indentation: number;
}

export type ChecklistFormat = 'DO-CONFIRM' | 'READ-DO' | '';

export interface ChecklistStateType {
  id: number;
  title: string;
  checklistType: ChecklistFormat;
  context: string;
  items: ChecklistItemType[];
  createdBy: string;
  completedBy: string;
}
