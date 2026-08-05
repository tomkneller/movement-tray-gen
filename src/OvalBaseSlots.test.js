import { Box3, Vector3 } from 'three';
import { buildBase, buildBorder } from './BaseBuilder';
import { generateCirclePlacements } from './CirclePlacement';
import { createOvalMesh } from './utils/ovalUtils';

const insetWidth = 60.5;
const insetHeight = 35.5;
const borderWidth = 1.5;
const disabledSupport = { enabled: false, mode: 'circle', length: 36, width: 36, count: 0 };

function generateOvalTray(overrides = {}) {
    return generateCirclePlacements({
        slotShape: 'oval',
        insetRadius: insetWidth / 2,
        insetWidth,
        insetHeight,
        borderWidth,
        rows: 2,
        cols: 3,
        gap: 0,
        stagger: false,
        triangleFormation: false,
        straySlot: false,
        supportSlot: disabledSupport,
        ...overrides
    });
}

test('places oval slots with their own length, width, and footprint bounds', () => {
    const { circles, bounds } = generateOvalTray();

    expect(circles).toHaveLength(6);
    expect(circles.every(slot => slot.shape === 'oval')).toBe(true);
    expect(circles.every(slot => slot.insetWidth === insetWidth && slot.insetHeight === insetHeight)).toBe(true);
    expect(bounds.min.x).toBeCloseTo(-(insetWidth + borderWidth * 2) / 2);
    expect(bounds.min.y).toBeCloseTo(-(insetHeight + borderWidth * 2) / 2);
    expect(bounds.max.x).toBeCloseTo((insetWidth + borderWidth * 2) * 2.5);
    expect(bounds.max.y).toBeCloseTo((insetHeight + borderWidth * 2) * 1.5);
});

test('supports staggered and triangle formations without dropping oval slots', () => {
    const staggered = generateOvalTray({ stagger: true });
    const triangle = generateOvalTray({ triangleFormation: true, rows: 4 });

    expect(staggered.circles).toHaveLength(6);
    expect(staggered.circles[3].position.x).toBeCloseTo((insetWidth + borderWidth * 2) / 2);
    expect(triangle.circles).toHaveLength(10);
});

test('builds finite oval fill and border geometry', () => {
    const { circles } = generateOvalTray({ rows: 2, cols: 2 });
    const base = buildBase({ circles, supportSlot: disabledSupport, borderWidth, baseThickness: 2 });
    const border = buildBorder({ circles, supportSlot: disabledSupport, borderWidth, edgeHeight: 5 });

    for (const mesh of [base, border]) {
        const positions = mesh.geometry.getAttribute('position');
        expect(positions.count).toBeGreaterThan(0);
        expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
    }
});

test('positions oval slot meshes and supports magnet and hollow cuts', () => {
    const group = createOvalMesh(
        { x: 20, y: -10 },
        insetWidth,
        insetHeight,
        2,
        borderWidth,
        5,
        { enabled: true, width: 4, depth: 1 },
        false,
        true
    );
    const bounds = new Box3().setFromObject(group);
    const center = bounds.getCenter(new Vector3());

    expect(group.children.length).toBe(1);
    expect(group.children[0].position.x).toBeCloseTo(20);
    expect(group.children[0].position.y).toBeCloseTo(-10);
    expect(center.x).toBeCloseTo(20);
    expect(center.y).toBeCloseTo(-10);
    expect(bounds.max.z).toBeCloseTo(2);
    expect(Array.from(group.children[0].geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);
});
