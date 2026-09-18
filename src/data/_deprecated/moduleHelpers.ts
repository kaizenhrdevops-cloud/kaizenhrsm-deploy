// src/utils/moduleHelpers.ts

// We import the modules list and the type from your existing data file
import { modules, Module } from "./ModulesData";

/**
 * Gets a specified number of random modules, excluding a specific one.
 * @param count - The number of random modules to return.
 * @param excludeLink - The 'link' of the module to exclude (e.g., the current page).
 */
export function getRandomModules(count: number, excludeLink: string): Module[] {
  // 1. Filter out the current module
  const filtered = modules.filter((m) => m.link !== excludeLink);

  // 2. Shuffle the filtered array (Fisher-Yates shuffle)
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  // 3. Return the first 'count' items
  return filtered.slice(0, count);
}

/**
 * Gets the next 'count' modules from the list, wrapping around to the start.
 * @param count - The number of next modules to return.
 * @param currentLink - The 'link' of the current module to start from.
 */
export function getNextModules(count: number, currentLink: string): Module[] {
  const totalModules = modules.length;
  // 1. Find the index of the current module
  const currentIndex = modules.findIndex((m) => m.link === currentLink);

  // Fallback: If module isn't found, just return random ones
  if (currentIndex === -1) {
    console.warn(`Module with link ${currentLink} not found in modulesData.ts`);
    return getRandomModules(count, currentLink);
  }

  const result: Module[] = [];
  // 2. Loop to get the next 'count' modules
  for (let i = 1; i <= count; i++) {
    // 3. Use the modulo operator (%) to wrap around the array
    const nextIndex = (currentIndex + i) % totalModules;
    result.push(modules[nextIndex]);
  }

  return result;
}