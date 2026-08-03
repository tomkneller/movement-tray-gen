import { getDistanceToOvalBoundary } from './CirclePlacementUtils';

export function getSupportConnectorPairs({
    circles,
    supportSlot,
    borderWidth,
    circleOuterRadius,
    connectionThreshold
}) {
    if (!supportSlot?.enabled || !circles || circles.length < 2) return [];

    const supportOuterLength = supportSlot.length + (borderWidth * 2);
    const supportOuterWidth = supportSlot.width + (borderWidth * 2);
    const maximumBridgeGap = circleOuterRadius * 1.2;
    const supportAdjacentCircles = circles
        .filter(circle => {
            const distanceToSupport = getDistanceToOvalBoundary(
                circle.position,
                { x: 0, y: 0 },
                supportOuterLength,
                supportOuterWidth
            );
            return supportSlot.mode === 'oval' ||
                distanceToSupport - circleOuterRadius <= maximumBridgeGap;
        })
        .sort((left, right) => {
            const leftAngle = Math.atan2(
                left.position.y / Math.max(supportOuterWidth, 1e-6),
                left.position.x / Math.max(supportOuterLength, 1e-6)
            );
            const rightAngle = Math.atan2(
                right.position.y / Math.max(supportOuterWidth, 1e-6),
                right.position.x / Math.max(supportOuterLength, 1e-6)
            );
            return leftAngle - rightAngle;
        });

    const pairs = [];
    const pairCount = supportAdjacentCircles.length === 2 ? 1 : supportAdjacentCircles.length;
    for (let index = 0; index < pairCount; index++) {
        const current = supportAdjacentCircles[index];
        const next = supportAdjacentCircles[(index + 1) % supportAdjacentCircles.length];
        if (!current || !next) continue;

        const distance = Math.hypot(
            current.position.x - next.position.x,
            current.position.y - next.position.y
        );
        if (distance < connectionThreshold) {
            pairs.push([current, next]);
        }
    }

    return pairs;
}
