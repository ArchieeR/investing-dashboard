# News Source Dropdown - Implementation

## Overview
Replaced the inline source filter buttons with a clean dropdown menu that includes a source selection list and "Add Source" button.

---

## Features

### Dropdown Button
- Shows count of selected sources (e.g., "4 selected")
- Expand/collapse icon
- Hover effects
- Click to toggle dropdown

### Dropdown Menu
- **Header Section:**
  - "News Sources" title
  - "Select All" / "Clear All" toggle button

- **Source List:**
  - Checkbox for each source
  - Source name
  - 🔒 icon for subscription sources
  - "Active" badge for configured sources
  - Hover highlight effect
  - Click anywhere on row to toggle

- **Add Source Button:**
  - Dashed border style
  - Plus icon
  - "Add News Source" label
  - Hover effects
  - Opens modal (placeholder alert for now)

### Interaction
- Click outside to close
- Click button to toggle
- Select/deselect sources with checkboxes
- Select All / Clear All for bulk actions

---

## Visual Design

```
┌─────────────────────────────────────┐
│ Sources: [4 selected ▼]             │
└─────────────────────────────────────┘
              ↓ (when clicked)
┌─────────────────────────────────────┐
│ News Sources          [Select All]  │
├─────────────────────────────────────┤
│ ☑ Reuters                  [Active] │
│ ☑ Wall Street Journal 🔒   [Active] │
│ ☑ Bloomberg 🔒             [Active] │
│ ☑ MarketWatch              [Active] │
│ ☑ Barron's 🔒              [Active] │
│ ☐ Financial Times 🔒                │
│ ☐ CNBC                              │
├─────────────────────────────────────┤
│ [+] Add News Source                 │
└─────────────────────────────────────┘
```

---

## Code Structure

### State
```typescript
const [showSourceDropdown, setShowSourceDropdown] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);
```

### Click Outside Handler
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowSourceDropdown(false);
    }
  };
  // ...
}, [showSourceDropdown]);
```

### Toggle Source
```typescript
const toggleSource = (sourceId: string) => {
  setSelectedSources(prev =>
    prev.includes(sourceId)
      ? prev.filter(id => id !== sourceId)
      : [...prev, sourceId]
  );
};
```

---

## Styling

### Dropdown Button
- Background: `var(--bg-card)`
- Border: `1px solid var(--border-color)`
- Hover: Changes to `var(--bg-card-hover)` and primary border
- Padding: `0.5rem 1rem`
- Border radius: `var(--radius-md)`

### Dropdown Menu
- Position: Absolute, below button
- Background: `var(--bg-card)`
- Border: `1px solid var(--border-color)`
- Shadow: `var(--shadow-xl)`
- Backdrop filter: `blur(20px)`
- Min width: `280px`
- Z-index: `1000`

### Dropdown Items
- Padding: `0.75rem 1rem`
- Hover: `var(--bg-secondary)`
- Smooth transitions
- Flex layout with space-between

### Add Source Button
- Border: `1px dashed var(--border-color)`
- Hover: Solid border with primary color
- Full width
- Margin top: `0.5rem`

---

## User Experience

### Opening
1. Click "Sources: X selected" button
2. Dropdown appears below button
3. Shows all available sources
4. Current selections are checked

### Selecting Sources
1. Click on any source row
2. Checkbox toggles
3. Count updates in button
4. Articles filter immediately

### Bulk Actions
1. Click "Select All" to check all sources
2. Click "Clear All" to uncheck all sources
3. Button text toggles based on state

### Adding Source
1. Click "+ Add News Source" button
2. Modal opens (to be implemented)
3. User configures new source
4. Source appears in list

### Closing
1. Click outside dropdown
2. Click button again
3. Select a source (optional - can stay open)

---

## Future Enhancements

### Phase 1: Add Source Modal
- Source selection (from predefined list)
- Authentication method selection
- Credential input
- Connection testing
- Save and activate

### Phase 2: Source Management
- Edit source credentials
- Remove sources
- Enable/disable sources
- Reorder sources
- Source status indicators

### Phase 3: Advanced Features
- Search sources
- Source categories (Free, Premium, Custom)
- Source statistics (article count, last update)
- Favorite sources
- Recently used sources

---

## Integration Points

### Settings Page
The "Add News Source" button will eventually open a modal that:
1. Shows available news sources
2. Allows credential configuration
3. Tests connection
4. Saves to user settings
5. Updates the dropdown list

### Mock Data
Currently uses `newsSources` from `mockNewsData.ts`:
```typescript
export const newsSources = [
  { id: 'reuters', name: 'Reuters', isActive: true, isFree: true },
  { id: 'wsj', name: 'Wall Street Journal', isActive: true, isFree: false },
  // ...
];
```

### Real Implementation
When connecting to real APIs:
1. Load sources from user settings
2. Show connection status
3. Display last update time
4. Handle authentication errors
5. Sync with backend

---

## Accessibility

- Keyboard navigation (to be added)
- ARIA labels (to be added)
- Focus management
- Screen reader support
- High contrast mode compatible

---

## Testing Checklist

- [x] Dropdown opens on click
- [x] Dropdown closes on outside click
- [x] Dropdown closes on button click
- [x] Checkboxes toggle correctly
- [x] Select All works
- [x] Clear All works
- [x] Count updates correctly
- [x] Articles filter correctly
- [x] Hover effects work
- [x] Add Source button shows alert
- [x] Active badges display
- [x] Lock icons show for premium sources
- [x] Responsive on mobile

---

## Mobile Considerations

- Dropdown width adjusts to screen
- Touch-friendly tap targets (min 44px)
- Scrollable if many sources
- Bottom sheet alternative (future)

---

**Status:** ✅ Complete
**Last Updated:** November 11, 2025
