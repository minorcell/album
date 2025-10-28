"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

async function ensurePdfJsLoaded(workerSrc?: string) {
  if (window.pdfjsLib) return window.pdfjsLib;
  const scriptUrl = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
  const workerUrl = workerSrc ?? "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });
  if (!window.pdfjsLib) throw new Error("PDF.js not available after loading script");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  return window.pdfjsLib;
}

export function PdfViewer({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [heightRatio, setHeightRatio] = useState(0.9); // each page uses 90% of viewer height
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const pdfjsLib = await ensurePdfJsLoaded();
        const doc = await pdfjsLib.getDocument({ url: src }).promise;
        if (cancelled) return;
        pdfDocRef.current = doc;
        setPageCount(doc.numPages);
        // Render all pages for continuous scroll
        await renderAllPages(doc, heightRatio);
      } catch (e: any) {
        setError(e?.message || "无法加载 PDF 内容");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      const doc = pdfDocRef.current;
      if (doc && doc.destroy) doc.destroy();
      pdfDocRef.current = null;
    };
  }, [src]);

  async function renderAllPages(doc: any, ratio: number) {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    for (let num = 1; num <= doc.numPages; num++) {
      const page = await doc.getPage(num);
      // Fit height: compute scale so page height ~= viewer height * ratio
      const viewerHeight = container.clientHeight || window.innerHeight * 0.9;
      const baseViewport = page.getViewport({ scale: 1 });
      const fitScale = (viewerHeight * ratio) / baseViewport.height;
      const viewport = page.getViewport({ scale: fitScale });
      const pageWrapper = document.createElement("div");
      pageWrapper.className = "mb-4 flex justify-center";
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) continue;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      // CSS scaling: ensure height-based display and auto width for aspect ratio
      canvas.style.height = `${Math.round(viewerHeight * ratio)}px`;
      canvas.style.width = "auto";
      pageWrapper.appendChild(canvas);
      container.appendChild(pageWrapper);
      await page.render({ canvasContext: context, viewport }).promise;
    }
  }

  async function zoom(delta: number) {
    if (!pdfDocRef.current) return;
    const next = Math.max(0.5, Math.min(1.5, heightRatio + delta));
    setHeightRatio(next);
    await renderAllPages(pdfDocRef.current, next);
  }

  useEffect(() => {
    function handleResize() {
      if (pdfDocRef.current) {
        renderAllPages(pdfDocRef.current, heightRatio);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [heightRatio]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-2 border-b p-2">
        <span className="text-sm text-muted-foreground">共 {pageCount} 页 · 高度比例 {Math.round(heightRatio * 100)}%</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => zoom(-0.1)}>-</Button>
          <Button variant="outline" size="sm" onClick={() => zoom(0.1)}>+</Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">加载中...</div>
        ) : error ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-destructive">{error}</div>
        ) : (
          <div ref={containerRef} className="mx-auto w-fit" />
        )}
      </div>
    </div>
  );
}
