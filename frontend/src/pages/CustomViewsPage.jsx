import React from 'react';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import QualityGauge from '../components/QualityGauge';
import BulkImageUpload from '../components/BulkImageUpload';
import PresetEditor from '../components/PresetEditor';

export default function CustomViewsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Photo Views</h1>
        <p className="text-slate-400 text-sm">
          Visual comparison tools, quality scoring, batch upload, and preset management
          for the AI product photo enhancer.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BeforeAfterSlider />
        <QualityGauge />
      </div>

      <BulkImageUpload />
      <PresetEditor />
    </div>
  );
}
