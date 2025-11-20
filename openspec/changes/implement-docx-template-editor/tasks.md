# Tasks

## Infrastructure & Setup
- [ ] Install `mimdokk` and `idb` dependencies.
- [ ] Configure Vite for Web Worker support (if extra config needed).
- [ ] Create `src/workers/mimdokk.worker.ts` skeleton.
- [ ] Create `src/lib/worker-client.ts` wrapper for Promise-based worker communication.

## Template Parsing
- [ ] Implement `parse` message handler in worker using `mimdokk`.
- [ ] Create `TemplateUploader` UI component.
- [ ] Connect Uploader to Worker to retrieve tags on file drop.
- [ ] Define TypeScript interfaces for `ParsedTag` and `TemplateSchema`.

## Form Generation
- [ ] Create `DynamicForm` component.
- [ ] Implement rendering logic for text inputs based on tags.
- [ ] Add support for basic validation (required fields).
- [ ] Add "Clear Form" functionality.

## Document Generation
- [ ] Implement `generate` message handler in worker using `mimdokk`.
- [ ] Add "Generate Document" button to UI.
- [ ] Handle Blob response and trigger file download.
- [ ] Add loading states/spinners during generation.

## Session Management
- [ ] Set up IndexedDB database and stores (`templates`, `sessions`).
- [ ] Implement "Save Template" functionality (store parsed tags and file).
- [ ] Implement "Save Session" functionality (store form data).
- [ ] Create `SessionList` sidebar/drawer to load previous sessions.
- [ ] Implement auto-save debounce for form inputs.

## UI/UX Polish
- [ ] Style components using existing UI library (shadcn/ui or similar if present).
- [ ] Add error handling for invalid docx files.
- [ ] Add success notifications for save/download actions.
