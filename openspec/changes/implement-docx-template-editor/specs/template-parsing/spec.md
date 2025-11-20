# Specification: Template Parsing

## ADDED Requirements

### Requirement: Extract Tags from DOCX
The system must be able to read a `.docx` file and extract all variable placeholders defined in the `mimdokk` format (e.g., `{VARIABLE}`).

#### Scenario: User uploads a valid template
- **Given** a `.docx` file containing text "Hello {NAME}, welcome to {CITY}."
- **When** the user uploads this file
- **Then** the system identifies `NAME` and `CITY` as variables.
- **And** returns a list of these variables to the UI.

#### Scenario: User uploads a file with no tags
- **Given** a `.docx` file with plain text only
- **When** the user uploads this file
- **Then** the system returns an empty list of variables.
- **And** displays a message indicating no tags were found.

#### Scenario: User uploads an invalid file
- **Given** a non-docx file or corrupted file
- **When** the user uploads this file
- **Then** the system catches the error.
- **And** displays an error message "Invalid file format".
