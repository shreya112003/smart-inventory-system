import React, { createContext, useContext, useState } from "react";

const SelectContext = createContext();

export function Select({ value, onValueChange, children }) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);

  const setValue = (val, label) => {
    onValueChange && onValueChange(val);
    setSelectedLabel(label || null);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, setValue, open, setOpen, selectedLabel }}>
      <div>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = "", children }) {
  const ctx = useContext(SelectContext);
  return (
    <div
      className={className}
      onClick={() => ctx.setOpen(!ctx.open)}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
    >
      {children}
    </div>
  );
}

export function SelectContent({ children }) {
  const ctx = useContext(SelectContext);
  if (!ctx.open) return null;
  return (
    <div style={{ marginTop: 6, border: "1px solid #e6e6e6", borderRadius: 8, background: "#fff", boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, { ...child.props, onClickInternal: ctx.setValue });
      })}
    </div>
  );
}

export function SelectItem({ value, children, onClickInternal }) {
  return (
    <div
      onClick={() => onClickInternal && onClickInternal(value, typeof children === "string" ? children : null)}
      style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f1f1" }}
    >
      {children}
    </div>
  );
}

export function SelectValue({ placeholder }) {
  const ctx = useContext(SelectContext);
  return <span>{ctx.selectedLabel || placeholder}</span>;
}
