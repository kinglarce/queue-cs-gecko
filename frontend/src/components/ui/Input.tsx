import React, { forwardRef, useId } from 'react';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  helperText,
  error,
  fullWidth = false,
  leftIcon,
  rightIcon,
  isLoading,
  disabled,
  id: propId,
  ...props
}, ref) => {
  const generatedId = useId();
  const id = propId || `input-${generatedId}`;
  const helperTextId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = error 
    ? errorId 
    : helperText 
      ? helperTextId 
      : undefined;

  const isDisabled = disabled || isLoading;

  return (
    <div className={twMerge('flex flex-col gap-1.5', fullWidth ? 'w-full' : '', className)}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-gray-500">
            {leftIcon}
          </div>
        )}
        
        <input
          id={id}
          ref={ref}
          className={twMerge(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon ? 'pl-10' : '',
            rightIcon || isLoading ? 'pr-10' : '',
            error ? 'border-red-500 focus:ring-red-500' : '',
            fullWidth ? 'w-full' : '',
          )}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          disabled={isDisabled}
          {...props}
        />
        
        {(rightIcon || isLoading) && (
          <div className="absolute right-3 flex items-center pointer-events-none text-gray-500">
            {isLoading ? (
              <svg 
                className="animate-spin h-5 w-5 text-gray-400" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : rightIcon}
          </div>
        )}
      </div>
      
      {helperText && !error && (
        <p id={helperTextId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}); 