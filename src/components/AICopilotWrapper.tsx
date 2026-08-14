'use client';

import dynamic from 'next/dynamic';

// Dynamically load the Copilot on the client side only to prevent SSR mismatches
const StudentAICopilot = dynamic(() => import('./StudentAICopilot'), {
  ssr: false,
});

export default function AICopilotWrapper() {
  return <StudentAICopilot />;
}