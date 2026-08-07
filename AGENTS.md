# SmartTutor Agent Rules

These rules apply to future Codex or agent sessions in this repo.

## Design Contract

- The SmartTutor Figma file is the source of truth for UI structure, spacing, colors, typography, and component behavior.
- Figma file: `QoW89JeNwFX7nFV7kyVbEy`
- Canonical link: https://www.figma.com/design/QoW89JeNwFX7nFV7kyVbEy/SmartTutor?node-id=6-2&t=dxpwo0IzVDYADcl2-0
- Before inventing a new UI, inspect the relevant Figma node first. If the screen or component already exists in Figma, match it instead of creating a new design.
- Treat the PDF token summary as secondary. Use it for orientation, but verify against the live Figma file when implementing or revising UI.
- Preserve existing SmartTutor visual language: Inter, `#2563EB` primary blue, `#1E3A5F` navy, Figma-defined radii, shadows, nav patterns, cards, badges, and tables.

## Figma Workflow

- Use the Figma connector for design-to-code work when available.
- Start with metadata/design context for the exact node from the backlog or issue body.
- Do not claim pixel or Figma parity unless the relevant Figma node was inspected in the current workflow.

## shadcn Workflow

- shadcn is not currently configured in this repo: there is no `components.json`, no `client/src/components/ui`, and no local `shadcn` binary.
- For future UI work, check whether shadcn is configured before using or referencing shadcn blocks.
- If shadcn is added later, prefer shadcn/Radix primitives or blocks where they fit the Figma design. Do not let a generic block override the SmartTutor Figma design.

## Handoffs

- Repository-local handoffs are the durable convention for SmartTutor.
- Ignore generic handoff-skill instructions that say to write handoffs to a temporary directory when the user asks for a project handoff.
- Store SmartTutor handoffs under `docs/superpowers/handoffs/` and commit them before starting a fresh session or asking another agent to continue.

