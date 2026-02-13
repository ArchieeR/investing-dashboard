"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePortfolio } from "@/context/PortfolioContext";
import { parsePortfolioCSV, ParseResult } from "@/services/data_ingestion/csv_parser";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function CSVUploadDialog({ children }: { children?: React.ReactNode }) {
    const { portfolios, addHoldings } = usePortfolio();
    const [open, setOpen] = useState(false);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        const result = await parsePortfolioCSV(file);
        setParseResult(result);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleConfirmImport = () => {
        if (!selectedPortfolioId || !parseResult?.holdings.length) return;

        addHoldings(selectedPortfolioId, parseResult.holdings);
        setOpen(false);
        setParseResult(null);
        setSelectedPortfolioId("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button>Import CSV</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Import Portfolio Data</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file containing your asset holdings.
                        Required columns: Ticker, Quantity, AvgCost.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* 1. Select Portfolio */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Target Portfolio</label>
                        <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a portfolio to sync with..." />
                            </SelectTrigger>
                            <SelectContent>
                                {portfolios.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 2. File Upload Area */}
                    {!parseResult ? (
                        <div
                            className={`
                                border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                            `}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />
                            <div className="bg-muted rounded-full p-4 mb-4">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg mb-1">Click to upload or drag and drop</h3>
                            <p className="text-sm text-muted-foreground">CSV files only (max 2MB)</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-green-500">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="font-medium">File parsed successfully</span>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setParseResult(null)}>
                                    Upload different file
                                </Button>
                            </div>

                            {parseResult.errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Parsing Errors</AlertTitle>
                                    <AlertDescription>
                                        Some rows were skipped:
                                        <ul className="list-disc pl-4 mt-1 text-xs">
                                            {parseResult.errors.slice(0, 3).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <ScrollArea className="h-[300px] border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ticker</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className='text-right'>Quantity</TableHead>
                                            <TableHead className='text-right'>Avg Cost</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parseResult.holdings.map((h, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium font-mono">{h.ticker}</TableCell>
                                                <TableCell>{h.assetType}</TableCell>
                                                <TableCell className="text-right font-mono">{h.quantity}</TableCell>
                                                <TableCell className="text-right font-mono text-muted-foreground">
                                                    {h.avgCost.toFixed(2)} {h.currency}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleConfirmImport}
                        disabled={!selectedPortfolioId || !parseResult || parseResult.holdings.length === 0}
                    >
                        Import {parseResult?.holdings.length || 0} Assets
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
