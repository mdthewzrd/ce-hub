"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps {
  className?: string;
  value?: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value = [0], onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [Number(e.target.value)];
      onValueChange?.(newValue);
    };

    return (
      <div className={cn("relative flex w-full items-center", className)} ref={ref}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0] || 0}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value[0] || 0) - min) / (max - min) * 100}%, #e5e7eb ${((value[0] || 0) - min) / (max - min) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }