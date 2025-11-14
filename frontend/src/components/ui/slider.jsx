import React from "react";

export function Slider({ value, onValueChange, min = 1, max = 12, step = 1, className = "" }) {
  return (
    <input
      className={className}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
    />
  );
}
