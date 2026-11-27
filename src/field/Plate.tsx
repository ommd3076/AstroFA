import { STAR_BY_ID } from '../data/astroData';
import type { IAUConstellation } from '../types/astronomy';

export function ConstellationPlate({ target, detailed = false }: { target: IAUConstellation; detailed?: boolean }) {
  const coordinate = (ra: number) => ((ra - target.raCenter + 540) % 360 - 180) * Math.cos(target.decCenter * Math.PI / 180);
  const points = new Map(target.starIds.flatMap(id => {
    const star = STAR_BY_ID.get(id);
    return star ? [[id, { x: coordinate(star.ra), y: star.dec - target.decCenter, star }] as const] : [];
  }));
  const coordinates = [...points.values()];
  const xs = coordinates.map(point => point.x);
  const ys = coordinates.map(point => point.y);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const scale = Math.min(360 / Math.max(1, Math.max(...xs) - Math.min(...xs)), 216 / Math.max(1, Math.max(...ys) - Math.min(...ys)));
  const position = (point: { x: number; y: number }) => [260 + (point.x - centerX) * scale, 150 - (point.y - centerY) * scale] as const;
  const labels: Array<{ x: number; y: number; width: number; name: string }> = [];
  if (detailed) {
    for (const point of [...coordinates].sort((a, b) => a.star.mag - b.star.mag)) {
      const name = point.star.proper;
      if (!name || point.star.mag >= 2.2) continue;
      const [starX, starY] = position(point);
      const width = name.length * 5.6;
      const y = starY - 7;
      const x = [starX + 9, starX - width - 9].find(left =>
        left >= 12 && left + width <= 508 && labels.every(label =>
          Math.abs(label.y - y) > 11 || left + width + 3 <= label.x || left >= label.x + label.width + 3,
        ),
      );
      if (x !== undefined) labels.push({ x, y, width, name });
    }
  }

  return (
    <svg className="field-plate" role="img" aria-label={`${target.name} constellation chart`} viewBox="0 0 520 300">
      <rect width="520" height="300" fill="#121c22" />
      <g fill="none" stroke="#657579" strokeOpacity=".4" strokeWidth=".65">
        <path d="M40 150H480M260 22V278" strokeDasharray="3 6" />
        <ellipse cx="260" cy="150" rx="187" ry="119" />
        <ellipse cx="260" cy="150" rx="132" ry="84" opacity=".55" />
      </g>
      {target.lineSegments.map((segment, index) => {
        const start = points.get(segment.starId1);
        const end = points.get(segment.starId2);
        if (!start || !end) return null;
        const [x1, y1] = position(start);
        const [x2, y2] = position(end);
        return <line key={index} x1={x1} x2={x2} y1={y1} y2={y2} stroke="#b7e2c8" strokeWidth="1.1" />;
      })}
      {coordinates.map(point => {
        const [x, y] = position(point);
        const radius = Math.max(1.7, 5 - point.star.mag * .65);
        return (
          <g key={point.star.id}>
            <circle cx={x} cy={y} r={radius + 3} fill="#c9f4dc" opacity=".1" />
            <circle cx={x} cy={y} r={radius} fill="#f4f8ed" />
          </g>
        );
      })}
      {labels.map(label => <text key={label.name} x={label.x} y={label.y} fill="#dbe4d9" fontSize="10">{label.name}</text>)}
      <g fill="#a4b4aa" fontSize="10" className="field-plate-type">
        <text x="25" y="28">{target.id.toUpperCase()}</text>
        <text x="495" y="28" textAnchor="end">N ↑</text>
        <text x="25" y="277">RA {(target.raCenter / 15).toFixed(2)}h</text>
        <text x="495" y="277" textAnchor="end">DEC {target.decCenter.toFixed(1)}°</text>
      </g>
    </svg>
  );
}
