/**
 * 图片URL处理工具测试
 */

import { describe, it, expect } from 'vitest';
import { bustImageCache, processArticleCoverImage } from '../image';

describe('image utils', () => {
  describe('bustImageCache', () => {
    it('should add timestamp to random image API URLs', () => {
      const url = 'https://picapi.pai.al/api/1080P.php';
      const result = bustImageCache(url);

      expect(result).toBeDefined();
      expect(result).toContain(url);
      expect(result).toContain('_t=');
      expect(result).toMatch(/^https:\/\/picapi\.pai\.al\/api\/1080P\.php\?_t=\d+$/);
    });

    it('should handle URLs with existing query params', () => {
      const url = 'https://picsum.photos/800/600?random=1';
      const result = bustImageCache(url);

      expect(result).toBeDefined();
      expect(result).toContain('&_t=');
      expect(result).toMatch(/^https:\/\/picsum\.photos\/800\/600\?random=1&_t=\d+$/);
    });

    it('should not modify normal image URLs', () => {
      const url = 'https://example.com/image.jpg';
      const result = bustImageCache(url);

      expect(result).toBe(url);
    });

    it('should return undefined for undefined input', () => {
      const result = bustImageCache(undefined);

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = bustImageCache('');

      expect(result).toBe('');
    });

    it('should handle invalid URLs', () => {
      const result = bustImageCache('not-a-valid-url');

      expect(result).toBe('not-a-valid-url');
    });
  });

  describe('processArticleCoverImage', () => {
    it('should process random image URLs', () => {
      const url = 'https://picapi.pai.al/api/1080P.php';
      const result = processArticleCoverImage(url);

      expect(result).toBeDefined();
      expect(result).toContain('_t=');
    });

    it('should return undefined for undefined input', () => {
      const result = processArticleCoverImage(undefined);

      expect(result).toBeUndefined();
    });
  });
});