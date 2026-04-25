import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isLovableBuilder() {
  const hostname = window.location.hostname;
  return (
    hostname.includes('lovable.app') || 
    hostname.includes('lovable.dev') || 
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1')
  );
}
