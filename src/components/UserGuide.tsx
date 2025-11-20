import React from 'react';

export function UserGuide() {
  return (
    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-sm text-blue-900 space-y-4">
      <h3 className="font-semibold text-lg text-blue-800">How to create a template</h3>
      <p>
        Create a standard Word document (.docx) and use the following syntax to define variables:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-2">
        <li>
          <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-700">&#123;VAR&#125;</code>
          <span className="ml-2">- Simple variable. Creates a text input.</span>
        </li>
        <li>
          <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-700">&#123;VAR|Default Value&#125;</code>
          <span className="ml-2">- Variable with default value.</span>
        </li>
      </ul>
      <p className="text-xs text-blue-700 mt-2">
        <strong>Tip:</strong> If your default value is long (more than 50 characters), the editor will automatically provide a larger text area for input.
      </p>
    </div>
  );
}
