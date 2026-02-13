import { adminDb } from "@/lib/firebase/server";
import { fmp } from "@/services/data_ingestion/fmp_client";
import { AssetProfile } from "@/services/data_ingestion/types/fmp.types";
import { Timestamp } from "firebase-admin/firestore";

interface AssetDocument {
    symbol: string;
    profile: AssetProfile;
    lastUpdated: Timestamp;
    type: "stock" | "etf";
}

const COLLECTION = "assets";
const STALE_THRESHOLD_HOURS = 24;

export const assetRepository = {
    /**
     * Retrieves an asset from Firestore or fetches it from FMP if missing/stale.
     * This implements the "Ingestion on Discovery" pattern.
     */
    async getAsset(symbol: string): Promise<AssetDocument> {
        const docRef = adminDb.collection(COLLECTION).doc(symbol);
        const doc = await docRef.get();

        const now = Date.now();
        let needsRefresh = true;
        let data: AssetDocument | undefined;

        if (doc.exists) {
            data = doc.data() as AssetDocument;
            const lastUpdated = data.lastUpdated.toDate().getTime();
            const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);

            if (hoursSinceUpdate < STALE_THRESHOLD_HOURS) {
                needsRefresh = false;
            }
        }

        if (!needsRefresh && data) {
            return data;
        }

        // --- Fetch Fresh Data ---
        console.log(`[AssetRepo] Fetching fresh data for ${symbol}...`);
        const profile = await fmp.getProfile(symbol);

        const newAsset: AssetDocument = {
            symbol: profile.symbol,
            profile: profile,
            lastUpdated: Timestamp.now(),
            type: profile.isEtf ? "etf" : "stock"
        };

        // Saving to Firestore (Fire & Forget or Await based on consistency needs)
        // We await here to ensure UI gets the saved version logic if needed, 
        // but for speed we could also not await. Awaiting is safer for now.
        await docRef.set(newAsset);

        return newAsset;
    }
};
