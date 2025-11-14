import React from "react";

export function Card({ children, className = "" }) {
  return <div className={`rounded-lg ${className}`}>{children}</div>;
}

export function CardHeader({ children }) {
  return <div style={{ padding: "12px 18px", borderBottom: "1px solid transparent" }}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={className} style={{ margin: 0 }}>{children}</h3>;
}

export function CardDescription({ children }) {
  return <div style={{ color: "#666", fontSize: 13 }}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={className} style={{ padding: 16 }}>{children}</div>;
}
