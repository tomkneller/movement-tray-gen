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

export function canAddCircle(x, y, row, col, circles, insetRadius, borderWidth, supportSlot, useOuter = false) {
    const position = { x, y };

    // 1. Check purple-to-purple (inset) overlap with other circles
    for (const existing of circles) {
        if (areInsetAreasOverlapping(position, existing.position, insetRadius, insetRadius)) {
            return false;
        }
    }

    if (useOuter) {
        const newOuter = insetRadius + borderWidth;
        for (const existing of circles) {
            const existingOuter = (existing.insetRadius || insetRadius) + (existing.borderWidth || borderWidth);
            if (areInsetAreasOverlapping(position, existing.position, newOuter, existingOuter)) {
                return false;
            }
        }
    }

    const newOuter = insetRadius + borderWidth;
    for (const existing of circles) {
        const existingInset = existing.insetRadius || insetRadius;
        const dx = position.x - existing.position.x;
        const dy = position.y - existing.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < (newOuter + existingInset) - 1e-6) return false;
    }

    if (supportSlot.enabled) {
        const insetIntersectsOval = doesInsetAreaIntersectOval(position, { x: 0, y: 0 }, insetRadius + borderWidth, supportSlot.length, supportSlot.width);
        if (insetIntersectsOval) return false;

        const outerIntersectsOval = doesInsetAreaIntersectOval(position, { x: 0, y: 0 }, insetRadius + borderWidth, supportSlot.length, supportSlot.width);
        if (outerIntersectsOval) return false;
    }

    return true;
}

export function nudgePositionAwayFromOval(initialX, initialY, circles, insetRadius, borderWidth, supportSlot, opts = {}) {
    if (!supportSlot || !supportSlot.enabled) return null;

    const maxDistance = opts.maxDistance || 40;
    const step = opts.step || 0.5;
    const angleSteps = opts.angleSteps || 24;
    const jitterAttempts = opts.jitterAttempts || 32;

    const baseAngle = Math.atan2(initialY, initialX);
    const twoPi = Math.PI * 2;

    for (let r = step; r <= maxDistance; r += step) {
        for (let i = 0; i < angleSteps; i++) {
            const angle = baseAngle + (i / angleSteps) * twoPi;
            const nx = initialX + Math.cos(angle) * r;
            const ny = initialY + Math.sin(angle) * r;

            // quick checks
            if (circles.some(existing => areInsetAreasOverlapping({ x: nx, y: ny }, existing.position, insetRadius, insetRadius))) continue;
            if (doesInsetAreaIntersectOval({ x: nx, y: ny }, { x: 0, y: 0 }, insetRadius + borderWidth, supportSlot.length, supportSlot.width)) continue;

            return { x: nx, y: ny };
        }
    }

    // jitter fallback
    for (let t = 0; t < jitterAttempts; t++) {
        const a = Math.random() * twoPi;
        const r = Math.random() * Math.min(maxDistance, 8);
        const nx = initialX + Math.cos(a) * r;
        const ny = initialY + Math.sin(a) * r;
        if (circles.some(existing => areInsetAreasOverlapping({ x: nx, y: ny }, existing.position, insetRadius, insetRadius))) continue;
        if (doesInsetAreaIntersectOval({ x: nx, y: ny }, { x: 0, y: 0 }, insetRadius + borderWidth, supportSlot.length, supportSlot.width)) continue;
        return { x: nx, y: ny };
    }

    return null;
}

export function relaxPositions(circles, insetRadius, borderWidth, supportSlot, opts = {}) {
    const iterations = opts.iterations || 8;
    const stepFactor = opts.stepFactor || 0.2;
    const maxMove = opts.maxMove || 0.8;

    if (!circles || circles.length === 0) return;

    const desired = (2 * insetRadius) * 0.98;

    for (let it = 0; it < iterations; it++) {
        const moves = new Array(circles.length).fill(0).map(() => ({ x: 0, y: 0 }));

        for (let i = 0; i < circles.length; i++) {
            const ci = circles[i];
            for (let j = 0; j < circles.length; j++) {
                if (i === j) continue;
                const cj = circles[j];
                const dx = cj.position.x - ci.position.x;
                const dy = cj.position.y - ci.position.y;
                const d = Math.sqrt(dx * dx + dy * dy) || 1e-6;

                const diff = d - desired;
                // small spring force: positive diff -> attract, negative -> repel
                const force = (diff) * 0.08;
                moves[i].x += (dx / d) * force;
                moves[i].y += (dy / d) * force;
            }
        }

        // Apply moves with validation
        for (let i = 0; i < circles.length; i++) {
            const mv = moves[i];
            let moveX = mv.x * stepFactor;
            let moveY = mv.y * stepFactor;
            const mag = Math.sqrt(moveX * moveX + moveY * moveY);
            if (mag > maxMove) {
                moveX = (moveX / mag) * maxMove;
                moveY = (moveY / mag) * maxMove;
            }

            const nx = circles[i].position.x + moveX;
            const ny = circles[i].position.y + moveY;

            // Validate we don't intrude into support slot or overlap inset areas
            if (doesInsetAreaIntersectOval({ x: nx, y: ny }, { x: 0, y: 0 }, insetRadius + borderWidth, supportSlot.length, supportSlot.width)) {
                continue;
            }

            let bad = false;
            for (let k = 0; k < circles.length; k++) {
                if (k === i) continue;
                if (areInsetAreasOverlapping({ x: nx, y: ny }, circles[k].position, insetRadius, insetRadius)) {
                    bad = true;
                    break;
                }
            }
            if (bad) continue;

            circles[i].position.x = nx;
            circles[i].position.y = ny;
        }
    }
}

export function doesOuterIntrudeIntoInset(pos, existingPos, insetRadius, borderWidth, existingInsetRadius = insetRadius) {
    const outerR = insetRadius + borderWidth;
    const dx = pos.x - existingPos.x;
    const dy = pos.y - existingPos.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    return d < (outerR + existingInsetRadius) - 1e-6;
}


