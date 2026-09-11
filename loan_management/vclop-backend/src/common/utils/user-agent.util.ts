import * as UAParser from 'ua-parser-js';

export interface ParsedUA {
  browser: string;
  os: string;
  device: string;
}

export function parseUserAgent(userAgent: string): ParsedUA {
  const parser = new UAParser.UAParser(userAgent);
  const result = parser.getResult();

  const browser = [result.browser.name, result.browser.version].filter(Boolean).join(' ') || 'Unknown';
  const os = [result.os.name, result.os.version].filter(Boolean).join(' ') || 'Unknown';
  const device = result.device.type ?? (result.device.model ? 'Mobile' : 'Desktop');

  return { browser, os, device };
}
