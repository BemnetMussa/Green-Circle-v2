import React from 'react';
import StartupDetailPage from './startupById';
import Loading from '../../loading';

interface StartupPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: StartupPageProps) {
  const raw = await params;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';

  if (!id) {
    return <Loading />;
  }

  return <StartupDetailPage id={id} />;
}
