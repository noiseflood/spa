export interface PresetCategory {
  [presetName: string]: string; // preset name -> file path
}

export interface PresetCategories {
  [categoryName: string]: PresetCategory;
}

let cachedCategories: PresetCategories | null = null;

/**
 * Get all preset categories and their presets
 * Dynamically fetches from the API or uses build-time generated data
 */
export function getPresetCategories(): PresetCategories {
  // If we have cached categories, return them
  if (cachedCategories) {
    return cachedCategories;
  }

  // For initial load, return empty object (will be populated by initializePresets)
  return {};
}

/**
 * Initialize preset categories - fetches from API if available, otherwise uses static JSON
 */
export async function initializePresets(): Promise<PresetCategories> {
  if (cachedCategories) {
    return cachedCategories;
  }

  // Try the API first (will work in development)
  try {
    const response = await fetch('/api/presets');
    if (response.ok) {
      const data = await response.json();
      cachedCategories = data.categories;
      return data.categories;
    }
  } catch (error) {
    // API not available, fall back to static JSON
    console.log('API not available, using static presets.json');
  }

  // Use static JSON as fallback (production) or if API fails
  try {
    const presetConfig = await import('../presets/presets.json');
    cachedCategories = presetConfig.default.categories;
    return cachedCategories;
  } catch (error) {
    console.error('Error loading static presets:', error);
    return {};
  }
}

/**
 * Load a preset SPA file
 */
export async function loadPreset(path: string): Promise<string> {
  try {
    const response = await fetch(`/presets/${path}`);
    if (!response.ok) {
      throw new Error(`Failed to load preset: ${path}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading preset ${path}:`, error);
    throw error;
  }
}

/**
 * Get the list of preset names for a category
 */
export function getPresetsForCategory(category: string): string[] {
  const categories = cachedCategories || {};
  const categoryPresets = categories[category];
  return categoryPresets ? Object.keys(categoryPresets) : [];
}

/**
 * Get the file path for a specific preset
 */
export function getPresetPath(category: string, presetName: string): string | null {
  const categories = cachedCategories || {};
  const categoryPresets = categories[category];
  return categoryPresets?.[presetName] || null;
}
