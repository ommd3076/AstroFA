import { describe, expect, it } from 'vitest';
import { escapeSvgText } from '../src/sky/svgText';

describe('SVG catalog label escaping', () => {
  it('encodes XML metacharacters before labels enter generated SVG markup', () => {
    expect(escapeSvgText(`A&B <script onload="run()"> 'x'`)).toBe(
      'A&amp;B &lt;script onload=&quot;run()&quot;&gt; &apos;x&apos;'
    );
  });

  it('leaves ordinary catalog text unchanged', () => {
    expect(escapeSvgText('ALPHA CENTAURI')).toBe('ALPHA CENTAURI');
  });
});
