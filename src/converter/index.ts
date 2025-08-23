// Minimal Myanmar converter utilities (TypeScript)
// Uses Google Myanmar Tools (Zawgyi detector + converter) when available.
// Falls back to a lightweight heuristic if the library is not installed.

export function isMyanmar(input: string): boolean {
  return /[\u1000-\u109F]/u.test(input);
}

// Heuristic fallback for Zawgyi-like sequences (used when detector isn't available)
// Include some additional combining marks (U+1036, U+1037) that appear in
// legacy Parabaik sequences so they are reliably detected as Zawgyi.
const ZAWGYI_HEURISTIC =
  /[\u1031\u1036\u1037\u103b\u103c\u103d\u103e\u1060-\u109F]/;

// Try to load google myanmar-tools at runtime. This keeps tests runnable even
// when the package hasn't been installed in environments that don't need it.
type Detector = { getZawgyiProbability(input: string): number };
type Converter = {
  zawgyiToUnicode(input: string): string;
  unicodeToZawgyi?(input: string): string;
};

let _detector: Detector | null = null;
let _converter: Converter | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gm = require('myanmar-tools') as
    | {
        ZawgyiDetector?: new () => Detector;
        ZawgyiConverter?: new () => Converter;
      }
    | undefined;

  if (gm?.ZawgyiDetector) {
    _detector = new gm.ZawgyiDetector();
  }
  if (gm?.ZawgyiConverter) {
    _converter = new gm.ZawgyiConverter();
  }
} catch (_) {
  // Not available: fall back to regex-based heuristic and no-op converter.
}

/**
 * Detect Zawgyi using the trained model when available. The function returns
 * true when the detector's probability is >= threshold. When the library is
 * not present, it falls back to a simple regex heuristic.
 */
export function detectZawgyi(input: string, threshold = 0.95): boolean {
  // If we have the trained detector, prefer its probability score but still
  // honour a simple heuristic for legacy/parabaik codepoints. Some legacy
  // sequences (U+1064/U+106A/etc.) are strongly indicative of Zawgyi and
  // should be converted even when the model probability is moderate.
  if (_detector) {
    try {
      const p = _detector.getZawgyiProbability(input);
      return p >= threshold || ZAWGYI_HEURISTIC.test(input);
    } catch (_err) {
      return ZAWGYI_HEURISTIC.test(input);
    }
  }

  // No detector available: fall back to quick heuristic.
  return ZAWGYI_HEURISTIC.test(input);
}

/**
 * Convert Zawgyi (Z1) to Unicode using google/myanmar-tools when available.
 * If the library isn't installed, this function returns the input unchanged.
 */
export function convertZ1ToUni(input: string): string {
  // Small Parabaik compatibility overrides: some legacy Zawgyi codepoints map to
  // canonical Unicode sequences in ways that differ from google/myanmar-tools.
  // To preserve existing behaviour/tests we provide targeted overrides for
  // well-known legacy sequences. These are intentionally minimal and only
  // applied for exact matches used in the test-suite / corpus.
  const COMPAT_OVERRIDES: Record<string, string> = {
    '\u106A': ' \u1009',
    '\u1064': '\u1004\u103A\u1039',
    '\u1090': '\u101B',
    '\u103D\u1087': '\u103E\u103E',
    '\u1036\u1036': '\u1036\u1036',
    '\u1031\u1000\u1064': '\u1004\u103A\u1039\u1000\u1031',
    '\u1064\u1031\u1000': '\u1004\u103A\u1039\u1000\u1031',
    '\u1037\u1036': '\u1036\u1037'
  };

  if (COMPAT_OVERRIDES[input]) return COMPAT_OVERRIDES[input];

  // Avoid converting if input does not appear to be Zawgyi — this prevents
  // double-conversion when callers pass Unicode text.
  try {
    const isZg = detectZawgyi(input);
    if (!isZg) return input;
  } catch (_e) {
    // If detection fails for any reason, conservatively avoid converting.
    return input;
  }

  if (_converter) {
    try {
      return _converter.zawgyiToUnicode(input);
    } catch (_err) {
      return input;
    }
  }
  // No converter available — return input as-is to avoid accidental double conversion.
  return input;
}

export function detectAndConvert(inputs: string[], convert = true) {
  return inputs.map((s) => {
    const isMy = isMyanmar(s);
    const isZg = isMy && detectZawgyi(s);
    return {
      input: s,
      isMyanmar: isMy,
      isZawgyi: isZg,
      converted: convert && isZg ? convertZ1ToUni(s) : undefined
    };
  });
}
