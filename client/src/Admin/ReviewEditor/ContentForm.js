// components/ReviewEditor/ContentForm.js
import React from 'react';
import RichTextEditor from './RichTextEditor.js';

const ContentForm = ({ content, onChange }) => {
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      placeholder: 'Provide an engaging introduction to the vehicle...'
    },
    {
      id: 'exterior',
      title: 'Exterior Design',
      placeholder: 'Describe the vehicle\'s exterior design and features...'
    },
    {
      id: 'interior',
      title: 'Interior & Comfort',
      placeholder: 'Detail the interior design, quality, and comfort features...'
    },
    {
      id: 'performance',
      title: 'Performance & Powertrain',
      placeholder: 'Analyze the vehicle\'s performance capabilities...'
    },
    {
      id: 'handling',
      title: 'Handling & Dynamics',
      placeholder: 'Discuss driving dynamics and handling characteristics...'
    },
    {
      id: 'technology',
      title: 'Technology & Features',
      placeholder: 'Cover infotainment, connectivity, and tech features...'
    },
    {
      id: 'safety',
      title: 'Safety & Driver Assistance',
      placeholder: 'Detail safety features and driver assistance systems...'
    },
    {
      id: 'value',
      title: 'Value & Competition',
      placeholder: 'Discuss pricing, value proposition, and competitors...'
    },
    {
      id: 'verdict',
      title: 'Verdict',
      placeholder: 'Provide your final thoughts and verdict...'
    }
  ];

  return (
    <div className="content-form">
      {sections.map(section => (
        <div key={section.id} className="content-section">
          <h4>{section.title}</h4>
          <RichTextEditor
            value={content[section.id]}
            onChange={(value) => onChange(section.id, value)}
            placeholder={section.placeholder}
          />
        </div>
      ))}
    </div>
  );
};

export default ContentForm;