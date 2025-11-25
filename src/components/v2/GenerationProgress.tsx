import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, CheckCircle2, Database, Brain, Paintbrush } from "lucide-react";
import { motion } from "framer-motion";

interface GenerationProgressProps {
  progress: {
    phase: 'structure' | 'parsing' | 'population' | 'complete';
    message: string;
    percentage: number;
    details?: string;
  } | null;
}

export function GenerationProgress({ progress }: GenerationProgressProps) {
  if (!progress) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <CardTitle>Initializing AI Generation...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Preparing to generate content</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const phases = [
    {
      id: 'structure',
      label: 'Template Structure',
      icon: Database,
      description: 'Analyzing template and copying slides'
    },
    {
      id: 'parsing',
      label: 'Content Parsing',
      icon: Brain,
      description: 'Extracting information from job description'
    },
    {
      id: 'population',
      label: 'Layer Population',
      icon: Paintbrush,
      description: 'Applying content to creative layers'
    }
  ];

  const currentPhaseIndex = phases.findIndex(p => p.id === progress.phase);
  const isComplete = progress.phase === 'complete';

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {isComplete ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            )}
          </div>
          <CardTitle>
            {isComplete ? 'Generation Complete!' : 'Generating Creative Content'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progress.percentage)}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>

        {/* Current Phase Message */}
        <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-sm font-medium">{progress.message}</p>
          {progress.details && (
            <p className="text-xs text-muted-foreground mt-1">{progress.details}</p>
          )}
        </div>

        {/* Phase Checklist */}
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const isPastPhase = index < currentPhaseIndex;
            const isCurrentPhase = phase.id === progress.phase && !isComplete;
            const isFuturePhase = index > currentPhaseIndex && !isComplete;
            const Icon = phase.icon;

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  isCurrentPhase
                    ? 'bg-primary/5 border-primary/20'
                    : isPastPhase || isComplete
                    ? 'bg-muted/50 border-border'
                    : 'border-border/50'
                }`}
              >
                <div
                  className={`mt-0.5 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    isPastPhase || isComplete
                      ? 'bg-primary text-primary-foreground'
                      : isCurrentPhase
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPastPhase || isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrentPhase ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isCurrentPhase
                        ? 'text-foreground'
                        : isPastPhase || isComplete
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground/60'
                    }`}
                  >
                    {phase.label}
                  </p>
                  <p
                    className={`text-xs ${
                      isCurrentPhase
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground/60'
                    }`}
                  >
                    {phase.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-primary/10 border border-primary/20 rounded-lg"
          >
            <p className="text-sm font-medium text-primary">
              ✨ Your creative is ready to preview!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
