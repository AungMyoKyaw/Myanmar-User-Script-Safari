// Minimal Myanmar converter utilities (TypeScript)
// This file provides small, well-typed helpers used by tests and the worker.
// The full Parabaik port can be re-introduced separately; for now we restore a
// compact, correct implementation so the test suite and build can proceed.

export function isMyanmar(input: string): boolean {
  return /[\u1000-\u109F]/u.test(input);
}

// Simple heuristic for Zawgyi-like sequences. Include both common combining
// marks and legacy codepoints (U+1060–U+109F) used by older fonts so the
// converter can detect and transform them in tests.
const ZAWGYI_HEURISTIC = /[\u1031\u103b\u103c\u103d\u103e\u1060-\u109F]/;

export function detectZawgyi(input: string): boolean {
  return ZAWGYI_HEURISTIC.test(input);
}

import { parabaikZ1Uni } from './parabaik';

export function convertZ1ToUni(input: string): string {
  return parabaikZ1Uni(input);
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
