import React from 'react';
import { Button } from './ui/button';

interface TemplateUploaderProps {
  onUpload: (file: File, buffer: ArrayBuffer) => void;
  onLoadExample: () => void;
}

export function TemplateUploader({ onUpload, onLoadExample }: TemplateUploaderProps) {
  const handleFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    onUpload(file, buffer);
  }, [onUpload]);

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors space-y-6">
      <div className="text-center space-y-4">
        <div className="text-xl font-semibold text-gray-700">Upload Template</div>
        <p className="text-sm text-gray-500">Select a .docx file with variables (e.g. &#123;NAME&#125;)</p>
        <div className="relative inline-block">
          <input
            type="file"
            accept=".docx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button variant="default">Choose File</Button>
        </div>
      </div>
      
      <div className="flex items-center w-full max-w-xs">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button variant="outline" onClick={onLoadExample}>
          Load Example Template
        </Button>
        <a 
          href="/examples/contact-info/example.docx" 
          download
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Download example.docx
        </a>
      </div>
    </div>
  );
}
