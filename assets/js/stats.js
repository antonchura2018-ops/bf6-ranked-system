/* ==========================================================
   BF6 Player Hub — Stats Engine (Step 3)
   Reads matches from localStorage + active season
   Computes: WIN RATE, TOTAL MATCHES, KDA, AVG KILLS, MVP%
   ========================================================== */

(function () {
  "use strict";

  // === from your index.html ===
  var STORAGE_KEY = "bf6_ranked_matches_v1";
  var ACTIVE_SEASON_KEY = "bf6_active_season_v1";
  var SELECTED_SEASON_KEY = "bf6_selected_season_v1";

  // If you ever rename fields in match objects, adjust here:
  var FIELD_MAP = {
    place: "place",
    kills: "kills",
    assists: "assists",
    deaths: "deaths",
    mvp: "mvp",
    seasonId: "seasonId"
  };

  function safeNum(v, fallback) {
    v = Number(v);
    return isFinite(v) ? v : (fallback || 0);
  }

  function clamp(v, min, max) {
    v = safeNum(v, min);
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  function loadMatches() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function getActiveSeasonId() {
    return localStorage.getItem(ACTIVE_SEASON_KEY) || null;
  }

  function getSelectedSeasonId() {
    // If user is viewing a season, keep hub consistent with "selected"
    // Fallback to active (same logic as your code)
    var v = localStorage.getItem(SELECTED_SEASON_KEY);
    return v ? v : getActiveSeasonId();
  }

  function filterBySeason(all) {
    var sid = getSelectedSeasonId();
    if (!sid) return all;
    var out = [];
    for (var i = 0; i < all.length; i++) {
      if (String(all[i][FIELD_MAP.seasonId]) === String(sid)) out.push(all[i]);
    }
    return out;
  }

  function fmt1(n) {
    return (Math.round(n * 10) / 10).toFixed(1);
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(val);
  }

  function computeAndRender() {
    var all = loadMatches();
    var matches = filterBySeason(all);

    var total = matches.length;
    if (!total) {
      setText("mWinRate", 0);
      setText("mTotal", 0);
      setText("mKDA", "0.0");
      setText("mAvgKills", "0.0");
      setText("mMVP", 0);
      return;
    }

    var wins = 0;
    var sumKills = 0;
    var sumAssists = 0;
    var sumDeaths = 0;
    var mvpCount = 0;

    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];

      var place = clamp(m[FIELD_MAP.place], 1, 25);
      var kills = clamp(m[FIELD_MAP.kills], 0, 999);
      var assists = clamp(m[FIELD_MAP.assists], 0, 999);
      var deaths = clamp(m[FIELD_MAP.deaths], 0, 999);
      var isMvp = !!m[FIELD_MAP.mvp];

      if (place === 1) wins++;
      sumKills += kills;
      sumAssists += assists;
      sumDeaths += deaths;
      if (isMvp) mvpCount++;
    }

    // Win Rate = % of matches with place 1
    var winRate = Math.round((wins / total) * 100);

    // KDA (not inflated): (kills + 0.5*assists) / max(1, deaths)
    // (if deaths==0, use 1 so it doesn't explode)
    var denom = Math.max(1, sumDeaths);
    var kda = (sumKills + 0.5 * sumAssists) / denom;

    // Avg Kills = kills / matches
    var avgKills = sumKills / total;

    // MVP% = mvpCount / total
    var mvpPct = Math.round((mvpCount / total) * 100);

    setText("mWinRate", winRate);
    setText("mTotal", total);
    setText("mKDA", fmt1(kda));
    setText("mAvgKills", fmt1(avgKills));
    setText("mMVP", mvpPct);
  }

  function boot() {
    computeAndRender();

    // Update if another tab changes storage
    window.addEventListener("storage", function (e) {
      if (!e || !e.key) return;
      if (e.key === STORAGE_KEY || e.key === ACTIVE_SEASON_KEY || e.key === SELECTED_SEASON_KEY) {
        computeAndRender();
      }
    });

    // Update when coming back to the tab
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") computeAndRender();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Optional: allow manual refresh from console: window.refreshHubStats()
  window.refreshHubStats = computeAndRender;
})();
