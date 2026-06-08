import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const markerStart = '<!-- jelly-cursor:start -->';
const markerEnd = '<!-- jelly-cursor:end -->';
const legacyMarkerStart = '<!-- new-neovide-cursor:start -->';
const legacyMarkerEnd = '<!-- new-neovide-cursor:end -->';
const injectedScriptName = 'jelly-cursor.js';
const legacyInjectedScriptName = 'new-neovide-cursor.js';
const backupSuffix = '.jelly-cursor-backup';

type JellyConfig = {
	fastSpeed: number;
	midSpeed: number;
	slowSpeed: number;
	axisBias: number;
	twistBoost: number;
	minAlpha: number;
	cursorColor: string;
	glowColor: string;
	glowEnabled: boolean;
	glowOpacity: number;
	glowIntensity: number;
	glowSize: number;
};

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('jellyCursor.installDomPatch', async () => {
			await installDomCursor();
		}),
		vscode.commands.registerCommand('jellyCursor.uninstallDomPatch', async () => {
			await uninstallDomCursor();
		})
	);
}

export function deactivate() {}

async function installDomCursor() {
	const workbenchHtml = await findWorkbenchHtml();

	if (!workbenchHtml) {
		vscode.window.showErrorMessage('Cannot find VS Code workbench.html.');
		return;
	}

	const scriptPath = path.join(path.dirname(workbenchHtml), injectedScriptName);
	const legacyScriptPath = path.join(path.dirname(workbenchHtml), legacyInjectedScriptName);
	const html = fs.readFileSync(workbenchHtml, 'utf8');
	backupWorkbenchHtml(workbenchHtml, html);

	const scriptTag = `${markerStart}<script src="./${injectedScriptName}"></script>${markerEnd}`;
	const htmlWithoutLegacyPatch = removePatchMarker(html, legacyMarkerStart, legacyMarkerEnd);
	const nextHtml = htmlWithoutLegacyPatch.includes(markerStart)
		? htmlWithoutLegacyPatch.replace(new RegExp(`${escapeRegExp(markerStart)}[\\s\\S]*?${escapeRegExp(markerEnd)}`), scriptTag)
		: htmlWithoutLegacyPatch.replace('</html>', `${scriptTag}\n</html>`);

	fs.writeFileSync(scriptPath, getInjectedScript(getJellyConfig()), 'utf8');
	fs.writeFileSync(workbenchHtml, nextHtml, 'utf8');

	if (fs.existsSync(legacyScriptPath)) {
		fs.unlinkSync(legacyScriptPath);
	}

	vscode.window.showInformationMessage('Jelly Cursor DOM patch installed. Restart VS Code to load it.');
}

async function uninstallDomCursor() {
	const workbenchHtml = await findWorkbenchHtml();

	if (!workbenchHtml) {
		vscode.window.showErrorMessage('Cannot find VS Code workbench.html.');
		return;
	}

	const scriptPath = path.join(path.dirname(workbenchHtml), injectedScriptName);
	const legacyScriptPath = path.join(path.dirname(workbenchHtml), legacyInjectedScriptName);
	const html = fs.readFileSync(workbenchHtml, 'utf8');
	const nextHtml = removePatchMarker(removePatchMarker(html, markerStart, markerEnd), legacyMarkerStart, legacyMarkerEnd);

	if (html !== nextHtml) {
		fs.writeFileSync(workbenchHtml, nextHtml, 'utf8');
	}

	if (fs.existsSync(scriptPath)) {
		fs.unlinkSync(scriptPath);
	}

	if (fs.existsSync(legacyScriptPath)) {
		fs.unlinkSync(legacyScriptPath);
	}

	vscode.window.showInformationMessage('Jelly Cursor DOM patch removed. Restart VS Code to finish.');
}

async function findWorkbenchHtml() {
	const candidates = getInstallRoots()
		.map((root) => path.join(root, 'resources', 'app', 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html'))
		.filter((file) => fs.existsSync(file));

	if (candidates.length > 0) {
		candidates.sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
		return candidates[0];
	}

	const picked = await vscode.window.showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: false,
		filters: {
			'workbench.html': ['html'],
		},
		title: 'Select VS Code workbench.html',
	});

	return picked?.[0]?.fsPath;
}

function getInstallRoots() {
	const roots: string[] = [];
	const appRoot = path.dirname(process.execPath);
	const localAppData = process.env.LOCALAPPDATA;

	roots.push(appRoot);

	if (localAppData) {
		const vscodeRoot = path.join(localAppData, 'Programs', 'Microsoft VS Code');

		if (fs.existsSync(vscodeRoot)) {
			for (const entry of fs.readdirSync(vscodeRoot, { withFileTypes: true })) {
				if (entry.isDirectory()) {
					roots.push(path.join(vscodeRoot, entry.name));
				}
			}
		}
	}

	return Array.from(new Set(roots));
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removePatchMarker(html: string, start: string, end: string) {
	return html.replace(new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\s*`), '');
}

function backupWorkbenchHtml(workbenchHtml: string, html: string) {
	const backupPath = `${workbenchHtml}${backupSuffix}`;

	if (!fs.existsSync(backupPath)) {
		fs.writeFileSync(backupPath, html, 'utf8');
	}
}

function getJellyConfig(): JellyConfig {
	const config = vscode.workspace.getConfiguration('jellyCursor');
	const legacyConfig = vscode.workspace.getConfiguration('newNeovideCursor');

	return {
		fastSpeed: clamp(getConfigValue(config, legacyConfig, 'fastSpeed', 0.42), 0.01, 1),
		midSpeed: clamp(getConfigValue(config, legacyConfig, 'midSpeed', 0.24), 0.01, 1),
		slowSpeed: clamp(getConfigValue(config, legacyConfig, 'slowSpeed', 0.10), 0.01, 1),
		axisBias: clamp(getConfigValue(config, legacyConfig, 'axisBias', 0.45), 0, 1),
		twistBoost: clamp(getConfigValue(config, legacyConfig, 'twistBoost', getConfigValue(config, legacyConfig, 'topEdgeBoost', 0.16)), 0, 0.6),
		minAlpha: clamp(getConfigValue(config, legacyConfig, 'minAlpha', 0.03), 0, 1),
		cursorColor: getConfigValue(config, legacyConfig, 'cursorColor', '#ffffff'),
		glowColor: getConfigValue(config, legacyConfig, 'glowColor', '#ffffff'),
		glowEnabled: getConfigValue(config, legacyConfig, 'glowEnabled', true),
		glowOpacity: clamp(getConfigValue(config, legacyConfig, 'glowOpacity', 0.9), 0, 1),
		glowIntensity: clamp(getConfigValue(config, legacyConfig, 'glowIntensity', 1.8), 0, 5),
		glowSize: clamp(getConfigValue(config, legacyConfig, 'glowSize', 18), 0, 40),
	};
}

function getConfigValue<T>(config: vscode.WorkspaceConfiguration, legacyConfig: vscode.WorkspaceConfiguration, key: string, fallback: T) {
	return config.get<T>(key, legacyConfig.get<T>(key, fallback));
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function getInjectedScript(jellyConfig: JellyConfig) {
	return String.raw`
(() => {
	const config = {
		fallbackColor: '#8fd3ff',
		fastSpeed: ${jellyConfig.fastSpeed},
		midSpeed: ${jellyConfig.midSpeed},
		slowSpeed: ${jellyConfig.slowSpeed},
		axisBias: ${jellyConfig.axisBias},
		twistBoost: ${jellyConfig.twistBoost},
		minAlpha: ${jellyConfig.minAlpha},
		cursorColor: ${JSON.stringify(jellyConfig.cursorColor)},
		glowColor: ${JSON.stringify(jellyConfig.glowColor)},
		glowEnabled: ${jellyConfig.glowEnabled},
		glowOpacity: ${jellyConfig.glowOpacity},
		glowIntensity: ${jellyConfig.glowIntensity},
		glowSize: ${jellyConfig.glowSize},
	};

	const style = document.createElement('style');
	style.textContent = [
		'.jelly-cursor-layer {',
		'	position: fixed;',
		'	inset: 0;',
		'	pointer-events: none;',
		'	z-index: 99999;',
		'	overflow: visible;',
		'}',
		'.jelly-cursor-svg {',
		'	position: absolute;',
		'	inset: 0;',
		'	width: 100%;',
		'	height: 100%;',
		'	overflow: visible;',
		'	pointer-events: none;',
		'}',
		'.monaco-editor .cursors-layer .cursor {',
		'	filter: opacity(0) !important;',
		'}',
	].join('\n');
	document.head.appendChild(style);

	const overlay = createOverlay();
	const states = [];
	let frameId = 0;

	function createOverlay() {
		const layer = document.createElement('div');
		layer.className = 'jelly-cursor-layer';
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.classList.add('jelly-cursor-svg');
		layer.appendChild(svg);
		document.body.appendChild(layer);

		return {
			layer,
			svg,
		};
	}

	function ensureCursorState(index) {
		while (states.length <= index) {
			states.push(createCursorState());
		}

		return states[index];
	}

	function createCursorState() {
		const shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
		shape.setAttribute('vector-effect', 'non-scaling-stroke');
		overlay.svg.appendChild(shape);

		return {
			shape,
			editor: null,
			targetX: 0,
			targetY: 0,
			width: 2,
			height: 18,
			visual: null,
			movement: 0,
			started: false,
			points: [],
			seen: 0,
		};
	}

	function updateTargets() {
		const seen = ++frameId;
		const cursors = Array.from(document.querySelectorAll('.monaco-editor .cursors-layer .cursor'))
			.filter((cursor) => {
				const editor = cursor.closest('.monaco-editor');
				const rect = cursor.getBoundingClientRect();

				return editor && isVisible(editor) && rect.width > 0 && rect.height > 0;
			})
			.sort(compareCursors);

		for (let index = 0; index < cursors.length; index++) {
			const cursor = cursors[index];
			const editor = cursor.closest('.monaco-editor');

			if (!editor) {
				continue;
			}

			const state = ensureCursorState(index);
			const cursorRect = cursor.getBoundingClientRect();
			const x = cursorRect.left;
			const y = cursorRect.top;

			if (!Number.isFinite(x) || !Number.isFinite(y) || cursorRect.height <= 0) {
				continue;
			}

			state.editor = editor;
			state.targetX = x;
			state.targetY = y;
			state.width = cursorRect.width;
			state.height = cursorRect.height;
			state.visual = readCursorVisual(cursor);
			state.seen = seen;

			if (!state.started) {
				const nearestState = findNearestStartedState(state, index);
				state.points = nearestState ? clonePoints(nearestState.points) : getTargetPoints(state);
				state.started = true;
			}
		}
	}

	function compareCursors(left, right) {
		const leftEditor = left.closest('.monaco-editor');
		const rightEditor = right.closest('.monaco-editor');
		const activeEditor = document.querySelector('.monaco-editor.focused') || document.activeElement?.closest?.('.monaco-editor');

		if (leftEditor === activeEditor && rightEditor !== activeEditor) {
			return -1;
		}

		if (rightEditor === activeEditor && leftEditor !== activeEditor) {
			return 1;
		}

		const leftRect = left.getBoundingClientRect();
		const rightRect = right.getBoundingClientRect();

		return leftRect.top - rightRect.top || leftRect.left - rightRect.left;
	}

	function tick() {
		updateTargets();

		for (const state of states) {
			if (!state.started || state.seen !== frameId || !state.editor || !isVisible(state.editor)) {
				hideCursorState(state);
				continue;
			}

			const targetPoints = getTargetPoints(state);
			const currentPoints = state.points.length === 4 ? state.points : targetPoints;
			const speeds = getCornerSpeeds(currentPoints, targetPoints);
			const currentCenter = getCenter(currentPoints);
			const targetCenter = getCenter(targetPoints);

			const nextPoints = currentPoints.map((point, index) => {
				const target = targetPoints[index];
				const speed = speeds[index];

				return {
					x: point.x + (target.x - point.x) * speed,
					y: point.y + (target.y - point.y) * speed,
				};
			});
			state.points = keepSimpleQuad(nextPoints, currentPoints, targetPoints);
			state.movement = Math.hypot(targetCenter.x - currentCenter.x, targetCenter.y - currentCenter.y);

			place(state);
		}

		requestAnimationFrame(tick);
	}

	function isVisible(element) {
		const rect = element.getBoundingClientRect();

		return rect.width > 0 && rect.height > 0;
	}

	function hideCursorState(state) {
		state.shape.setAttribute('visibility', 'hidden');
		state.shape.style.filter = 'none';
	}

	function findNearestStartedState(targetState, targetIndex) {
		let nearest = null;
		let nearestDistance = Number.POSITIVE_INFINITY;
		const targetCenter = getCenter(getTargetPoints(targetState));

		for (let index = 0; index < states.length; index++) {
			const state = states[index];

			if (index === targetIndex || !state.started || state.points.length !== 4) {
				continue;
			}

			const center = getCenter(state.points);
			const distance = Math.hypot(targetCenter.x - center.x, targetCenter.y - center.y);

			if (distance < nearestDistance) {
				nearest = state;
				nearestDistance = distance;
			}
		}

		return nearest;
	}

	function clonePoints(points) {
		return points.map((point) => ({ x: point.x, y: point.y }));
	}

	function readCursorVisual(cursor) {
		const style = getComputedStyle(cursor);
		const nativeBackgroundColor = style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)'
			? style.backgroundColor
			: config.fallbackColor;
		const backgroundColor = config.cursorColor || nativeBackgroundColor;

		return {
			opacity: Number.parseFloat(style.opacity || '1'),
			visibility: style.visibility,
			backgroundColor,
			border: style.border,
			borderColor: style.borderColor,
			borderRadius: style.borderRadius,
			outline: style.outline,
			boxShadow: style.boxShadow && style.boxShadow !== 'none' ? style.boxShadow : '0 0 10px ' + backgroundColor,
		};
	}

	function getTargetPoints(state) {
		const x = state.targetX;
		const y = state.targetY;
		const width = Math.max(1, state.width);
		const height = Math.max(1, state.height);

		return [
			{ x, y },
			{ x: x + width, y },
			{ x: x + width, y: y + height },
			{ x, y: y + height },
		];
	}

	function getCornerSpeeds(currentPoints, targetPoints) {
		const currentCenter = getCenter(currentPoints);
		const targetCenter = getCenter(targetPoints);
		const dx = targetCenter.x - currentCenter.x;
		const dy = targetCenter.y - currentCenter.y;
		const distance = Math.hypot(dx, dy);

		if (distance < 0.01) {
			return [config.fastSpeed, config.fastSpeed, config.fastSpeed, config.fastSpeed];
		}

		const direction = {
			x: dx / distance,
			y: dy / distance,
		};
		const targetCenterForCorners = getCenter(targetPoints);
		const scores = targetPoints.map((point) => {
			const cornerVector = normalize({
				x: point.x - targetCenterForCorners.x,
				y: point.y - targetCenterForCorners.y,
			});
			const diagonalScore = (dot(cornerVector, direction) + 1) / 2;
			const axisScore = getAxisScore(cornerVector, direction);
			const mixedScore = diagonalScore * (1 - config.axisBias) + axisScore * config.axisBias;

			return Math.max(0, Math.min(1, mixedScore));
		});

		return scores.map((score, index) => {
			const cornerVector = normalize({
				x: targetPoints[index].x - targetCenterForCorners.x,
				y: targetPoints[index].y - targetCenterForCorners.y,
			});
			const tangent = {
				x: -direction.y,
				y: direction.x,
			};
			const twistScore = dot(cornerVector, tangent);
			const speed = config.slowSpeed +
				(config.fastSpeed - config.slowSpeed) * score +
				config.twistBoost * twistScore * 0.5;

			return Math.max(0.01, Math.min(1, speed));
		});
	}

	function keepSimpleQuad(nextPoints, currentPoints, targetPoints) {
		if (isSimpleConvexQuad(nextPoints)) {
			return nextPoints;
		}

		for (const factor of [0.75, 0.5, 0.25, 0]) {
			const candidate = currentPoints.map((point, index) => ({
				x: targetPoints[index].x + (point.x - targetPoints[index].x) * factor,
				y: targetPoints[index].y + (point.y - targetPoints[index].y) * factor,
			}));

			if (isSimpleConvexQuad(candidate)) {
				return candidate;
			}
		}

		return targetPoints;
	}

	function isSimpleConvexQuad(points) {
		if (!points || points.length !== 4) {
			return false;
		}

		const signs = [];

		for (let index = 0; index < 4; index++) {
			const previous = points[index];
			const current = points[(index + 1) % 4];
			const next = points[(index + 2) % 4];
			const crossValue = cross(
				{ x: current.x - previous.x, y: current.y - previous.y },
				{ x: next.x - current.x, y: next.y - current.y }
			);

			if (Math.abs(crossValue) < 0.001) {
				continue;
			}

			signs.push(Math.sign(crossValue));
		}

		return signs.length > 0 && signs.every((sign) => sign === signs[0]);
	}

	function getCenter(points) {
		return points.reduce((sum, point) => ({
			x: sum.x + point.x / points.length,
			y: sum.y + point.y / points.length,
		}), { x: 0, y: 0 });
	}

	function getAxisScore(cornerVector, direction) {
		const horizontal = direction.x === 0 ? 0.5 : (Math.sign(direction.x) === Math.sign(cornerVector.x) ? 1 : 0);
		const vertical = direction.y === 0 ? 0.5 : (Math.sign(direction.y) === Math.sign(cornerVector.y) ? 1 : 0);
		const horizontalWeight = Math.abs(direction.x);
		const verticalWeight = Math.abs(direction.y);
		const total = horizontalWeight + verticalWeight || 1;

		return (horizontal * horizontalWeight + vertical * verticalWeight) / total;
	}

	function normalize(vector) {
		const length = Math.hypot(vector.x, vector.y) || 1;

		return {
			x: vector.x / length,
			y: vector.y / length,
		};
	}

	function dot(left, right) {
		return left.x * right.x + left.y * right.y;
	}

	function cross(left, right) {
		return left.x * right.y - left.y * right.x;
	}

	function place(state) {
		const fallbackVisual = {
			opacity: 1,
			visibility: 'visible',
			backgroundColor: config.fallbackColor,
			border: '0',
			borderColor: config.fallbackColor,
			borderRadius: '0',
			outline: '0',
			boxShadow: '0 0 10px ' + config.fallbackColor,
		};
		const visual = state.visual || fallbackVisual;
		const points = state.points.map((point) => point.x.toFixed(2) + ',' + point.y.toFixed(2)).join(' ');
		const opacity = Math.max(config.minAlpha, visual.opacity);
		const glowColor = config.glowColor || visual.backgroundColor;
		const movementOpacity = Math.min(1, state.movement / 18) * config.glowOpacity * config.glowIntensity * opacity;
		const glowSize = Math.max(0, config.glowSize);
		const glowAlpha = Math.max(0, Math.min(1, movementOpacity));
		const glowFilter = config.glowEnabled && glowAlpha > 0 && glowSize > 0
			? [
				'drop-shadow(0 0 ' + Math.max(2, glowSize * 0.45) + 'px ' + withAlpha(glowColor, glowAlpha) + ')',
				'drop-shadow(0 0 ' + glowSize + 'px ' + withAlpha(glowColor, glowAlpha * 0.72) + ')',
			].join(' ')
			: 'none';

		state.shape.setAttribute('points', points);
		state.shape.setAttribute('fill', visual.backgroundColor);
		state.shape.setAttribute('opacity', String(opacity));
		state.shape.setAttribute('visibility', visual.visibility);
		state.shape.style.filter = glowFilter;
	}

	function withAlpha(color, alpha) {
		const safeAlpha = Math.max(0, Math.min(1, alpha));

		if (/^#[0-9a-f]{6}$/i.test(color)) {
			const value = color.slice(1);
			const red = Number.parseInt(value.slice(0, 2), 16);
			const green = Number.parseInt(value.slice(2, 4), 16);
			const blue = Number.parseInt(value.slice(4, 6), 16);

			return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + safeAlpha + ')';
		}

		if (/^#[0-9a-f]{3}$/i.test(color)) {
			const red = Number.parseInt(color[1] + color[1], 16);
			const green = Number.parseInt(color[2] + color[2], 16);
			const blue = Number.parseInt(color[3] + color[3], 16);

			return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + safeAlpha + ')';
		}

		if (color.startsWith('rgb(')) {
			return color.replace('rgb(', 'rgba(').replace(')', ', ' + safeAlpha + ')');
		}

		return color;
	}

	requestAnimationFrame(tick);
})();
`;
}
