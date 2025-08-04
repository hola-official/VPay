import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Repeat } from "lucide-react";

export function VestingSchedule({ schedule, setSchedule }) {
  const updateSchedule = (field, value) => {
    setSchedule({ ...schedule, [field]: value });
  };

  return (
    <Card className="p-4 bg-slate-800/40 border-slate-700/30">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <Label className="text-slate-300 font-medium">Vesting Schedule</Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-400 text-sm flex items-center space-x-2">
            <Clock className="w-3 h-3" />
            <span>Cliff Period (months)</span>
          </Label>
          <Input
            type="number"
            placeholder="3"
            value={schedule.cliff}
            onChange={(e) => updateSchedule("cliff", e.target.value)}
            className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-400 text-sm flex items-center space-x-2">
            <Calendar className="w-3 h-3" />
            <span>Total Duration (months)</span>
          </Label>
          <Input
            type="number"
            placeholder="12"
            value={schedule.duration}
            onChange={(e) => updateSchedule("duration", e.target.value)}
            className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-400 text-sm flex items-center space-x-2">
            <Repeat className="w-3 h-3" />
            <span>Release Intervals</span>
          </Label>
          <Input
            type="number"
            placeholder="30"
            value={schedule.intervals}
            onChange={(e) => updateSchedule("intervals", e.target.value)}
            className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-blue-300 text-sm">
          <strong>Schedule Preview:</strong> After a {schedule.cliff || "3"}{" "}
          month cliff period, tokens will be released every{" "}
          {schedule.intervals || "30"} days over {schedule.duration || "12"}{" "}
          months.
        </p>
      </div>
    </Card>
  );
}
