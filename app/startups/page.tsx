import React, { Suspense } from 'react';
import StartupsForm from './startup-form';

export default function StartupPage() {
  return (
    <Suspense fallback={null}>
      <StartupsForm />
    </Suspense>
  );
}
