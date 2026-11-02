import { describe, expect, it } from 'vitest';
import { shellLabel } from '../../../webview-ui/src/shellLabel';

describe('shellLabel', () => {
	it('da el nombre propio de cada shell del catálogo', () => {
		expect(shellLabel('powershell')).toBe('PowerShell');
		expect(shellLabel('bash')).toBe('bash');
		expect(shellLabel('zsh')).toBe('zsh');
		expect(shellLabel('cmd')).toBe('cmd');
	});
});
