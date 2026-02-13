"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface FilterSectionProps {
    title: string;
    options: string[];
    selected: string[];
    onChange: (value: string) => void;
}

const FilterSection = ({ title, options, selected, onChange }: FilterSectionProps) => (
    <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground tracking-wide uppercase">{title}</h4>
        <div className="space-y-2">
            {options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                        id={`${title}-${option}`}
                        checked={selected.includes(option)}
                        onCheckedChange={() => onChange(option)}
                    />
                    <Label
                        htmlFor={`${title}-${option}`}
                        className="text-sm font-normal cursor-pointer text-foreground/90"
                    >
                        {option}
                    </Label>
                </div>
            ))}
        </div>
    </div>
);

export function ETFSearchSidebar({ facets, filters, setFilters }: any) {
    const toggleFilter = (category: keyof typeof filters, value: string) => {
        setFilters((prev: any) => {
            const current = prev[category];
            const updated = current.includes(value)
                ? current.filter((item: string) => item !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    };

    return (
        <Card className="h-fit sticky top-4 border-none shadow-none bg-transparent sm:border sm:bg-card">
            <CardHeader className="pl-0 sm:pl-6">
                <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pl-0 sm:pl-6">
                <FilterSection
                    title="Region"
                    options={facets.regions}
                    selected={filters.region}
                    onChange={(val) => toggleFilter('region', val)}
                />
                <Separator />
                <FilterSection
                    title="Sector"
                    options={facets.sectors}
                    selected={filters.sector}
                    onChange={(val) => toggleFilter('sector', val)}
                />
                <Separator />
                <FilterSection
                    title="Issuer"
                    options={facets.issuers}
                    selected={filters.issuer}
                    onChange={(val) => toggleFilter('issuer', val)}
                />
            </CardContent>
        </Card>
    );
}
