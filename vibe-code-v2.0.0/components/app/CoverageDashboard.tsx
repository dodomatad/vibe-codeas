'use client';

/**
 * Coverage Dashboard
 * 
 * Visualização em tempo real da cobertura de testes.
 * Ajuda a identificar gaps de testes e melhorar qualidade do código.
 * 
 * @layer MVP
 * @accessibility WCAG 2.1 AA compliant
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface FileCoverage {
  name: string;
  path: string;
  coverage: number;
  statements: { covered: number; total: number };
  branches: { covered: number; total: number };
  functions: { covered: number; total: number };
  lines: { covered: number; total: number };
}

export interface CoverageData {
  overall: CoverageMetrics;
  files: FileCoverage[];
  trends?: {
    statements: number; // % change from last run
    branches: number;
    functions: number;
    lines: number;
  };
  lastUpdated: Date;
}

export interface CoverageDashboardProps {
  data: CoverageData;
  showTrends?: boolean;
  maxFiles?: number;
}

export function CoverageDashboard({ 
  data, 
  showTrends = true,
  maxFiles = 10,
}: CoverageDashboardProps) {
  const getColor = (value: number): string => {
    if (value >= 80) return 'text-green-600 dark:text-green-400';
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getVariant = (value: number): 'default' | 'secondary' | 'destructive' => {
    if (value >= 80) return 'default';
    if (value >= 60) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-600" aria-label="Increasing" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-red-600" aria-label="Decreasing" />;
    return null;
  };

  const sortedFiles = [...data.files]
    .sort((a, b) => a.coverage - b.coverage)
    .slice(0, maxFiles);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Test Coverage Dashboard
              {data.overall.statements >= 80 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Good coverage" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" aria-label="Coverage needs improvement" />
              )}
            </CardTitle>
            <CardDescription>
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </CardDescription>
          </div>
          <Badge variant="outline" className="tabular-nums">
            {data.files.length} files analyzed
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Overall Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['statements', 'branches', 'functions', 'lines'] as const).map((metric) => (
                <div key={metric} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize font-medium">{metric}</span>
                    <div className="flex items-center gap-1">
                      <span className={cn('font-semibold tabular-nums', getColor(data.overall[metric]))}>
                        {data.overall[metric]}%
                      </span>
                      {showTrends && data.trends && getTrendIcon(data.trends[metric])}
                    </div>
                  </div>
                  <Progress 
                    value={data.overall[metric]} 
                    className="h-2"
                    aria-label={`${metric} coverage: ${data.overall[metric]}%`}
                  />
                  {showTrends && data.trends && data.trends[metric] !== 0 && (
                    <p className="text-xs text-muted-foreground">
                      {data.trends[metric] > 0 ? '+' : ''}
                      {data.trends[metric].toFixed(1)}% from last run
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Coverage Status */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h3 className="text-sm font-semibold mb-2">Coverage Status</h3>
              <div className="flex flex-wrap gap-2">
                {data.overall.statements >= 80 ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Excellent
                  </Badge>
                ) : data.overall.statements >= 60 ? (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Good
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Needs Improvement
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {data.overall.statements >= 80
                  ? 'Your codebase has excellent test coverage. Keep it up!'
                  : data.overall.statements >= 60
                  ? 'Good coverage, but there\'s room for improvement.'
                  : 'Consider adding more tests to improve coverage.'}
              </p>
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Showing {Math.min(maxFiles, data.files.length)} files with lowest coverage
            </div>

            <div className="space-y-3">
              {sortedFiles.map((file) => (
                <div
                  key={file.path}
                  className="rounded-lg border p-3 hover:border-primary/50 transition-colors"
                  role="article"
                  aria-label={`${file.name} coverage: ${file.coverage}%`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono text-foreground truncate block">
                        {file.name}
                      </code>
                      <p className="text-xs text-muted-foreground truncate">
                        {file.path}
                      </p>
                    </div>
                    <Badge 
                      variant={getVariant(file.coverage)}
                      className="ml-2 shrink-0 tabular-nums"
                    >
                      {file.coverage}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Statements: </span>
                      <span className="font-medium">
                        {file.statements.covered}/{file.statements.total}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Branches: </span>
                      <span className="font-medium">
                        {file.branches.covered}/{file.branches.total}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Functions: </span>
                      <span className="font-medium">
                        {file.functions.covered}/{file.functions.total}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lines: </span>
                      <span className="font-medium">
                        {file.lines.covered}/{file.lines.total}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {data.files.length > maxFiles && (
              <p className="text-sm text-muted-foreground text-center">
                {data.files.length - maxFiles} more files not shown
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Enterprise Layer: Advanced features
 */
export interface EnterpriseCoverageDashboardProps extends CoverageDashboardProps {
  onFileClick?: (file: FileCoverage) => void;
  enableHistoricalData?: boolean;
  enableExport?: boolean;
  comparisonMode?: boolean;
}

export function EnterpriseCoverageDashboard({
  onFileClick,
  enableHistoricalData = true,
  enableExport = true,
  comparisonMode = false,
  ...props
}: EnterpriseCoverageDashboardProps) {
  // TODO: Implement historical coverage charts
  // TODO: Add export to CSV/PDF
  // TODO: Enable comparison between branches/commits
  // TODO: Show coverage heatmap

  return <CoverageDashboard {...props} />;
}
