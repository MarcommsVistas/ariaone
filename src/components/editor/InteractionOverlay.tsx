import { useState, useRef, useEffect } from 'react';
import { Layer } from '@/store/useTemplateStore';
import { useTemplateStore } from '@/store/useTemplateStore';

interface InteractionOverlayProps {
  slideWidth: number;
  slideHeight: number;
  scale: number;
}

export const InteractionOverlay = ({ slideWidth, slideHeight, scale }: InteractionOverlayProps) => {
  const { selectedLayer, updateLayer, currentSlide } = useTemplateStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLayer) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const { deleteLayer } = useTemplateStore.getState();
        deleteLayer(selectedLayer.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayer]);

  if (!selectedLayer || !currentSlide) return null;

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    if (selectedLayer.locked) return;

    e.stopPropagation();
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({
      x: e.clientX / scale,
      y: e.clientY / scale,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;

    const deltaX = e.clientX / scale - dragStart.x;
    const deltaY = e.clientY / scale - dragStart.y;

    if (isDragging) {
      updateLayer(selectedLayer.id, {
        x: selectedLayer.x + deltaX,
        y: selectedLayer.y + deltaY,
      });
    } else if (isResizing) {
      let newWidth = selectedLayer.width;
      let newHeight = selectedLayer.height;
      let newX = selectedLayer.x;
      let newY = selectedLayer.y;

      switch (resizeHandle) {
        case 'nw':
          newWidth = Math.max(20, selectedLayer.width - deltaX);
          newHeight = Math.max(20, selectedLayer.height - deltaY);
          newX = selectedLayer.x + deltaX;
          newY = selectedLayer.y + deltaY;
          break;
        case 'ne':
          newWidth = Math.max(20, selectedLayer.width + deltaX);
          newHeight = Math.max(20, selectedLayer.height - deltaY);
          newY = selectedLayer.y + deltaY;
          break;
        case 'sw':
          newWidth = Math.max(20, selectedLayer.width - deltaX);
          newHeight = Math.max(20, selectedLayer.height + deltaY);
          newX = selectedLayer.x + deltaX;
          break;
        case 'se':
          newWidth = Math.max(20, selectedLayer.width + deltaX);
          newHeight = Math.max(20, selectedLayer.height + deltaY);
          break;
      }

      updateLayer(selectedLayer.id, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      });
    }

    setDragStart({
      x: e.clientX / scale,
      y: e.clientY / scale,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

  const handleSize = 8;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Selection box */}
      <div
        className="absolute border-2 border-primary pointer-events-auto"
        style={{
          left: selectedLayer.x,
          top: selectedLayer.y,
          width: selectedLayer.width,
          height: selectedLayer.height,
          cursor: selectedLayer.locked ? 'not-allowed' : 'move',
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        {/* Resize handles */}
        {!selectedLayer.locked && (
          <>
            {/* Corner handles */}
            <div
              className="absolute bg-primary rounded-full"
              style={{
                width: handleSize,
                height: handleSize,
                left: -handleSize / 2,
                top: -handleSize / 2,
                cursor: 'nw-resize',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
            />
            <div
              className="absolute bg-primary rounded-full"
              style={{
                width: handleSize,
                height: handleSize,
                right: -handleSize / 2,
                top: -handleSize / 2,
                cursor: 'ne-resize',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
            />
            <div
              className="absolute bg-primary rounded-full"
              style={{
                width: handleSize,
                height: handleSize,
                left: -handleSize / 2,
                bottom: -handleSize / 2,
                cursor: 'sw-resize',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
            />
            <div
              className="absolute bg-primary rounded-full"
              style={{
                width: handleSize,
                height: handleSize,
                right: -handleSize / 2,
                bottom: -handleSize / 2,
                cursor: 'se-resize',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'se')}
            />
          </>
        )}

        {/* Layer name label */}
        <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded whitespace-nowrap">
          {selectedLayer.name}
        </div>
      </div>
    </div>
  );
};
