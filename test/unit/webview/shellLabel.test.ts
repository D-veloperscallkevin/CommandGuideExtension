import { describe, expect, it } from 'vitest';
import { shellClass, shellLabel, splitAroundShell } from '../../../webview-ui/src/shellLabel';

describe('shellLabel', () => {
	it('da el nombre propio de cada shell del catálogo', () => {
		expect(shellLabel('powershell')).toBe('PowerShell');
		expect(shellLabel('bash')).toBe('bash');
		expect(shellLabel('zsh')).toBe('zsh');
		expect(shellLabel('cmd')).toBe('cmd');
	});
});

describe('shellClass', () => {
	it('da una clase de color por shell', () => {
		expect(shellClass('powershell')).toBe('shell-name shell-powershell');
		expect(shellClass('cmd')).toBe('shell-name shell-cmd');
	});
});

describe('splitAroundShell', () => {
	it('parte el texto alrededor del nombre del shell', () => {
		expect(splitAroundShell((s) => `Terminal: ${s}`)).toEqual({ before: 'Terminal: ', after: '' });
		expect(splitAroundShell((s) => `${s} 用の例`)).toEqual({ before: '', after: ' 用の例' });
	});

	it('sin marcador deja todo el texto antes', () => {
		expect(splitAroundShell(() => 'Terminal')).toEqual({ before: 'Terminal', after: '' });
	});
});
