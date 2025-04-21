import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { 
  Form, 
  FormField, 
  FormSection, 
  FormActions, 
  FormMessage
} from './ui/Form';

// Define the schema for form validation
const loginSchema = z.object({
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' }),
  rememberMe: z.boolean().optional(),
});

// Type for our form values
type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: (data: LoginFormValues) => void;
  isLoading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  isLoading = false 
}) => {
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize the form with react-hook-form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Handle form submission
  const handleSubmit = async (data: LoginFormValues) => {
    try {
      setFormError(null);
      
      // Here you would typically call your authentication API
      console.log('Login attempt with:', data);
      
      // For demonstration, let's simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setFormError('Invalid email or password. Please try again.');
    }
  };

  return (
    <Form
      form={form}
      onSubmit={handleSubmit}
      onError={() => setFormError('Please fix the errors in the form')}
      className="w-full max-w-md mx-auto"
    >
      {formError && (
        <FormMessage type="error">
          {formError}
        </FormMessage>
      )}
      
      <FormSection title="Sign in to your account">
        <FormField name="email">
          <Input
            label="Email Address"
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            required
          />
        </FormField>
        
        <FormField name="password">
          <Input
            label="Password"
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            required
          />
        </FormField>
        
        <FormField name="rememberMe">
          {({ field }) => (
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="rememberMe"
                checked={field.value as boolean}
                onChange={field.onChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                Remember me for 30 days
              </label>
            </div>
          )}
        </FormField>
        
        <div className="text-right mt-2">
          <a href="#" className="text-sm text-primary-600 hover:underline">
            Forgot password?
          </a>
        </div>
      </FormSection>
      
      <FormActions>
        <Button
          type="submit"
          isLoading={isLoading}
          variant="primary"
          fullWidth
        >
          Sign In
        </Button>
      </FormActions>
      
      <div className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="#" className="font-medium text-primary-600 hover:underline">
          Sign up
        </a>
      </div>
    </Form>
  );
}; 