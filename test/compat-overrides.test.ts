import { describe, expect, it } from 'vitest';
import { convertZ1ToUni, detectZawgyi } from '../src/converter';

describe('compat overrides (Parabaik parity)', () => {
  const cases: Array<{ input: string; expected: string }> = [
    { input: '\u106A', expected: ' \u1009' },
    { input: '\u1064', expected: '\u1004\u103A\u1039' },
    { input: '\u1090', expected: '\u101B' },
    { input: '\u103D\u1087', expected: '\u103E\u103E' },
    { input: '\u1031\u1000\u1064', expected: '\u1004\u103A\u1039\u1000\u1031' },
    { input: '\u1064\u1031\u1000', expected: '\u1004\u103A\u1039\u1000\u1031' },
    { input: '\u1037\u1036', expected: '\u1036\u1037' }
  ];

  for (const c of cases) {
    it(`convertZ1ToUni(${JSON.stringify(c.input)}) -> ${JSON.stringify(
      c.expected
    )}`, () => {
      // Each override should be detected as Zawgyi and be converted to the
      // well-known canonical sequence used by the project.
      expect(detectZawgyi(c.input)).toBe(true);
      expect(convertZ1ToUni(c.input)).toBe(c.expected);
    });
  }
});
