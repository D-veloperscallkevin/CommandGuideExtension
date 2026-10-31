import { describe, expect, it } from 'vitest';
import { bundledCatalog } from '../../../src/catalog/index';
import { checkCatalogRules } from '../../../src/catalog/validate';
import { branchParam, makeCategory, makeCommand } from './fixtures';

describe('checkCatalogRules', () => {
	it('el catálogo real no tiene errores', () => {
		expect(checkCatalogRules(bundledCatalog)).toEqual([]);
	});

	it('detecta un id duplicado entre categorías', () => {
		const errors = checkCatalogRules([
			makeCategory('git', [makeCommand({ id: 'git.status' })]),
			makeCategory('npm', [makeCommand({ id: 'git.status' })]),
		]);
		expect(errors.some((e) => e.includes('id duplicado "git.status"'))).toBe(true);
	});

	it('detecta un prefijo que no coincide con la categoría', () => {
		const errors = checkCatalogRules([makeCategory('git', [makeCommand({ id: 'npm.install' })])]);
		expect(errors).toEqual(['git/npm.install: el id debe empezar por "git."']);
	});

	it('detecta un placeholder sin declarar en command (bash)', () => {
		const errors = checkCatalogRules([
			makeCategory('git', [makeCommand({ id: 'git.new-branch', command: 'git checkout -b ${branch}' })]),
		]);
		expect(errors).toEqual(['git/git.new-branch: ${branch} en command no está declarado en params']);
	});

	it('detecta un placeholder sin declarar en shells.powershell', () => {
		const errors = checkCatalogRules([
			makeCategory('fs', [
				makeCommand({ id: 'fs.remove', command: 'rm -rf dist', shells: { powershell: 'Remove-Item ${path}' } }),
			]),
		]);
		expect(errors).toEqual(['fs/fs.remove: ${path} en shells.powershell no está declarado en params']);
	});

	it('detecta un parámetro declarado que no aparece en command', () => {
		const errors = checkCatalogRules([
			makeCategory('git', [
				makeCommand({
					id: 'git.push',
					command: 'git push',
					params: [{ ...branchParam, name: 'remote' }],
				}),
			]),
		]);
		expect(errors).toEqual(['git/git.push: el parámetro "remote" no aparece en command']);
	});

	it('detecta nombres de parámetro repetidos', () => {
		const errors = checkCatalogRules([
			makeCategory('git', [
				makeCommand({ id: 'git.new-branch', command: 'git checkout -b ${branch}', params: [branchParam, branchParam] }),
			]),
		]);
		expect(errors).toEqual(['git/git.new-branch: parámetros repetidos: branch']);
	});

	it('acepta plantillas y params coherentes en command y shells', () => {
		const errors = checkCatalogRules([
			makeCategory('git', [
				makeCommand({
					id: 'git.new-branch',
					command: 'git checkout -b ${branch}',
					shells: { powershell: 'git checkout -b ${branch}' },
					params: [branchParam],
				}),
			]),
		]);
		expect(errors).toEqual([]);
	});
});
