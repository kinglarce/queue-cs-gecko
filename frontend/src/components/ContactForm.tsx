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
const contactFormSchema = z.object({
  firstName: z.string()
    .min(2, { message: 'First name must be at least 2 characters' })
    .max(50, { message: 'First name must not exceed 50 characters' }),
  lastName: z.string()
    .min(2, { message: 'Last name must be at least 2 characters' })
    .max(50, { message: 'Last name must not exceed 50 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  phone: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .optional()
    .or(z.literal('')),
  subject: z.enum(['general', 'support', 'billing', 'other'], {
    errorMap: () => ({ message: 'Please select a subject' }),
  }),
  message: z.string()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(500, { message: 'Message must not exceed 500 characters' }),
  agreeToTerms: z.boolean()
    .refine((val: boolean) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
});

// Type for our form values
type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  onSuccess?: (data: ContactFormValues) => void;
  isLoading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({ 
  onSuccess, 
  isLoading = false 
}) => {
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Initialize the form with react-hook-form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      subject: 'general' as const,
      message: '',
      agreeToTerms: false,
    },
  });

  // Handle form submission
  const handleSubmit = async (data: ContactFormValues) => {
    try {
      setFormError(null);
      setFormSuccess(null);
      
      // Here you would typically call your API to send the contact form
      console.log('Submitting contact form with data:', data);
      
      // For demonstration, let's simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success
      setFormSuccess('Thank you for your message! We will get back to you soon.');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Reset the form
      form.reset();
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormError('Failed to submit the form. Please try again later.');
    }
  };

  return (
    <Form
      form={form}
      onSubmit={handleSubmit}
      onError={() => setFormError('Please fix the errors in the form')}
      className="w-full max-w-xl mx-auto"
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
        title="Personal Information"
        description="Tell us about yourself"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="firstName">
            <Input
              label="First Name"
              placeholder="John"
              autoComplete="given-name"
              required
            />
          </FormField>
          
          <FormField name="lastName">
            <Input
              label="Last Name"
              placeholder="Doe"
              autoComplete="family-name"
              required
            />
          </FormField>
        </div>
        
        <FormField name="email">
          <Input
            label="Email Address"
            placeholder="your@email.com"
            type="email"
            autoComplete="email"
            required
            helperText="We'll never share your email with anyone else"
          />
        </FormField>
        
        <FormField name="phone">
          <Input
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            type="tel"
            autoComplete="tel"
            helperText="Optional: for urgent matters"
          />
        </FormField>
      </FormSection>
      
      <FormSection
        title="Message Details"
        description="What would you like to talk about?"
        className="mt-8"
      >
        <FormField name="subject">
          {({ field }) => (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject" className="text-sm font-medium text-gray-700">
                Subject
              </label>
              <select
                id="subject"
                value={field.value as string}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
        </FormField>
        
        <FormField name="message">
          {({ field }) => (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                value={field.value as string}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                className="flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          placeholder:text-gray-400"
                placeholder="Type your message here..."
                required
              />
              <p className="text-sm text-gray-500">
                {(field.value as string)?.length || 0}/500 characters
              </p>
            </div>
          )}
        </FormField>
        
        <FormField name="agreeToTerms">
          {({ field }) => (
            <div className="flex items-start gap-2 mt-4">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={field.value as boolean}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                I agree to the <a href="#" className="text-primary-600 hover:underline">Terms and Conditions</a> and <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
              </label>
            </div>
          )}
        </FormField>
      </FormSection>
      
      <FormActions className="mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={isLoading}
        >
          Reset
        </Button>
        
        <Button
          type="submit"
          isLoading={isLoading}
          variant="primary"
        >
          Send Message
        </Button>
      </FormActions>
    </Form>
  );
}; 