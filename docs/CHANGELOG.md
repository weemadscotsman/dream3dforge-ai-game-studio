# Changelog

All notable changes to Dream3DForge will be documented in this file.

## [2.5.1] - 2026-01-27

### Added
-   **Authoritative Difficulty**: The "Difficulty" slider (1-10) now enforces exact mathematical physics constraints (reaction time, failure penalties) rather than vague "hardness" requests.
-   **Architecture Drawer**: A new UI component that explains *why* the AI chose a specific architecture (e.g., ECS vs OOP) and lists rejected alternatives.
-   **Preflight Checks**: An automated validation system that runs before compilation. It blocks generation if critical constraints (like entity count vs renderer capabilities) are violated.
-   **Settings Page**: A dedicated page for API key management and provider selection (Google, OpenAI, OpenRouter).
-   **Templates**: 9 new "Quick Start" templates with pre-configured schemas.

### ⚠️ Breaking Conceptual Changes
-   **Difficulty Enforcement**: Difficulty is no longer descriptive; it is **enforced**. Games that previously relied on "vibe-based" tuning will now fail preflight or feel significantly different under the new math-based `DifficultySignature`.

### Changed
-   **Prompt Engineering**: Shifted from "Guidance" prompts to "Constraint" prompts. The AI is now forbidden from hallucinating easy games when "Nightmare" is selected.
-   **UI**: Unified the "Blueprint" and "Prototype" tabs into a cohesive "Forge" workflow.
-   **Documentation**: Added `USER_GUIDE.md` and `ARCHITECTURE.md`.

### Fixed
-   Fixed a crash where the app would panic on startup if no API key was found (implemented `NoOpProvider` fallback).
-   Fixed `DifficultySignature` not being readonly, which allowed runtime mutations.
-   resolved over 50 TypeScript errors related to `types.ts` definitions.

## [2.4.0] - Prior Release
-   Initial Mobile Support (Capacitor).
-   Touch Control injection.
