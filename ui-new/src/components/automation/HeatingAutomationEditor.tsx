import {Flame, Plus, Trash2} from "lucide-react";
import {PrimaryButton} from "@/src/components/actionComponents/PrimaryButton.tsx";
import {SliderCDN} from "@/src/components/actionComponents/Slider.tsx";
import {
    buildHeatingTimelineSegments,
    getHeatingDayLabel,
    HeatingDaySchedule,
    HeatingPeriod,
    minutesToTimeInput,
    normalizeHeatingPeriods,
    timeInputToMinutes
} from "@/src/utils/heatingAutomation.ts";

type HeatingAutomationEditorProps = {
    schedules: HeatingDaySchedule[],
    roomName?: string,
    onChange: (nextSchedules: HeatingDaySchedule[]) => void
};

const MINUTES_PER_DAY = 24 * 60;

const temperatureColor = (value: number): string => {
    const clamped = Math.max(6, Math.min(30, value));
    const ratio = (clamped - 6) / (30 - 6);
    const hue = Math.round(220 - ratio * 200);
    return `hsl(${hue}, 72%, 52%)`;
};

const updateSchedulePeriods = (
    schedules: HeatingDaySchedule[],
    scheduleIndex: number,
    mapper: (periods: HeatingPeriod[]) => HeatingPeriod[]
): HeatingDaySchedule[] => {
    return schedules.map((schedule, index) => {
        if (index !== scheduleIndex) return schedule;
        return {
            ...schedule,
            periods: normalizeHeatingPeriods(mapper(schedule.periods))
        };
    });
};

export const HeatingAutomationEditor = ({schedules, roomName, onChange}: HeatingAutomationEditorProps) => {
    if (schedules.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                Keine Heizplan-Daten gefunden.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {schedules.map((schedule, scheduleIndex) => {
                const periods = normalizeHeatingPeriods(schedule.periods);
                const timelineSegments = buildHeatingTimelineSegments(schedule.baseTemperature, periods);
                const lastPeriod = periods[periods.length - 1];

                return (
                    <div key={`day-schedule-${schedule.dayMask}`} className="rounded-xl border border-cyan-100 bg-gradient-to-b from-cyan-50/60 to-white p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
                                <Flame size={12}/>
                                {getHeatingDayLabel(schedule.dayMask)}
                            </span>
                            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                                {periods.length} Zeitraeume
                            </span>
                            {roomName && <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">Raum: {roomName}</span>}
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="relative h-7 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                {timelineSegments.map((segment) => {
                                    const left = (segment.startMinutes / MINUTES_PER_DAY) * 100;
                                    const width = ((segment.endMinutes - segment.startMinutes) / MINUTES_PER_DAY) * 100;
                                    return (
                                        <div
                                            key={`${segment.startMinutes}-${segment.endMinutes}-${segment.temperature}`}
                                            className="absolute inset-y-0"
                                            style={{
                                                left: `${left}%`,
                                                width: `${width}%`,
                                                backgroundColor: temperatureColor(segment.temperature)
                                            }}
                                        />
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                <span>00:00</span>
                                <span>06:00</span>
                                <span>12:00</span>
                                <span>18:00</span>
                                <span>24:00</span>
                            </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-slate-900">Grundtemperatur</div>
                                <div className="text-sm font-semibold text-slate-700">{schedule.baseTemperature.toFixed(1)} °C</div>
                            </div>
                            <div className="mt-3">
                                <SliderCDN
                                    min={6}
                                    max={30}
                                    step={0.5}
                                    value={[schedule.baseTemperature]}
                                    onValueChange={(values) => {
                                        onChange(schedules.map((entry, index) => index === scheduleIndex
                                            ? {...entry, baseTemperature: values[0]}
                                            : entry
                                        ));
                                    }}
                                />
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-slate-500">
                                <span>6.0 °C</span>
                                <span>30.0 °C</span>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            {periods.length === 0 && (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                                    Keine Zeitraeume gesetzt. Fuege einen Zeitraum hinzu.
                                </div>
                            )}

                            {periods.map((period, periodIndex) => (
                                <div key={period.id} className="rounded-lg border border-slate-200 bg-white p-3">
                                    <div className="flex items-center">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Zeitraum {periodIndex + 1}</div>
                                        <button
                                            type="button"
                                            className="ml-auto rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                                            onClick={() => {
                                                onChange(updateSchedulePeriods(schedules, scheduleIndex, (current) => current.filter((entry) => entry.id !== period.id)));
                                            }}
                                            aria-label="Zeitraum entfernen"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>

                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <label className="text-xs font-medium text-slate-700">
                                            Von
                                            <input
                                                type="time"
                                                value={minutesToTimeInput(period.startMinutes)}
                                                onChange={(event) => {
                                                    const nextValue = timeInputToMinutes(event.target.value);
                                                    if (nextValue === undefined) return;
                                                    onChange(updateSchedulePeriods(schedules, scheduleIndex, (current) => current.map((entry) => entry.id === period.id ? {
                                                        ...entry,
                                                        startMinutes: nextValue
                                                    } : entry)));
                                                }}
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                                            />
                                        </label>
                                        <label className="text-xs font-medium text-slate-700">
                                            Bis
                                            <input
                                                type="time"
                                                value={period.endMinutes === MINUTES_PER_DAY ? "23:59" : minutesToTimeInput(period.endMinutes)}
                                                onChange={(event) => {
                                                    const nextValue = timeInputToMinutes(event.target.value);
                                                    if (nextValue === undefined) return;
                                                    onChange(updateSchedulePeriods(schedules, scheduleIndex, (current) => current.map((entry) => entry.id === period.id ? {
                                                        ...entry,
                                                        endMinutes: nextValue === 23 * 60 + 59 ? MINUTES_PER_DAY : nextValue
                                                    } : entry)));
                                                }}
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                                            />
                                        </label>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="text-xs font-medium text-slate-700">Temperatur</div>
                                        <div className="text-sm font-semibold text-slate-700">{period.temperature.toFixed(1)} °C</div>
                                    </div>
                                    <div className="mt-2">
                                        <SliderCDN
                                            min={6}
                                            max={30}
                                            step={0.5}
                                            value={[period.temperature]}
                                            onValueChange={(values) => {
                                                onChange(updateSchedulePeriods(schedules, scheduleIndex, (current) => current.map((entry) => entry.id === period.id ? {
                                                    ...entry,
                                                    temperature: values[0]
                                                } : entry)));
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <PrimaryButton
                                onClick={() => {
                                    const suggestedStart = Math.min((lastPeriod?.endMinutes ?? 6 * 60), 22 * 60);
                                    const suggestedEnd = Math.min(suggestedStart + 120, MINUTES_PER_DAY);
                                    const nextPeriod: HeatingPeriod = {
                                        id: `period-${schedule.dayMask}-${Date.now()}`,
                                        startMinutes: suggestedStart,
                                        endMinutes: Math.max(suggestedStart + 30, suggestedEnd),
                                        temperature: Math.max(6, Math.min(30, schedule.baseTemperature + 2))
                                    };

                                    onChange(updateSchedulePeriods(schedules, scheduleIndex, (current) => [...current, nextPeriod]));
                                }}
                            >
                                <span className="inline-flex items-center gap-2"><Plus size={14}/>Zeitraum hinzufuegen</span>
                            </PrimaryButton>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

