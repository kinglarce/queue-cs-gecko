# Form Components

A comprehensive set of form components that work with React Hook Form to create flexible, accessible, and type-safe forms.

## Components Overview

The form library consists of the following components:

- `Form`: The base container that connects to React Hook Form
- `FormField`: Connects individual fields to form state and validation
- `FormInput`: A specialized input field for common text input scenarios
- `FormSection`: Organizes forms into logical sections with titles and descriptions
- `FormActions`: Container for form buttons with alignment options
- `FormMessage`: Displays form-level feedback messages

## Installation

These components depend on:

- React Hook Form v7+
- Zod (for validation)
- TailwindCSS (for styling)

Make sure these dependencies are installed in your project:

```bash
npm install react-hook-form @hookform/resolvers zod
```

## Basic Usage

Here's a simple example of how to use these components:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form,
  FormField,
  FormInput,
  FormSection,
  FormActions,
  FormMessage
} from './components/ui/Form';
import { Button } from './components/ui/Button';

// 1. Define your form schema with zod
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// 2. Create a type from the schema
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  // 3. Initialize the form with validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 4. Define submit handler
  const onSubmit = (data: LoginFormValues) => {
    console.log(data);
  };

  return (
    <Form 
      form={form} 
      onSubmit={onSubmit}
      className="max-w-md"
    >
      {/* Group related fields */}
      <FormSection title="Login to your account">
        {/* Easy connection to form state */}
        <FormField name="email">
          <FormInput 
            label="Email" 
            type="email" 
            placeholder="you@example.com" 
          />
        </FormField>
        
        <FormField name="password">
          <FormInput 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
          />
        </FormField>
      </FormSection>
      
      {/* Actions container with alignment */}
      <FormActions align="right">
        <Button type="submit">
          Sign in
        </Button>
      </FormActions>
    </Form>
  );
}
```

## Advanced Usage

### Rendering Field Children

`FormField` supports both direct children and render props for more control:

```tsx
// Direct children (simple)
<FormField name="email">
  <Input label="Email" />
</FormField>

// Render props (advanced)
<FormField name="email">
  {({ field, fieldState }) => (
    <div>
      <Input {...field} label="Email" />
      {fieldState.error && <p>{fieldState.error.message}</p>}
    </div>
  )}
</FormField>
```

### Custom Field Components

You can use any input components with `FormField`:

```tsx
<FormField name="color">
  {({ field }) => (
    <div>
      <label>Color</label>
      <input 
        type="color" 
        value={field.value} 
        onChange={field.onChange}
      />
    </div>
  )}
</FormField>
```

### Multiple Sections

Organize complex forms with multiple sections:

```tsx
<Form form={form} onSubmit={onSubmit}>
  <FormSection 
    title="Personal Details" 
    description="Basic information about you"
  >
    {/* Personal fields */}
  </FormSection>
  
  <FormSection 
    title="Address Information" 
    description="Where should we contact you?"
  >
    {/* Address fields */}
  </FormSection>
</Form>
```

### Error Handling

Show form-level messages:

```tsx
const [error, setError] = useState('');

<Form 
  form={form} 
  onSubmit={onSubmit}
  onError={() => setError('Please fix form errors')}
>
  {error && (
    <FormMessage type="error">
      {error}
    </FormMessage>
  )}
  
  {/* Form fields */}
</Form>
```

## Component API

### Form

| Prop | Type | Description |
|------|------|-------------|
| `form` | `UseFormReturn` | Form instance from React Hook Form |
| `onSubmit` | `SubmitHandler` | Function called on successful form submission |
| `onError` | `SubmitErrorHandler` | Function called on validation errors |
| `className` | `string` | Optional CSS class |
| `children` | `ReactNode` | Form content |

### FormField

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Field name (must match schema key) |
| `children` | `ReactNode` or `Function` | Field content or render function |
| `className` | `string` | Optional CSS class |

### FormInput

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Field name (must match schema key) |
| plus all props from the underlying `Input` component |

### FormSection

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Section title (optional) |
| `description` | `string` | Section description (optional) |
| `children` | `ReactNode` | Section content |
| `className` | `string` | Optional CSS class |

### FormActions

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Action buttons |
| `className` | `string` | Optional CSS class |
| `align` | `'left'` \| `'center'` \| `'right'` \| `'between'` | Button alignment |

### FormMessage

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Message content |
| `type` | `'success'` \| `'error'` \| `'info'` | Message type |
| `className` | `string` | Optional CSS class | 