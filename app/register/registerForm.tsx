'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignUpInput, SignUpSchema } from '@/zod-validator/validator';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      role: 'user',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (SignUpData: SignUpInput) => {
    try {
      await authClient.signUp.email(
        {
          name: SignUpData.name,
          email: SignUpData.email,
          password: SignUpData.password,
          role: SignUpData.role,
          callbackURL: '/dashboard',
        },
        {
          onRequest: () => {
            //show loading
            setIsLoading(true);
          },
          onSuccess: (ctx) => {
            //redirect to the dashboard or sign in page
            console.log(ctx.data);

            router.push('/');
          },
          onError: (ctx) => {
      
            // display the error message
            alert(ctx.error.message);
          },
        }
      );
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center space-x-2">
            <span className="text-xl font-semibold text-gray-900">
            <span className="text-primary">Green</span> Circle
          </span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create Account
            </CardTitle>
            <CardDescription>
              Join Ethiopia&apos;s startup ecosystem and discover real
              opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="name"
                  placeholder="Abebe"
                  {...register('name')}
                  required
                />
                {errors.name && (
                  <p className="text-red-500 font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="abebe@example.com"
                  {...register('email')}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  required
                />
                {errors.password && (
                  <p className="text-red-500 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>I am a...</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setValue('role', value as 'user' | 'startup' | 'investor')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Ecosystem Member (Browse & Discover)</SelectItem>
                    <SelectItem value="startup">Startup Founder (List my company)</SelectItem>
                    <SelectItem value="investor">Investor (Access deal flow)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-red-500 font-medium">{errors.role.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms" className="text-sm text-gray-800">
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
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary/100 hover:bg-primary"
              >
                {isLoading ? 'Signing up...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-800">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:text-primary/90"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
