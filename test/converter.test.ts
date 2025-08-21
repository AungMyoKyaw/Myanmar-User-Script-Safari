import { describe, expect, it } from 'vitest';
import {
  convertZ1ToUni,
  detectAndConvert,
  detectZawgyi,
  isMyanmar
} from '../src/converter';

describe('converter basics', () => {
  it('detects myanmar text', () => {
    expect(isMyanmar('မင်္ဂလာပါ')).toBe(true);
    expect(isMyanmar('Hello')).toBe(false);
  });

  it('detects zawgyi pattern', () => {
    expect(detectZawgyi('\u1031\u103b')).toBe(true);
  });

  it('converts placeholder replacements', () => {
    // In Parabaik, U+106A converts to a leading space + U+1009
    expect(convertZ1ToUni('\u106A')).toBe(' \u1009');
  });

  it('applies ordered rules and batch convert', () => {
    const inputs = ['\u106A', 'Hello', '\u1031\u103b'];
    const r = detectAndConvert(inputs, true);
    expect(r[0].converted).toBe(' \u1009');
    expect(r[1].isMyanmar).toBe(false);
    expect(r[2].isZawgyi).toBe(true);
  });

  it('converts several Parabaik legacy codepoints', () => {
    expect(convertZ1ToUni('\u1064')).toBe('\u1004\u103A\u1039');
    // 106A now maps to space+1009
    expect(convertZ1ToUni('\u106A')).toBe(' \u1009');
    expect(convertZ1ToUni('\u1090')).toBe('\u101B');
  });

  it('applies medial and reorder rules (chunk 2)', () => {
    // 1064 should be moved/preserved in front when following a consonant
    // Parabaik ordering yields mapped block + base + pre-vowel
    expect(convertZ1ToUni('\u1031\u1000\u1064')).toBe(
      '\u1004\u103A\u1039\u1000\u1031'
    );
    // ans+u swap
    expect(convertZ1ToUni('\u1036\u102F')).toBe('\u102F\u1036');
  });

  it('applies numeric and normalization cleanups (chunk 3)', () => {
    // Parabaik does not collapse duplicate \u103E here; both map to \u103E
    expect(convertZ1ToUni('\u103D\u1087')).toBe('\u103E\u103E');
    expect(convertZ1ToUni('\u102d\u102d')).toBe('\u102d');
    expect(convertZ1ToUni('\u102f\u102d')).toBe('\u102d\u102f');
  });

  it('more Parabaik-like sequences stay canonical', () => {
    // pre-vowel + base + mapped 1064 should normalize to mapped + pre + base
    expect(convertZ1ToUni('\u1031\u1000\u1064')).toBe(
      '\u1004\u103A\u1039\u1000\u1031'
    );
    // kinzi-like block should not be duplicated; Parabaik ordering yields mapped + base + pre-vowel
    expect(convertZ1ToUni('\u1064\u1031\u1000')).toBe(
      '\u1004\u103A\u1039\u1000\u1031'
    );
    // duplicate dot below and anusvara cleanups
    expect(convertZ1ToUni('\u102d\u102e')).toBe('\u102e');
    // Parabaik leaves duplicate \u1036 as-is (no collapse here)
    expect(convertZ1ToUni('\u1036\u1036')).toBe('\u1036\u1036');
    // dot above + dot below order fix
    expect(convertZ1ToUni('\u1037\u1036')).toBe('\u1036\u1037');
  });
});
