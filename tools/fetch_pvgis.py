"""PVGIS (欧州委員会 JRC, PVGIS-ERA5) から各地点の月別傾斜面日射量 H(i)_m を取得する。
水平面(0°)に対する各 傾斜×方位 の月別比率（傾斜面換算係数）を作るために使う。
API: https://re.jrc.ec.europa.eu/api/v5_2/PVcalc
"""
import json, pathlib, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
here = pathlib.Path(__file__).parent
st = json.load(open(here / "jma_normals.json", encoding="utf-8"))
TILTS = [0, 11.3, 16.7, 21.8, 26.6, 31.0, 35.0]       # 陸屋根, 2〜7寸勾配
AZ = [0, 45, -45, 90, -90, 135, -135, 180]             # PVGIS: 0=南, 90=西, -90=東
cache_p = here / "pvgis_cache.json"
cache = json.load(open(cache_p)) if cache_p.exists() else {}
def get(lat, lon, tilt, az):
    key = f"{lat},{lon},{tilt},{az}"
    if key in cache: return key, cache[key]
    # 海上と判定される沿岸の地点は、内陸側へ少しずらして再試行する
    for dlat, dlon in [(0, 0), (0, -0.05), (0, 0.05), (0.05, 0), (-0.05, 0), (0.05, -0.05), (-0.05, -0.05), (0.05, 0.05), (-0.05, 0.05), (0, -0.1), (0.1, 0), (-0.1, 0), (0, 0.1)]:
        url = (f"https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat={lat + dlat:.3f}&lon={lon + dlon:.3f}&peakpower=1&loss=14"
               f"&angle={tilt}&aspect={az}&outputformat=json")
        for i in range(5):
            try:
                d = json.load(urllib.request.urlopen(url, timeout=60))
                return key, [m["H(i)_m"] for m in d["outputs"]["monthly"]["fixed"]]
            except urllib.error.HTTPError as e:
                if e.code == 400: break  # 海上 → 位置をずらす
                time.sleep(2 * (i + 1))
            except Exception:
                time.sleep(2 * (i + 1))
    raise RuntimeError(url)
jobs = []
for name, s in st.items():
    jobs.append((s["lat"], s["lon"], 0, 0))
    for t in TILTS[1:]:
        for a in AZ: jobs.append((s["lat"], s["lon"], t, a))
with ThreadPoolExecutor(8) as ex:
    for n, (k, v) in enumerate(ex.map(lambda j: get(*j), jobs)):
        cache[k] = v
        if n % 200 == 0:
            print(n, len(jobs), flush=True); json.dump(cache, open(cache_p, "w"))
json.dump(cache, open(cache_p, "w"))
print("done", len(cache))
