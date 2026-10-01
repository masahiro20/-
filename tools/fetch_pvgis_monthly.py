"""PVGIS MRcalc から、市区町村・気象官署ごとの月別 水平面日射量と平均気温（2005-2020平均）を取得 → pvgis_monthly_cache.json"""
import json, pathlib, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
here = pathlib.Path(__file__).parent
munis = json.load(open(here / "municipalities.json", encoding="utf-8"))
st = json.load(open(here / "jma_normals.json", encoding="utf-8"))
cache_p = here / "pvgis_monthly_cache.json"
cache = json.load(open(cache_p)) if cache_p.exists() else {}
OFFS = [(0, 0), (0, -0.05), (0, 0.05), (0.05, 0), (-0.05, 0), (0.05, -0.05), (-0.05, -0.05), (0.05, 0.05), (-0.05, 0.05), (0, -0.1), (0.1, 0), (-0.1, 0), (0, 0.1), (0.1, 0.1), (-0.1, -0.1), (0.1, -0.1), (-0.1, 0.1)]
def get(lat, lon):
    key = f"{lat},{lon}"
    if key in cache: return key, cache[key]
    for dlat, dlon in OFFS:
        url = (f"https://re.jrc.ec.europa.eu/api/v5_2/MRcalc?lat={lat + dlat:.4f}&lon={lon + dlon:.4f}"
               f"&horirrad=1&avtemp=1&outputformat=json")
        for i in range(5):
            try:
                d = json.load(urllib.request.urlopen(url, timeout=60))
                H = [0.0] * 12; T = [0.0] * 12; n = [0] * 12
                for r in d["outputs"]["monthly"]:
                    m = r["month"] - 1; H[m] += r["H(h)_m"]; T[m] += r["T2m"]; n[m] += 1
                return key, {"H": [round(H[m] / n[m], 2) for m in range(12)], "T": [round(T[m] / n[m], 2) for m in range(12)], "shift": [dlat, dlon]}
            except urllib.error.HTTPError as e:
                if e.code == 400: break
                time.sleep(2 * (i + 1))
            except Exception:
                time.sleep(2 * (i + 1))
    print("FAIL", lat, lon, flush=True)
    return key, None
pts = [(s["lat"], s["lon"]) for s in st.values()] + [(m["lat"], m["lon"]) for m in munis]
with ThreadPoolExecutor(8) as ex:
    for i, (k, v) in enumerate(ex.map(lambda p: get(*p), pts)):
        if v: cache[k] = v
        if i % 100 == 0:
            print(i, len(pts), flush=True); json.dump(cache, open(cache_p, "w"))
json.dump(cache, open(cache_p, "w"))
print("done", len(cache))
