# 🧩 Portfolio Tool — Mock UI Documentation
### *(Front-End Showcase – Mock Data Only)*

> **Note:**  
> This build is a **mock UI** for portfolio management. It demonstrates interface flow, layout, and interactions, but uses **simulated data** (no backend, live API, or brokerage integration).  
> All numbers, tickers, and metrics are **dummy values** for display purposes only.

---

## 🗂️ Project Overview

The **Portfolio Tool UI** visualises what a full investment management dashboard could look like.  
It is designed to emulate a modern, responsive platform for managing, analysing, and exploring ETFs and portfolios — without real data connections.

---

## 🧭 Page & Component Index

| Page | Purpose | Data Type |
|------|----------|------------|
| **1. Portfolio Dashboard** | View holdings, allocation, and performance | Mock portfolio + simulated prices |
| **2. ETF Explorer** | Search, filter, and analyse ETFs | Mock ETF list + randomised stats |
| **3. News & Insights** | Read curated financial news relevant to holdings | Static sample headlines |
| **4. Earnings & Events Calendar** | Track earnings, dividends, and macro events | Static list of events |
| **5. Overlap Analysis** | Detect duplicate holdings across ETFs | Mock ETF overlap matrix |
| **6. Analytics & Insights** | Display simulated performance/risk metrics | Simulated Sharpe, Beta, Volatility |
| **7. Settings / Profile** | Adjust preferences and integrations | Static forms + theme toggle |

---

## ⚙️ Technology Stack (UI Mock)
- **Frontend:** React + Vite  
- **Styling:** TailwindCSS + ShadCN UI Components  
- **Charts:** Recharts / ApexCharts  
- **Icons:** Lucide React  
- **Animations:** Framer Motion (optional transitions)  
- **Data:** Static JSON files (no API)  

---

## 🧱 Folder Structure (Mock UI)

```plaintext
/src
 ├── components/
 │   ├── Navbar.tsx
 │   ├── Sidebar.tsx
 │   ├── PortfolioCard.tsx
 │   ├── HoldingsTable.tsx
 │   ├── ChartComponent.tsx
 │   ├── PieChartComponent.tsx
 │   ├── ETFCard.tsx
 │   ├── NewsCard.tsx
 │   ├── CalendarItem.tsx
 │   ├── Heatmap.tsx
 │   ├── SimulationPanel.tsx
 │   ├── ModalETFDetails.tsx
 │   └── Loader.tsx
 │
 ├── pages/
 │   ├── PortfolioPage.tsx
 │   ├── ETFExplorer.tsx
 │   ├── NewsPage.tsx
 │   ├── EventsPage.tsx
 │   ├── OverlapPage.tsx
 │   ├── AnalyticsPage.tsx
 │   └── SettingsPage.tsx
 │
 ├── data/
 │   ├── mockPortfolio.json
 │   ├── mockETFs.json
 │   ├── mockNews.json
 │   ├── mockEvents.json
 │   └── mockOverlap.json
 │
 ├── utils/
 │   ├── formatCurrency.ts
 │   ├── calcWeights.ts
 │   └── generateMockData.ts
 │
 ├── App.tsx
 └── main.tsx
```

---

## 🧩 Detailed Page Documentation

### **1. Portfolio Dashboard**
**File:** `/pages/PortfolioPage.tsx`
- Central portfolio view with value, allocations, and core–satellite split.
- Sections: Summary cards, performance chart, holdings table, allocations visuals.
- Data: `/data/mockPortfolio.json`

### **2. ETF Explorer**
**File:** `/pages/ETFExplorer.tsx`
- Discover ETFs by filters and view details in a modal.
- Data: `/data/mockETFs.json`

### **3. News & Insights**
**File:** `/pages/NewsPage.tsx`
- Simulated financial news feed with category tags and sentiment.
- Data: `/data/mockNews.json`

### **4. Earnings & Events Calendar**
**File:** `/pages/EventsPage.tsx`
- Mock earnings, dividends, and macro calendar.
- Data: `/data/mockEvents.json`

### **5. Overlap Analysis**
**File:** `/pages/OverlapPage.tsx`
- Simulated overlap detection between ETFs.
- Data: `/data/mockOverlap.json`

### **6. Analytics & Insights**
**File:** `/pages/AnalyticsPage.tsx`
- Fake risk and performance metrics display.
- Data: `/utils/generateMockData.ts`

### **7. Settings / Profile**
**File:** `/pages/SettingsPage.tsx`
- User preferences and integration placeholders.
- Static only.

---

## 🧠 Component Details

| Component | Description | Data Source |
|------------|--------------|--------------|
| Navbar.tsx | Navigation with theme toggle | Static |
| Sidebar.tsx | Left navigation | Static |
| PortfolioCard.tsx | Portfolio summary card | mockPortfolio |
| HoldingsTable.tsx | Holdings table | mockPortfolio |
| ChartComponent.tsx | Line chart | generateMockData |
| PieChartComponent.tsx | Allocation pie | mockPortfolio |
| ETFCard.tsx | ETF summary tile | mockETFs |
| NewsCard.tsx | Headline and sentiment | mockNews |
| CalendarItem.tsx | Event listing | mockEvents |
| Heatmap.tsx | Overlap matrix | mockOverlap |
| SimulationPanel.tsx | Rebalancing sliders | Local |
| ModalETFDetails.tsx | ETF detail modal | mockETFs |
| Loader.tsx | Loading spinner | Static |

---

## 🧪 Mock Data Example

### `/data/mockPortfolio.json`
```json
{
  "totalValue": 112450,
  "dailyChange": 0.43,
  "holdings": [
    { "ticker": "EQQQ", "name": "Invesco Nasdaq 100 ETF", "weight": 0.32, "price": 400.12, "value": 35984 },
    { "ticker": "VUKE", "name": "Vanguard FTSE 100 ETF", "weight": 0.25, "price": 35.40, "value": 28112 },
    { "ticker": "SPYG", "name": "SPDR S&P 500 Growth ETF", "weight": 0.18, "price": 68.70, "value": 20298 },
    { "ticker": "AGGG", "name": "iShares Global Bond ETF", "weight": 0.15, "price": 102.34, "value": 16888 },
    { "ticker": "SGLN", "name": "iShares Physical Gold", "weight": 0.10, "price": 30.20, "value": 11168 }
  ]
}
```

---

## 📦 Future Extension (Real Build Ideas)
- Live ETF data via LSEG / Yahoo Finance API
- Portfolio analytics integration (Sharpe, volatility)
- Brokerage linking (Plaid / Revolut / IBKR)
- Real-time news scraping via RSS/AI filtering
- AI-driven insights and recommendations

---

## 🧾 License
MIT — free to use for demonstration or portfolio projects.  
© 2025 ALDR Ltd. Mock data and UI design for portfolio presentation only.
