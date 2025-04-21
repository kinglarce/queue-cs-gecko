import React from 'react';
import { twMerge } from 'tailwind-merge';
import {
  UseFormReturn,
  FieldValues,
  SubmitHandler,
  SubmitErrorHandler,
  Controller,
  FormProvider,
  useFormContext,
  FieldPath,
} from 'react-hook-form';
import { Input, InputProps } from './Input';

// ========== Form Container ==========
export interface FormProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  onError?: SubmitErrorHandler<TFormValues>;
  className?: string;
  children: React.ReactNode;
}

export const Form = <TFormValues extends FieldValues>({
  form,
  onSubmit,
  onError,
  className,
  children,
}: FormProps<TFormValues>) => {
  return (
    <FormProvider {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit, onError)} 
        className={twMerge('space-y-6', className)}
      >
        {children}
      </form>
    </FormProvider>
  );
};

// ========== Form Field ==========
export interface FormFieldProps<
  TFormValues extends FieldValues,
  TFieldName extends FieldPath<TFormValues> = FieldPath<TFormValues>
> {
  name: TFieldName;
  children: React.ReactNode | ((props: { field: any; fieldState: any }) => React.ReactNode);
  className?: string;
}

export const FormField = <TFormValues extends FieldValues>({
  name,
  children,
  className,
}: FormFieldProps<TFormValues>) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={twMerge('space-y-1.5', className)}>
          {typeof children === 'function'
            ? children({ field, fieldState })
            : React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child;

                return React.cloneElement(child as React.ReactElement, {
                  ...field,
                  error: fieldState.error?.message,
                  ...child.props,
                });
              })}
        </div>
      )}
    />
  );
};

// ========== Form Input ==========
export interface FormInputProps extends Omit<InputProps, 'name'> {
  name: string;
}

export const FormInput = ({ name, ...props }: FormInputProps) => {
  const { register, formState } = useFormContext();
  const { errors } = formState;
  const error = errors[name]?.message as string | undefined;

  return (
    <Input
      {...register(name)}
      error={error}
      {...props}
    />
  );
};

// ========== Form Section ==========
export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection = ({
  title,
  description,
  children,
  className,
}: FormSectionProps) => {
  return (
    <div className={twMerge('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
};

// ========== Form Actions ==========
export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const FormActions = ({
  children,
  className,
  align = 'right',
}: FormActionsProps) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={twMerge(
        'flex flex-wrap items-center gap-3 pt-4 mt-2 border-t border-gray-200',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};

// ========== Form Message ==========
export interface FormMessageProps {
  children: React.ReactNode;
  type?: 'success' | 'error' | 'info';
  className?: string;
}

export const FormMessage = ({
  children,
  type = 'info',
  className,
}: FormMessageProps) => {
  if (!children) return null;

  const messageStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div
      className={twMerge(
        'p-3 rounded-md border text-sm',
        messageStyles[type],
        className
      )}
    >
      {children}
    </div>
  );
}; 