"use client";

import { useState, useEffect, useCallback } from "react";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { useHotkeys, SHORTCUTS } from "@/components/primitives/useHotkeys";

interface PDFViewerProps {
  paperId: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  onTextSelect?: (text: string, page: number) => void;
}

export function PDFViewer({
  paperId,
  currentPage,
  onPageChange,
  onTotalPagesChange,
  onTextSelect,
}: PDFViewerProps) {
  const [scale, setScale] = useState<number | SpecialZoomLevel>(
    SpecialZoomLevel.PageWidth
  );

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [],
    toolbarPlugin: {
      fullScreenPlugin: {
        onEnterFullScreen: () => {},
        onExitFullScreen: () => {},
      },
    },
  });

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() && onTextSelect) {
        onTextSelect(selection.toString().trim(), currentPage);
      }
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, [currentPage, onTextSelect]);

  // Keyboard shortcuts for page navigation
  useHotkeys(SHORTCUTS.nextPage, () => {
    onPageChange(currentPage + 1);
  });

  useHotkeys(SHORTCUTS.prevPage, () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  });

  return (
    <div className="h-full w-full overflow-hidden bg-[var(--surface)]">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer
          fileUrl={`/api/papers/${paperId}/pdf`}
          plugins={[defaultLayoutPluginInstance]}
          defaultScale={scale}
          onPageChange={(e) => onPageChange(e.currentPage + 1)}
          onDocumentLoad={(e) => onTotalPagesChange(e.doc.numPages)}
          initialPage={currentPage - 1}
          theme={{
            theme: "auto",
          }}
        />
      </Worker>
    </div>
  );
}
