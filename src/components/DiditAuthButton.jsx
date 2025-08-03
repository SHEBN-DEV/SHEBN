'use client';

import React from 'react';
import { DiditButton } from './DiditButton';

export function DiditAuthButton({ variant = 'login' }) {
  return (
    <div className="w-full">
      <DiditButton variant={variant} />
    </div>
  );
} 