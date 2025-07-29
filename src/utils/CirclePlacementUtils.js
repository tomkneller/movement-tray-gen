/** Utility functions related to placing slots on the tray **/

export function placeEvenCirclesAlongOval(ovalCenter, a, b, numCircles, padding, addCircle) {
    const steps = 1000;
    const angleStep = (2 * Math.PI) / steps;
    const arcLengths = [0];
    let totalLength = 0;

    // Step 1: Sample points along the ellipse and calculate arc length
    for (let i = 1; i <= steps; i++) {
        const t1 = (i - 1) * angleStep;
        const t2 = i * angleStep;

        const x1 = a * Math.cos(t1);
        const y1 = b * Math.sin(t1);
        const x2 = a * Math.cos(t2);
        const y2 = b * Math.sin(t2);

        const dx = x2 - x1;
        const dy = y2 - y1;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);

        totalLength += segmentLength;
        arcLengths.push(totalLength);
    }

    // Step 2: For each desired point, find the corresponding angle
    for (let i = 0; i < numCircles; i++) {
        const targetLength = (i / numCircles) * totalLength;

        // Binary search to find the closest arc length index
        let low = 0;
        let high = arcLengths.length - 1;
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (arcLengths[mid] < targetLength) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        const t = low * angleStep;

        // Position on the ellipse, add outward padding
        const x = ovalCenter.x + (a + padding) * Math.cos(t);
        const y = ovalCenter.y + (b + padding) * Math.sin(t);

        addCircle(x, y, i);
    }
}

export function areInsetAreasOverlapping(pos1, pos2, purpleRadius1, purpleRadius2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distanceSq = dx * dx + dy * dy;
    const minAllowed = purpleRadius1 + purpleRadius2;
    return distanceSq < minAllowed * minAllowed;
}

export function doesInsetAreaIntersectOval(circlePos, ovalPos, purpleRadius, ovalLength, ovalWidth) {
    const dx = circlePos.x - ovalPos.x;
    const dy = circlePos.y - ovalPos.y;
    const rx = ovalLength / 2 + purpleRadius;
    const ry = ovalWidth / 2 + purpleRadius;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) < 1;
}

export function canAddCircle(x, y, row, col, circles, insetRadius, borderWidth, supportSlot) {
    const position = { x, y };

    // 1. Check purple-to-purple (inset) overlap with other circles
    for (const existing of circles) {
        if (areInsetAreasOverlapping(position, existing.position, insetRadius, insetRadius)) {
            return false;
        }
    }

    if (supportSlot.enabled) {
        const insetIntersectsOval = doesInsetAreaIntersectOval(position, { x: 0, y: 0 }, insetRadius + borderWidth, supportSlot.length, supportSlot.width);
        if (insetIntersectsOval) return false;

        const outerIntersectsOval = doesInsetAreaIntersectOval(position, { x: 0, y: 0 }, insetRadius + borderWidth, supportSlot.length, supportSlot.width);
        if (outerIntersectsOval) return false;
    }

    return true;
}


