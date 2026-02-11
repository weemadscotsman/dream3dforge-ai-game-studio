# Dream3DForge User Guide

## Overview
Dream3DForge is a **constraint-driven AI game compiler** that turns text descriptions into playable prototypes in seconds. Unlike generic chat-based tools, it uses an authoritative pipeline to ensure the output is a real, playable game, not just a hallucination.

## 1. Getting Started
1.  **Launch the App**: Open the application (Web, Android, or Windows).
2.  **API Configuration**: Click the 🛠️ icon in the top right. Enter your Google Gemini or OpenAI key.
3.  **Choose a Template**: Select from 9 pre-built templates (e.g., "Neon Survivor", "Bullet Dance") or start from scratch.

## 2. Defining Your Game
The "Forge" interface is where you define the DNA of your game.

### Core Identity
-   **Genre**: Defines the fundamental rules (e.g., Arena Shooter, Platformer, Puzzle).
-   **Visual Style**: Sets the aesthetic (e.g., Cyberpunk, Low Poly, Retro).
-   **Perspective**: Camera angle (Top-Down, First Person, Isometric).

### 🆕 Authoritative Difficulty
*Phase 4 Feature*
The **Difficulty Slider (1-10)** is no longer just a label. It mathematically enforces game physics:
-   **Levels 1-3**: Generous reaction times (>400ms), high forgiveness.
-   **Levels 4-7**: Standard gaming challenge.
-   **Levels 8-10**: "Nightmare" constraints. Reaction windows <200ms, 1-hit deaths, high variance.
*Check the "Authoritative Constraints" dropdown on the slider to see the exact math.*

### 🆕 Preflight Checks
Before generating, the system runs a simulation to prevent broken games:
-   **Hard Fails (❌)**: Critical issues (e.g., asking for 10,000 entities in a DOM renderer). functionality is blocked until fixed.
-   **Soft Fails (⚠️)**: Warnings about pacing or genre validity.

## 3. The Blueprint Phase
Once you click **"Architect Blueprint"**, the AI designs the system.
You will see:
1.  **Architecture Diagram**: A visual graph of the game's code structure.
2.  **🆕 Architecture Reasoning**: A drawer explaining *WHY* certain patterns were chosen (e.g., "Why ECS over OOP?"). It also lists **Rejected Alternatives**.
3.  **Tech Stack**: The libraries and tools selected.

**Refinement**: You can chat with the Architect to tweak the plan *before* it's built.
*All iteration requests are translated into blueprint deltas and revalidated through the same authoritative pipeline.*

## 4. Prototyping
Click **"Compile Prototype"** to generate the code.
-   The AI writes the actual HTML/JS/CSS.
-   The game loads in the preview window.
-   **Controls**: Mouse/Keyboard for desktop, Touch overlay for mobile.

## 5. Iteration
-   **Play**: Test the game.
-   **Iterate**: Use the chat box below the game to request changes.
    *Example: "Make the player faster"* or *"Fix the collision bug"*
-   **Code View**: Inspect the generated source code.

## 6. Exporting
-   **Download HTML**: Generates a **deterministic single-file HTML executable**.
-   **Auto-Save**: Your project is automatically saved locally.

## Troubleshooting
-   **"Compilation Failed"**: Check if your prompt triggered a Hard Fail in the Preflight checks.
-   **"Laggy Game"**: Lower the "Visual Fidelity" or avoid Swarm mechanics on standard rendering settings.
