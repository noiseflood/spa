I'm building SPA (Scalable Parametric Audio) - a declarative XML format for procedural sound effects, similar to how SVG works for graphics. Think: "the SVG of sound effects" for web developers.

FIRST: Please read these documents in order to understand the project:
1. README.md - project overview and vision
2. SPA_SPEC_v1.0.md - complete technical specification
3. BUILD_INSTRUCTIONS.md - detailed implementation guide

After reading, please:

1. Create the directory structure for these 4 MVP repositories:
   - spa-spec/ (specification, examples, and JSON schema)
   - spa-js/ (core JavaScript library - parser + renderer)
   - spa-web/ (website with visual designer - this is the main feature)
   - spa-react/ (React integration for adoption)

2. For each directory, create:
   - Initial package.json (with correct metadata from BUILD_INSTRUCTIONS)
   - Directory structure (all folders specified in BUILD_INSTRUCTIONS)
   - README.md (with description and purpose)
   - .gitignore (appropriate for each project type)

3. Show me the complete directory tree so I can verify the structure before we start implementing.

NOTE: This is NOT a monorepo. Each directory will be its own independent git repository. The parent directory just houses them all for convenience.

We'll add spa-vscode, spa-cli, and other integrations later. For now, focus on the core 4 repos needed to launch.

Ready to start? Please confirm you've read the docs and show me your understanding of what we're building.