import { useState, useRef, useEffect } from 'react';
import { Layer } from '@/store/useTemplateStore';
import { useTemplateStore } from '@/store/useTemplateStore';
import { RotateCw } from 'lucide-react';

interface InteractionOverlayProps {
  slideWidth: number;
  slideHeight: number;
  scale: number;
}

export const InteractionOverlay = ({ slideWidth, slideHeight, scale }: InteractionOverlayProps) => {
  const { selectedLayer, updateLayer, currentSlide } = useTemplateStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotationStart, setRotationStart] = useState(0);
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

  const handleMouseDown = (e: React.MouseEvent, handle?: string, rotate?: boolean) => {
    if (selectedLayer.locked) return;

    e.stopPropagation();
    
    if (rotate) {
      setIsRotating(true);
      const centerX = selectedLayer.x + selectedLayer.width / 2;
      const centerY = selectedLayer.y + selectedLayer.height / 2;
      const angle = Math.atan2(e.clientY / scale - centerY, e.clientX / scale - centerX);
      setRotationStart(angle * (180 / Math.PI) - (selectedLayer.rotation || 0));
    } else if (handle) {
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
    if (!isDragging && !isResizing && !isRotating) return;

    const deltaX = e.clientX / scale - dragStart.x;
    const deltaY = e.clientY / scale - dragStart.y;

    if (isDragging) {
      updateLayer(selectedLayer.id, {
        x: selectedLayer.x + deltaX,
        y: selectedLayer.y + deltaY,
      });
    } else if (isRotating) {
      const centerX = selectedLayer.x + selectedLayer.width / 2;
      const centerY = selectedLayer.y + selectedLayer.height / 2;
      const angle = Math.atan2(e.clientY / scale - centerY, e.clientX / scale - centerX);
      const rotation = angle * (180 / Math.PI) - rotationStart;
      updateLayer(selectedLayer.id, {
        rotation: Math.round(rotation) % 360,
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
    setIsRotating(false);
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
        className="absolute border-2 border-primary pointer-events-auto transition-all"
        style={{
          left: selectedLayer.x,
          top: selectedLayer.y,
          width: selectedLayer.width,
          height: selectedLayer.height,
          transform: `rotate(${selectedLayer.rotation || 0}deg)`,
          transformOrigin: 'center center',
          cursor: selectedLayer.locked ? 'not-allowed' : 'move',
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        {/* Resize handles */}
        {!selectedLayer.locked && (
          <>
            {/* Corner handles */}
            <div
              className="absolute bg-white border-2 border-primary rounded-full hover:scale-125 transition-transform"
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
              className="absolute bg-white border-2 border-primary rounded-full hover:scale-125 transition-transform"
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
              className="absolute bg-white border-2 border-primary rounded-full hover:scale-125 transition-transform"
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
              className="absolute bg-white border-2 border-primary rounded-full hover:scale-125 transition-transform"
              style={{
                width: handleSize,
                height: handleSize,
                right: -handleSize / 2,
                bottom: -handleSize / 2,
                cursor: 'se-resize',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'se')}
            />
            
            {/* Rotation handle */}
            <div
              className="absolute bg-primary rounded-full hover:scale-125 transition-transform flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{
                width: handleSize + 4,
                height: handleSize + 4,
                left: '50%',
                top: -24,
                transform: 'translateX(-50%)',
              }}
              onMouseDown={(e) => handleMouseDown(e, undefined, true)}
              title="Rotate"
            >
              <RotateCw size={8} className="text-white" />
            </div>
          </>
        )}

        {/* Layer name label */}
        <div className="absolute -top-7 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium whitespace-nowrap shadow-sm">
          {selectedLayer.name}
        </div>
      </div>
    </div>
  );
};
