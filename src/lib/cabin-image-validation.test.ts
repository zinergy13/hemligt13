import { describe, expect, it } from 'vitest';
import { CABIN_IMAGE_MAX_BYTES, validateCabinImage } from './cabin-image-validation';

describe('validateCabinImage', () => {
  it('accepts supported images at the limit', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(validateCabinImage({ type, size: CABIN_IMAGE_MAX_BYTES })).toBeNull();
    }
  });
  it('rejects unsupported, empty, and oversized files', () => {
    expect(validateCabinImage({ type: 'image/svg+xml', size: 100 })).toMatch(/JPG/);
    expect(validateCabinImage({ type: 'image/jpeg', size: 0 })).toMatch(/tom/);
    expect(validateCabinImage({ type: 'image/png', size: CABIN_IMAGE_MAX_BYTES + 1 })).toMatch(/10 MB/);
  });
});