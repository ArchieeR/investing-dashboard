# Phase 1: The "Keep It Simple" Execution Plan

**Goal:** A working "Look-Through" dashboard for a UK investor.

## 1. Database Setup
*   Create the `Assets` and `Holdings` collections in Firestore/BigQuery.
*   Implement the **Universal Asset Schema**.

## 2. FMP Integration
*   Connect the "Easy Pipe" (Prices & US Data) as our primary baseline.
*   Ensure we can fetch and store basic price data for US stocks.

## 3. Vanguard MVP
*   **Objective:** PROVE we can ingest a CSV, normalize it, and make it searchable in the dashboard.
*   **Constraint:** Build **one single scraper script** for Vanguard UCITS ETFs.
*   **Limit:** Do not over-engineer a generic scraping engine yet. Just make Vanguard work.
