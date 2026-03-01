"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/src/utils/cn-helper.ts"

type SliderVariant = "default" | "climate";

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    variant?: SliderVariant
};

const climateColor = (value: number, min: number, max: number): string => {
    if (max <= min) return "hsl(193 88% 46%)";
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const hue = 210 - normalized * 200;
    return `hsl(${hue} 88% 52%)`;
};

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    SliderProps
>(({ className, variant = "default", min, max, value, defaultValue, ...props }, ref) => {
    const minValue = typeof min === "number" ? min : 0;
    const maxValue = typeof max === "number" ? max : 100;
    const currentValue = Array.isArray(value)
        ? value[0]
        : Array.isArray(defaultValue)
            ? defaultValue[0]
            : minValue;

    const accentColor = variant === "climate"
        ? climateColor(Number(currentValue ?? minValue), minValue, maxValue)
        : "hsl(193 88% 46%)";

    return (
        <SliderPrimitive.Root
            ref={ref}
            className={cn(
                "relative flex w-full touch-none select-none items-center",
                className
            )}
            style={{"--slider-accent": accentColor} as React.CSSProperties}
            min={min}
            max={max}
            value={value}
            defaultValue={defaultValue}
            {...props}
        >
            <SliderPrimitive.Track className={cn(
                "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary dark:bg-slate-700",
                variant === "climate" && "bg-gradient-to-r from-sky-300/30 via-cyan-300/30 to-rose-300/30 dark:from-sky-700/40 dark:via-cyan-700/30 dark:to-rose-700/35"
            )}>
                <SliderPrimitive.Range className="absolute h-full rounded-full bg-[var(--slider-accent)]" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[var(--slider-accent)] bg-white shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-950" />
        </SliderPrimitive.Root>
    );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider as SliderCDN }
