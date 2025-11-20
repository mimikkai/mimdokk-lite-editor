import React from 'react';
import { Button } from './ui/button';

interface SessionListProps {
  sessions: any[];
  onSelectSession: (session: any) => void;
  onNewSession: () => void;
}

export function SessionList({ sessions, onSelectSession, onNewSession }: SessionListProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Saved Sessions</h3>
        <Button variant="outline" size="sm" onClick={onNewSession}>New Fill</Button>
      </div>
      
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">No saved sessions yet.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <button
                onClick={() => onSelectSession(session)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 flex justify-between items-center group"
              >
                <span className="font-medium text-gray-700">
                  {new Date(session.updatedAt).toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 group-hover:text-gray-600">
                  Load
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
