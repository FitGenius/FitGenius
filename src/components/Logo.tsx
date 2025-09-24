import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hexágono de fundo transparente com borda dourada */}
      <path
        d="M50 5 L85 27.5 L85 72.5 L50 95 L15 72.5 L15 27.5 Z"
        fill="transparent"
        stroke="#FFD700"
        strokeWidth="3"
      />

      {/* Letra F estilizada */}
      <path
        d="M30 30 L30 70 M30 30 L55 30 M30 50 L50 50"
        stroke="#FFD700"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Letra G estilizada */}
      <path
        d="M70 35 Q60 35 60 45 L60 55 Q60 65 70 65 Q75 65 75 60 L75 52 L68 52"
        stroke="#FFD700"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Detalhe de energia/fitness */}
      <circle cx="50" cy="85" r="3" fill="#FFD700" />
      <circle cx="42" cy="85" r="2" fill="#FFD700" opacity="0.7" />
      <circle cx="58" cy="85" r="2" fill="#FFD700" opacity="0.7" />
    </svg>
  );
}

export function LogoWithText({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={40} />
      <span className="text-2xl font-bold bg-gradient-to-r from-gold to-gold/60 bg-clip-text text-transparent">
        FitGenius
      </span>
    </div>
  );
}