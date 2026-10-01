"""気象庁 平年値(1991-2020) から月別の全天日射量・平均気温を取得する。
出典: 気象庁「過去の気象データ検索 平年値（年・月ごとの値）」
"""
import json, re, sys, time, urllib.request, pathlib
here = pathlib.Path(__file__).parent
stations = json.load(open(here / "stations.json", encoding="utf-8"))
out = {}
for pref, name, prec, block, lat, lon in stations:
    url = f"https://www.data.jma.go.jp/stats/etrn/view/nml_sfc_ym.php?prec_no={prec}&block_no={block}&year=&month=&day=&view="
    s = urllib.request.urlopen(url, timeout=30).read().decode("utf-8", "ignore")
    i = s.find("<table")
    t = re.sub(r"<[^>]+>", "|", s[i:]); t = re.sub(r"\|+", "|", t); t = re.sub(r"\s+", " ", t)
    head = t[: t.find("|1月|")]
    if name not in head:
        print("NO RAD", pref, name, file=sys.stderr); continue
    rows = re.findall(r"\|(\d+)月\|([^ ]*?)\| \|", t + " |")
    months = {}
    for m in range(1, 13):
        seg = t.split(f"|{m}月|")[1].split("| |")[0].split("|")
        months[m] = seg
    # 列順: 現地気圧, 海面気圧, 降水量, 平均気温, 最高, 最低, 蒸気圧, 湿度, 風速, 風向, 日照, 日射, ...
    hdr = head.split("|")
    def num(v):
        v = v.replace("&#64;", "").replace("@", "").strip().rstrip(")] ").strip()
        return None if v in ("///", "---", "") else float(v)
    temp = [num(months[m][3]) for m in range(1, 13)]
    rad = [num(months[m][11]) for m in range(1, 13)]
    if any(r is None for r in rad):
        rad = None  # 日射観測なし → PVGIS から補正推計（build_data.py）
    ref = any("&#64;" in months[m][11] for m in range(1, 13))
    out[name] = {"pref": pref, "lat": lat, "lon": lon, "block": block, "temp": temp, "radMJ": rad, "radRef": ref}
    print(name, rad, temp, file=sys.stderr)
    time.sleep(0.5)
json.dump(out, open(here / "jma_normals.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
