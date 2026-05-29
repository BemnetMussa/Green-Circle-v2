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
import { LoginInput, LoginSchema } from '@/zod-validator/validator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (Logindata: LoginInput) => {
    console.log('this is login data', Logindata);

    try {
      await authClient.signIn.email(
        {
          email: Logindata.email,
          password: Logindata.password,
        },
        {
          onRequest: () => {
            //show loading
            setIsLoading(true);
          },
          onSuccess: (ctx) => {
            console.log(ctx.data);

            router.push(callbackUrl || '/');
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
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
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
              Welcome Back
            </CardTitle>
            <CardDescription>
              Sign in to your account to access the startup directory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm text-gray-800">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="#"
                  className="text-sm text-primary hover:text-primary/90"
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary/100 hover:bg-primary"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-sm text-gray-800">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-medium text-primary hover:text-primary/90"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
