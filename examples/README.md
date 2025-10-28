# SPA Example Library

This directory contains 24 example SPA (Sound Prompt Audio) files demonstrating various sound effects for web applications. Each file is a complete, working example that can be rendered and played using the SPA library.

## Directory Structure

```
examples/
├── ui/          # User interface sounds (13 files)
├── forms/       # Form interaction sounds (3 files)
├── game/        # Game effect sounds (4 files)
└── ambient/     # Atmospheric sounds (3 files)
```

## UI Sounds (`/ui/`)

### Buttons & Interactions
- **button-click.spa** - Short sine wave for tactile button feedback (50ms)
- **button-hover.spa** - Gentle feedback for mouse hover (30ms)
- **drag-start.spa** - Subtle feedback when initiating drag operation (50ms)
- **drop-success.spa** - Positive feedback for successful drop operation (120ms)
- **swipe.spa** - Filtered noise sweep for swipe gestures (150ms)

### Toggles & States
- **toggle-on.spa** - Ascending slide for switch activation (80ms)
- **toggle-off.spa** - Descending slide for switch deactivation (80ms)

### Feedback & Alerts
- **error.spa** - Two-tone square wave for error feedback (150ms)
- **success.spa** - Two-tone ascending melody for positive feedback (300ms)
- **notification.spa** - Attention-grabbing alert sound (200ms)
- **progress-complete.spa** - Three-note ascending chime for task completion (200ms)

### Modals & Navigation
- **modal-open.spa** - Ascending tone for dialog appearance (150ms)
- **modal-close.spa** - Descending tone for dialog dismissal (120ms)
- **loading-tick.spa** - High-frequency tick for progress indication (30ms)

## Form Sounds (`/forms/`)

- **input-focus.spa** - Subtle tone for form field focus (40ms)
- **input-valid.spa** - Pleasant ascending tone for validation success (100ms)
- **input-invalid.spa** - Dissonant tones for validation error (80ms)

## Game Sounds (`/game/`)

- **coin.spa** - Classic arcade coin collection sound (300ms)
- **jump.spa** - Quick ascending tone for character jump (200ms)
- **laser.spa** - Sci-fi weapon discharge with noise layer (300ms)
- **power-up.spa** - Rising sine wave for ability activation (500ms)

## Ambient Sounds (`/ambient/`)

- **page-transition.spa** - Smooth whoosh for navigation (300ms)
- **whoosh.spa** - Filtered noise sweep for motion effects (500ms)
- **wind.spa** - Layered noise for atmospheric ambience (5000ms)

## Usage Examples

### JavaScript (using @spa-audio/core)
```javascript
import { playSPA } from '@spa-audio/core';
import buttonClickSPA from './examples/ui/button-click.spa';

// Play directly from file content
await playSPA(buttonClickSPA);

// Or fetch and play
const response = await fetch('/examples/ui/button-click.spa');
const spaContent = await response.text();
await playSPA(spaContent);
```

### React (using @spa-audio/react)
```jsx
import { SPASound } from '@spa-audio/react';

function Button() {
  return (
    <button>
      Click Me
      <SPASound src="/examples/ui/button-click.spa" autoPlay />
    </button>
  );
}
```

### HTML (with inline SPA)
```html
<button onclick="playSPAInline(this)">
  Click Me
  <script type="text/spa">
    <spa xmlns="https://spa.audio/ns" version="1.0" xmlns="http://spa.audio/ns">
      <tone wave="sine" freq="800" dur="0.05" envelope="0,0.02,0,0.03"/>
    </spa>
  </script>
</button>
```

## Sound Characteristics

### Waveform Types Used
- **Sine** - Smooth, pure tones (buttons, notifications, UI feedback)
- **Square** - Retro, digital sounds (errors, games)
- **Triangle** - Softer than square, warmer than sine (validation)
- **Sawtooth** - Rich, bright sounds (lasers, effects)

### Noise Colors Used
- **White** - Full spectrum hiss (lasers, swipes)
- **Pink** - Natural, softer noise (wind, ambience)
- **Brown** - Deep, rumbling noise (wind layers)

### Common Techniques

#### Frequency Sweeps
Many sounds use frequency automation for dynamic effects:
- **Ascending** (success, power-up, modal open)
- **Descending** (laser, modal close, toggle off)
- **Smooth curves** for natural transitions

#### Envelopes (ADSR)
All sounds use custom ADSR envelopes for shaping:
- **Fast attack** (0-10ms) for immediate response
- **Quick decay** (20-100ms) for punchy sounds
- **Low sustain** (0.2-0.5) for natural falloff
- **Short release** (30-200ms) for clean endings

#### Layering
Complex sounds use groups to layer multiple elements:
- Tone + noise (laser)
- Multiple tones (success, error)
- Multiple noise colors (wind)

## File Format

All examples follow this structure:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- Description: What this sound represents -->
<spa xmlns="http://spa.audio/ns" version="1.0">
  <!-- Sound elements here -->
</spa>
```

## Testing

To validate all examples against the schema:
```bash
# Using the SPA CLI (when available)
spa validate examples/**/*.spa

# Or programmatically
npm test -- --examples
```

## Contributing

When adding new examples:
1. Place in appropriate category folder
2. Include descriptive comment
3. Keep duration under 1 second (except ambient)
4. Test that it sounds appropriate
5. Update this README

## License

All example files are released under MIT license for free use in any project.