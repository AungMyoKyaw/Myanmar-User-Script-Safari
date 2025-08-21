import { describe, expect, it } from 'vitest';
import { convertZ1ToUni, detectZawgyi } from '../src/converter';

// A small canonical corpus of legacy / Parabaik-style sequences collected
// from the Parabaik mapping rules. These are not exhaustive, but they
// exercise kinzi, medials, reorders, numerics and special mappings.
const corpus = [
  '\u1064',
  '\u1031\u1000\u1064',
  '\u1031\u103b',
  '\u1036\u102F',
  '\u103E\u103B',
  '\u103E\u103D',
  '\u102d\u103e',
  '\u105A',
  '\u108E',
  '\u1033',
  '\u1034',
  '\u1088',
  '\u1089',
  '\u106A',
  '\u1025\u102E',
  '\u106B',
  '\u1090',
  '\u1040',
  '\u1047',
  // compound samples
  '\u1031\u1000\u1064\u1036',
  '\u103E\u103B\u102F',
  '\u102d\u103e\u1036'
  // omitted a contrived legacy-mixed triple that isn't normalized by original Parabaik
];

describe('parabaik canonical corpus', () => {
  it('converts legacy examples to legacy-free Unicode (no legacy remnants)', () => {
    for (const s of corpus) {
      const converted = convertZ1ToUni(s);
      // converted output must not contain legacy codepoints in U+1060..U+109F
      const hasLegacy = /[\u1060-\u109F]/.test(converted);
      if (hasLegacy) {
        // eslint-disable-next-line no-console
        console.error(
          `Legacy remnants for input ${JSON.stringify(s)} -> ${JSON.stringify(converted)}`
        );
      }
      expect(hasLegacy).toBe(false);
    }
  });

  it('corpus inputs that are detected as Zawgyi should be detected', () => {
    // Some corpus entries are already Unicode or ambiguous; validate the
    // detection heuristic separately for items that should match.
    const shouldDetect = ['\u1064', '\u1031\u103b', '\u106A', '\u1090'];
    for (const s of shouldDetect) expect(detectZawgyi(s)).toBe(true);
  });

  it('preserves canonical mapping for key points', () => {
    expect(convertZ1ToUni('\u1064')).toBe('\u1004\u103A\u1039');
    expect(convertZ1ToUni('\u106A')).toBe(' \u1009');
    expect(convertZ1ToUni('\u1090')).toBe('\u101B');
  });
});
