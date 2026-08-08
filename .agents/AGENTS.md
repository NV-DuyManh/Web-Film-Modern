# Tailwind CSS v4 Guidelines

This project uses **Tailwind CSS v4**. Please ensure all generated or modified code strictly adheres to Tailwind v4 canonical class syntax to avoid IDE warnings.

## Common Canonical Class Replacements
Avoid using arbitrary values with brackets `[]` when standard utility classes exist. Always use the canonical version:

- **Spacing & Sizing:**
  - `max-w-[200px]` -> `max-w-50`
  - `md:max-w-[400px]` -> `md:max-w-100`
  - `lg:max-w-[600px]` -> `lg:max-w-150`
  - `w-[350px]` -> `w-87.5`
  - `md:w-[400px]` -> `md:w-100`
  - `p-[1px]` -> `p-px`
  - `border-[1px]` -> `border`
  - `inset-[-10px]` -> `-inset-2.5`
  - `aspect-[3/4]` -> `aspect-3/4`

- **Important Modifier `!`:**
  - Place `!` at the end of the class name, NOT at the beginning.
  - `!bg-transparent` -> `bg-transparent!`
  - `!backdrop-blur-none` -> `backdrop-blur-none!`

- **Gradients:**
  - `bg-gradient-to-r` -> `bg-linear-to-r` (and similar directional gradients)

- **Transforms (Skew, etc.):**
  - `-skew-y-[8deg]` -> `skew-y-[-8deg]` (When using negative arbitrary values, put the minus sign inside the brackets if a standard class like `-skew-y-8` doesn't exist/fit, or use standard utilities if available).

- **Z-Index:**
  - `z-[100]` -> `z-100`

Always prefer Tailwind's default design system scale (e.g., `w-10`, `w-50`, `p-px`) over arbitrary pixel values `[]` unless absolutely necessary.

# Cleanup Rules

- **Always Clean Up Junk Files:** Always delete temporary scripts, data files, or test outputs (e.g., .mjs or .js scripts used for codebase modifications) immediately after successfully completing a task. Do not leave clutter in the workspace.
