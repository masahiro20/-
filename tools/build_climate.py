"""気象データ → js/data/climate.js を生成する。

- 水平面全天日射量・月平均気温: 気象庁 平年値(1991-2020) [jma_normals.json]
  * 日射観測が無い地点は PVGIS 水平面日射量 × (気象庁/PVGIS の全国中央値比) で推計
- 傾斜面換算係数: PVGIS-ERA5 の 傾斜面日射量 / 水平面日射量（月別） [pvgis_cache.json]

使い方:  python3 fetch_jma.py && python3 fetch_pvgis.py && python3 build_climate.py
"""
import json, pathlib, statistics

here = pathlib.Path(__file__).parent
root = here.parent
st = json.load(open(here / "jma_normals.json", encoding="utf-8"))
pv = json.load(open(here / "pvgis_cache.json"))
TILTS = [0, 11.3, 16.7, 21.8, 26.6, 31.0, 35.0]
AZ = [0, 45, -45, 90, -90, 135, -135, 180]
AZ_NAMES = ["S", "SW", "SE", "W", "E", "NW", "NE", "N"]
DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def key(s, t, a):
    return f"{s['lat']},{s['lon']},{t},{a}"


# 1) 気象庁実測 / PVGIS 水平面 の月別比（バイアス補正用）
bias = [[] for _ in range(12)]
local_bias = {}
for name, s in st.items():
    if s["radMJ"] is None or s["radRef"]:
        continue
    h0 = pv[key(s, 0, 0)]
    local_bias[name] = [s["radMJ"][m] / 3.6 * DAYS[m] / h0[m] for m in range(12)]
    for m in range(12):
        bias[m].append(local_bias[name][m])
bias_med = [round(statistics.median(b), 4) for b in bias]
print("JMA/PVGIS bias (monthly median):", bias_med)


def near_bias(s, k=2):
    """日射観測のない地点：近傍 k 地点（気象庁実測あり）の比の平均"""
    import math
    d = sorted(local_bias, key=lambda n: math.hypot(st[n]["lat"] - s["lat"], (st[n]["lon"] - s["lon"]) * math.cos(math.radians(s["lat"]))))[:k]
    return [sum(local_bias[n][m] for n in d) / k for m in range(12)], d

out = {"meta": {
    "tilts": TILTS, "azimuths": AZ_NAMES,
    "radiationSource": "気象庁 平年値(1991-2020) 全天日射量（月平均日積算）",
    "ratioSource": "PVGIS v5.2 (European Commission JRC, PVGIS-ERA5 2005-2020) 傾斜面/水平面 日射量比",
    "biasJmaPerPvgis": bias_med,
}, "stations": {}}

for name, s in st.items():
    h0 = pv[key(s, 0, 0)]
    if s["radMJ"] is not None:
        H = [round(v / 3.6, 3) for v in s["radMJ"]]  # kWh/m2/day
        src = "気象庁平年値（参考値を含む）" if s["radRef"] else "気象庁平年値"
    else:
        b, near = near_bias(s)
        H = [round(h0[m] * b[m] / DAYS[m], 3) for m in range(12)]
        src = "推計（PVGIS水平面を近傍の" + "・".join(near) + "の実測比で補正）"
    ratio = []
    for t in TILTS:
        row = []
        for a in AZ:
            hi = h0 if t == 0 else pv[key(s, t, a)]
            row.append([round(hi[m] / h0[m] * 1000) for m in range(12)])
        ratio.append(row)
    out["stations"][name] = {
        "pref": s["pref"], "lat": s["lat"], "lon": s["lon"],
        "temp": s["temp"], "H": H, "src": src, "ratio": ratio,
    }

js = ("/* 自動生成ファイル: tools/build_climate.py で生成。直接編集しないでください。 */\n"
      "(function (root) {\n  root.SOLAR_CLIMATE = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
      "  if (typeof module !== 'undefined') module.exports = root.SOLAR_CLIMATE;\n"
      "})(typeof window !== 'undefined' ? window : globalThis);\n")
(root / "js" / "data").mkdir(parents=True, exist_ok=True)
(root / "js" / "data" / "climate.js").write_text(js, encoding="utf-8")
print("stations:", len(out["stations"]), "bytes:", len(js.encode()))

# 参考: 南向き30°付近(31°) 年間傾斜面日射量
for n in ["札幌", "仙台", "東京", "名古屋", "金沢", "大阪", "広島", "高松", "福岡", "那覇"]:
    s = out["stations"][n]
    tot = sum(s["H"][m] * DAYS[m] * s["ratio"][5][0][m] / 1000 for m in range(12))
    print(n, s["src"], "南31° 年間", round(tot), "kWh/m2")
