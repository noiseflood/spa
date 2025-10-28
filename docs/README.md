# SPA Documentation

Welcome to the SPA (Sound Prompt Audio) documentation. SPA is a declarative language for generating audio using XML-based syntax.

## Documentation Index

### Core Documentation
- [**Specification**](./SPEC.md) - Complete SPA v1.0 language specification
- [**Quick Start**](./QUICKSTART.md) - Get started with SPA in 5 minutes
- [**Build Instructions**](./BUILD_INSTRUCTIONS.md) - Implementation guide for building SPA tools
- [**Roadmap**](./ROADMAP.md) - Development roadmap and future features

### Getting Started

1. **Learn the Syntax**: Start with the [Quick Start Guide](./QUICKSTART.md)
2. **Understand the Spec**: Review the full [Specification](./SPEC.md)
3. **Build Tools**: Follow the [Build Instructions](./BUILD_INSTRUCTIONS.md)
4. **Future Features**: Check the [Roadmap](./ROADMAP.md)

### Quick Example

```xml
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="440" dur="500ms" amp="0.5" />
</spa>
```

This creates a 440Hz sine wave (A4 note) for 500 milliseconds at half volume.

### Resources

- **Examples**: Browse the `/examples/` directory for various SPA files
- **Schema**: JSON Schema validation in `/schema/`
- **Packages**: Core library, React components, and TypeScript types in `/packages/`

### Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on contributing to the project.