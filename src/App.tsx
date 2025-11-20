import { useState, useCallback, useEffect } from 'react';
import { TemplateUploader } from './components/TemplateUploader';
import { DynamicForm } from './components/DynamicForm';
import { SessionList } from './components/SessionList';
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
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleUpload = useCallback(async (file: File, buffer: ArrayBuffer) => {
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

  const handleFormChange = useCallback((key: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: value };
      return newData;
    });
  }, []);

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
  }, []);

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
      a.download = `filled_${fileName}`;
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
        <div className="lg:col-span-1">
          <SessionList 
            sessions={sessions} 
            onSelectSession={handleSelectSession} 
            onNewSession={handleNewSession} 
          />
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
            <TemplateUploader onUpload={handleUpload} />
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
