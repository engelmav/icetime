import React, { useEffect, useRef } from 'react';
import { Button } from '@/libs/ui/button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function CustomDialog({ open, onOpenChange, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
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
  onApply: () => void;
}

export function FilterDialog({ isOpen, onOpenChange, title, description, children, onApply }: FilterDialogProps) {
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
      </div>
    </CustomDialog>
  );
}

// Export CustomDialog for use in other components
export { CustomDialog };