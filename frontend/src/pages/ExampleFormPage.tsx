import React, { useState } from 'react';
import { JoinQueueForm } from '../components/JoinQueueForm';
import { ContactForm } from '../components/ContactForm';
import { LoginForm } from '../components/LoginForm';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

enum FormType {
  JoinQueue = 'join-queue',
  Contact = 'contact',
  Login = 'login'
}

const ExampleFormPage: React.FC = () => {
  const [activeForm, setActiveForm] = useState<FormType>(FormType.JoinQueue);
  
  const handleFormSuccess = (data: any) => {
    console.log('Form submitted with data:', data);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow py-12 container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Form Examples</h1>
          
          <div className="mb-8 flex space-x-2 border-b border-gray-200">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeForm === FormType.JoinQueue
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveForm(FormType.JoinQueue)}
            >
              Join Queue Form
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeForm === FormType.Contact
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveForm(FormType.Contact)}
            >
              Contact Form
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeForm === FormType.Login
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveForm(FormType.Login)}
            >
              Login Form
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader
                  title={
                    activeForm === FormType.JoinQueue 
                      ? "Join Queue Form" 
                      : activeForm === FormType.Contact
                        ? "Contact Form"
                        : "Login Form"
                  }
                  description={
                    activeForm === FormType.JoinQueue 
                      ? "A simple form for joining a queue" 
                      : activeForm === FormType.Contact
                        ? "A more complex form with multiple field types and sections"
                        : "A standard authentication form"
                  }
                />
                <CardContent>
                  {activeForm === FormType.JoinQueue ? (
                    <JoinQueueForm 
                      queueId="example-queue-id" 
                      onSuccess={handleFormSuccess}
                    />
                  ) : activeForm === FormType.Contact ? (
                    <ContactForm
                      onSuccess={handleFormSuccess}
                    />
                  ) : (
                    <LoginForm 
                      onSuccess={handleFormSuccess}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader
                  title="About This Form"
                  description="Key components & features"
                />
                <CardContent className="prose max-w-none">
                  {activeForm === FormType.JoinQueue ? (
                    <>
                      <p>
                        The Join Queue form demonstrates:
                      </p>
                      <ul>
                        <li>Basic field validation with Zod</li>
                        <li>Required and optional fields</li>
                        <li>Form submission handling</li>
                        <li>Success and error messages</li>
                      </ul>
                    </>
                  ) : activeForm === FormType.Contact ? (
                    <>
                      <p>
                        The Contact form demonstrates:
                      </p>
                      <ul>
                        <li>Multi-section form organization</li>
                        <li>Multiple field types (text, select, textarea, checkbox)</li>
                        <li>Complex validation rules</li>
                        <li>Field layout with grid</li>
                        <li>Character count display</li>
                        <li>Terms and conditions agreement</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>
                        The Login form demonstrates:
                      </p>
                      <ul>
                        <li>Authentication form pattern</li>
                        <li>Password field with masking</li>
                        <li>Remember me checkbox</li>
                        <li>Accessible field labels</li>
                        <li>"Forgot password" and "Sign up" links</li>
                        <li>Full-width submit button</li>
                      </ul>
                    </>
                  )}
                  
                  <p className="mt-4">
                    All forms use the same core components:
                  </p>
                  <ul>
                    <li>
                      <strong>Form</strong> - Container with React Hook Form integration
                    </li>
                    <li>
                      <strong>FormField</strong> - Field-level state management
                    </li>
                    <li>
                      <strong>FormSection</strong> - Logical form grouping
                    </li>
                    <li>
                      <strong>FormActions</strong> - Button container
                    </li>
                    <li>
                      <strong>FormMessage</strong> - Form-level messages
                    </li>
                  </ul>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="font-medium">
                      Implementation notes:
                    </p>
                    <ul>
                      <li>Uses Zod for schema validation</li>
                      <li>Leverages React Hook Form for state management</li>
                      <li>TypeScript for type safety</li>
                      <li>TailwindCSS for styling</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExampleFormPage; 