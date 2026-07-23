import { forwardRef, useCallback } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { soundEffects } from '@/lib/sound-effects';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark',
        secondary:
          'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white',
        success: 'bg-green-600 text-white hover:bg-green-700',
        destructive:
          'border-2 border-red-300 bg-white text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-950/30 dark:hover:text-red-200',
        ghost: 'hover:bg-gray-100',
      },
      size: {
        default: 'px-6 py-3',
        sm: 'px-4 py-2 text-sm',
        lg: 'px-8 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Disable sound effects for this button */
  disableSound?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size, onClick, disableSound = false, ...props }, ref) => {
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Play sound effect based on variant
        if (!disableSound && !props.disabled) {
          switch (variant) {
            case 'primary':
              soundEffects.playPop();
              break;
            case 'success':
              soundEffects.playSuccess();
              break;
            case 'secondary':
            case 'destructive':
            case 'ghost':
            default:
              soundEffects.playClick();
              break;
          }
        }

        // Call original onClick handler
        onClick?.(e);
      },
      [onClick, variant, disableSound, props.disabled]
    );

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
