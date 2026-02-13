# Rheos Tech Stack & Architecture

## 1. Core Application (Frontend)

* **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) - *React 19, Server Components.*
* **Language:** [TypeScript](https://www.typescriptlang.org/) - *Type safety.*
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **UI System:** [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
  * *Strategy:* "Copy-Paste" ecosystem. We own the code.
* **Icons:** [Lucide React](https://lucide.dev/)
* **Motion:** [Framer Motion](https://www.framer.com/motion/) - *Premium feel animations.*
* **Interactive Components:**
  * **[Prompt Kit](https://prompt-kit.com/):** *AI Chat Interfaces (Shadcn Compatible).*
  * **[Magic UI](https://magicui.design/):** *High-end "Wow" factors (Marquees, Meteors).*
  * **[Aceternity UI](https://ui.aceternity.com/):** *Hero section aesthetics.*
  * **[Tremor](https://www.tremor.so/):** *Charts & Dashboards.*

## 2. Backend & Infrastructure (Serverless)

* **Cloud Platform:** [Firebase](https://firebase.google.com/) (Google Cloud)
* **Database:** [Firestore](https://firebase.google.com/docs/firestore) - *NoSQL Document Store.*
* **Auth:** Firebase Auth
* **Serverless:** Firebase Cloud Functions (2nd Gen)
* **Storage:** Firebase Storage
* **Billing Sync:** [Stripe](https://stripe.com/) + Firebase Extensions.

## 3. AI & Intelligence Engine

* **Orchestration:** [Genkit](https://firebase.google.com/docs/genkit) - *Google's AI SDK (Node.js).*
* **Models:** Vertex AI (Gemini 2.5 Flash / Gemini 3 Pro) - *Multimodal generation.*
* **Speech-to-Text:** Microsoft Azure Cognitive Services (Whisper).
* **Retrieval:** [Firecrawl](https://firecrawl.dev/) - *Web scraping to LLM-ready data.*
* **Vector Search:** [Pinecone](https://www.pinecone.io/) (Future: Brand Memory).

## 4. Security & Code Health (Enterprise Grade)

* **[Aikido](https://www.aikido.dev/):** *Unified Security Platform.*
  * *Covers:* Code vulnerability scanning, Dependency scanning, Cloud Posture (Firebase permissions), and Secrets detection.
* **[Arcjet](https://arcjet.com/):** *Runtime Protection (Next.js).*
  * *Covers:* API Rate Limiting, Bot Protection, Email Validation.
* **[Firebase App Check](https://firebase.google.com/docs/app-check):** *Infrastructure Integrity.*
  * *Covers:* Ensures only your trusted app can access Firestore/Functions.
* **Code Quality:**
  * **[Sentry](https://sentry.io/):** *Error Tracking & Performance Monitoring.*
  * **[Knip](https://knip.dev/):** *Finds unused code/exports/dependencies.*
  * **[Zod](https://zod.dev/):** *Runtime Schema Validation (Input/Output sanitization).*
  * **[Google Secret Manager](https://cloud.google.com/secret-manager):** *Production Secret Storage.*

## 5. Product Growth & Operations

* **Analytics:**
  * **[PostHog](https://posthog.com/):** *Session Replays, Heatmaps, Feature Flags.*
  * **[Amplitude](https://amplitude.com/):** *Deep Funnel & Cohort Analysis.*
* **Customer Support & Issues:**
  * **[DevRev](https://devrev.ai/):** *Unified Support & Engineering.*
  * *Why:* Connects customer tickets directly to GitHub issues using AI. Replaces Intercom/Jira/Linear.
* **User Engagement:**
  * **[Novu](https://novu.co/):** *Notification Infrastructure (In-App, Email, Push).*
  * **[Resend](https://resend.com/):** *Transactional Email API.*
* **Marketing Intelligence:**
  * **[Attio](https://attio.com/):** *CRM.*
  * **[SparkToro](https://sparktoro.com/):** *Audience Research.*
  * **[GummySearch](https://gummysearch.com/):** *Reddit Intent Mining.*
  * **[Peec AI](https://peec.ai/):** *Viral Content Geo-Tracking.*
  * **[Profound](https://profound.co/):** *AI Search Optimization (GEO).*
  * **[Attensira](https://attensira.com/):** *AI Visibility & Prompt Tracking.*
  * **Billing & Usage:**
    * **Usage Service:** Custom telemetry for AI token tracking.
    * **Sync:** Firestore `ai_usage_daily` -> Stripe.

## 6. Testing Strategy

* **Unit/Integration:** [Jest](https://jestjs.io/) - *Core logic & Service coverage.*
* **End-to-End (E2E):** [Playwright](https://playwright.dev/) - *Critical flows.*
* **Visual Regression:** Chromatic (Future).

## 7. Future / Enterprise Roadmap

* **Vector Search:** Firebase Vector RAG (for Images/Docs).
* **Job Queues:** Cloud Tasks for scheduled posts & AI threading.
* **Documentation:** [Fumadocs](https://fumadocs.dev/) (AI-ready docs).
* **Mobile:** [Capacitor](https://capacitorjs.com/) (Wrap Next.js as iOS/Android app).
