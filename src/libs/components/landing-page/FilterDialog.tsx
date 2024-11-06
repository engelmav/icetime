import React, { useEffect, useRef } from 'react';
import { Button } from '@/libs/ui/button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  showApplyButton?: boolean;
}

function CustomDialog({ open, onOpenChange, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    const handleOutsideInteraction = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the click is on any Google Places autocomplete element
      const isPacElement = target.closest('.pac-container') || 
                          target.classList.contains('pac-item') ||
                          target.classList.contains('pac-item-query');
                          
      if (isPacElement) {
        console.log('Pointer was on Places autocomplete element');
        event.stopImmediatePropagation();
        return;
      }

      if (dialogRef.current && !dialogRef.current.contains(target)) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('pointerdown', handleOutsideInteraction, { 
        capture: true, 
        passive: false 
      });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleOutsideInteraction, { 
        capture: true 
      });
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div ref={dialogRef} className="bg-background border rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        {children}
      </div>
    </div>
  );
}

interface FilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  onApply?: () => void;
  showApplyButton?: boolean;
}

export function FilterDialog({ 
  isOpen, 
  onOpenChange, 
  title, 
  description, 
  children, 
  onApply, 
  showApplyButton = true 
}: FilterDialogProps) {
  return (
    <CustomDialog open={isOpen} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {children}
        </div>
        {showApplyButton && onApply && (
          <div>
            <Button
              className="w-full"
              onClick={() => {
                onApply();
                onOpenChange(false);
              }}
            >
              Apply
            </Button>
          </div>
        )}
      </div>
    </CustomDialog>
  );
}

// Export CustomDialog for use in other components
export { CustomDialog };