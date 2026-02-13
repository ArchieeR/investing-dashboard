# Settings/Admin Page - Complete Specification

## Overview
Comprehensive settings and administration interface for managing all aspects of the portfolio application.

---

## Page Structure

### Navigation Sidebar
```
┌─────────────────────┐
│ SETTINGS            │
├─────────────────────┤
│ 👤 Account          │
│ 📰 News Sources     │
│ 📊 Portfolio        │
│ 👁️  Display         │
│ 🔔 Notifications    │
│ 🔐 Privacy          │
│ 💾 Data & Backup    │
│ 🔌 Integrations     │
│ ⚙️  Advanced        │
└─────────────────────┘
```

---

## 1. Account Settings

### Profile
- Name
- Email
- Avatar upload
- Account type (Individual, Family Manager, Member)
- Timezone
- Currency preference

### Multiple Accounts
```
┌─────────────────────────────────────────┐
│ ACCOUNTS                                │
├─────────────────────────────────────────┤
│ ● John Doe (You)                        │
│   Manager • 3 portfolios                │
│   [Switch] [Edit]                       │
│                                         │
│ ○ Jane Doe                              │
│   Family Member • 1 portfolio           │
│   [Switch] [Edit]                       │
│                                         │
│ ○ Kids Portfolio                        │
│   Managed • 1 portfolio                 │
│   [Switch] [Edit]                       │
│                                         │
│ [+ Add Family Member]                   │
└─────────────────────────────────────────┘
```

---

## 2. News Sources Settings

### Source Management
```
┌─────────────────────────────────────────┐
│ ACTIVE SOURCES                          │
├─────────────────────────────────────────┤
│ ✓ Reuters                               │
│   Status: Active • Free                 │
│   Last updated: 2 min ago               │
│   [Configure] [Disable]                 │
│                                         │
│ ✓ MarketWatch                           │
│   Status: Active • Free                 │
│   Last updated: 5 min ago               │
│   [Configure] [Disable]                 │
│                                         │
│ ✓ Barron's                              │
│   Status: Active • Subscription         │
│   Auth: RSS Feed                        │
│   Last updated: 1 min ago               │
│   [Configure] [Disable] [Test]          │
│                                         │
│ ○ Wall Street Journal                   │
│   Status: Not configured                │
│   [+ Add Credentials]                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ AVAILABLE SOURCES                       │
├─────────────────────────────────────────┤
│ Bloomberg • Financial Times • CNBC      │
│ Seeking Alpha • Yahoo Finance           │
│ [+ Add Source]                          │
└─────────────────────────────────────────┘
```

### Add/Edit Source Modal
```
┌─────────────────────────────────────────┐
│ Configure News Source              [×]  │
├─────────────────────────────────────────┤
│ Source Name: [Barron's ▼]               │
│                                         │
│ Authentication Type:                    │
│ ● RSS Feed URL                          │
│ ○ API Key                               │
│ ○ OAuth                                 │
│ ○ Local Proxy                           │
│                                         │
│ RSS Feed URL:                           │
│ [https://feeds.barrons.com/...]         │
│                                         │
│ Update Frequency:                       │
│ [Every 15 minutes ▼]                    │
│                                         │
│ Categories to fetch:                    │
│ [✓] Market News                         │
│ [✓] Company News                        │
│ [✓] Economic News                       │
│ [ ] Opinion                             │
│                                         │
│ [Test Connection]                       │
│ Status: ✓ Connected successfully        │
│                                         │
│ [Save]  [Cancel]                        │
└─────────────────────────────────────────┘
```

### News Filtering Preferences
```
┌─────────────────────────────────────────┐
│ AI FILTERING                            │
├─────────────────────────────────────────┤
│ Enable AI categorization:  [✓]          │
│ Enable sentiment analysis: [✓]          │
│ Enable relevance scoring:  [✓]          │
│                                         │
│ Minimum Relevance Score:                │
│ [●──────────] 60%                       │
│                                         │
│ Priority Categories:                    │
│ [✓] Portfolio-related news              │
│ [✓] Watchlist-related news              │
│ [✓] Economic indicators                 │
│ [✓] Market movements                    │
│ [ ] Political news                      │
│ [ ] Cryptocurrency                      │
│                                         │
│ Auto-hide low relevance: [✓]            │
│ Show read articles:      [✓]            │
└─────────────────────────────────────────┘
```

### News Tab Management
```
┌─────────────────────────────────────────┐
│ NEWS TABS                               │
├─────────────────────────────────────────┤
│ ☰ My Portfolio                          │
│   Layout: Feed • Auto-refresh: On       │
│   [Edit] [Duplicate] [Delete]           │
│                                         │
│ ☰ Market Overview                       │
│   Layout: Magazine • Auto-refresh: On   │
│   [Edit] [Duplicate] [Delete]           │
│                                         │
│ ☰ Breaking News                         │
│   Layout: Feed • Auto-refresh: On       │
│   [Edit] [Duplicate] [Delete]           │
│                                         │
│ ☰ Tech Sector                           │
│   Layout: Grid • Auto-refresh: Off      │
│   [Edit] [Duplicate] [Delete]           │
│                                         │
│ [+ Create New Tab]                      │
└─────────────────────────────────────────┘
```

### Create/Edit News Tab
```
┌─────────────────────────────────────────┐
│ Edit News Tab                      [×]  │
├─────────────────────────────────────────┤
│ Tab Name: [My Portfolio]                │
│ Icon: [📊 ▼]                            │
│                                         │
│ Layout Style:                           │
│ ● Feed  ○ Grid  ○ Magazine  ○ Compact  │
│                                         │
│ Filters:                                │
│ Sources: [All ▼]                        │
│ Categories: [All ▼]                     │
│ Tickers: [Portfolio holdings]           │
│ Sectors: [All ▼]                        │
│                                         │
│ Sort by: [Relevance ▼]                  │
│                                         │
│ Auto-refresh: [✓]                       │
│ Refresh interval: [15 minutes ▼]       │
│                                         │
│ [Save]  [Cancel]                        │
└─────────────────────────────────────────┘
```

---

## 3. Portfolio Settings

### Default Settings
- Default currency
- Default exchange
- Commission rates
- Tax settings
- Dividend reinvestment preferences

### Display Preferences
```
┌─────────────────────────────────────────┐
│ PORTFOLIO DISPLAY                       │
├─────────────────────────────────────────┤
│ Default view: [Grid ▼]                  │
│ Show cost basis: [✓]                    │
│ Show unrealized P/L: [✓]                │
│ Show daily change: [✓]                  │
│ Show allocation %: [✓]                  │
│                                         │
│ Color scheme:                           │
│ Gains: [Green ▼]                        │
│ Losses: [Red ▼]                         │
│                                         │
│ Number format:                          │
│ Decimals: [2 ▼]                         │
│ Thousands separator: [Comma ▼]          │
└─────────────────────────────────────────┘
```

---

## 4. Display Settings

### Theme
```
┌─────────────────────────────────────────┐
│ APPEARANCE                              │
├─────────────────────────────────────────┤
│ Theme: ● Dark  ○ Light  ○ Auto          │
│                                         │
│ Accent color:                           │
│ [🔵] [🟢] [🟣] [🟠] [🔴]                │
│                                         │
│ Font size: [Medium ▼]                   │
│ Compact mode: [ ]                       │
└─────────────────────────────────────────┘
```

### Dashboard Layout
- Widget preferences
- Default monitor view
- Chart preferences

---

## 5. Notifications

### News Notifications
```
┌─────────────────────────────────────────┐
│ NEWS ALERTS                             │
├─────────────────────────────────────────┤
│ Breaking news: [✓]                      │
│ Portfolio-related news: [✓]             │
│ High importance only: [✓]               │
│                                         │
│ Notification method:                    │
│ [✓] In-app                              │
│ [✓] Browser push                        │
│ [ ] Email                               │
│ [ ] SMS                                 │
│                                         │
│ Quiet hours:                            │
│ From: [22:00] To: [08:00]               │
└─────────────────────────────────────────┘
```

### Portfolio Alerts
- Price alerts
- P/L thresholds
- Dividend announcements
- Earnings dates

### Event Notifications
- Economic calendar events
- Earnings releases
- Corporate actions

---

## 6. Privacy & Security

### Data Privacy
- Data sharing preferences
- Analytics opt-in/out
- Third-party integrations

### Security
- Two-factor authentication
- Session management
- API key management
- Connected devices

---

## 7. Data & Backup

### Backup Settings
```
┌─────────────────────────────────────────┐
│ AUTOMATIC BACKUPS                       │
├─────────────────────────────────────────┤
│ Enable auto-backup: [✓]                 │
│ Frequency: [Daily ▼]                    │
│ Retention: [30 days ▼]                  │
│ Last backup: 2 hours ago                │
│                                         │
│ [Create Backup Now]                     │
│ [Restore from Backup]                   │
│ [Download All Data]                     │
└─────────────────────────────────────────┘
```

### Import/Export
- CSV import
- JSON export
- Portfolio migration

---

## 8. Integrations

### Brokerage Connections
- Interactive Brokers
- TD Ameritrade
- Robinhood
- etc.

### Data Providers
- Market data APIs
- News APIs
- Analytics services

### Third-party Apps
- Trading platforms
- Tax software
- Spreadsheet sync

---

## 9. Advanced Settings

### API Configuration
```
┌─────────────────────────────────────────┐
│ API KEYS                                │
├─────────────────────────────────────────┤
│ Market Data API:                        │
│ Provider: [Alpha Vantage ▼]             │
│ API Key: [••••••••••••••] [Edit]        │
│ Status: ✓ Active                        │
│                                         │
│ News API:                               │
│ Provider: [NewsAPI.org ▼]               │
│ API Key: [••••••••••••••] [Edit]        │
│ Status: ✓ Active                        │
│                                         │
│ [+ Add API Key]                         │
└─────────────────────────────────────────┘
```

### Performance
- Cache settings
- Data refresh intervals
- Preload preferences

### Developer Options
- Debug mode
- API logs
- Performance metrics

---

## Implementation Notes

### State Management
```typescript
interface SettingsState {
  account: AccountSettings;
  newsSources: NewsSourceSettings;
  portfolio: PortfolioSettings;
  display: DisplaySettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  backup: BackupSettings;
  integrations: IntegrationSettings;
  advanced: AdvancedSettings;
}

interface NewsSourceSettings {
  sources: NewsSourceCredentials[];
  filtering: AIFilteringPreferences;
  tabs: NewsTab[];
  defaultTab: string;
}
```

### Validation
- Validate API keys before saving
- Test news source connections
- Verify backup integrity
- Check integration permissions

### Security
- Encrypt stored credentials
- Use secure storage for API keys
- Implement rate limiting
- Audit log for sensitive changes

---

## UI Components Needed

1. **SettingsLayout** - Main container with sidebar
2. **SettingsSection** - Individual setting sections
3. **SourceCard** - News source display/config
4. **CredentialModal** - Add/edit credentials
5. **TabEditor** - News tab configuration
6. **ConnectionTester** - Test API connections
7. **BackupManager** - Backup/restore interface
8. **NotificationPreferences** - Alert configuration
9. **ThemeSelector** - Appearance customization
10. **APIKeyManager** - API key management

---

## Responsive Design

### Desktop (>1024px)
- Sidebar navigation
- Full-width content area
- Multi-column layouts

### Tablet (768px-1024px)
- Collapsible sidebar
- Single column content
- Touch-friendly controls

### Mobile (<768px)
- Bottom navigation
- Stacked sections
- Simplified forms

---

## Accessibility

- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus indicators
- ARIA labels
- Error announcements

---

## Testing Checklist

- [ ] Add/remove news sources
- [ ] Test authentication methods
- [ ] Create/edit/delete news tabs
- [ ] Validate API connections
- [ ] Test backup/restore
- [ ] Verify notification delivery
- [ ] Check theme switching
- [ ] Test on all screen sizes
- [ ] Verify data encryption
- [ ] Test account switching
