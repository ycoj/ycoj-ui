import { parseScoreboardRecord } from './scoreboard-presentation';
import { describe, expect, it } from 'vitest';

describe('parseScoreboardRecord', () => {
  it('replaces check icons and keeps the surrounding record text', () => {
    expect(
      parseScoreboardRecord('<span class="icon icon-check"></span>\n00:12')
    ).toEqual([{ text: '✓\n00:12', tone: 'normal' }]);
  });
  it('emphasizes orange spans as partial scores', () => {
    expect(
      parseScoreboardRecord('-1 <span style="color:orange">+2</span>')
    ).toEqual([
      { text: '-1 ', tone: 'normal' },
      { text: '+2', tone: 'partial' },
    ]);
  });
  it('keeps normal text between multiple orange spans', () => {
    expect(
      parseScoreboardRecord(
        'a<span style="color:orange">b</span>c<span style="color:orange">d</span>'
      )
    ).toEqual([
      { text: 'a', tone: 'normal' },
      { text: 'b', tone: 'partial' },
      { text: 'c', tone: 'normal' },
      { text: 'd', tone: 'partial' },
    ]);
  });
  it('passes unrecognized markup through literally', () => {
    expect(
      parseScoreboardRecord('<b>x</b> <span style="color:red">y</span>')
    ).toEqual([
      { text: '<b>x</b> <span style="color:red">y</span>', tone: 'normal' },
    ]);
  });
});
