import { generateCirclePlacements } from './CirclePlacement';
import { getSupportConnectorPairs } from './utils/baseFillUtils';
import { getDistanceToOvalBoundary } from './utils/CirclePlacementUtils';

jest.setTimeout(30000);

const insetRadius = 12.75;
const borderWidth = 1.5;

function generateSupportTray(supportSlot) {
    const { circles } = generateCirclePlacements({
        slotShape: 'circle',
        insetRadius,
        insetWidth: insetRadius * 2,
        insetHeight: insetRadius * 2,
        borderWidth,
        rows: 4,
        cols: 3,
        gap: 0,
        stagger: false,
        triangleFormation: false,
        straySlot: false,
        supportSlot
    });

    const connectorPairs = getSupportConnectorPairs({
        circles,
        supportSlot,
        borderWidth,
        circleOuterRadius: insetRadius + borderWidth,
        connectionThreshold: ((insetRadius + borderWidth) * 2) * 1.6
    });

    return { circles, connectorPairs };
}

test('oval placement uses semi-axes and keeps the requested ring evenly clear of the support', () => {
    const supportSlot = { enabled: true, mode: 'oval', length: 61, width: 36, count: 9 };
    const { circles } = generateSupportTray(supportSlot);

    expect(circles).toHaveLength(supportSlot.count);

    const clearances = circles.map(circle =>
        getDistanceToOvalBoundary(circle.position, { x: 0, y: 0 }, supportSlot.length, supportSlot.width) -
        (insetRadius + borderWidth)
    );

    expect(Math.min(...clearances)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...clearances) - Math.min(...clearances)).toBeLessThan(0.01);
    expect(Math.max(...circles.map(circle => Math.abs(circle.position.x)))).toBeLessThan(55);
});

test.each([
    ['standard oval', { enabled: true, mode: 'oval', length: 61, width: 36, count: 9 }],
    ['rotated oval', { enabled: true, mode: 'oval', length: 37, width: 61.5, count: 9 }],
    ['large oval', { enabled: true, mode: 'oval', length: 151, width: 36, count: 12 }],
    ['large circle', { enabled: true, mode: 'circle', length: 80, width: 80, count: 9 }]
])('%s support retains boundary-based connector wedges', (name, supportSlot) => {
    const { circles, connectorPairs } = generateSupportTray(supportSlot);

    expect(circles).toHaveLength(supportSlot.count);
    if (supportSlot.mode === 'oval') {
        expect(connectorPairs).toHaveLength(supportSlot.count);
    } else {
        expect(connectorPairs.length).toBeGreaterThan(0);
    }
});
