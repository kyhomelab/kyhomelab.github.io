(async function() {
  const data = await fetch('/assets/data/honeypot-attacks.json').then(r => r.json());
  const all = data.attacks;
  const tStart = new Date(data.meta.window.start).getTime();
  const tEnd = new Date(data.meta.window.end).getTime();

  /* Map setup */
  const map = L.map('map', { worldCopyJump: true, minZoom: 2, maxZoom: 8 }).setView([25, 0], 2);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

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

  /* Build markers, keep references so we can filter by time */
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
    return m;
  });

  function setTimePosition(pct) {
    const cutoff = tStart + (tEnd - tStart) * pct;
    document.getElementById('time-display').textContent =
      new Date(cutoff).toUTCString().replace(' GMT', ' UTC');
    cluster.clearLayers();
    let ips = 0, attempts = 0;
    const countryCounts = {}, asnCounts = {};
    const visible = [];
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
      }
    }
    cluster.addLayers(visible);
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

  function play() {
    playing = true;
    playBtn.textContent = '⏸ PAUSE';
    const speed = parseFloat(speedSelect.value);
    const totalDuration = (tEnd - tStart);
    const stepMs = 100;
    const stepPct = (stepMs * speed / totalDuration) * 100;
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
    setTimePosition(0);
  });

  /* Initial render: show full state at t=end */
  setTimePosition(1);
})();
