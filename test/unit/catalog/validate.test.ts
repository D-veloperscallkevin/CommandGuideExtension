import { describe, expect, it } from 'vitest';
import { bundledCatalog } from './bundled';
import { checkCatalogRules, paramProblems } from '../../../src/catalog/validate';
import { branchParam, makeCategory, makeCommand } from './fixtures';

describe('checkCatalogRules', () => {
	it('el catálogo real no tiene errores', () => {
		expect(checkCatalogRules(bundledCatalog)).toEqual([]);
	});

	it('rechaza el prefijo reservado custom- en una categoría del catálogo', () => {
		const errors = checkCatalogRules([makeCategory('custom-tools', [makeCommand({ id: 'custom-tools.run' })])]);
		expect(errors).toEqual(['custom-tools: el prefijo "custom-" está reservado para los comandos propios']);
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

describe('paramProblems', () => {
	it('devuelve códigos en lugar de mensajes', () => {
		const cmd = makeCommand({
			id: 'x.y',
			command: 'ssh ${host}',
			params: [branchParam, branchParam],
			shells: { cmd: 'echo ${other}' },
		});
		expect(paramProblems(cmd)).toEqual([
			{ code: 'duplicateParam', names: ['branch'] },
			{ code: 'undeclaredParam', name: 'host', variant: 'command' },
			{ code: 'undeclaredParam', name: 'other', variant: 'shells.cmd' },
			{ code: 'unusedParam', name: 'branch' },
		]);
	});

	it('sin problemas en un comando coherente', () => {
		expect(paramProblems(makeCommand({ id: 'x.y', command: 'git checkout -b ${branch}', params: [branchParam] }))).toEqual([]);
	});
});
