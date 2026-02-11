# Dream3DForge Architecture

## System Overview
Dream3DForge is a **deterministic AI game compiler**. It uses an LLM as a sophisticated parser and reasoner, but the output is strictly constrained by an authoritative pipeline of Preflight Checks, Mathematical Physics signatures, and Architectural Schemas. It is an **Orchestrator**, not a Chatbot.

## Core Components

### 1. The Brain (`geminiService.ts`)
The central service that communicates with the LLM (Google Gemini). It manages the context window, injects system prompts, and parses JSON responses.

### 2. Prompt Registry (`promptRegistry.ts`)
A centralized store of system instructions. Phase 4 introduced significant hardening here:
-   **Doctrine Enforcement**: Every prompt includes the "5 Laws of Micro-Games".
-   **Authoritative Constraints**: Difficulty settings are injected as hard mathematical values, not vague adjectives.

### 3. Authoritative Reasoning Module (🆕 Phase 4)
To prevent "hallucinated" or "vibe-based" game design, we implemented a strict reasoning layer.

#### A. Difficulty Mathematics (`difficultyMath.ts`)
We no longer send `difficulty: "Hard"` to the LLM. We derive a `DifficultySignature`:
```typescript
interface DifficultySignature {
    reactionWindowMs: number;    // e.g., 250ms
    failurePropagation: number;  // e.g., 1.5x damage multiplier
    forgivenessFactor: number;   // e.g., 0.8 coyote time
    enemyVariance: number;       // e.g., 0.6 randomness
    aiDirectorAggression: number; // e.g., 0.9 spawn rate
}
```
The AI is mandated to implement these exact numbers in the game loop.

#### B. Preflight Simulation (`preflightChecks.ts`)
Before any code is generated, the Blueprint is vetted against a rule engine:
-   **Entity Budget**: Checks if the requested entity count fits the chosen renderer (DOM vs Canvas vs WebGL).
-   **Loop Starvation**: Detects potentially heavy physics simulations on the main thread.
-   **Result**: Returns `Pass`, `Soft Fail` (Warning), or `Hard Fail` (Blocker).

#### C. Composable Schemas (`composableSchemas.ts`)
Templates are constructed from atomic modules (`MECHANIC`, `PACING`, `CAMERA`) rather than monolithic scripts. Each module carries "Design Intent" tags (e.g., `time_pressure`, `spatial_reasoning`) to ensure the gameplay matches the psychological goal.

### 4. Frontend Architecture
-   **React + Vite**: Fast, modern frontend.
-   **Tailwind CSS**: Utility-first styling.
-   **Framer Motion**: UI animations and transitions.
-   **ArchitectureDrawer**: A specialized component to visualize the AI's decision-making process (Reasoning vs Rejected Alternatives).

## Data Flow
1.  **User Input** -> `PromptRegistry` (Injected with `DifficultySignature`)
2.  **LLM** -> Generates `Blueprint` (JSON)
3.  **Preflight Checks** -> Validates `Blueprint`
4.  **User Approval** -> `PromptRegistry` (Architecture Mode)
5.  **LLM** -> Generates `Prototype` (HTML/JS)
6.  **Preview** -> Renders in IFrame via `GamePreview`

## Directories
-   `/services`: Core logic (AI, Math, Storage).
-   `/components`: React UI.
-   `/prompts`: (Virtual) managed within `promptRegistry`.
-   `/docs`: System documentation.
