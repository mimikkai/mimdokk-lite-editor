import React, { useCallback } from 'react';
import { Button } from './ui/button';

interface TemplateUploaderProps {
  onUpload: (file: File, buffer: ArrayBuffer) => void;
}

export function TemplateUploader({ onUpload }: TemplateUploaderProps) {
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    onUpload(file, buffer);
  }, [onUpload]);

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="text-center space-y-4">
        <div className="text-xl font-semibold text-gray-700">Upload Template</div>
        <p className="text-sm text-gray-500">Select a .docx file with variables (e.g. &#123;NAME&#125;)</p>
        <div className="relative">
          <input
            type="file"
            accept=".docx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button variant="default">Choose File</Button>
        </div>
      </div>
    </div>
  );
}
