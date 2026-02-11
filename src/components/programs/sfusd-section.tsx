import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { SFUSD_DISCLAIMER } from "@/lib/config/cities/sf";
import type { ProgramSfusdLinkage } from "@/types/domain";

interface SfusdSectionProps {
  linkage: ProgramSfusdLinkage;
  attendanceAreaName: string | null;
}

export function SfusdSection({ linkage, attendanceAreaName }: SfusdSectionProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-neutral-900">SFUSD Connection</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-neutral-700">
          {attendanceAreaName && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Attendance Area</span>
              <span className="font-medium">{attendanceAreaName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">School Year</span>
            <span>{linkage.schoolYear}</span>
          </div>
          {linkage.feederElementarySchool && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Feeder School</span>
              <span>{linkage.feederElementarySchool}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">Tiebreaker Eligible</span>
            <span>{linkage.tiebreakerEligible ? "Yes" : "No"}</span>
          </div>
        </div>
        <p className="mt-4 rounded-md bg-neutral-50 p-3 text-xs text-neutral-500">
          {SFUSD_DISCLAIMER}
        </p>
      </CardContent>
    </Card>
  );
}
