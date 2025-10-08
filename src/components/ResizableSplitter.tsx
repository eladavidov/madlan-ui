"use client";

import { useState, useCallback, useEffect } from "react";

interface ResizableSplitterProps {
  children: [React.ReactNode, React.ReactNode];
  initialLeftWidth?: number; // percentage
  minLeftWidth?: number; // percentage
  maxLeftWidth?: number; // percentage
  onResize?: (leftWidth: number) => void;
  onClose?: () => void;
}

export default function ResizableSplitter({
  children,
  initialLeftWidth = 77,
  minLeftWidth = 30,
  maxLeftWidth = 85,
  onResize,
  onClose
}: ResizableSplitterProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = useState(false);
  const [mobilePanelHeight, setMobilePanelHeight] = useState(60); // percentage
  const [isMobileDragging, setIsMobileDragging] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Adjust initial widths based on screen size
  useEffect(() => {
    if (screenSize === 'tablet') {
      setLeftWidth(60); // 60% main, 40% chat for tablet
    } else if (screenSize === 'desktop') {
      setLeftWidth(initialLeftWidth); // Use prop value for desktop
    }
    // Mobile will use overlay, no width adjustment needed
  }, [screenSize, initialLeftWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const containerWidth = window.innerWidth;
    const newLeftWidth = (e.clientX / containerWidth) * 100;

    // Clamp the width between min and max
    const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);

    setLeftWidth(clampedWidth);
    onResize?.(clampedWidth);
  }, [isDragging, minLeftWidth, maxLeftWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mobile drag handlers
  const handleMobileTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsMobileDragging(true);
  }, []);

  const handleMobileTouchMove = useCallback((e: TouchEvent) => {
    if (!isMobileDragging) return;

    const containerHeight = window.innerHeight - 64; // Subtract header height
    const touchY = e.touches[0].clientY - 64; // Subtract header height
    const newPanelHeight = ((containerHeight - touchY) / containerHeight) * 100;

    // Clamp between 10% and 80%
    const clampedHeight = Math.min(Math.max(newPanelHeight, 10), 80);
    setMobilePanelHeight(clampedHeight);
  }, [isMobileDragging]);

  const handleMobileTouchEnd = useCallback(() => {
    setIsMobileDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isMobileDragging) {
      document.addEventListener('touchmove', handleMobileTouchMove, { passive: false });
      document.addEventListener('touchend', handleMobileTouchEnd);
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('touchmove', handleMobileTouchMove);
        document.removeEventListener('touchend', handleMobileTouchEnd);
        document.body.style.userSelect = '';
      };
    }
  }, [isMobileDragging, handleMobileTouchMove, handleMobileTouchEnd]);

  const rightWidth = 100 - leftWidth;

  // Mobile layout: Resizable Bottom Panel
  if (screenSize === 'mobile') {
    const actualPanelHeight = isMobilePanelExpanded ? `${mobilePanelHeight}%` : '60px';
    const mainContentHeight = isMobilePanelExpanded ? `${100 - mobilePanelHeight}%` : 'calc(100% - 60px)';

    return (
      <div className="relative h-full" dir="ltr" style={{ direction: 'ltr' }}>
        {/* Main Content - Always visible on mobile */}
        <div
          className="w-full overflow-y-auto transition-all duration-300 ease-out"
          style={{ height: mainContentHeight }}
        >
          {children[0]}
        </div>

        {/* Resizable Chat Panel - Always visible bottom panel */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-white z-10 border-t-2 border-primary shadow-2xl transition-all duration-300 ease-out"
          style={{ height: actualPanelHeight }}
        >
          {/* Drag Handle - Only visible when expanded */}
          {isMobilePanelExpanded && (
            <div
              className="h-2 bg-gray-300 hover:bg-primary cursor-row-resize transition-colors flex items-center justify-center active:bg-primary"
              onTouchStart={handleMobileTouchStart}
            >
              <div className="w-8 h-1 bg-gray-500 rounded-full" />
            </div>
          )}

          {/* Panel Header - Always visible */}
          <div
            className="h-[60px] flex items-center justify-between px-4 cursor-pointer bg-gradient-to-r from-primary/5 to-primary/10"
            onClick={() => !isMobilePanelExpanded && setIsMobilePanelExpanded(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-lg">💬</span>
              </div>
              <div>
                <div className="font-semibold text-primary text-sm">שוחח עם AI</div>
                <div className="text-xs text-gray-600">
                  {isMobilePanelExpanded ? 'גרור כדי לשנות גודל או הקש לצמצום' : 'הקש כדי להרחיב'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Complete Close Button - Only visible when expanded */}
              {isMobilePanelExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose?.(); // Close the entire chat panel
                  }}
                  className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors"
                  title="סגור צ'אט לחלוטין"
                >
                  <span className="text-red-600 text-sm">🗙</span>
                </button>
              )}

              {/* Collapse/Expand Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMobilePanelExpanded) {
                    setIsMobilePanelExpanded(false); // Collapse the panel
                  } else {
                    setIsMobilePanelExpanded(true);
                  }
                }}
                className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
              >
                <span className={`text-primary transform transition-transform duration-300 ${
                  isMobilePanelExpanded ? '' : 'rotate-180'
                }`}>
                  {isMobilePanelExpanded ? '↓' : '↑'}
                </span>
              </button>
            </div>
          </div>

          {/* Chat Content - Only visible when expanded */}
          {isMobilePanelExpanded && (
            <div
              className="animate-in fade-in duration-300"
              style={{ height: `calc(100% - ${isMobilePanelExpanded ? '62px' : '60px'})` }}
            >
              {children[1]}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tablet and Desktop layout: Side by side with splitter
  return (
    <div className="flex h-full" dir="ltr" style={{ direction: 'ltr' }}>
      {/* Left Panel - Main Content */}
      <div
        style={{ width: `${leftWidth}%` }}
        className="overflow-y-auto"
      >
        {children[0]}
      </div>

      {/* Splitter - Always visible on tablet/desktop */}
      <div
        className={`w-1 bg-gray-300 hover:bg-primary cursor-col-resize transition-colors relative group ${
          isDragging ? 'bg-primary' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        {/* Splitter handle - visible on hover */}
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1 h-8 bg-primary rounded-full shadow-md" />
        </div>
      </div>

      {/* Right Panel - Chat Panel */}
      <div
        style={{ width: `${rightWidth}%` }}
        className="border-l border-gray-200 bg-white"
      >
        {children[1]}
      </div>
    </div>
  );
}