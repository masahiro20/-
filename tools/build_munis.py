"""市区町村ごとの月別 水平面日射量・平均気温 → js/data/munis.js

- PVGIS（ERA5, 2005-2020）の市区町村代表点の月別値を
- 近傍の気象庁観測点（2地点・距離の逆数で重み付け）の「実測 ÷ PVGIS」比（日射）・「実測 − PVGIS」差（気温）で補正
- 屋根の向き・勾配の換算は最寄りの気象官署の値を使う（engine.site）

使い方: python3 fetch_municipalities.py && python3 fetch_pvgis_monthly.py && python3 build_munis.py
"""
import json, math, pathlib

here = pathlib.Path(__file__).parent
root = here.parent
munis = json.load(open(here / "municipalities.json", encoding="utf-8"))
st = json.load(open(here / "jma_normals.json", encoding="utf-8"))
pv = json.load(open(here / "pvgis_monthly_cache.json"))
DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def dist(a, b):
    return math.hypot(a["lat"] - b["lat"], (a["lon"] - b["lon"]) * math.cos(math.radians((a["lat"] + b["lat"]) / 2))) * 111.0


def pv_at(o):
    return pv.get(f"{o['lat']},{o['lon']}")


# 観測点ごとの補正量
rad_bias, temp_bias = {}, {}
for name, s in st.items():
    p = pv_at(s)
    if not p:
        continue
    if s["radMJ"] is not None and not s["radRef"]:
        rad_bias[name] = [s["radMJ"][m] / 3.6 * DAYS[m] / p["H"][m] for m in range(12)]
    if all(t is not None for t in s["temp"]):
        temp_bias[name] = [s["temp"][m] - p["T"][m] for m in range(12)]


def idw(o, table, k=2):
    near = sorted(table, key=lambda n: dist(o, st[n]))[:k]
    ws = [1 / max(dist(o, st[n]), 3.0) for n in near]
    return [sum(w * table[n][m] for n, w in zip(near, ws)) / sum(ws) for m in range(12)], near


out, by_pref, miss = {}, {}, []
for mu in munis:
    p = pv_at(mu)
    if not p:
        miss.append(mu["name"]); continue
    rb, near = idw(mu, rad_bias)
    tb, _ = idw(mu, temp_bias)
    ref = min(st, key=lambda n: dist(mu, st[n]))
    H = [round(p["H"][m] * rb[m] / DAYS[m] * 100) for m in range(12)]      # kWh/㎡/日 ×100
    T = [round((p["T"][m] + tb[m]) * 10) for m in range(12)]               # ℃ ×10
    out[mu["code"]] = [mu["pref"], mu["name"], mu["lat"], mu["lon"], ref, H, T, "・".join(near)]
    by_pref.setdefault(mu["pref"], []).append(mu["code"])

js = ("/* 自動生成ファイル: tools/build_munis.py で生成。直接編集しないでください。\n"
      "   [都道府県, 市区町村, 緯度, 経度, 傾斜換算に使う気象官署, 水平面日射量(kWh/㎡/日×100)×12, 平均気温(℃×10)×12, 補正に使った観測点] */\n"
      "(function (root) {\n  root.SOLAR_MUNIS = " + json.dumps({"list": out, "byPref": by_pref}, ensure_ascii=False, separators=(",", ":")) + ";\n"
      "  if (typeof module !== 'undefined') module.exports = root.SOLAR_MUNIS;\n"
      "})(typeof window !== 'undefined' ? window : globalThis);\n")
(root / "js" / "data" / "munis.js").write_text(js, encoding="utf-8")
print("municipalities:", len(out), "missing:", miss, "bytes:", len(js.encode()))

# 検証：観測点がある市で、気象庁の値をどれだけ再現できているか
for code, name in [("231002", "名古屋市"), ("131016", "千代田区"), ("011002", "札幌市")]:
    r = out.get(code)
    if r:
        print(name, "年間", round(sum(r[5][m] / 100 * DAYS[m] for m in range(12))), "kWh/㎡", "平均気温", round(sum(r[6]) / 120, 1))
for name in ["名古屋", "東京", "札幌"]:
    s = st[name]
    print(name, "気象庁", round(sum(s["radMJ"][m] / 3.6 * DAYS[m] for m in range(12))), round(sum(s["temp"]) / 12, 1))
