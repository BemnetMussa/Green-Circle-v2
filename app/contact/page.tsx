'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Building2, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject');
  const isInvestorRequest = subject === 'investor-verification';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: isInvestorRequest 
      ? 'I would like to request investor access to Green Circle. I am interested in accessing deal flow metrics and market intelligence on Ethiopian startups.' 
      : '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main className="flex items-center justify-center min-h-[60vh] px-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-forest" />
              </div>
              <h2 className="text-xl font-bold text-ink mb-2">
                {isInvestorRequest ? 'Request Received!' : 'Message Sent!'}
              </h2>
              <p className="text-ink-muted mb-6">
                {isInvestorRequest 
                  ? 'Our team will review your investor verification request and get back to you within 24-48 hours.'
                  : 'Thank you for reaching out. We will get back to you as soon as possible.'
                }
              </p>
              <Button asChild className="w-full bg-forest hover:bg-forest-soft">
                <a href="/">Return home</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      
      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {isInvestorRequest ? (
            <div className="mb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-forest" />
              </div>
              <h1 className="text-3xl font-bold text-ink mb-3">
                Request Investor Access
              </h1>
              <p className="text-ink-muted max-w-lg mx-auto">
                Provide your details below. Our team will verify your investor status 
                and upgrade your account within 24-48 hours.
              </p>
            </div>
          ) : (
            <div className="mb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-forest" />
              </div>
              <h1 className="text-3xl font-bold text-ink mb-3">
                Get in Touch
              </h1>
              <p className="text-ink-muted max-w-lg mx-auto">
                Have a question or want to partner with us? Fill out the form below 
                and we will get back to you.
              </p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{isInvestorRequest ? 'Investor Verification' : 'Contact Form'}</CardTitle>
              <CardDescription>
                {isInvestorRequest 
                  ? 'Tell us about your investment focus and experience'
                  : 'Fill out the form below to send us a message'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">
                    {isInvestorRequest ? 'Investment Firm / Organization *' : 'Company (optional)'}
                  </Label>
                  <Input
                    id="company"
                    placeholder={isInvestorRequest ? 'e.g., Acme Ventures' : 'Your company name'}
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required={isInvestorRequest}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">
                    {isInvestorRequest ? 'Investment Focus & Experience *' : 'Message *'}
                  </Label>
                  <Textarea
                    id="message"
                    placeholder={isInvestorRequest 
                      ? 'Tell us about your investment thesis, typical check sizes, and portfolio...' 
                      : 'How can we help you?'}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-forest hover:bg-forest-soft"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {isInvestorRequest ? 'Submit Request' : 'Send Message'}
                    </>
                  )}
                </Button>

                {isInvestorRequest && (
                  <p className="text-xs text-ink-muted text-center">
                    By submitting this form, you agree to our verification process. 
                    We may contact you for additional information.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Alternative contact methods */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="text-center p-6 rounded-xl border border-rule bg-paper-deep">
              <Mail className="h-6 w-6 text-forest mx-auto mb-3" />
              <h3 className="font-semibold text-ink mb-1">Email Us</h3>
              <a href="mailto:hello@greencircle.et" className="text-sm text-ink-muted hover:text-forest">
                hello@greencircle.et
              </a>
            </div>
            <div className="text-center p-6 rounded-xl border border-rule bg-paper-deep">
              <Building2 className="h-6 w-6 text-forest mx-auto mb-3" />
              <h3 className="font-semibold text-ink mb-1">Office</h3>
              <p className="text-sm text-ink-muted">
                Addis Ababa, Ethiopia
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
