import { describe, it, expect } from '@jest/globals';
import { parseArgs } from '../../src/index';
import { isDistributionInstalled, isSupportedPythonVersion } from '../../src/python-environment';

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

describe('isDistributionInstalled', () => {
  const freeze = ['mcp==2.0.0', 'mistralai==2.9.3', 'python-dotenv==1.2.3', ''].join('\n');

  it('matches the pinned form that pip freeze actually emits', () => {
    expect(isDistributionInstalled(freeze, 'mcp')).toBe(true);
    expect(isDistributionInstalled(freeze, 'mistralai')).toBe(true);
  });

  it('normalises the distribution name like PyPI does', () => {
    expect(isDistributionInstalled(freeze, 'python_dotenv')).toBe(true);
    expect(isDistributionInstalled('Pillow==12.3.0', 'pillow')).toBe(true);
  });

  it('matches direct-reference and editable installs', () => {
    expect(isDistributionInstalled('mcp @ file:///tmp/mcp', 'mcp')).toBe(true);
  });

  it('does not match a different distribution with a shared prefix', () => {
    expect(isDistributionInstalled('mcp-server==1.0.0', 'mcp')).toBe(false);
    expect(isDistributionInstalled('', 'mcp')).toBe(false);
  });

  it('ignores comments and blank lines', () => {
    expect(isDistributionInstalled('# mcp==2.0.0\n\n', 'mcp')).toBe(false);
  });
});
