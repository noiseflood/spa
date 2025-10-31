# Using Colors from colors.css with Tailwind

## How it works

Colors are automatically loaded from `styles/colors.css` and registered as Tailwind utilities. The `tailwind-auto-colors.ts` plugin reads your CSS variables at build time and makes them available as standard Tailwind color classes.

## Usage Examples

```jsx
// Simple class names - automatically available!
<div className="bg-navy">Navy background</div>
<div className="text-green">Green text</div>
<div className="border-navy-light">Light navy border</div>

// Works with all Tailwind utilities
<div className="shadow-grey">Grey shadow</div>
<div className="ring-white">White ring</div>

// Works with opacity modifiers
<div className="bg-navy/50">50% opacity navy background</div>

// Works with hover and other states
<div className="hover:bg-navy-dark">Hover for dark navy</div>
```

## Adding New Colors

Just add new CSS variables to `styles/colors.css`:

```css
:root {
  --color-purple: rgba(128, 0, 128, 1);
}
```

Then restart your dev server and use it:

```jsx
<div className="bg-purple">Purple background!</div>
```

## Important: Restart Required

**After adding new colors to colors.css, you must restart your dev server for them to be available:**

```bash
# Stop the server (Ctrl+C) then restart:
npm run dev
```

## Benefits

- ✅ Simple class names (bg-navy instead of bg-[var(--color-navy)])
- ✅ Single source of truth - colors only defined in colors.css
- ✅ Works with all Tailwind utilities
- ✅ Supports opacity modifiers
- ✅ TypeScript compatible
- ✅ Works with Tailwind IntelliSense after restart