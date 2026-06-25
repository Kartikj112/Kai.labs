import './engine.css';
import type { ReactNode } from 'react';
import { EngineHeader } from '@/components/sections/DecisionEngine/EngineHeader';

export default function EngineLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EngineHeader />
      {children}
    </>
  );
}
