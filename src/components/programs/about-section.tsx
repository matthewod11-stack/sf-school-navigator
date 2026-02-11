import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProgramWithDetails } from "@/types/domain";

interface AboutSectionProps {
  program: ProgramWithDetails;
}

export function AboutSection({ program }: AboutSectionProps) {
  const hasLanguages = program.languages.length > 0;
  const hasTags = program.tags.length > 0;

  if (!hasLanguages && !hasTags) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-neutral-900">About</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hasLanguages && (
            <div>
              <h3 className="text-sm font-medium text-neutral-700">Languages</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {program.languages.map((l) => (
                  <Badge key={l.language} color="blue">
                    {l.language}
                    {l.immersionType !== "exposure" && (
                      <span className="ml-1 opacity-75">({l.immersionType})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {hasTags && (
            <div>
              <h3 className="text-sm font-medium text-neutral-700">Philosophy & Features</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {program.tags.map((t) => (
                  <Badge key={t.tag} color="green">
                    {t.tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
