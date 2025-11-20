# Design: Client-Side Docx Template Editor

## Architecture
The application follows a client-side SPA architecture using React and Vite. Heavy computational tasks (parsing and generation) are offloaded to a Web Worker to prevent blocking the main thread.

### High-Level Components
1.  **Main Thread (UI Layer):**
    *   **App Container:** Manages global state and routing (if needed).
    *   **TemplateUploader:** Component for file selection and drag-and-drop.
    *   **DynamicForm:** Component that renders inputs based on parsed schema.
    *   **SessionList:** Displays saved sessions from IndexedDB.
    *   **Preview/Download:** Handles the result of the generation process.

2.  **Background Thread (Worker Layer):**
    *   **MimdokkWorker:** Wraps the `mimdokk` library. Handles:
        *   `parse(fileBuffer)`: Returns list of tags.
        *   `generate(fileBuffer, data)`: Returns filled document blob.

3.  **Storage Layer:**
    *   **IndexedDB:** Stores:
        *   Templates (metadata and potentially file content if small enough, or references).
        *   Sessions (filled data, timestamp, template reference).

## Data Flow
1.  **Upload:** User selects `.docx` -> File read as ArrayBuffer -> Sent to Worker.
2.  **Parse:** Worker calls `mimdokk` -> Extracts tags (e.g., `{NAME}`) -> Returns JSON schema to UI.
3.  **Input:** UI renders form based on JSON schema -> User inputs data.
4.  **Save (Auto/Manual):** Form data saved to IndexedDB as a "Session".
5.  **Generate:** User clicks "Generate" -> Template Buffer + Form Data sent to Worker -> Worker generates `.docx` -> Returns Blob -> UI triggers download.

## Technical Decisions

### `mimdokk` Integration
*   The library will be imported into a Web Worker.
*   If `mimdokk` is WASM-based, the worker will handle WASM instantiation.
*   Communication via `postMessage` with a Promise-based wrapper on the main thread for cleaner `async/await` usage.

### State Management
*   Local component state for form inputs.
*   `Context` or a lightweight store (like `zustand`) for sharing worker status and current session data.

### Storage
*   `idb` (or similar wrapper) for easier IndexedDB usage.
*   Schema:
    *   `templates`: `{ id, name, content (Blob), parsedTags, createdAt }`
    *   `sessions`: `{ id, templateId, formData, updatedAt }`

## Security & Privacy
*   All processing is local. No data is sent to any server.
*   Content Security Policy (CSP) should allow worker scripts and blob URLs.
