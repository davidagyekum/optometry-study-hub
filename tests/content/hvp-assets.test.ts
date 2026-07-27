import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';

const ASSETS = {
  '/images/courses/visual-perception/retina-landmarks.svg': [1200, 800],
  '/images/courses/visual-perception/retinal-circuit.svg': [1200, 900],
  '/images/courses/visual-perception/photoreceptor-distribution.svg': [1200, 700],
  '/images/courses/visual-perception/visual-pathway-medial-brain.svg': [1200, 800],
  '/images/courses/visual-perception/lgn-layers.svg': [1000, 900],
  '/images/courses/visual-perception/dorsal-ventral-streams.svg': [1200, 800],
} as const;

describe('OPT 374 original assessment diagrams', () => {
  it('provides all six safe, original, responsive SVGs with exact viewBoxes', () => {
    Object.entries(ASSETS).forEach(([src, [width, height]]) => {
      const svg = readFileSync(`public${src}`, 'utf8');
      expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
      expect(svg).not.toMatch(/<script|on(?:click|load|error)=|(?:href|src)=["']https?:\/\/|data:image/i);
      expect(svg).not.toMatch(/<image\b/i);
    });
  });

  it('matches every image question dimension and keeps answer labels out of assets', () => {
    const imageQuestions = humanVisualPerceptionCandidateBank.questions.filter(
      (question) => question.format === 'image_hotspot' || question.format === 'image_label',
    );
    imageQuestions.forEach((question) => {
      const expected = ASSETS[question.image.src as keyof typeof ASSETS];
      expect(expected).toEqual([question.image.width, question.image.height]);
      const svg = readFileSync(`public${question.image.src}`, 'utf8').toLocaleLowerCase();
      if (question.format === 'image_hotspot') {
        question.regions.forEach((region) => {
          expect(svg).not.toContain(region.label.toLocaleLowerCase());
        });
      } else {
        question.labels.forEach((label) => {
          expect(svg).not.toContain(label.text.toLocaleLowerCase());
        });
      }
    });
  });
});
