import React from 'react';
import StartupDetailPage from './startupById';
import Loading from '../../loading';
import { TrackView } from '@/components/analytics/track-view';

interface StartupPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: StartupPageProps) {
  const raw = await params;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';

  if (!id) {
    return <Loading />;
  }

  return (
    <>
      <TrackView startupId={id} />
      <StartupDetailPage id={id} />
    </>
  );
}
