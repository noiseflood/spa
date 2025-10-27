/**
 * SPA Validator - Validates SPA documents against schema
 */

import type {
  SPADocument,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '@spa/types';

/**
 * Validate SPA XML string
 */
export function validateSPA(xml: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    // Parse XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      errors.push({
        type: 'error',
        code: 'PARSE_ERROR',
        message: parserError.textContent || 'XML parsing failed'
      });
      return { valid: false, errors, warnings };
    }

    const root = doc.documentElement;

    // Validate root element
    if (root.tagName !== 'spa') {
      errors.push({
        type: 'error',
        code: 'INVALID_ROOT',
        message: 'Root element must be <spa>'
      });
    }

    // Validate version
    if (!root.hasAttribute('version')) {
      errors.push({
        type: 'error',
        code: 'MISSING_VERSION',
        message: 'Missing version attribute on <spa> element'
      });
    }

    // Validate children
    validateChildren(root, errors, warnings);

  } catch (error) {
    errors.push({
      type: 'error',
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown validation error'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate child elements
 */
function validateChildren(
  parent: Element,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  for (const child of Array.from(parent.children)) {
    if (child.tagName === 'defs') {
      validateDefs(child, errors, warnings);
    } else if (child.tagName === 'tone') {
      validateTone(child, errors, warnings);
    } else if (child.tagName === 'noise') {
      validateNoise(child, errors, warnings);
    } else if (child.tagName === 'group') {
      validateGroup(child, errors, warnings);
    } else if (child.tagName !== 'parsererror') {
      warnings.push({
        type: 'warning',
        code: 'UNKNOWN_ELEMENT',
        message: `Unknown element: ${child.tagName}`,
        element: child.tagName
      });
    }
  }
}

/**
 * Validate defs element
 */
function validateDefs(
  el: Element,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  for (const child of Array.from(el.children)) {
    if (child.tagName === 'envelope') {
      if (!child.hasAttribute('id')) {
        errors.push({
          type: 'error',
          code: 'MISSING_ID',
          message: 'Envelope in defs missing id attribute',
          element: 'envelope'
        });
      }
    }
  }
}

/**
 * Validate tone element
 */
function validateTone(
  el: Element,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Required attributes
  if (!el.hasAttribute('wave')) {
    errors.push({
      type: 'error',
      code: 'MISSING_ATTRIBUTE',
      message: 'Tone element missing required wave attribute',
      element: 'tone',
      attribute: 'wave'
    });
  } else {
    const wave = el.getAttribute('wave');
    const validWaves = ['sine', 'square', 'triangle', 'saw', 'pulse'];
    if (wave && !validWaves.includes(wave)) {
      errors.push({
        type: 'error',
        code: 'INVALID_VALUE',
        message: `Invalid wave type: ${wave}`,
        element: 'tone',
        attribute: 'wave'
      });
    }
  }

  if (!el.hasAttribute('freq') && !el.hasAttribute('freq.start')) {
    errors.push({
      type: 'error',
      code: 'MISSING_ATTRIBUTE',
      message: 'Tone element missing required freq attribute',
      element: 'tone',
      attribute: 'freq'
    });
  }

  if (!el.hasAttribute('dur')) {
    errors.push({
      type: 'error',
      code: 'MISSING_ATTRIBUTE',
      message: 'Tone element missing required dur attribute',
      element: 'tone',
      attribute: 'dur'
    });
  } else {
    const dur = parseFloat(el.getAttribute('dur')!);
    if (dur <= 0) {
      errors.push({
        type: 'error',
        code: 'INVALID_VALUE',
        message: 'Duration must be positive',
        element: 'tone',
        attribute: 'dur'
      });
    }
  }

  // Validate nested elements
  validateChildren(el, errors, warnings);
}

/**
 * Validate noise element
 */
function validateNoise(
  el: Element,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Required attributes
  if (!el.hasAttribute('color')) {
    errors.push({
      type: 'error',
      code: 'MISSING_ATTRIBUTE',
      message: 'Noise element missing required color attribute',
      element: 'noise',
      attribute: 'color'
    });
  } else {
    const color = el.getAttribute('color');
    const validColors = ['white', 'pink', 'brown', 'blue', 'violet', 'grey'];
    if (color && !validColors.includes(color)) {
      errors.push({
        type: 'error',
        code: 'INVALID_VALUE',
        message: `Invalid noise color: ${color}`,
        element: 'noise',
        attribute: 'color'
      });
    }
  }

  if (!el.hasAttribute('dur')) {
    errors.push({
      type: 'error',
      code: 'MISSING_ATTRIBUTE',
      message: 'Noise element missing required dur attribute',
      element: 'noise',
      attribute: 'dur'
    });
  }

  // Validate nested elements
  validateChildren(el, errors, warnings);
}

/**
 * Validate group element
 */
function validateGroup(
  el: Element,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const children = Array.from(el.children).filter(
    child => child.tagName === 'tone' || child.tagName === 'noise' || child.tagName === 'group'
  );

  if (children.length === 0) {
    warnings.push({
      type: 'warning',
      code: 'EMPTY_GROUP',
      message: 'Group element contains no sound elements',
      element: 'group'
    });
  }

  // Validate nested elements
  validateChildren(el, errors, warnings);
}

/**
 * Alias for validateSPA
 */
export const validate = validateSPA;