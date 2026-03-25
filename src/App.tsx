import { useState, useCallback, useEffect, useMemo } from 'react';
import { TemplateUploader } from './components/TemplateUploader';
import { DynamicForm } from './components/DynamicForm';
import { SessionList } from './components/SessionList';
import { UserGuide } from './components/UserGuide';
import { mimdokkClient } from './lib/worker-client';
import { saveTemplate, saveSession, getAllSessions, getTemplate } from './lib/db';

interface Session {
  id: number;
  templateId: number;
  formData: Record<string, string>;
  updatedAt: Date;
}

function App() {
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [outputFileName, setOutputFileName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [serverTemplateId, setServerTemplateId] = useState<string | null>(null);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Session Management
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const loadSessions = useCallback(async () => {
    const allSessions = await getAllSessions();
    // Sort by updatedAt desc
    allSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    setSessions(allSessions as unknown as Session[]);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Auto-load template from URL params on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('_template_id');
    const tmplUrl = params.get('_template_url');
    if (!templateId && !tmplUrl) return;

    const presetData: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      if (!key.startsWith('_')) presetData[key] = value;
    }
    const presetFilename = params.get('_filename') ?? '';

    const autoLoad = async () => {
      try {
        setError(null);
        if (templateId) {
          console.info('[App] auto-loading template from server id=', templateId);
          const res = await fetch(`/api/templates/${templateId}`);
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          const { name, data } = await res.json();
          const binary = atob(data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const buffer = bytes.buffer;
          const file = new File([buffer], name, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          await handleUpload(file, buffer);
          setServerTemplateId(templateId);
        } else if (tmplUrl) {
          console.info('[App] auto-loading template from URL=', tmplUrl);
          const proxyRes = await fetch(`/api/proxy?url=${encodeURIComponent(tmplUrl)}`);
          if (!proxyRes.ok) throw new Error(`Proxy returned ${proxyRes.status}`);
          const blob = await proxyRes.blob();
          const buffer = await blob.arrayBuffer();
          const rawSegment = tmplUrl.split('/').pop()?.split('?')[0] ?? '';
          const decoded = decodeURIComponent(rawSegment);
          const fileName = decoded.split('/').pop() || 'template.docx';
          const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          await handleUpload(file, buffer, tmplUrl);
        }
        if (Object.keys(presetData).length > 0) setFormData(presetData);
        if (presetFilename) setOutputFileName(presetFilename);
      } catch (err) {
        console.error('[App] auto-load failed:', err);
        setError('Failed to auto-load template from URL parameters.');
      }
    };
    autoLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = useCallback(async (file: File, buffer: ArrayBuffer, sourceUrl?: string) => {
    try {
      setError(null);
      const extractedTags = await mimdokkClient.parseTemplate(buffer);

      // Save template to DB
      const templateId = await saveTemplate(file.name, buffer, extractedTags);

      setTemplateBuffer(buffer);
      setFileName(file.name);
      setTags(extractedTags);
      setCurrentTemplateId(templateId);
      setCurrentSessionId(null); // New session
      setServerTemplateId(null); // Reset server cache on new template
      setTemplateUrl(sourceUrl ?? null);
      setOutputFileName(`filled_${file.name}`);
      
      // Initialize form data
      const initialData = extractedTags.reduce((acc, tag) => {
        const [key, defaultValue] = tag.split('|');
        return { ...acc, [key.trim()]: defaultValue ? defaultValue.trim() : '' };
      }, {});
      setFormData(initialData);
    } catch (err) {
      console.error(err);
      setError('Failed to parse template. Please ensure it is a valid .docx file.');
    }
  }, []);

  const handleLoadExample = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}examples/contact-info/example.docx`);
      if (!response.ok) throw new Error('Failed to fetch example template');
      
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const file = new File([blob], 'example.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      await handleUpload(file, buffer);
    } catch (err) {
      console.error(err);
      setError('Failed to load example template.');
    }
  }, [handleUpload]);

  const handleFormChange = useCallback((key: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: value };
      return newData;
    });
  }, []);

  // Sync form state to URL params
  useEffect(() => {
    if (!templateBuffer) {
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(formData)) {
      if (value) params.set(key, value);
    }
    if (outputFileName) params.set('_filename', outputFileName);
    if (serverTemplateId) params.set('_template_id', serverTemplateId);
    else if (templateUrl) params.set('_template_url', templateUrl);
    const search = params.toString();
    window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
  }, [formData, outputFileName, serverTemplateId, templateUrl, templateBuffer]);

  // Auto-save effect
  useEffect(() => {
    if (!currentTemplateId || Object.keys(formData).length === 0) return;

    const timeoutId = setTimeout(async () => {
      const sessionId = await saveSession(currentTemplateId, formData, currentSessionId || undefined);
      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
        loadSessions(); // Refresh list on new session creation
      }
    }, 1000); // Debounce 1s

    return () => clearTimeout(timeoutId);
  }, [formData, currentTemplateId, currentSessionId, loadSessions]);

  const handleSelectSession = useCallback(async (session: Session) => {
    try {
      const template = await getTemplate(session.templateId);
      if (!template) {
        setError('Template for this session not found.');
        return;
      }

      setTemplateBuffer(template.buffer);
      setFileName(template.name);
      setTags(template.tags);
      setFormData(session.formData);
      setCurrentTemplateId(session.templateId);
      setCurrentSessionId(session.id);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load session.');
    }
  }, []);

  const handleNewSession = useCallback(() => {
    setTemplateBuffer(null);
    setFileName('');
    setTags([]);
    setFormData({});
    setCurrentTemplateId(null);
    setCurrentSessionId(null);
    setServerTemplateId(null);
    setTemplateUrl(null);
    setOutputFileName('');
  }, []);

  const uiLink = useMemo(() => {
    if (!templateBuffer) return null;
    if (!serverTemplateId && !templateUrl) return null;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(formData)) {
      if (value) params.set(key, value);
    }
    if (outputFileName) params.set('_filename', outputFileName);
    if (serverTemplateId) params.set('_template_id', serverTemplateId);
    else if (templateUrl) params.set('_template_url', templateUrl);
    const search = params.toString();
    return `${window.location.origin}${window.location.pathname}${search ? '?' + search : ''}`;
  }, [templateBuffer, serverTemplateId, templateUrl, formData, outputFileName]);

  const generatedLink = useMemo(() => {
    if (!serverTemplateId) return null;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(formData)) {
      if (value) params.set(key, value);
    }
    if (outputFileName) params.set('_filename', outputFileName);
    return `${window.location.origin}/api/generate/${serverTemplateId}?${params}`;
  }, [serverTemplateId, formData, outputFileName]);

  const handleCopyLink = useCallback(async () => {
    if (!templateBuffer) return;

    try {
      setIsCopyingLink(true);
      setError(null);

      let templateId = serverTemplateId;

      if (!templateId) {
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(templateBuffer))
        );
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fileName, data: base64 }),
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const body = await res.json();
        templateId = body.id as string;
        setServerTemplateId(templateId);
      }

      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(formData)) {
        if (value) params.set(key, value);
      }
      if (outputFileName) params.set('_filename', outputFileName);

      const link = `${window.location.origin}/api/generate/${templateId}?${params}`;

      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1000);
    } catch (err) {
      console.error(err);
      setError('Failed to copy link. Make sure the backend server is running.');
    } finally {
      setIsCopyingLink(false);
    }
  }, [templateBuffer, fileName, formData, serverTemplateId]);

  const handleGenerate = useCallback(async () => {
    if (!templateBuffer) return;

    try {
      setIsGenerating(true);
      setError(null);
      const result = await mimdokkClient.generateDocument(templateBuffer, formData);
      
      const blob = new Blob([result as unknown as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName || `filled_${fileName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Failed to generate document.');
    } finally {
      setIsGenerating(false);
    }
  }, [templateBuffer, formData, fileName]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar / Session List */}
        <div className="lg:col-span-1 space-y-6">
          <SessionList 
            sessions={sessions} 
            onSelectSession={handleSelectSession} 
            onNewSession={handleNewSession} 
          />
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-xs text-yellow-800">
            <p className="font-semibold mb-1">Privacy & Data</p>
            <p>
              Documents are generated locally in your browser. Saved sessions are stored in local storage only.
            </p>
            <p className="mt-2">
              <strong>Copy Link</strong> uploads the template to the local server to generate a shareable URL. No data leaves your machine.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-gray-900">Docx Template Editor</h1>
            <p className="mt-2 text-gray-600">Upload a template, fill the form, and download your document.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {!templateBuffer ? (
            <div className="space-y-8">
              <TemplateUploader onUpload={handleUpload} onLoadExample={handleLoadExample} />
              <UserGuide />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                <span className="font-medium text-gray-700">Current Template: {fileName}</span>
                <button 
                  onClick={handleNewSession}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change Template
                </button>
              </div>
              
              <DynamicForm
                tags={tags}
                values={formData}
                onChange={handleFormChange}
                onSubmit={handleGenerate}
                isGenerating={isGenerating}
                onCopyLink={handleCopyLink}
                isCopyingLink={isCopyingLink}
                linkCopied={linkCopied}
                outputFileName={outputFileName}
                onOutputFileNameChange={setOutputFileName}
                uiLink={uiLink}
                generatedLink={generatedLink}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
