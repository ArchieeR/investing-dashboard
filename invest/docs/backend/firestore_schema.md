# Backend Architecture: Firestore Schema

## 1. Collections Structure

### `users`
*   `uid`: string
*   `email`: string
*   `portfolioIds`: string[]

### `portfolios`
*   `id`: string
*   `ownerId`: string
*   `holdings`: Array of { ticker, quantity, costBasis }

### `assets` (Hot Cache)
*   `ticker`: string (Document ID)
*   `name`: string
*   `price`: number
*   `lastUpdated`: timestamp

## 2. Security Rules
*   **Read:** Public for `assets`, Owner-only for `portfolios`.
*   **Write:** Admin-only for `assets`, Owner-only for `portfolios`.
