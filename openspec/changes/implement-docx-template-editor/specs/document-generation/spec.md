# Specification: Document Generation

## ADDED Requirements

### Requirement: Generate Filled DOCX
The system must produce a new `.docx` file where placeholders are replaced by user-provided values.

#### Scenario: Successful generation
- **Given** a template with `{NAME}` and input data `{ NAME: "Alice" }`
- **When** the generation process is triggered
- **Then** a new `.docx` file is created.
- **And** the text `{NAME}` in the document is replaced with "Alice".
- **And** the file is prompted for download.

### Requirement: Asynchronous Processing
The generation process must not block the main UI thread.

#### Scenario: Large document generation
- **Given** a large template file
- **When** generation is in progress
- **Then** the UI remains responsive (e.g., loading spinner animates).
- **And** the user can still interact with other parts of the app (optional, but UI shouldn't freeze).
