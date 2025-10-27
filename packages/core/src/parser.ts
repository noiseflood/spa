/**
 * SPA XML Parser - Converts SPA XML to JavaScript AST
 */

import type {
  SPADocument,
  SPASound,
  ToneElement,
  NoiseElement,
  GroupElement,
  ADSREnvelope,
  AutomationCurve,
  FilterConfig,
  ParseOptions,
  ParseResult,
  WaveformType,
  NoiseColor,
  FilterType,
  CurveType
} from '@spa/types';

/**
 * Parse SPA XML string into a document object
 */
export function parseSPA(
  xml: string,
  options: ParseOptions = {}
): SPADocument {
  const {
    validate = true,
    resolveReferences = true,
    strict = false,
    allowComments = true
  } = options;

  // Remove comments if not allowed
  let cleanXml = xml;
  if (!allowComments) {
    cleanXml = xml.replace(/<!--[\s\S]*?-->/g, '');
  }

  // Parse XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanXml, 'text/xml');

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`XML parsing error: ${parserError.textContent}`);
  }

  const root = doc.documentElement;
  if (root.tagName !== 'spa') {
    throw new Error('Root element must be <spa>');
  }

  const version = root.getAttribute('version');
  if (!version) {
    throw new Error('Missing version attribute on <spa> element');
  }

  // Parse definitions if present
  const defs = parseDefinitions(root);

  // Parse sound elements
  const sounds = parseChildren(root, defs, resolveReferences);

  return {
    version,
    xmlns: root.getAttribute('xmlns') || undefined,
    defs,
    sounds
  };
}

/**
 * Parse definitions section
 */
function parseDefinitions(root: Element): any {
  const defsEl = root.querySelector('defs');
  if (!defsEl) return undefined;

  const envelopes: Record<string, ADSREnvelope> = {};

  defsEl.querySelectorAll('envelope').forEach(el => {
    const id = el.getAttribute('id');
    if (!id) throw new Error('Envelope in defs missing id attribute');

    envelopes[id] = {
      attack: parseFloat(el.getAttribute('attack') || '0'),
      decay: parseFloat(el.getAttribute('decay') || '0'),
      sustain: parseFloat(el.getAttribute('sustain') || '1'),
      release: parseFloat(el.getAttribute('release') || '0')
    };
  });

  return { envelopes };
}

/**
 * Parse child sound elements
 */
function parseChildren(
  parent: Element,
  defs?: any,
  resolveRefs: boolean = true
): SPASound[] {
  const sounds: SPASound[] = [];

  for (const child of Array.from(parent.children)) {
    if (child.tagName === 'defs') continue;

    if (child.tagName === 'tone') {
      sounds.push(parseTone(child, defs, resolveRefs));
    } else if (child.tagName === 'noise') {
      sounds.push(parseNoise(child, defs, resolveRefs));
    } else if (child.tagName === 'group') {
      sounds.push(parseGroup(child, defs, resolveRefs));
    }
  }

  return sounds;
}

/**
 * Parse tone element
 */
function parseTone(
  el: Element,
  defs?: any,
  resolveRefs: boolean = true
): ToneElement {
  const wave = el.getAttribute('wave') as WaveformType;
  if (!wave) {
    throw new Error('Tone element missing required wave attribute');
  }

  const freq = parseNumericOrAutomation(el, 'freq');
  if (freq === undefined) {
    throw new Error('Tone element missing required freq attribute');
  }

  const dur = parseFloat(el.getAttribute('dur') || '0');
  if (dur <= 0) {
    throw new Error('Tone element missing required dur attribute');
  }

  return {
    type: 'tone',
    id: el.getAttribute('id') || undefined,
    wave,
    freq,
    dur,
    amp: parseNumericOrAutomation(el, 'amp'),
    envelope: parseEnvelope(el, defs, resolveRefs),
    pan: parseNumericOrAutomation(el, 'pan'),
    filter: parseFilter(el),
    phase: el.hasAttribute('phase')
      ? parseFloat(el.getAttribute('phase')!)
      : undefined
  };
}

/**
 * Parse noise element
 */
function parseNoise(
  el: Element,
  defs?: any,
  resolveRefs: boolean = true
): NoiseElement {
  const color = el.getAttribute('color') as NoiseColor;
  if (!color) {
    throw new Error('Noise element missing required color attribute');
  }

  const dur = parseFloat(el.getAttribute('dur') || '0');
  if (dur <= 0) {
    throw new Error('Noise element missing required dur attribute');
  }

  return {
    type: 'noise',
    id: el.getAttribute('id') || undefined,
    color,
    dur,
    amp: parseNumericOrAutomation(el, 'amp'),
    envelope: parseEnvelope(el, defs, resolveRefs),
    pan: parseNumericOrAutomation(el, 'pan'),
    filter: parseFilter(el)
  };
}

/**
 * Parse group element
 */
function parseGroup(
  el: Element,
  defs?: any,
  resolveRefs: boolean = true
): GroupElement {
  const sounds = parseChildren(el, defs, resolveRefs);

  return {
    type: 'group',
    id: el.getAttribute('id') || undefined,
    sounds,
    amp: el.hasAttribute('amp')
      ? parseFloat(el.getAttribute('amp')!)
      : undefined,
    pan: el.hasAttribute('pan')
      ? parseFloat(el.getAttribute('pan')!)
      : undefined
  };
}

/**
 * Parse numeric value or automation curve
 */
function parseNumericOrAutomation(
  el: Element,
  param: string
): number | AutomationCurve | undefined {
  const value = el.getAttribute(param);
  const start = el.getAttribute(`${param}.start`);
  const end = el.getAttribute(`${param}.end`);
  const curve = el.getAttribute(`${param}.curve`) as CurveType;

  if (start && end) {
    return {
      start: parseFloat(start),
      end: parseFloat(end),
      curve: curve || 'linear'
    };
  }

  if (value) {
    return parseFloat(value);
  }

  return undefined;
}

/**
 * Parse envelope (inline or reference)
 */
function parseEnvelope(
  el: Element,
  defs?: any,
  resolveRefs: boolean = true
): ADSREnvelope | string | undefined {
  const envAttr = el.getAttribute('envelope');
  if (!envAttr) return undefined;

  // Check if it's a reference (#id)
  if (envAttr.startsWith('#')) {
    const refId = envAttr.slice(1);
    if (resolveRefs && defs?.envelopes?.[refId]) {
      return defs.envelopes[refId];
    }
    return envAttr; // Return reference string
  }

  // Parse inline format: "a,d,s,r"
  const parts = envAttr.split(',').map(s => s.trim());
  if (parts.length !== 4) {
    throw new Error(`Invalid envelope format: ${envAttr}`);
  }

  const [a, d, s, r] = parts.map(parseFloat);
  return {
    attack: a,
    decay: d,
    sustain: s,
    release: r
  };
}

/**
 * Parse filter configuration
 */
function parseFilter(el: Element): FilterConfig | undefined {
  const filterType = el.getAttribute('filter') as FilterType;
  if (!filterType) return undefined;

  const cutoff = parseNumericOrAutomation(el, 'cutoff');
  if (!cutoff) {
    throw new Error('Filter requires cutoff attribute');
  }

  return {
    type: filterType,
    cutoff,
    resonance: parseNumericOrAutomation(el, 'resonance'),
    gain: el.hasAttribute('gain')
      ? parseFloat(el.getAttribute('gain')!)
      : undefined,
    detune: el.hasAttribute('detune')
      ? parseFloat(el.getAttribute('detune')!)
      : undefined
  };
}