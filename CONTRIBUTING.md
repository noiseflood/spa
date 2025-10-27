# Contributing to SPA

Thank you for your interest in contributing to SPA! We welcome contributions from everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/spa.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature`
5. Make your changes
6. Run tests: `pnpm test`
7. Push changes: `git push origin feature/your-feature`
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Commands

```bash
pnpm install      # Install dependencies
pnpm dev          # Start dev mode
pnpm build        # Build all packages
pnpm test         # Run tests
pnpm lint         # Lint code
pnpm typecheck    # Type check
```

## Code Style

- We use Prettier for formatting
- We use ESLint for linting
- TypeScript strict mode is enabled

Run `pnpm lint` before committing.

## Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for good coverage

## Commit Messages

We follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

## Pull Requests

1. Update documentation if needed
2. Add tests for new features
3. Ensure CI passes
4. Keep PRs focused and small
5. Write clear PR descriptions

## Reporting Issues

- Use issue templates
- Provide reproduction steps
- Include system information
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the MIT License.