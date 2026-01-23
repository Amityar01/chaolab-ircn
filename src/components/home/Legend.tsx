'use client';

// ============================================
// LEGEND COMPONENT
// ============================================
// Explains the visualization elements

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CONFIG } from '@/components/predictive/config';

export function Legend() {
  const { language } = useLanguage();

  const items = [
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path
            d="M8 2 L14 8 L14 14 L2 14 L2 8 Z"
            fill={CONFIG.COLORS.fovFill}
            stroke={CONFIG.COLORS.fovStroke}
            strokeWidth="1"
          />
        </svg>
      ),
      label: language === 'ja' ? '注意' : 'attention',
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="4" y="4" width="4" height="4" fill={CONFIG.COLORS.edgeCell} rx="1" />
          <rect x="9" y="9" width="4" height="4" fill={CONFIG.COLORS.edgeCell} rx="1" opacity="0.6" />
        </svg>
      ),
      label: language === 'ja' ? '感知' : 'sensing',
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect
            x="2"
            y="2"
            width="12"
            height="12"
            fill="none"
            stroke={CONFIG.COLORS.memoryActive}
            strokeWidth="2"
            rx="2"
          />
        </svg>
      ),
      label: language === 'ja' ? '知覚' : 'seeing',
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect
            x="2"
            y="2"
            width="12"
            height="12"
            fill="none"
            stroke={CONFIG.COLORS.memoryFading}
            strokeWidth="1.5"
            strokeDasharray="3 2"
            rx="2"
            opacity="0.6"
          />
        </svg>
      ),
      label: language === 'ja' ? '記憶' : 'memory',
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" fill={CONFIG.COLORS.surprise} />
          <text x="8" y="11" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">!</text>
        </svg>
      ),
      label: language === 'ja' ? '驚き' : 'surprise',
    },
  ];

  return (
    <div className="legend">
      {items.map((item, index) => (
        <div key={index} className="legend-item">
          <span className="legend-icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default Legend;
