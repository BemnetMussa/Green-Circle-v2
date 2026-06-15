'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LoaderPinwheel, Shield } from 'lucide-react';
import { FormData } from './submit-form';
import { generatePKCEPair } from '@/utils/faydaUtils';
import { useState } from 'react';
import { StartupZodSchema } from '@/zod-validator/validator';
import z from 'zod';
import { authClient } from '@/lib/auth-client';
import { ClipLoader } from 'react-spinners';
import DocumentUploader from '@/components/DocumentUploader';

export const MainSection: React.FC<{
  step: number;
  formData: FormData;
  handleInputChange: (field: string, value: string | boolean | string[]) => void;
  handleNext: () => void;
  isStepValid: boolean;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}> = ({
  step,
  formData,
  handleInputChange,
  handleNext,
  isStepValid,
  setFormData,
}) => {
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [loading, setLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // url for fayda
  const generateSignInUrl = async () => {
    const { codeChallenge } = await generatePKCEPair();

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_CLIENT_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
      response_type: 'code',
      scope: 'openid profile email',
      acr_values: 'mosip:idp:acr:generated-code',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      display: 'page',
      nonce: 'g4DEuje5Fx57Vb64dO4oqLHXGT8L8G7g',
      state: 'ptOO76SD',
      ui_locales: 'en',
    });

    console.log('this is params', params);

    return `${process.env
      .NEXT_PUBLIC_AUTHORIZATION_ENDPOINT!}?${params.toString()}`;
  };

  // api
  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();
    setSubmissionStatus({ type: null, message: '' });
    setFieldErrors({});

    const session = await authClient.getSession();
    const email = session.data?.user.email;

    console.log(email);

    try {
      // Validate formData
      StartupZodSchema.parse(formData);

      // Submit to API
      const response = await fetch(`/api/startups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, email }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit startup');
      }

      setSubmissionStatus({
        type: 'success',
        message: 'Startup submitted successfully! Awaiting review.',
      });

      // Reset form (except faydaId)
      setFormData({
        startupName: 'AfriTech Solutions',
        website: 'https://afritech.et',
        sector: '',
        location: '',
        description:
          'AfriTech Solutions leverages data and AI to help smallholder farmers increase crop yields, access markets, and improve sustainability.',
        founderName: 'Selam Tesfaye',
        founderRole: 'Co-Founder & CEO',
        pitch:
          'Our platform empowers farmers across Ethiopia with predictive insights, access to finance, and digital marketplaces to enhance their agricultural productivity.',
        startupLaw: false,
        faydaId: true,
        terms: false,
        foundedYear: '2021',
        stage: 'seed',
        employees: '25',
        revenue: '150000', // in USD
        achievements:
          'Winner of the 2023 African Agritech Innovation Award, Expanded to 4 regions in Ethiopia.',
        founderPhone: '+251912345678',
        founderBio:
          'Selam Tesfaye is a tech entrepreneur passionate about digital agriculture, with over 7 years of experience in software development and rural innovation.',
        documents: [],
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors = error.flatten().fieldErrors;
        setFieldErrors(errors);
        const errorMessages = Object.values(errors).flat().join(' ');
        setSubmissionStatus({
          type: 'error',
          message: errorMessages || 'Please fix the errors in the form.',
        });
      } else {
        setSubmissionStatus({
          type: 'error',
          message: error.message || 'An error occurred during submission.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  switch (step) {
    case 1:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Fayda ID Verification</CardTitle>
            <CardDescription>Verify your identity to proceed</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 border-emerald-200 bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary/80">
                <strong>Fayda ID Verification Required:</strong> Click below to
                authenticate with Fayda Digital ID.
              </AlertDescription>
            </Alert>
            <Button
              onClick={async () => {
                const url = await generateSignInUrl();
                console.log('url', url);
                window.location.href = `${url}`;
              }}
              className="w-full bg-primary/100 hover:bg-primary"
            >
              Verify with Fayda
            </Button>
            <Button
              onClick={handleNext}
              disabled={true}
              className="mt-4 w-full"
            >
              Next
            </Button>
          </CardContent>
        </Card>
      );
    case 2:
      return (
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Startup Information</CardTitle>
              <CardDescription>
                Provide detailed information about your startup for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissionStatus.type && (
                <Alert
                  className={`mb-6 ${
                    submissionStatus.type === 'success'
                      ? 'border-primary/30 bg-primary/10'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <AlertCircle
                    className={`h-4 w-4 ${
                      submissionStatus.type === 'success'
                        ? 'text-primary'
                        : 'text-red-600'
                    }`}
                  />
                  <AlertDescription
                    className={
                      submissionStatus.type === 'success'
                        ? 'text-primary/80'
                        : 'text-red-800'
                    }
                  >
                    {submissionStatus.message}
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startupName">Startup Name *</Label>
                      <Input
                        id="startupName"
                        placeholder="EthioPay"
                        value={formData.startupName}
                        onChange={(e) =>
                          handleInputChange('startupName', e.target.value)
                        }
                        required
                        className={
                          fieldErrors.startupName ? 'border-red-500' : ''
                        }
                      />
                      {fieldErrors.startupName && (
                        <p className="text-red-500 text-sm">
                          {fieldErrors.startupName.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://yourstartup.com"
                        value={formData.website}
                        onChange={(e) =>
                          handleInputChange('website', e.target.value)
                        }
                        className={fieldErrors.website ? 'border-red-500' : ''}
                      />
                      {fieldErrors.website && (
                        <p className="text-red-500 text-sm">
                          {fieldErrors.website.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sector">Sector *</Label>
                      <Select
                        value={formData.sector}
                        onValueChange={(value) =>
                          handleInputChange('sector', value)
                        }
                      >
                        <SelectTrigger
                          className={fieldErrors.sector ? 'border-red-500' : ''}
                        >
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fintech">FinTech</SelectItem>
                          <SelectItem value="agriculture">
                            Agriculture
                          </SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="energy">Clean Energy</SelectItem>
                          <SelectItem value="logistics">Logistics</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="Tech">Tech</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.sector && (
                        <p className="text-red-500 text-sm">
                          {fieldErrors.sector.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) =>
                          handleInputChange('location', value)
                        }
                      >
                        <SelectTrigger
                          className={
                            fieldErrors.location ? 'border-red-500' : ''
                          }
                        >
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="addis-ababa">
                            Addis Ababa
                          </SelectItem>
                          <SelectItem value="bahir-dar">Bahir Dar</SelectItem>
                          <SelectItem value="mekelle">Mekelle</SelectItem>
                          <SelectItem value="hawassa">Hawassa</SelectItem>
                          <SelectItem value="dire-dawa">Dire Dawa</SelectItem>
                          <SelectItem value="adama">Adama</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.location && (
                        <p className="text-red-500 text-sm">
                          {fieldErrors.location.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage">Company stage *</Label>
                    <Select
                      value={formData.stage}
                      onValueChange={(value) =>
                        handleInputChange('stage', value)
                      }
                    >
                      <SelectTrigger
                        className={fieldErrors.stage ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="idea">Idea / pre-product</SelectItem>
                        <SelectItem value="pre-seed">Pre-seed</SelectItem>
                        <SelectItem value="seed">Seed</SelectItem>
                        <SelectItem value="series-a">Series A</SelectItem>
                        <SelectItem value="series-b-plus">Series B+</SelectItem>
                        <SelectItem value="bootstrapped">Bootstrapped</SelectItem>
                        <SelectItem value="undisclosed">Undisclosed</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.stage && (
                      <p className="text-red-500 text-sm">
                        {fieldErrors.stage.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Briefly describe what your startup does..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange('description', e.target.value)
                      }
                      required
                      className={
                        fieldErrors.description ? 'border-red-500' : ''
                      }
                    />
                    {fieldErrors.description && (
                      <p className="text-red-500 text-sm">
                        {fieldErrors.description.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Founder Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Founder Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="founderName">Full Name *</Label>
                      <Input
                        id="founderName"
                        placeholder="Meron Tadesse"
                        value={formData.founderName}
                        onChange={(e) =>
                          handleInputChange('founderName', e.target.value)
                        }
                        required
                        className={
                          fieldErrors.founderName ? 'border-red-500' : ''
                        }
                      />
                      {fieldErrors.founderName && (
                        <p className="text-red-500 text-sm">
                          {fieldErrors.founderName.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="founderRole">Role *</Label>
                      <Input
                        id="founderRole"
                        placeholder="CEO & Founder"
                        value={formData.founderRole}
                        onChange={(e) =>
                          handleInputChange('founderRole', e.target.value)
                        }
                        required
                        className={
                          fieldErrors.founderRole ? 'border-red-500' : ''
                        }
                      />
                      {fieldErrors.founderRole && (
                        <p className="text-red-500 text-sm">
                          {fieldErrors.founderRole.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pitch">Detailed Pitch *</Label>
                    <Textarea
                      id="pitch"
                      placeholder="Provide a comprehensive description of your startup..."
                      rows={6}
                      value={formData.pitch}
                      onChange={(e) =>
                        handleInputChange('pitch', e.target.value)
                      }
                      required
                      className={fieldErrors.pitch ? 'border-red-500' : ''}
                    />
                    {fieldErrors.pitch && (
                      <p className="text-red-500 text-sm">
                        {fieldErrors.pitch.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="foundedYear">Year Founded</Label>
                      <Input
                        id="foundedYear"
                        type="number"
                        placeholder="e.g., 2023"
                        value={formData.foundedYear}
                        onChange={(e) =>
                          handleInputChange('foundedYear', e.target.value)
                        }
                        className={
                          fieldErrors.foundedYear ? 'border-red-500' : ''
                        }
                      />
                      {fieldErrors.foundedYear && (
                        <p className="text-red-500 text-sm">
                          {fieldErrors.foundedYear.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employees">Number of Employees</Label>
                      <Input
                        id="employees"
                        type="number"
                        placeholder="e.g., 10"
                        value={formData.employees}
                        onChange={(e) =>
                          handleInputChange('employees', e.target.value)
                        }
                        className={
                          fieldErrors.employees ? 'border-red-500' : ''
                        }
                      />
                      {fieldErrors.employees && (
                        <p className="text-red-500 text-sm">
                          {fieldErrors.employees.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="revenue">Annual Revenue (ETB)</Label>
                    <Input
                      id="revenue"
                      type="number"
                      placeholder="e.g., 500000"
                      value={formData.revenue}
                      onChange={(e) =>
                        handleInputChange('revenue', e.target.value)
                      }
                      className={fieldErrors.revenue ? 'border-red-500' : ''}
                    />
                    {fieldErrors.revenue && (
                      <p className="text-red-500 text-sm">
                        {fieldErrors.revenue.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="achievements">Key Achievements</Label>
                    <Textarea
                      id="achievements"
                      placeholder="List milestones, awards, or key achievements..."
                      rows={3}
                      value={formData.achievements}
                      onChange={(e) =>
                        handleInputChange('achievements', e.target.value)
                      }
                      className={
                        fieldErrors.achievements ? 'border-red-500' : ''
                      }
                    />
                    {fieldErrors.achievements && (
                      <p className="text-red-500 text-sm">
                        {fieldErrors.achievements.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* upload documents */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upload Documents
                  </h3>
                  <DocumentUploader
                    type='documents'
                    onUploaded={(files) =>
                      handleInputChange('documents', files.map((file) => file.url))
                    }
                  />
                </div>

                {/* Legal Compliance */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Legal Compliance
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="startupLaw"
                        checked={formData.startupLaw}
                        onCheckedChange={(val) =>
                          handleInputChange('startupLaw', val === true)
                        }
                      />
                      <Label htmlFor="startupLaw" className="text-sm">
                        I confirm that my startup meets the requirements of
                        Ethiopia&apos;s national Startup Law *
                      </Label>
                    </div>
                    {fieldErrors.startupLaw && (
                      <p className="text-red-500 text-sm">
                        {fieldErrors.startupLaw.join(', ')}
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox id="faydaId" />
                      <Label htmlFor="faydaId" className="text-sm">
                        I have completed Fayda ID verification *
                      </Label>
                    </div>
                    {fieldErrors.faydaId && (
                      <p className="text-red-500 text-sm">
                        {fieldErrors.faydaId.join(', ')}
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.terms}
                        onCheckedChange={(val) =>
                          handleInputChange('terms', val === true)
                        }
                      />
                      <Label htmlFor="terms" className="text-sm">
                        I agree to the{' '}
                        <Link
                          href="#"
                          className="text-primary hover:text-primary/90"
                        >
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link
                          href="#"
                          className="text-primary hover:text-primary/90"
                        >
                          Privacy Policy
                        </Link>{' '}
                        *
                      </Label>
                    </div>
                    {fieldErrors.terms && (
                      <p className="text-red-500 text-sm">
                        {fieldErrors.terms.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary/100 hover:bg-primary"
                  size="lg"
                >
                  {loading ? <ClipLoader /> : 'Submit for Review'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      );
    default:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Invalid Step</CardTitle>
            <CardDescription>
              Please start from the verification step.
            </CardDescription>
          </CardHeader>
        </Card>
      );
  }
};
