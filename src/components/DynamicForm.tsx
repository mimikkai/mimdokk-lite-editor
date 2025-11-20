import React from 'react';
import { Button } from './ui/button';

interface DynamicFormProps {
  tags: string[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export function DynamicForm({ tags, values, onChange, onSubmit, isGenerating }: DynamicFormProps) {
  if (tags.length === 0) {
    return <div className="text-center text-gray-500 py-8">No variables found in this template.</div>;
  }

  // Helper to parse tag and determine input type
  const parseTag = (tag: string) => {
    const [key, defaultValue] = tag.split('|');
    const cleanKey = key.trim();
    const cleanDefault = defaultValue ? defaultValue.trim() : '';
    const isLongText = cleanDefault.length > 50; // Threshold for TextArea
    return { key: cleanKey, defaultValue: cleanDefault, isLongText, originalTag: tag };
  };

  // Deduplicate keys for the form (multiple tags might map to same key)
  const uniqueFields = Array.from(new Set(tags.map(t => t.split('|')[0].trim()))).map(key => {
    // Find the first tag that matches this key to get metadata
    const originalTag = tags.find(t => t.split('|')[0].trim() === key)!;
    return parseTag(originalTag);
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-4">Fill Template</h2>
      <div className="grid gap-4">
        {uniqueFields.map(({ key, isLongText }) => (
          <div key={key} className="flex flex-col space-y-2">
            <label htmlFor={key} className="text-sm font-medium text-gray-700">
              {key}
            </label>
            {isLongText ? (
              <textarea
                id={key}
                value={values[key] || ''}
                onChange={(e) => onChange(key, e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={`Enter value for ${key}`}
              />
            ) : (
              <input
                id={key}
                type="text"
                value={values[key] || ''}
                onChange={(e) => onChange(key, e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={`Enter value for ${key}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="pt-4 flex justify-end">
        <Button onClick={onSubmit} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Document'}
        </Button>
      </div>
    </div>
  );
}
