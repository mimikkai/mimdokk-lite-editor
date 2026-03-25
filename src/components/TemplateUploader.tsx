import React, { useState } from 'react';
import { Button } from './ui/button';

interface TemplateUploaderProps {
  onUpload: (file: File, buffer: ArrayBuffer, sourceUrl?: string) => void;
  onLoadExample: () => void;
}

export function TemplateUploader({ onUpload, onLoadExample }: TemplateUploaderProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    onUpload(file, buffer);
  }, [onUpload]);

  const handleLoadFromUrl = React.useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;

    console.info('[TemplateUploader] loading template from URL:', url);
    setIsLoadingUrl(true);
    setUrlError(null);

    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const rawSegment = url.split('/').pop()?.split('?')[0] ?? '';
      const decoded = decodeURIComponent(rawSegment);
      const fileName = decoded.split('/').pop() || 'template.docx';
      const file = new File([blob], fileName, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      console.info('[TemplateUploader] loaded template from URL, size=', buffer.byteLength);
      onUpload(file, buffer, url);
    } catch (err) {
      console.error('[TemplateUploader] failed to load URL:', err);
      setUrlError(`Failed to load template: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoadingUrl(false);
    }
  }, [urlInput, onUpload]);

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

      <div className="w-full max-w-sm space-y-2">
        <div className="text-sm font-medium text-gray-600 text-center">Load from URL</div>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadFromUrl()}
            placeholder="https://example.com/template.docx"
            className="flex-1 h-9 rounded-md border border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button
            variant="outline"
            onClick={handleLoadFromUrl}
            disabled={isLoadingUrl || !urlInput.trim()}
          >
            {isLoadingUrl ? 'Loading...' : 'Load'}
          </Button>
        </div>
        {urlError && (
          <p className="text-xs text-red-600">{urlError}</p>
        )}
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
          href={`${import.meta.env.BASE_URL}examples/contact-info/example.docx`}
          download
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Download example.docx
        </a>
      </div>
    </div>
  );
}
