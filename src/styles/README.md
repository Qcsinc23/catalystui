# QCS Management System CSS Architecture

This directory contains the CSS architecture for the QCS Management System, built with Tailwind CSS and Catalyst UI Kit.

## Directory Structure

```
styles/
├── base/
│   ├── variables.css    # Design tokens and CSS custom properties
│   ├── typography.css   # Typography system and text utilities
│   └── reset.css        # CSS reset and base styles
├── main.css            # Main stylesheet with component styles
└── README.md           # Documentation
```

## Usage Guidelines

### 1. Design Tokens

Design tokens are defined in `variables.css` and provide a single source of truth for:
- Colors
- Typography
- Spacing
- Shadows
- Z-indices
- Transitions
- Layout measurements

Access tokens using CSS custom properties:
```css
.example {
  color: var(--color-primary-600);
  margin: var(--spacing-4);
}
```

### 2. Component Classes

Component styles are defined in `main.css` using Tailwind's `@apply` directive. Available components include:

#### Buttons
- `.btn` - Base button styles
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button
- `.btn-success` - Success/confirmation button
- `.btn-danger` - Danger/delete button

```html
<button class="btn btn-primary">Submit</button>
```

#### Forms
- `.form-input` - Input field
- `.form-label` - Input label
- `.form-helper` - Helper text
- `.form-error` - Error message

```html
<label class="form-label">Username</label>
<input type="text" class="form-input" />
<span class="form-helper">Enter your username</span>
```

#### Cards
- `.card` - Container
- `.card-header` - Card header
- `.card-body` - Main content area
- `.card-footer` - Card footer

```html
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
  <div class="card-footer">Actions</div>
</div>
```

#### Tables
- `.table` - Base table styles
- Styled `th` and `td` elements
- Hover effects on rows

```html
<table class="table">
  <thead>
    <tr>
      <th>Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell</td>
    </tr>
  </tbody>
</table>
```

#### Badges
- `.badge` - Base badge styles
- `.badge-primary` - Primary badge
- `.badge-success` - Success badge
- `.badge-warning` - Warning badge
- `.badge-error` - Error badge

```html
<span class="badge badge-primary">New</span>
```

#### Alerts
- `.alert` - Base alert styles
- `.alert-info` - Information alert
- `.alert-success` - Success alert
- `.alert-warning` - Warning alert
- `.alert-error` - Error alert

```html
<div class="alert alert-info">Information message</div>
```

#### Modals
- `.modal` - Modal container
- `.modal-overlay` - Background overlay
- `.modal-content` - Modal box
- `.modal-header` - Modal header
- `.modal-body` - Modal content
- `.modal-footer` - Modal footer

```html
<div class="modal">
  <div class="modal-overlay"></div>
  <div class="modal-content">
    <div class="modal-header">Title</div>
    <div class="modal-body">Content</div>
    <div class="modal-footer">Actions</div>
  </div>
</div>
```

### 3. Dark Mode

Dark mode styles are automatically applied when the user's system preference is set to dark mode. No additional classes are required.

### 4. Accessibility

The CSS architecture includes:
- Focus styles for keyboard navigation
- Sufficient color contrast
- Reduced motion preferences
- ARIA-friendly components

### 5. Best Practices

1. Use design tokens instead of hard-coded values
2. Leverage Tailwind's utility classes for one-off styles
3. Use component classes for consistent patterns
4. Follow BEM naming convention for custom components
5. Maintain dark mode compatibility

### 6. Browser Support

The CSS architecture supports:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- IE11 is not supported

## Contributing

When adding new styles:
1. Use existing design tokens
2. Follow the established patterns
3. Include dark mode variants
4. Test across browsers
5. Ensure accessibility