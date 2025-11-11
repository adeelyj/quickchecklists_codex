import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Checklist from './components/Checklist.tsx';
import PlusIcon from './components/icons/PlusIcon.tsx';
import useKeystrokeSound from './hooks/useKeystrokeSound.ts';
import { ChecklistStateType } from './types.ts';

declare const html2canvas: any;

const createChecklist = (id: number): ChecklistStateType => ({
  id,
  title: '',
  checklistType: '',
  context: '',
  items: [],
  createdBy: '',
  completedBy: '',
});

const useIsDesktop = () => {
  const matchQuery = '(min-width: 1024px)';
  const getMatches = () =>
    typeof window !== 'undefined' && 'matchMedia' in window
      ? window.matchMedia(matchQuery).matches
      : false;
  const [isDesktop, setIsDesktop] = useState<boolean>(getMatches);

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return;
    const mediaQuery = window.matchMedia(matchQuery);
    const listener = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return isDesktop;
};

const App: React.FC = () => {
  const [checklists, setChecklists] = useState<ChecklistStateType[]>([
    createChecklist(Date.now()),
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const isDesktop = useIsDesktop();
  const printRef = useRef<HTMLDivElement | null>(null);

  useKeystrokeSound();

  const shouldLandscape = checklists.length > 1;
  const isLandscapeLayout = (isDesktop && shouldLandscape) || (isPreparingPdf && shouldLandscape);

  const layoutLabel = useMemo(() => {
    if (!isDesktop) {
      return 'Mobile Stacked';
    }
    return shouldLandscape ? 'A4 Landscape' : 'A4 Portrait';
  }, [isDesktop, shouldLandscape]);

  const handleAddChecklist = () => {
    if (checklists.length >= 3) return;
    const identifier = Date.now() + Math.random();
    setChecklists((prev) => [...prev, createChecklist(identifier)]);
  };

  const handleRemoveChecklist = (id: number) => {
    if (checklists.length === 1) return;
    setChecklists((prev) => prev.filter((checklist) => checklist.id !== id));
  };

  const handleUpdateChecklist = useCallback(
    (updated: ChecklistStateType) => {
      setChecklists((prev) => prev.map((checklist) => (checklist.id === updated.id ? updated : checklist)));
    },
    []
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    if (!printRef.current) return;
    try {
      setIsSaving(true);
      setIsPreparingPdf(true);
      const orientation = shouldLandscape ? 'landscape' : 'portrait';
      document.body.classList.add('pdf-generating');
      document.body.classList.toggle('pdf-landscape', orientation === 'landscape');
      document.body.classList.toggle('pdf-portrait', orientation === 'portrait');

      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const pageWidth = orientation === 'landscape' ? 297 : 210;
      const pageHeight = orientation === 'landscape' ? 210 : 297;
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      let renderWidth = maxWidth;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;

      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = (canvas.width * renderHeight) / canvas.height;
      }

      const offsetX = margin + (maxWidth - renderWidth) / 2;
      const offsetY = margin + (maxHeight - renderHeight) / 2;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', offsetX, offsetY, renderWidth, renderHeight);
      pdf.save('checklists.pdf');
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      document.body.classList.remove('pdf-generating', 'pdf-landscape', 'pdf-portrait');
      setIsPreparingPdf(false);
      setIsSaving(false);
    }
  };

  const containerStyle: React.CSSProperties | undefined = isDesktop
    ? {
        width: shouldLandscape ? '297mm' : '210mm',
        height: shouldLandscape ? '210mm' : '297mm',
      }
    : undefined;

  const checklistLayoutClass = isLandscapeLayout
    ? 'flex h-full divide-x-4 divide-black'
    : isDesktop
    ? 'flex h-full flex-col'
    : 'flex flex-col gap-4';

  const checklistWrapperClass = isDesktop ? 'flex-1 px-6 py-8' : 'w-full py-3';
  const applyScaledContent = shouldLandscape && (isDesktop || isPreparingPdf);

  return (
    <div className="min-h-screen bg-slate-100 pb-16 text-slate-900">
      <div className="no-print sticky top-0 z-10 border-b border-slate-200 bg-slate-100/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold uppercase tracking-widest text-slate-700">
              Checklist Manifesto
            </h1>
            <p className="text-sm text-slate-500">Craft thoughtful checklists, ready for print or PDF.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Print
            </button>
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {isSaving ? 'Saving…' : 'Save as PDF'}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-8">
        <div className="no-print flex w-full flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-6 py-5 text-center shadow-sm sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Page Layout</span>
            <span className="text-lg font-semibold text-slate-700">{layoutLabel}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{checklists.length} / 3 Checklists</span>
            <button
              type="button"
              onClick={handleAddChecklist}
              disabled={checklists.length >= 3}
              className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              <PlusIcon className="h-4 w-4" />
              Add Checklist
            </button>
          </div>
        </div>

        <div
          ref={printRef}
          className={`print-area w-full ${isDesktop ? 'a4-surface' : 'space-y-4'} ${
            applyScaledContent ? 'scaled-content' : ''
          }`}
          style={containerStyle}
        >
          <div className={`${checklistLayoutClass} h-full w-full bg-white/95`}>
            {checklists.map((checklist) => (
              <div
                key={checklist.id}
                className={checklistWrapperClass}
              >
                <Checklist
                  checklist={checklist}
                  onUpdate={handleUpdateChecklist}
                  onRemove={() => handleRemoveChecklist(checklist.id)}
                  isRemovable={checklists.length > 1}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
