import React from 'react';
import AIReport from './AIReport';

// Native feature detail views share the structured report renderer with the
// workspace's returned result and saved history views.
export default function AIResultDisplay({ data, title = 'AI Analysis Results' }) {
  return <AIReport response={data} title={title} />;
}
