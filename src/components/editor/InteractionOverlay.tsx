import React, { useState, useRef } from 'react';
import { useTemplateStore } from '@/store/useTemplateStore';
import { RotateCw } from 'lucide-react';

interface InteractionOverlayProps {
  slideWidth: number;
  slideHeight: number;
  scale: number;
}

export const InteractionOverlay = ({ slideWidth, slideHeight, scale }: InteractionOverlayProps) => {
  const { selectedLayer, updateLayer, currentSlide, setSelectedLayer } = useTemplateStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const dragStartRef = useRef({ x: 0, y: 0, layerX: 0, layerY: 0, layerWidth: 0, layerHeight: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if ((!isDragging && !isResizing && !isRotating) || !selectedLayer) return;

    const deltaX = (e.clientX - dragStartRef.current.x) / scale;
    const deltaY = (e.clientY - dragStartRef.current.y) / scale;

    if (isDragging) {
      updateLayer(selectedLayer.id, {
        x: Math.round(dragStartRef.current.layerX + deltaX),
        y: Math.round(dragStartRef.current.layerY + deltaY),
      });
    } else if (isRotating) {
      const centerX = dragStartRef.current.layerX + dragStartRef.current.layerWidth / 2;
      const centerY = dragStartRef.current.layerY + dragStartRef.current.layerHeight / 2;
      
      const startAngle = Math.atan2(
        dragStartRef.current.y / scale - centerY,
        dragStartRef.current.x / scale - centerX
      );
      
      const currentAngle = Math.atan2(
        e.clientY / scale - centerY,
        e.clientX / scale - centerX
      );
      
      const angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
      const newRotation = (selectedLayer.rotation + angleDiff) % 360;
      
      updateLayer(selectedLayer.id, {
        rotation: Math.round(newRotation),
      });
      
      dragStartRef.current.x = e.clientX;
      dragStartRef.current.y = e.clientY;
    } else if (isResizing) {
      let newWidth = dragStartRef.current.layerWidth;
      let newHeight = dragStartRef.current.layerHeight;
      let newX = dragStartRef.current.layerX;
      let newY = dragStartRef.current.layerY;

      switch (resizeHandle) {
        case 'nw':
          newWidth = Math.max(20, dragStartRef.current.layerWidth - deltaX);
          newHeight = Math.max(20, dragStartRef.current.layerHeight - deltaY);
          newX = dragStartRef.current.layerX + (dragStartRef.current.layerWidth - newWidth);
          newY = dragStartRef.current.layerY + (dragStartRef.current.layerHeight - newHeight);
          break;
        case 'n':
          newHeight = Math.max(20, dragStartRef.current.layerHeight - deltaY);
          newY = dragStartRef.current.layerY + (dragStartRef.current.layerHeight - newHeight);
          break;
        case 'ne':
          newWidth = Math.max(20, dragStartRef.current.layerWidth + deltaX);
          newHeight = Math.max(20, dragStartRef.current.layerHeight - deltaY);
          newY = dragStartRef.current.layerY + (dragStartRef.current.layerHeight - newHeight);
          break;
        case 'e':
          newWidth = Math.max(20, dragStartRef.current.layerWidth + deltaX);
          break;
        case 'se':
          newWidth = Math.max(20, dragStartRef.current.layerWidth + deltaX);
          newHeight = Math.max(20, dragStartRef.current.layerHeight + deltaY);
          break;
        case 's':
          newHeight = Math.max(20, dragStartRef.current.layerHeight + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(20, dragStartRef.current.layerWidth - deltaX);
          newHeight = Math.max(20, dragStartRef.current.layerHeight + deltaY);
          newX = dragStartRef.current.layerX + (dragStartRef.current.layerWidth - newWidth);
          break;
        case 'w':
          newWidth = Math.max(20, dragStartRef.current.layerWidth - deltaX);
          newX = dragStartRef.current.layerX + (dragStartRef.current.layerWidth - newWidth);
          break;
      }

      updateLayer(selectedLayer.id, {
        width: Math.round(newWidth),
        height: Math.round(newHeight),
        x: Math.round(newX),
        y: Math.round(newY),
      });
    }
  }, [isDragging, isResizing, isRotating, selectedLayer, scale, resizeHandle, updateLayer]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setResizeHandle('');
  }, []);

  // Add/remove global mouse listeners - MUST be before any conditional returns
  React.useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp]);

  // Early return AFTER all hooks
  if (!selectedLayer || !currentSlide) return null;

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize' | 'rotate', handle?: string) => {
    if (selectedLayer.locked) return;
    e.stopPropagation();

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layerX: selectedLayer.x,
      layerY: selectedLayer.y,
      layerWidth: selectedLayer.width,
      layerHeight: selectedLayer.height,
    };

    if (action === 'drag') {
      setIsDragging(true);
    } else if (action === 'resize' && handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else if (action === 'rotate') {
      setIsRotating(true);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedLayer(null);
    }
  };

  const handleSize = 10;
  const rotateHandleDistance = 30;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-auto"
      onClick={handleBackgroundClick}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* Selection box with transform applied */}
      <div
        className="absolute border-2 border-primary pointer-events-auto transition-all duration-75"
        style={{
          left: selectedLayer.x,
          top: selectedLayer.y,
          width: selectedLayer.width,
          height: selectedLayer.height,
          transform: `rotate(${selectedLayer.rotation || 0}deg)`,
          transformOrigin: 'center center',
          cursor: selectedLayer.locked ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.15)',
        }}
        onMouseDown={(e) => !selectedLayer.locked && handleMouseDown(e, 'drag')}
      >
        {/* Layer name label */}
        <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-t font-medium whitespace-nowrap shadow-sm pointer-events-none">
          {selectedLayer.name}
        </div>

        {!selectedLayer.locked && (
          <>
            {/* Corner handles */}
            {['nw', 'ne', 'se', 'sw'].map((handle) => (
              <div
                key={handle}
                className="absolute w-3 h-3 bg-white border-2 border-primary rounded-full hover:scale-150 transition-transform cursor-pointer z-50"
                style={{
                  top: handle.includes('n') ? -handleSize / 2 : handle.includes('s') ? `calc(100% - ${handleSize / 2}px)` : '50%',
                  left: handle.includes('w') ? -handleSize / 2 : handle.includes('e') ? `calc(100% - ${handleSize / 2}px)` : '50%',
                  cursor: `${handle}-resize`,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'resize', handle)}
              />
            ))}

            {/* Edge handles */}
            {['n', 'e', 's', 'w'].map((handle) => (
              <div
                key={handle}
                className="absolute w-3 h-3 bg-white border-2 border-primary rounded-full hover:scale-150 transition-transform cursor-pointer z-50"
                style={{
                  top: handle === 'n' ? -handleSize / 2 : handle === 's' ? `calc(100% - ${handleSize / 2}px)` : '50%',
                  left: handle === 'w' ? -handleSize / 2 : handle === 'e' ? `calc(100% - ${handleSize / 2}px)` : '50%',
                  transform: (handle === 'n' || handle === 's') ? 'translateX(-50%)' : (handle === 'e' || handle === 'w') ? 'translateY(-50%)' : 'none',
                  cursor: `${handle === 'n' || handle === 's' ? 'ns' : 'ew'}-resize`,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'resize', handle)}
              />
            ))}

            {/* Rotation handle */}
            <div
              className="absolute w-4 h-4 bg-primary rounded-full hover:scale-125 transition-all cursor-grab active:cursor-grabbing flex items-center justify-center z-50 shadow-md"
              style={{
                left: '50%',
                top: -rotateHandleDistance,
                transform: 'translateX(-50%)',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'rotate')}
              title="Rotate"
            >
              <RotateCw size={10} className="text-white" />
            </div>
            
            {/* Rotation line */}
            <div
              className="absolute bg-primary pointer-events-none"
              style={{
                left: '50%',
                top: -rotateHandleDistance + 8,
                width: '2px',
                height: rotateHandleDistance - 8,
                transform: 'translateX(-50%)',
                opacity: 0.5,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};
