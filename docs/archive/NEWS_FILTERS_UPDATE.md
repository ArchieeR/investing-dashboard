# News Filters Update

## Changes Made

### 1. Simplified Category Names
**Before:**
- All News
- Market News
- Company News
- Economic News
- Political News
- Sector News
- Earnings
- Technology
- Analysis

**After:**
- All
- Market
- Company
- Economic
- Political
- Earnings
- Technology
- Analysis

Removed the redundant "News" suffix from category names for cleaner UI.

---

### 2. Added Sectors Dropdown

New editable dropdown for filtering by sector, similar to the sources dropdown.

#### Features:
- **Button shows:** "All" (when none selected) or "X selected"
- **Dropdown includes:**
  - Header with "Sectors" title
  - "Select All" / "Clear All" toggle
  - Checkboxes for each sector
  - Click anywhere on row to toggle
  - Hover highlights

#### Available Sectors:
- Technology
- Financial Services
- Healthcare
- Energy
- Consumer Discretionary
- Consumer Staples
- Industrials
- Materials
- Real Estate
- Utilities
- Communication Services

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [All] [Market] [Company] [Economic] [Political] [Earnings]  │
│ [Technology] [Analysis]                                      │
│                                                              │
│ Sources: [5 selected ▼]  Sectors: [All ▼]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Filtering Logic

Articles are now filtered by:
1. **Tab** (All, Portfolio, Market, Breaking, Watchlist)
2. **Category** (All, Market, Company, etc.)
3. **Sources** (Reuters, WSJ, Bloomberg, etc.)
4. **Sectors** (Technology, Healthcare, etc.) - NEW!

All filters work together (AND logic):
- Article must match selected tab
- Article must match selected category
- Article must be from selected source(s)
- Article must be related to selected sector(s)

---

## State Management

### New State:
```typescript
const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
const [showSectorDropdown, setShowSectorDropdown] = useState(false);
const sectorDropdownRef = useRef<HTMLDivElement>(null);
```

### Toggle Function:
```typescript
const toggleSector = (sector: string) => {
  setSelectedSectors(prev =>
    prev.includes(sector)
      ? prev.filter(s => s !== sector)
      : [...prev, sector]
  );
};
```

### Filter Logic:
```typescript
const sectorMatch = selectedSectors.length === 0 ||
  selectedSectors.some(sector => article.relatedSectors.includes(sector));
```

---

## Click Outside Behavior

Both dropdowns (sources and sectors) close when clicking outside:
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
      setShowSourceDropdown(false);
    }
    if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(event.target as Node)) {
      setShowSectorDropdown(false);
    }
  };
  // ...
}, [showSourceDropdown, showSectorDropdown]);
```

---

## Mock Data Updates

### newsCategories
```typescript
export const newsCategories = [
  'All',
  'Market',
  'Company',
  'Economic',
  'Political',
  'Earnings',
  'Technology',
  'Analysis',
];
```

### newsSectors (NEW)
```typescript
export const newsSectors = [
  'Technology',
  'Financial Services',
  'Healthcare',
  'Energy',
  'Consumer Discretionary',
  'Consumer Staples',
  'Industrials',
  'Materials',
  'Real Estate',
  'Utilities',
  'Communication Services',
];
```

---

## User Experience

### Selecting Sectors:
1. Click "Sectors: All" button
2. Dropdown appears with all sectors
3. Check/uncheck sectors
4. Articles filter in real-time
5. Button updates to show count

### Bulk Actions:
- **Select All:** Checks all 11 sectors
- **Clear All:** Unchecks all sectors (shows "All")

### Visual Feedback:
- Hover highlights on dropdown items
- Checkboxes show selection state
- Button shows selection count
- Smooth transitions

---

## Responsive Behavior

- Filters wrap on smaller screens
- Dropdowns adjust to available space
- Touch-friendly tap targets
- Scrollable if many items

---

## Future Enhancements

### Custom Sectors:
- Allow users to add custom sectors
- Edit sector names
- Remove sectors
- Reorder sectors

### Sector Groups:
- Group related sectors
- Collapsible groups
- Quick select by group

### Saved Filters:
- Save filter combinations
- Quick filter presets
- Named filter sets

---

**Status:** ✅ Complete
**Files Modified:**
- `src/pages/NewsPage.tsx`
- `src/data/mockNewsData.ts`

**Last Updated:** November 11, 2025
