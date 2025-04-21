import React, { useState } from 'react';
import { useForm, ControllerRenderProps, ControllerFieldState } from 'react-hook-form';
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
const joinQueueSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name must not exceed 50 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' })
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .optional()
    .or(z.literal('')),
});

// Type for our form values
type JoinQueueFormValues = z.infer<typeof joinQueueSchema>;

interface JoinQueueFormProps {
  queueId: string;
  onSuccess?: (data: any) => void;
  isLoading?: boolean;
}

export const JoinQueueForm: React.FC<JoinQueueFormProps> = ({ 
  queueId, 
  onSuccess, 
  isLoading = false 
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Initialize the form with react-hook-form
  const form = useForm<JoinQueueFormValues>({
    resolver: zodResolver(joinQueueSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // Handle form submission
  const handleSubmit = async (data: JoinQueueFormValues) => {
    try {
      setFormError(null);
      setFormSuccess(null);
      
      // Here you would typically call your API to join the queue
      console.log('Joining queue with data:', data);
      
      // For demonstration, let's simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success
      setFormSuccess('You have successfully joined the queue!');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess({
          ...data,
          queueId,
          joinedAt: new Date().toISOString(),
        });
      }
      
      // Reset the form
      form.reset();
      
    } catch (error) {
      console.error('Error joining queue:', error);
      setFormError('Failed to join the queue. Please try again.');
    }
  };

  return (
    <Form
      form={form}
      onSubmit={handleSubmit}
      onError={() => setFormError('Please fix the errors in the form')}
      className="w-full max-w-md mx-auto"
    >
      {formSuccess && (
        <FormMessage type="success">
          {formSuccess}
        </FormMessage>
      )}
      
      {formError && (
        <FormMessage type="error">
          {formError}
        </FormMessage>
      )}
      
      <FormSection
        title="Join the Queue"
        description="Please fill out the form below to join the queue"
      >
        <FormField name="name">
          {({ field }) => (
            <Input
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name as string}
              ref={field.ref}
              label="Your Name"
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          )}
        </FormField>
        
        <FormField name="email">
          {({ field }) => (
            <Input
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name as string}
              ref={field.ref}
              label="Email Address"
              placeholder="your@email.com"
              type="email"
              autoComplete="email"
              helperText="We'll send updates about your position to this email"
            />
          )}
        </FormField>
        
        <FormField name="phone">
          {({ field }) => (
            <Input
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name as string}
              ref={field.ref}
              label="Phone Number"
              placeholder="+1 (555) 123-4567"
              type="tel"
              autoComplete="tel"
              helperText="Optional: for SMS notifications when it's your turn"
            />
          )}
        </FormField>
      </FormSection>
      
      <FormActions>
        <Button
          type="button"
          onClick={() => form.reset()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          isLoading={isLoading}
          variant="primary"
        >
          Join Queue
        </Button>
      </FormActions>
    </Form>
  );
}; 