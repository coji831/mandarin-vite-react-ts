/**
 * @file hooks/useDragToPan.ts
 * @description Custom hook for drag-to-pan behavior on scrollable containers.
 * Handles both mouse drag and touch drag for horizontal/vertical panning.
 */

import { useCallback, useRef } from "react";

interface DragToPanState {
  isDragging: React.MutableRefObject<boolean>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
}

export function useDragToPan(): DragToPanState {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const touchStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const isTouching = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".pinyin-detail-panel")) return;
    isDragging.current = true;
    const el = scrollRef.current;
    if (!el) return;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    el.scrollLeft = dragStart.current.scrollLeft - dx;
    el.scrollTop = dragStart.current.scrollTop - dy;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = scrollRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.userSelect = "";
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isTouching.current = true;
    const el = scrollRef.current;
    if (!el) return;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTouching.current || e.touches.length !== 1) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    el.scrollLeft = touchStart.current.scrollLeft - dx;
    el.scrollTop = touchStart.current.scrollTop - dy;
  }, []);

  const handleTouchEnd = useCallback(() => {
    isTouching.current = false;
  }, []);

  return {
    isDragging,
    scrollRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
