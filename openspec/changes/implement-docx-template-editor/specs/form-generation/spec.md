# Specification: Form Generation

## ADDED Requirements

### Requirement: Dynamic Input Rendering
The system must render an input field for each unique variable extracted from the template.

#### Scenario: Rendering text inputs
- **Given** a list of variables `['FIRST_NAME', 'LAST_NAME']`
- **When** the form is generated
- **Then** two text input fields are displayed.
- **And** the labels correspond to `FIRST_NAME` and `LAST_NAME`.

### Requirement: Input State Management
The system must track the value of each input field as the user types.

#### Scenario: User types in a field
- **Given** a generated form with a `CITY` field
- **When** the user types "New York" into the `CITY` field
- **Then** the application state updates to `{ CITY: "New York" }`.
