import presetConfig from '../presets/presets.json';

export interface PresetCategory {
  [presetName: string]: string; // preset name -> file path
}

export interface PresetCategories {
  [categoryName: string]: PresetCategory;
}

/**
 * Get all preset categories and their presets
 */
export function getPresetCategories(): PresetCategories {
  return presetConfig.categories;
}

/**
 * Load a preset SPA file
 */
export async function loadPreset(path: string): Promise<string> {
  try {
    const response = await fetch(`/api/presets/${path}`);
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
  const categories = getPresetCategories();
  const categoryPresets = categories[category];
  return categoryPresets ? Object.keys(categoryPresets) : [];
}

/**
 * Get the file path for a specific preset
 */
export function getPresetPath(category: string, presetName: string): string | null {
  const categories = getPresetCategories();
  const categoryPresets = categories[category];
  return categoryPresets?.[presetName] || null;
}