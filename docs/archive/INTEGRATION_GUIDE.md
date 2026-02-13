# Integration Guide - New UI Components

**Quick reference for using the new UI components**

---

## 🎯 Quick Start

### 1. Toast Notifications

**Setup (already done in App.tsx):**
```typescript
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <PortfolioProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </PortfolioProvider>
  );
}
```

**Usage in any component:**
```typescript
import { useToastContext } from '../contexts/ToastContext';

function MyComponent() {
  const toast = useToastContext();
  
  // Simple notifications
  toast.success('Portfolio saved!');
  toast.error('Failed to update holding');
  toast.warning('Portfolio drift exceeds 5%');
  toast.info('Live prices updated');
  
  // With action button
  toast.error('Failed to save', {
    label: 'Retry',
    onClick: () => handleRetry()
  });
  
  // Dismiss all toasts
  toast.dismissAll();
}
```

---

### 2. Empty States

**Usage:**
```typescript
import { EmptyState } from './components/common/EmptyState';

// No holdings
<EmptyState
  icon="account_balance_wallet"
  title="Your portfolio is empty"
  description="Add your first holding to start tracking"
  actions={[
    {
      label: 'Add Holding',
      onClick: () => setShowForm(true),
      primary: true
    },
    {
      label: 'Import CSV',
      onClick: () => handleImport()
    }
  ]}
/>

// No search results
<EmptyState
  icon="filter_list_off"
  title="No results found"
  description="Try adjusting your search or filters"
  actions={[
    {
      label: 'Clear Filters',
      onClick: () => clearFilters()
    }
  ]}
/>
```

---

### 3. Skeleton Loaders

**Usage:**
```typescript
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonHoldingsTable 
} from './components/common/SkeletonLoader';

// Simple skeleton
{loading ? (
  <Skeleton width="200px" height="24px" />
) : (
  <div>{data}</div>
)}

// Card skeleton
{loading ? (
  <SkeletonCard />
) : (
  <Card>{content}</Card>
)}

// Table skeleton
{loading ? (
  <SkeletonHoldingsTable rows={5} />
) : (
  <HoldingsTable data={holdings} />
)}
```

---

### 4. Portfolio Hero

**Usage:**
```typescript
import { PortfolioHero } from './components/PortfolioHero';

<PortfolioHero
  portfolioName={portfolio.name}
  portfolioType={portfolio.type}
  totalValue={totalValue}
  dayChange={dayChange}
  dayChangePercent={dayChangePercent}
  lastUpdated={new Date()}
  onAddHolding={() => setShowHoldingForm(true)}
  onRecordTrade={() => setShowTradeForm(true)}
  onRebalance={() => handleRebalance()}
/>
```

---

### 5. Metrics Grid

**Usage:**
```typescript
import { MetricsGrid } from './components/MetricsGrid';

<MetricsGrid
  metrics={[
    {
      icon: 'trending_up',
      label: 'YTD Return',
      value: '+12.5%',
      change: '+2.3% vs last month',
      status: 'good',
    },
    {
      icon: 'account_balance',
      label: 'Cash %',
      value: '8.2%',
      status: 'good',
    },
    {
      icon: 'warning',
      label: 'Drift',
      value: '2.1%',
      status: 'warning',
    },
  ]}
  loading={false}
/>
```

**Status values:**
- `'good'` - Green (success)
- `'warning'` - Orange (warning)
- `'bad'` - Red (error)
- `'neutral'` - Gray (default)

---

### 6. Enhanced Holdings Grid

**Usage:**
```typescript
import { HoldingsGridEnhanced } from './components/HoldingsGridEnhanced';

<HoldingsGridEnhanced
  onAddHolding={() => setShowHoldingForm(true)}
  onRecordTrade={(holding) => {
    setSelectedHolding(holding);
    setShowTradeForm(true);
  }}
/>
```

**Features:**
- Inline editing (click cells)
- Bulk selection (checkboxes)
- Bulk actions (delete, duplicate)
- Sortable columns (click headers)
- Search (real-time)
- Filter by section (chips)
- Empty states (automatic)

---

## 🎨 Common Patterns

### Pattern 1: Loading → Data → Empty

```typescript
function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  
  if (loading) {
    return <SkeletonHoldingsTable rows={5} />;
  }
  
  if (data.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="No data yet"
        description="Get started by adding some data"
        actions={[
          { label: 'Add Data', onClick: handleAdd, primary: true }
        ]}
      />
    );
  }
  
  return <DataTable data={data} />;
}
```

---

### Pattern 2: Action → Toast Feedback

```typescript
function MyComponent() {
  const toast = useToastContext();
  
  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Saved successfully!');
    } catch (error) {
      toast.error('Failed to save', {
        label: 'Retry',
        onClick: handleSave
      });
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

---

### Pattern 3: Conditional Metrics

```typescript
function Dashboard() {
  const cashPct = calculateCashPercentage();
  
  return (
    <MetricsGrid
      metrics={[
        {
          icon: 'account_balance',
          label: 'Cash %',
          value: `${cashPct.toFixed(1)}%`,
          status: cashPct > 5 && cashPct < 15 ? 'good' : 'warning',
        },
      ]}
    />
  );
}
```

---

## 🎯 Best Practices

### Toast Notifications

**DO:**
- ✅ Use for action feedback (save, delete, update)
- ✅ Keep messages short and clear
- ✅ Use appropriate type (success/error/warning/info)
- ✅ Add action button for recoverable errors

**DON'T:**
- ❌ Use for critical errors (use modal instead)
- ❌ Show multiple toasts at once (they stack)
- ❌ Use for long messages (use modal instead)
- ❌ Forget to handle errors

---

### Empty States

**DO:**
- ✅ Provide clear next action
- ✅ Use friendly, helpful language
- ✅ Include relevant icon
- ✅ Offer multiple options when appropriate

**DON'T:**
- ❌ Leave users confused
- ❌ Use technical jargon
- ❌ Show empty table with no guidance
- ❌ Forget to handle "no results" vs "no data"

---

### Skeleton Loaders

**DO:**
- ✅ Match the shape of actual content
- ✅ Use for initial loads
- ✅ Keep animation subtle
- ✅ Show for >200ms delays

**DON'T:**
- ❌ Use for instant operations
- ❌ Show for too long (>5s)
- ❌ Use instead of progress bars for long operations
- ❌ Forget to remove when data loads

---

## 🔧 Customization

### Custom Toast Duration

```typescript
// Default: 5000ms (5 seconds)
toast.success('Quick message'); // 5s

// Custom duration
toast.showToast({
  type: 'info',
  message: 'Read this carefully',
  duration: 10000 // 10 seconds
});

// No auto-dismiss
toast.showToast({
  type: 'error',
  message: 'Critical error',
  duration: 0 // Must manually dismiss
});
```

---

### Custom Empty State

```typescript
<EmptyState
  icon="custom_icon"
  title="Custom Title"
  description="Custom description with more details"
  actions={[
    {
      label: 'Primary Action',
      onClick: handlePrimary,
      primary: true
    },
    {
      label: 'Secondary Action',
      onClick: handleSecondary
    }
  ]}
/>
```

---

### Custom Metric Status

```typescript
// Calculate status dynamically
const getStatus = (value: number) => {
  if (value > 10) return 'good';
  if (value > 5) return 'warning';
  return 'bad';
};

<MetricsGrid
  metrics={[
    {
      icon: 'trending_up',
      label: 'Return',
      value: `${returnPct}%`,
      status: getStatus(returnPct),
    },
  ]}
/>
```

---

## 🐛 Troubleshooting

### Toast not showing?

**Check:**
1. Is `ToastProvider` wrapping your app?
2. Are you using `useToastContext()` inside the provider?
3. Check browser console for errors

```typescript
// ✅ Correct
<ToastProvider>
  <MyComponent /> {/* Can use useToastContext here */}
</ToastProvider>

// ❌ Wrong
<MyComponent /> {/* useToastContext will throw error */}
<ToastProvider />
```

---

### Inline editing not working?

**Check:**
1. Is the cell clickable?
2. Is `editingCell` state being set?
3. Is `stopEditing` being called on blur?

```typescript
// Make sure you have these handlers
onClick={() => startEditing(id, field)}
onBlur={stopEditing}
onKeyDown={(e) => {
  if (e.key === 'Enter') stopEditing();
  if (e.key === 'Escape') stopEditing();
}}
```

---

### Bulk selection not working?

**Check:**
1. Is `selectedIds` a Set?
2. Are you toggling correctly?
3. Is the checkbox checked state correct?

```typescript
// ✅ Correct
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const toggleSelection = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
};
```

---

## 📚 Component API Reference

### Toast

```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // milliseconds, 0 = no auto-dismiss
  onClose?: () => void;
}
```

### EmptyState

```typescript
interface EmptyStateProps {
  icon: string; // Material Symbols icon name
  title: string;
  description: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    primary?: boolean;
  }>;
}
```

### MetricCard

```typescript
interface MetricCardProps {
  icon: string; // Material Symbols icon name
  label: string;
  value: string;
  change?: string;
  status?: 'good' | 'warning' | 'bad' | 'neutral';
  loading?: boolean;
}
```

### PortfolioHero

```typescript
interface PortfolioHeroProps {
  portfolioName: string;
  portfolioType: 'actual' | 'draft' | 'model';
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  lastUpdated?: Date;
  onAddHolding?: () => void;
  onRebalance?: () => void;
  onRecordTrade?: () => void;
}
```

---

## 🎓 Examples

### Complete Dashboard Example

```typescript
import { PortfolioHero } from './components/PortfolioHero';
import { MetricsGrid } from './components/MetricsGrid';
import { HoldingsGridEnhanced } from './components/HoldingsGridEnhanced';
import { useToastContext } from './contexts/ToastContext';

function Dashboard() {
  const toast = useToastContext();
  const [showHoldingForm, setShowHoldingForm] = useState(false);
  
  const handleRebalance = () => {
    toast.info('Rebalancing feature coming soon!');
  };
  
  return (
    <div>
      <PortfolioHero
        portfolioName="Main Portfolio"
        portfolioType="actual"
        totalValue={52450}
        dayChange={1234}
        dayChangePercent={2.4}
        lastUpdated={new Date()}
        onAddHolding={() => setShowHoldingForm(true)}
        onRebalance={handleRebalance}
      />
      
      <MetricsGrid
        metrics={[
          {
            icon: 'trending_up',
            label: 'YTD Return',
            value: '+12.5%',
            status: 'good',
          },
        ]}
      />
      
      <HoldingsGridEnhanced
        onAddHolding={() => setShowHoldingForm(true)}
      />
    </div>
  );
}
```

---

**That's it! You're ready to use all the new UI components.** 🚀

For more details, see:
- `docs/UI_REFINEMENT_PLAN.md` - Full plan
- `docs/UI_IMPLEMENTATION_LOG.md` - Implementation details
- `docs/UI_SESSION_2_SUMMARY.md` - Session 2 summary
