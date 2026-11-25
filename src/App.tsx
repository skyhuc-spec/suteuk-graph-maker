import React, { useState, useEffect } from 'react';
import { StatDataset, AppSettings, StyleConfig } from './types';
import { SAMPLE_DATASETS } from './data/sampleData';
import { DEFAULT_STYLE_CONFIG } from './data/presetTemplates';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { InputSection } from './components/InputSection';
import { DataGridSection } from './components/DataGridSection';
import { ChartStudio } from './components/ChartStudio';
import { MapStudio } from './components/MapStudio';
import { ExamQuestionStudio } from './components/ExamQuestionStudio';

export default function App() {
  // App Settings in localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('stat_studio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.modelName || parsed.modelName.includes('2.5')) {
          parsed.modelName = 'gemini-4-hydrogen';
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return {
      apiKey: '',
      modelName: 'gemini-4-hydrogen',
      theme: 'bright',
      bwPatternMode: false,
      showDataLabels: true,
      showPercentages: false,
    };
  });

  // Current Statistical Dataset (default to sample #1 for instant classroom preview)
  const [dataset, setDataset] = useState<StatDataset | null>(() => SAMPLE_DATASETS[0]);

  // Style Configuration (Typography, Palettes, HWP Canvas Presets)
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(() => DEFAULT_STYLE_CONFIG);

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<'input' | 'grid' | 'chart' | 'map' | 'exam'>('grid');

  // Settings Modal Open State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Save settings when changed
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('stat_studio_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }
  };

  // Switch tab on dataset loaded
  const handleDatasetLoaded = (newDataset: StatDataset) => {
    setDataset(newDataset);
    setActiveTab('grid');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasData={!!dataset}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'input' && (
          <InputSection
            onDatasetLoaded={handleDatasetLoaded}
            settings={settings}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'grid' && (
          <DataGridSection
            dataset={dataset}
            onUpdateDataset={setDataset}
            onGoToChart={() => setActiveTab('chart')}
          />
        )}

        {activeTab === 'chart' && (
          <ChartStudio
            dataset={dataset}
            settings={settings}
            styleConfig={styleConfig}
            onUpdateStyleConfig={setStyleConfig}
            onUpdateDataset={setDataset}
          />
        )}

        {activeTab === 'map' && (
          <MapStudio
            dataset={dataset}
            settings={settings}
            styleConfig={styleConfig}
            onUpdateStyleConfig={setStyleConfig}
          />
        )}

        {activeTab === 'exam' && (
          <ExamQuestionStudio
            dataset={dataset}
            settings={settings}
            styleConfig={styleConfig}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
