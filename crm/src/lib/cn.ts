import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Тот же помощник, что на сайте: clsx + разрешение конфликтов Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
