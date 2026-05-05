(async function() {
  const data = await fetch('/assets/data/honeypot-attacks.json').then(r => r.json());
  const all = data.attacks;
  const tStart = new Date(data.meta.window.start).getTime();
  const tEnd = new Date(data.meta.window.end).getTime();

  /* Honeypot target location: Azure East US (Virginia) */
  const TARGET = [37.4316, -78.6569];

  /* Map setup */
  const map = L.map('map', { worldCopyJump: true, minZoom: 2, maxZoom: 8 }).setView([25, 0], 2);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  /* Target marker — animated pulsing honeypot pin */
  const targetIcon = L.divIcon({
    html: '<div class="honeypot-target"></div>',
    className: 'honeypot-target-wrapper',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
  L.marker(TARGET, { icon: targetIcon, interactive: true })
    .bindPopup('<strong>HONEYPOT TARGET</strong><br>Azure East US<br><small>Real attacks captured here</small>')
    .addTo(map);

  /* Marker cluster layer */
  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    chunkedLoading: true,
    iconCreateFunction: function(c) {
      const n = c.getChildCount();
      const size = n < 10 ? 'small' : n < 50 ? 'medium' : 'large';
      return L.divIcon({
        html: '<div><span>' + n + '</span></div>',
        className: 'marker-cluster marker-cluster-' + size,
        iconSize: L.point(40, 40)
      });
    }
  });
  map.addLayer(cluster);

  /* Heatmap layer (toggled) */
  const heatLayer = L.heatLayer([], {
    radius: 22,
    blur: 18,
    maxZoom: 6,
    minOpacity: 0.4,
    gradient: {
      0.0: 'rgba(0, 245, 255, 0.3)',
      0.3: 'rgba(0, 255, 159, 0.6)',
      0.6: 'rgba(255, 255, 0, 0.8)',
      0.85: 'rgba(255, 0, 170, 0.9)',
      1.0: 'rgba(255, 0, 64, 1)'
    }
  });

  /* Attack lines layer (toggled) */
  const linesLayer = L.layerGroup().addTo(map);

  /* Build markers */
  const markers = all.map(function(a) {
    const radius = Math.max(4, Math.min(18, Math.log10(Math.max(a.attempts, 1)) * 3));
    const m = L.circleMarker([a.lat, a.lon], {
      radius: radius,
      color: '#00F5FF',
      weight: 1.5,
      fillColor: '#FF00AA',
      fillOpacity: 0.7
    });
    m.bindPopup(
      '<strong>' + a.ip + '</strong><br>' +
      (a.city && a.city !== 'Unknown' ? a.city + ', ' : '') + (a.country || '?') + '<br>' +
      '<strong>' + a.attempts.toLocaleString() + '</strong> attempts<br>' +
      (a.asname ? '<small>' + a.asname + '</small>' : '')
    );
    m._ts = new Date(a.ts).getTime();
    m._data = a;
    m._lat = a.lat;
    m._lon = a.lon;
    return m;
  });

  /* State */
  let mode = 'pins';      /* 'pins' or 'heat' */
  let linesEnabled = false;
  let prevVisibleIPs = new Set();

  /* Generate quadratic-bezier arc points between origin and target */
  function arcPath(from, to, segments) {
    segments = segments || 24;
    const lat0 = from[0], lon0 = from[1];
    const lat1 = to[0], lon1 = to[1];
    /* Curve upward — control point above midpoint, scaled by distance */
    const dist = Math.sqrt((lat1 - lat0) * (lat1 - lat0) + (lon1 - lon0) * (lon1 - lon0));
    const midLat = (lat0 + lat1) / 2 + Math.min(35, dist * 0.4);
    const midLon = (lon0 + lon1) / 2;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const lat = (1 - t) * (1 - t) * lat0 + 2 * (1 - t) * t * midLat + t * t * lat1;
      const lon = (1 - t) * (1 - t) * lon0 + 2 * (1 - t) * t * midLon + t * t * lon1;
      points.push([lat, lon]);
    }
    return points;
  }

  /* Draw an attack arc from origin to target with CSS animation; auto-removes after 2.5s */
  function fireArc(from) {
    const path = arcPath(from, TARGET);
    const line = L.polyline(path, {
      color: '#FF00AA',
      weight: 1.5,
      opacity: 1,
      className: 'attack-arc'
    }).addTo(linesLayer);
    setTimeout(function() {
      linesLayer.removeLayer(line);
    }, 2600);
  }

  function setTimePosition(pct) {
    const cutoff = tStart + (tEnd - tStart) * pct;
    document.getElementById('time-display').textContent =
      new Date(cutoff).toUTCString().replace(' GMT', ' UTC');

    let ips = 0, attempts = 0;
    const countryCounts = {}, asnCounts = {};
    const visible = [];
    const heatPoints = [];
    const currentVisibleIPs = new Set();

    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      if (m._ts <= cutoff) {
        visible.push(m);
        const a = m._data;
        ips++;
        const ipProgress = Math.min(1, (cutoff - m._ts) / (tEnd - tStart) + 0.05);
        const a_attempts = Math.round(a.attempts * ipProgress);
        attempts += a_attempts;
        const c = a.country || 'Unknown';
        countryCounts[c] = (countryCounts[c] || 0) + a_attempts;
        const asn = a.asname || a.asn || 'Unknown';
        asnCounts[asn] = (asnCounts[asn] || 0) + a_attempts;
        currentVisibleIPs.add(a.ip);
        /* Heat points: weight by log of attempts */
        const intensity = Math.min(1, Math.log10(Math.max(a_attempts, 1)) / 5);
        heatPoints.push([m._lat, m._lon, intensity]);
      }
    }

    /* Update layer based on mode */
    if (mode === 'pins') {
      cluster.clearLayers();
      cluster.addLayers(visible);
      heatLayer.setLatLngs([]);
    } else {
      cluster.clearLayers();
      heatLayer.setLatLngs(heatPoints);
    }

    /* Fire attack arcs for newly-visible IPs (if lines enabled & during play) */
    if (linesEnabled) {
      const newIPs = [];
      for (let i = 0; i < markers.length; i++) {
        const m = markers[i];
        if (currentVisibleIPs.has(m._data.ip) && !prevVisibleIPs.has(m._data.ip)) {
          newIPs.push(m);
        }
      }
      /* Cap to avoid drowning the map */
      const cap = Math.min(newIPs.length, 30);
      for (let i = 0; i < cap; i++) {
        fireArc([newIPs[i]._lat, newIPs[i]._lon]);
      }
    }
    prevVisibleIPs = currentVisibleIPs;

    document.getElementById('stat-ips').textContent = ips.toLocaleString();
    document.getElementById('stat-attempts').textContent = attempts.toLocaleString();
    document.getElementById('stat-countries').textContent = Object.keys(countryCounts).length;
    document.getElementById('stat-asns').textContent = Object.keys(asnCounts).length;
    renderBars('chart-countries', countryCounts, 8);
    renderBars('chart-asns', asnCounts, 8);
  }

  function renderBars(elId, counts, topN) {
    const el = document.getElementById(elId);
    const sorted = Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, topN);
    if (sorted.length === 0) {
      el.innerHTML = '<div style="color:#555">no data</div>';
      return;
    }
    const max = sorted[0][1];
    el.innerHTML = sorted.map(function(entry) {
      const k = entry[0], v = entry[1];
      const pct = (v / max) * 100;
      return '<div class="bar-row"><div class="bar-label" title="' + k + '">' + k + '</div>' +
             '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
             '<div class="bar-value">' + v.toLocaleString() + '</div></div>';
    }).join('');
  }

  /* Wire up controls */
  const slider = document.getElementById('timeline');
  slider.addEventListener('input', function() { setTimePosition(slider.value / 100); });

  let playing = false, playInterval = null;
  const playBtn = document.getElementById('play-btn');
  const speedSelect = document.getElementById('speed');
  const heatBtn = document.getElementById('heat-btn');
  const linesBtn = document.getElementById('lines-btn');

  function play() {
    playing = true;
    playBtn.textContent = '⏸ PAUSE';
    if (parseFloat(slider.value) >= 99.9) {
      slider.value = 0;
      prevVisibleIPs = new Set();
      setTimePosition(0);
    }
    const pctPerSec = parseFloat(speedSelect.value);
    const stepMs = 100;
    const stepPct = pctPerSec * (stepMs / 1000);
    playInterval = setInterval(function() {
      const next = parseFloat(slider.value) + stepPct;
      if (next >= 100) {
        slider.value = 100;
        setTimePosition(1);
        pause();
        return;
      }
      slider.value = next;
      setTimePosition(next / 100);
    }, stepMs);
  }
  function pause() {
    playing = false;
    playBtn.textContent = '▶ PLAY';
    if (playInterval) clearInterval(playInterval);
  }
  playBtn.addEventListener('click', function() { playing ? pause() : play(); });
  document.getElementById('reset-btn').addEventListener('click', function() {
    pause();
    slider.value = 0;
    prevVisibleIPs = new Set();
    setTimePosition(0);
  });

  heatBtn.addEventListener('click', function() {
    if (mode === 'pins') {
      mode = 'heat';
      heatBtn.classList.add('active');
      heatBtn.textContent = '📍 PINS';
      map.removeLayer(cluster);
      heatLayer.addTo(map);
    } else {
      mode = 'pins';
      heatBtn.classList.remove('active');
      heatBtn.textContent = '🔥 HEAT';
      map.removeLayer(heatLayer);
      cluster.addTo(map);
    }
    setTimePosition(parseFloat(slider.value) / 100);
  });

  linesBtn.addEventListener('click', function() {
    linesEnabled = !linesEnabled;
    if (linesEnabled) {
      linesBtn.classList.add('active');
      linesBtn.textContent = '📡 LINES ON';
    } else {
      linesBtn.classList.remove('active');
      linesBtn.textContent = '📡 LINES';
      linesLayer.clearLayers();
    }
  });

  /* Initial render: full state */
  setTimePosition(1);
})();
