/** Utility functions related to placing slots on the tray **/

export function placeEvenCirclesAlongOval(ovalCenter, a, b, numCircles, offset, addCircle, minimumSpacing = 0) {
    const steps = 1000;
    const angleStep = (2 * Math.PI) / steps;

    const getOffsetPoint = (angle, resolvedOffset) => {
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const normalX = cosAngle / Math.max(a, 1e-6);
        const normalY = sinAngle / Math.max(b, 1e-6);
        const normalLength = Math.hypot(normalX, normalY) || 1;

        return {
            x: (a * cosAngle) + (normalX / normalLength) * resolvedOffset,
            y: (b * sinAngle) + (normalY / normalLength) * resolvedOffset
        };
    };

    const buildEvenPoints = resolvedOffset => {
        const arcLengths = [0];
        let totalLength = 0;

        // Sample the path followed by the slot centers, rather than the inner
        // support ellipse, so equal arc lengths remain equal after the offset.
        for (let i = 1; i <= steps; i++) {
            const point1 = getOffsetPoint((i - 1) * angleStep, resolvedOffset);
            const point2 = getOffsetPoint(i * angleStep, resolvedOffset);
            totalLength += Math.hypot(point2.x - point1.x, point2.y - point1.y);
            arcLengths.push(totalLength);
        }

        const points = [];
        for (let i = 0; i < numCircles; i++) {
            const targetLength = (i / numCircles) * totalLength;
            let low = 0;
            let high = arcLengths.length - 1;
            while (low < high) {
                const midpoint = Math.floor((low + high) / 2);
                if (arcLengths[midpoint] < targetLength) {
                    low = midpoint + 1;
                } else {
                    high = midpoint;
                }
            }

            points.push(getOffsetPoint(low * angleStep, resolvedOffset));
        }

        return points;
    };

    const hasRequiredSpacing = points => {
        if (points.length < 2 || minimumSpacing <= 0) return true;
        return points.every((point, index) => {
            const next = points[(index + 1) % points.length];
            return Math.hypot(point.x - next.x, point.y - next.y) >= minimumSpacing;
        });
    };

    let points = buildEvenPoints(offset);

    if (!hasRequiredSpacing(points)) {
        let low = offset;
        let high = offset + Math.max(minimumSpacing, 1);
        let highPoints = buildEvenPoints(high);

        for (let expansion = 0; expansion < 12 && !hasRequiredSpacing(highPoints); expansion++) {
            high = offset + ((high - offset) * 2);
            highPoints = buildEvenPoints(high);
        }

        if (hasRequiredSpacing(highPoints)) {
            for (let iteration = 0; iteration < 20; iteration++) {
                const midpoint = (low + high) / 2;
                const midpointPoints = buildEvenPoints(midpoint);
                if (hasRequiredSpacing(midpointPoints)) {
                    high = midpoint;
                    highPoints = midpointPoints;
                } else {
                    low = midpoint;
                }
            }

            points = highPoints;
        }
    }

    points.forEach((point, index) => {
        addCircle(ovalCenter.x + point.x, ovalCenter.y + point.y, index);
    });
}

export function getDistanceToOvalBoundary(point, ovalCenter, ovalLength, ovalWidth) {
    const radiusX = Math.max(ovalLength / 2, 1e-6);
    const radiusY = Math.max(ovalWidth / 2, 1e-6);
    const x = Math.abs(point.x - ovalCenter.x);
    const y = Math.abs(point.y - ovalCenter.y);

    const normalizedDistance = (x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY);
    if (normalizedDistance <= 1) return 0;

    const radiusXSquared = radiusX * radiusX;
    const radiusYSquared = radiusY * radiusY;
    const ellipseEquationAt = lambda => {
        const ellipseX = (radiusX * x) / (radiusXSquared + lambda);
        const ellipseY = (radiusY * y) / (radiusYSquared + lambda);
        return (ellipseX * ellipseX) + (ellipseY * ellipseY);
    };

    let low = 0;
    let high = Math.max(radiusX, radiusY) * Math.max(Math.hypot(x, y), 1);
    while (ellipseEquationAt(high) > 1) {
        high *= 2;
    }

    for (let iteration = 0; iteration < 40; iteration++) {
        const midpoint = (low + high) / 2;
        if (ellipseEquationAt(midpoint) > 1) {
            low = midpoint;
        } else {
            high = midpoint;
        }
    }

    const lambda = (low + high) / 2;
    const closestX = (radiusXSquared * x) / (radiusXSquared + lambda);
    const closestY = (radiusYSquared * y) / (radiusYSquared + lambda);
    return Math.hypot(x - closestX, y - closestY);
}

export function areInsetAreasOverlapping(pos1, pos2, purpleRadius1, purpleRadius2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distanceSq = dx * dx + dy * dy;
    const minAllowed = purpleRadius1 + purpleRadius2;
    return distanceSq < minAllowed * minAllowed;
}

export function areRectanglesOverlapping(pos1, size1, pos2, size2) {
    return Math.abs(pos1.x - pos2.x) < ((size1.width + size2.width) / 2) &&
        Math.abs(pos1.y - pos2.y) < ((size1.height + size2.height) / 2);
}

export function doesInsetAreaIntersectOval(circlePos, ovalPos, purpleRadius, ovalLength, ovalWidth) {
    return getDistanceToOvalBoundary(circlePos, ovalPos, ovalLength, ovalWidth) < purpleRadius - 1e-6;
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


