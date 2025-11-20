# Specification: User Guide

## ADDED Requirements

### Requirement: Display Template Syntax
The system must display instructions on how to format `.docx` templates for use with the editor.

#### Scenario: Viewing the guide
- **Given** the user wants to learn how to create a template
- **When** the user views the guide section
- **Then** the system displays the syntax for simple variables: `{VAR}`.
- **And** the system displays the syntax for default values: `{VAR|default}`.
- **And** the system explains that long default values (>50 chars) trigger a text area.
