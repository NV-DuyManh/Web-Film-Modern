// Fit the reviewed vine artwork to the MFilm dialog, including responsive resizing.
export function fitVineArtwork(svg) {
    const host = svg.parentElement;
    const main = [...svg.querySelectorAll('[data-layout="main"]')];
    const branches = [...svg.querySelectorAll('[data-layout="branch"]')];
    const ornaments = [...svg.querySelectorAll('[data-layout="ornament"]')];
    const numbers = /-?\d+(?:\.\d+)?/g;
    const rootOf = group => group.dataset.path.match(numbers).slice(0, 2).map(Number);
    let lastLayout;
    function resize() {
      if (!host.isConnected) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      const unit = Math.min(width / 1000, height / 620);
      const card = host.parentElement.querySelector('.login-card');
      const bounds = card.getBoundingClientRect(), frame = host.getBoundingClientRect();
      const left = bounds.left - frame.left, top = bounds.top - frame.top;
      const right = bounds.right - frame.left, bottom = bounds.bottom - frame.top;
      const radius = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 32;
      const layout = [width, height, left, top, right, bottom, radius].join(',');
      if (layout === lastLayout) return;
      lastLayout = layout;
      const interpolate = (value, source, target) => {
        const i = value < source[1] ? 0 : value > source[2] ? 2 : 1;
        return target[i] + (value - source[i]) * (target[i + 1] - target[i]) / (source[i + 1] - source[i]);
      };
      const map = (x, y) => [
        interpolate(x, [58, 98, 902, 942], [left, left + radius, right - radius, right]),
        interpolate(y, [55, 95, 537, 565], [top, top + radius, bottom - radius, bottom]),
      ];
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      function draw(group, mapping) {
        const values = group.dataset.path.match(numbers).map(Number);
        let n = 0;
        const path = group.dataset.path.replace(numbers, () => {
          const coordinate = n % 2;
          const at = n - coordinate;
          const point = mapping(values[at], values[at + 1]);
          n++;
          return point[coordinate].toFixed(3);
        });
        for (const node of group.children) {
          node.setAttribute('d', path);
          node.setAttribute('stroke-width', node.dataset.width * unit);
        }
      }
      main.forEach(group => draw(group, map));
      const samples = main.flatMap(group => {
        const path = group.firstElementChild, length = path.getTotalLength();
        return Array.from({ length: 401 }, (_, i) => path.getPointAtLength(length * i / 400));
      });
      const attach = (x, y) => {
        const [px, py] = map(x, y);
        const closest = samples.reduce((best, point) => (point.x - px) ** 2 + (point.y - py) ** 2 < (best.x - px) ** 2 + (best.y - py) ** 2 ? point : best);
        return [closest.x, closest.y];
      };
      branches.forEach(group => {
        const [x, y] = rootOf(group), [px, py] = attach(x, y);
        draw(group, (cx, cy) => [px + (cx - x) * unit, py + (cy - y) * unit]);
      });
      ornaments.forEach(group => {
        const { art, x, y, scale, rotation } = group.dataset;
        let point = art === 'pumpkin' ? map(+x, +y) : attach(+x, +y);
        if (group.dataset.branchRootX !== undefined) {
          const rx = Number(group.dataset.branchRootX), ry = Number(group.dataset.branchRootY);
          const anchor = attach(rx, ry);
          point = [anchor[0] + (+x - rx) * unit, anchor[1] + (+y - ry) * unit];
        }
        if (art === 'lantern') {
          const root = +x < 500 ? [65, 219] : [946, 300];
          const anchor = attach(...root);
          point = [anchor[0] + (+x - root[0]) * unit, anchor[1] + (+y - root[1]) * unit];
        }
        group.setAttribute('transform', `translate(${point[0]} ${point[1]}) rotate(${rotation}) scale(${scale * unit})`);
      });
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    return () => observer.disconnect();
  }
