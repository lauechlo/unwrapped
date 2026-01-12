'use client';

import { ReactNode } from 'react';

export type TabId = 'overview' | 'patterns' | 'when' | 'persona';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  badge?: number;
}

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  tabs: Tab[];
}

export default function TabNavigation({ activeTab, onTabChange, tabs }: TabNavigationProps) {
  return (
    <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-zinc-700">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex gap-2 overflow-x-auto scrollbar-hide py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm
                whitespace-nowrap transition-all duration-200
                ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-zinc-800/50 text-gray-400 hover:bg-zinc-700 hover:text-gray-200'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-500/20 text-purple-300'
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
