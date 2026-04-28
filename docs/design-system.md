# Design System

The app uses the same semantic design tokens as `shathing-frontend`, adapted for React Native and Expo.

## Tokens

Tokens live in `constants/theme.ts`.

- `Colors`: semantic light and dark colors mapped from the frontend CSS variables, including `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart1` through `chart5`, and sidebar tokens.
- `Spacing`: shared spacing scale from `xxs` to `4xl`.
- `Radius`: corner radius values derived from `--radius: 0.625rem`, with `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, and `4xl` matching the frontend scale.
- `Typography`: text variants for display, title, heading, body, label, and caption.
- `Shadows`: reusable elevation styles.

React Native does not consistently support CSS `oklch()` values across native targets, so the frontend OKLCH colors are stored as equivalent sRGB hex or rgba values.

## Hooks

Use `useTheme()` when a component needs multiple tokens:

```tsx
const { colors, spacing, radius } = useTheme();
```

Use `useThemeColor()` when a component only needs one semantic color.

## Components

Shared primitives live in `components/ui`.

- `Screen`: safe-area screen shell with optional scrolling.
- `Button`: primary, secondary, outline, ghost, and danger actions.
- `Card`: flat, outlined, and elevated surfaces.
- `Badge`: compact status labels.

`ThemedText` and `ThemedView` remain compatible with the Expo starter template and now read from the same token set.
