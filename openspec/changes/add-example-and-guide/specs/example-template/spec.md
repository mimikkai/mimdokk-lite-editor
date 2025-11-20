# Specification: Example Template

## ADDED Requirements

### Requirement: Load Built-in Example
The system must provide a way for the user to load a sample template without uploading a file.

#### Scenario: User clicks "Load Example"
- **Given** the user is on the main screen
- **When** the user clicks the "Load Example" button
- **Then** the system fetches the `example.docx` file.
- **And** processes it exactly as if the user had uploaded it (parsing tags, generating form).
- **And** the filename is set to "example.docx".
