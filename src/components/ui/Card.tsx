import type { HTMLAttributes } from "react";
import "./Card.css";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`ih-card ${className}`} {...rest}>
      {children}
    </div>
  );
}
