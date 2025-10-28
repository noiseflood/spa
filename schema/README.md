# SPA Schema

This directory contains JSON Schema definitions for validating SPA (Sound Prompt Audio) XML files.

## Files

- `spa-v1.schema.json` - JSON Schema for SPA v1 specification

## Usage

### Validating SPA Files

You can use the JSON Schema to validate SPA files programmatically:

```javascript
import Ajv from 'ajv';
import schema from './spa-v1.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

const spaDocument = `
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="440" dur="500ms" amp="0.5" />
</spa>
`;

// Parse XML to JSON first, then validate
const valid = validate(parsedSpaJson);
if (!valid) {
  console.error(validate.errors);
}
```

### Schema Features

The JSON Schema validates:
- Root `<spa>` element with version attribute
- Valid child elements (`<tone>`, `<noise>`, `<group>`)
- Attribute types and constraints
- Required vs optional fields
- Value ranges (e.g., amp: 0-1, freq: >0)
- Enum values (wave types, noise colors, curve types)
- Pattern matching (e.g., envelope format "A,D,S,R")

### Editor Integration

Many editors can use JSON Schema for:
- Auto-completion
- Real-time validation
- Inline documentation
- Type checking

Configure your editor to use `spa-v1.schema.json` when editing `.spa` files.

## Schema Versions

- **v1.0** - Initial release (current)
  - Basic elements: tone, noise, group
  - Core attributes: wave, freq, dur, amp
  - Envelopes and automation
  - Filters and effects

Future versions will maintain backward compatibility.