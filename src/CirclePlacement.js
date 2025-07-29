// CirclePlacer.js
import { Vector2 } from 'three';
import { placeEvenCirclesAlongOval, areInsetAreasOverlapping, doesInsetAreaIntersectOval, canAddCircle } from './CirclePlacementUtils';

export function generateCirclePlacements({
    insetRadius,
    borderWidth,
    rows,
    cols,
    gap,
    stagger,
    straySlot,
    supportSlot
}) {
    const circles = [];
    const points = [];

    const circleOuterRadius = insetRadius + borderWidth;
    const xOffset = circleOuterRadius + insetRadius + gap;
    const yOffset = stagger
        ? Math.sqrt((2 * circleOuterRadius) ** 2 - (xOffset / 2) ** 2) * 0.98
        : circleOuterRadius + insetRadius + gap;

    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;

    const addCircle = (x, y, row = 0, col = 0) => {
        const position = { x, y };

        if (!canAddCircle(x, y, row, col, circles, insetRadius, borderWidth, supportSlot)) {
            return false;
        }

        circles.push({ position, insetRadius, borderWidth, borderHeight: borderWidth, row, col });
        points.push(new Vector2(x, y));
        minx = Math.min(minx, x - circleOuterRadius);
        miny = Math.min(miny, y - circleOuterRadius);
        maxx = Math.max(maxx, x + circleOuterRadius);
        maxy = Math.max(maxy, y + circleOuterRadius);

        return true;
    };

    if (supportSlot.enabled) {
        const centerX = 0, centerY = 0;

        if (supportSlot.mode === 'circle') {
            const a = ((supportSlot.length / 2) + insetRadius) + borderWidth + 1;
            const b = ((supportSlot.width / 2) + insetRadius) + borderWidth + 1;

            let added = 0, angle = 0;
            const maxAngle = Math.PI * 2;
            const minSpacing = (2 * insetRadius) * 0.99;

            while (added < supportSlot.count && angle < maxAngle + 0.2) {
                const x = centerX + a * Math.cos(angle);
                const y = centerY + b * Math.sin(angle);
                const position = { x, y };

                let overlaps = circles.some(existing =>
                    areInsetAreasOverlapping(position, existing.position, insetRadius, insetRadius + borderWidth)
                );

                const insetIntersects = doesInsetAreaIntersectOval(position, { x: centerX, y: centerY }, insetRadius, supportSlot.length, supportSlot.width);
                const outerIntersects = doesInsetAreaIntersectOval(position, { x: centerX, y: centerY }, insetRadius + borderWidth, supportSlot.length, supportSlot.width);

                if (!overlaps && !insetIntersects && !outerIntersects) {
                    addCircle(x, y, 0, added);
                    added++;

                    const dx = -a * Math.sin(angle);
                    const dy = b * Math.cos(angle);
                    const speed = Math.sqrt(dx * dx + dy * dy);
                    const dTheta = minSpacing / speed;
                    angle += dTheta;
                } else {
                    angle += 0.01;
                }
            }

            points.push(new Vector2(centerX, centerY));
        } else {
            // Oval mode
            placeEvenCirclesAlongOval(
                { x: 0, y: 0 },
                supportSlot.length,
                supportSlot.width,
                supportSlot.count,
                2,
                (x, y, i) => {
                    addCircle(x, y, i);
                }
            );
        }
    } else {
        for (let row = 0; row < rows; row++) {
            const isStaggeredRow = stagger && row % 2 === 1;
            let effectiveCols = cols;
            if (straySlot && isStaggeredRow) {
                effectiveCols -= 1;
            }

            for (let col = 0; col < effectiveCols; col++) {
                let x = col * xOffset;
                if (isStaggeredRow) x += xOffset / 2;
                const y = row * yOffset;
                addCircle(x, y, row, col);
            }
        }
    }

    return { circles, points };
}
