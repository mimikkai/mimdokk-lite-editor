# Add Example Template and User Guide

## Summary
Introduce a built-in example template and a user guide to help users understand how to use the application and the supported template syntax.

## Motivation
New users may not have a ready-made `.docx` template with the correct syntax. Providing an example allows them to immediately test the application's functionality. Additionally, a guide explaining the `{VAR}` and `{VAR|default}` syntax is essential for users to create their own templates.

## Proposed Changes
- **New Capability:** `example-template` - Ability to load a pre-configured example document.
- **New Capability:** `user-guide` - UI section explaining template syntax.

## Timeline
- **Phase 1:** Create example docx file and place in public assets.
- **Phase 2:** Implement "Load Example" functionality in the UI.
- **Phase 3:** Create and integrate the "User Guide" component.
