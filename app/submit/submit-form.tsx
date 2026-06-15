'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { z } from 'zod';

import { MainSection } from './main-section';
import { faydaSchema, StartupZodSchema } from '@/zod-validator/validator';

export interface FormData {
  startupName: string;
  website: string;
  sector: string;
  location: string;
  description: string;
  founderName: string;
  founderRole: string;
  pitch: string;
  startupLaw: boolean;
  faydaId: boolean;
  terms: boolean;

  // 
  // video: string
  documents: string[];

  foundedYear: string;
  /** Company stage — see `STARTUP_STAGES` in `lib/startup-stage.ts`. */
  stage: string;
  employees: string;
  revenue: string;
  achievements: string;
  founderPhone: string;
  founderBio: string;
}

const steps = [
  {
    step: 1,
    title: 'Verification',
    desc: 'Fayda ID verification',
    path: '/submit/verify',
  },
  {
    step: 2,
    title: 'Submit Startup',
    desc: 'Provide startup details',
    path: '/submit/startup-info',
  },
];

export default function SubmitStartupForm({ verified }: { verified: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  const currentStep = steps.findIndex((s) => s.path === pathname) + 1 || 1;

  const [formData, setFormData] = useState<FormData>({
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

  // useEffect(() => {
  //   // Redirect to first step if pathname is invalid
  //   if (!steps.some((s) => s.path === pathname)) {
  //     router.replace(steps[0].path);
  //   }
  // }, [pathname, router]);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    try {
      switch (currentStep) {
        case 1:
          faydaSchema.parse(formData);
          return true;
        case 2:
          StartupZodSchema.parse(formData);
          return true;
        default:
          return false;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        console.log(fieldErrors); // You can store/display these if needed
      }
      return false;
    }
  };

  const handleNext = async () => {
    if (isStepValid() && currentStep < steps.length) {
      router.push(steps[currentStep].path);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="submit" />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            Submit Your Startup
          </h1>
          <p className="mx-auto max-w-2xl text-gray-800">
            Join Ethiopia&apos;s startup ecosystem on Green Circle. Submissions
            use Fayda identity sign-in and go through review under the national
            Startup Law.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {currentStep >= 1 && currentStep <= steps.length ? (
              <MainSection
                step={currentStep}
                formData={formData}
                handleInputChange={handleInputChange}
                handleNext={handleNext}
                isStepValid={isStepValid()}
                setFormData={setFormData}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Loading...</CardTitle>
                  <CardDescription>
                    Redirecting to the correct step.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((item, index) => {
                  const isStepCompleted =
                    index + 1 < currentStep ||
                    (index + 1 === currentStep && isStepValid());
                  const isStepAccessible =
                    index + 1 <= currentStep ||
                    (index + 1 === currentStep + 1 && isStepValid());
                  return (
                    <Link
                      key={item.step}
                      href={isStepAccessible ? item.path : '#'}
                      className={`flex items-start space-x-3 ${
                        !isStepAccessible
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }`}
                      title={
                        !isStepAccessible
                          ? `Complete Step ${currentStep} to unlock`
                          : ''
                      }
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                          index + 1 === currentStep
                            ? 'bg-primary/100'
                            : isStepCompleted
                            ? 'bg-emerald-300'
                            : 'bg-gray-300'
                        }`}
                      >
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-800">{item.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    'Ethiopian-based startup',
                    'Fayda ID verification',
                    'Startup Law compliance',
                    'Innovative business model',
                    'Growth potential',
                  ].map((req, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-primary/100"></div>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
