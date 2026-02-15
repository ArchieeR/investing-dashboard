import { fmpClient } from "@/lib/fmp";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AssetCharts } from "@/components/features/etf/AssetCharts";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  const [profile, quote] = await Promise.all([
    fmpClient.getProfile(symbol),
    fmpClient.getQuote(symbol),
  ]);

  if (!profile) {
    return notFound();
  }

  const isETF = profile.isEtf;

  let holdings: Awaited<ReturnType<typeof fmpClient.getETFHoldings>> = [];
  let sectors: { name: string; value: number }[] = [];
  let countries: { name: string; value: number }[] = [];

  if (isETF) {
    const [h, s, c] = await Promise.all([
      fmpClient.getETFHoldings(symbol),
      fmpClient.getETFSectorWeightings(symbol),
      fmpClient.getETFCountryWeightings(symbol),
    ]);
    holdings = h;
    sectors = s.map((item) => ({
      name: item.sector,
      value: parseFloat(item.weightPercentage.replace("%", "")),
    }));
    countries = c.map((item) => ({
      name: item.country,
      value: parseFloat(item.weightPercentage.replace("%", "")),
    }));
  }

  const chartData = {
    sectors: sectors.slice(0, 6),
    countries: countries.slice(0, 6),
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/explorer">
          <Button
            variant="ghost"
            className="w-fit pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explorer
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">
                {profile.companyName}
              </h1>
              <Badge variant="secondary" className="text-lg">
                {symbol}
              </Badge>
              {isETF && <Badge variant="outline">ETF</Badge>}
            </div>
            {quote && (
              <div className="flex items-baseline gap-4 mt-2">
                <span className="text-3xl font-bold">
                  ${quote.price.toFixed(2)}
                </span>
                <span
                  className={
                    quote.changePercentage >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {quote.changePercentage > 0 ? "+" : ""}
                  {quote.changePercentage.toFixed(2)}%
                </span>
              </div>
            )}
            {profile.description && (
              <p className="text-lg text-muted-foreground mt-2 max-w-3xl line-clamp-2">
                {profile.description}
              </p>
            )}
          </div>
        </div>
        <Separator />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-full border-0 shadow-none bg-transparent sm:border sm:rounded-xl sm:bg-card/50 sm:shadow-sm">
          <CardHeader>
            <CardTitle>{isETF ? "Top Holdings" : "Key Statistics"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {isETF ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="p-4 font-medium text-muted-foreground">
                        Asset
                      </th>
                      <th className="p-4 font-medium text-muted-foreground text-right w-[100px]">
                        Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.slice(0, 10).map((h, i) => (
                      <tr
                        key={h.asset + i}
                        className="border-t last:border-0 hover:bg-muted/10 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-bold text-primary">{h.asset}</div>
                          <div className="text-muted-foreground">
                            {h.name || h.asset}
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono font-medium">
                          {h.weightPercentage.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                    {holdings.length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="p-6 text-center text-muted-foreground"
                        >
                          No holdings data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <StatItem
                  label="Market Cap"
                  value={
                    quote
                      ? `$${(quote.marketCap / 1e9).toFixed(2)}B`
                      : "N/A"
                  }
                />
                <StatItem label="Exchange" value={profile.exchangeShortName} />
                <StatItem label="Industry" value={profile.industry ?? "N/A"} />
                <StatItem label="Sector" value={profile.sector ?? "N/A"} />
                <StatItem
                  label="Employees"
                  value={profile.fullTimeEmployees ?? "N/A"}
                />
                <StatItem label="Country" value={profile.country ?? "N/A"} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          {isETF ? (
            <AssetCharts
              sectors={chartData.sectors}
              countries={chartData.countries}
            />
          ) : (
            <Card className="border-0 bg-transparent shadow-none sm:border sm:bg-card/50 sm:shadow-sm">
              <CardHeader>
                <CardTitle>About {profile.companyName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {profile.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="text-sm font-medium text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
