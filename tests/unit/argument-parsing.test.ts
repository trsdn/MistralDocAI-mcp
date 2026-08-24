import { describe, it, expect } from '@jest/globals';
import { parseArgs } from '../../src/index';
import { isSupportedPythonVersion } from '../../src/python-environment';

describe('parseArgs', () => {
  it('returns no options for an empty argument list', () => {
    expect(parseArgs([])).toEqual({});
  });

  it('recognises long and short flags', () => {
    expect(parseArgs(['--test'])).toEqual({ test: true });
    expect(parseArgs(['--help'])).toEqual({ help: true });
    expect(parseArgs(['-h'])).toEqual({ help: true });
    expect(parseArgs(['--version'])).toEqual({ version: true });
    expect(parseArgs(['-v'])).toEqual({ version: true });
  });

  it('ignores unknown arguments instead of failing the process', () => {
    expect(parseArgs(['--unknown', '--test'])).toEqual({ test: true });
  });
});

describe('isSupportedPythonVersion', () => {
  it.each([
    ['Python 3.8.0', true],
    ['Python 3.10.14', true],
    ['Python 3.13.1', true],
    ['Python 4.0.0', true]
  ])('accepts %s', (version, expected) => {
    expect(isSupportedPythonVersion(version)).toBe(expected);
  });

  it.each([['Python 3.7.9'], ['Python 2.7.18'], ['not python at all'], ['']])(
    'rejects %s',
    (version) => {
      expect(isSupportedPythonVersion(version)).toBe(false);
    }
  );
});
