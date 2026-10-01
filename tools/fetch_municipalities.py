"""全国の市区町村（市・町・村・東京特別区）と代表点の緯度経度を Wikidata から取得する → municipalities.json"""
import json, urllib.request, urllib.parse, pathlib
here = pathlib.Path(__file__).parent
PREFS = "北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県".split()
q = """
SELECT ?m ?mLabel ?coord ?code WHERE {
  ?m wdt:P429 ?code ; wdt:P625 ?coord .
  FILTER NOT EXISTS { ?m wdt:P576 ?end }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ja". }
}"""
url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": q, "format": "json"})
req = urllib.request.Request(url, headers={"User-Agent": "hikari-solar-planner/1.0 (local tool)"})
rows = json.load(urllib.request.urlopen(req, timeout=120))["results"]["bindings"]
out = {}
for r in rows:
    code = r["code"]["value"]
    if not (len(code) == 6 and code.isdigit()) or code[2:5] == "000":
        continue  # 都道府県・不正なコード
    nm = r["mLabel"]["value"]
    if not nm.endswith(("市", "町", "村", "区")) or (nm.endswith("区") and not code.startswith("131")):
        continue  # 政令市の行政区は市単位にまとめる
    lon, lat = map(float, r["coord"]["value"].replace("Point(", "").replace(")", "").split())
    out.setdefault(code, {"code": code, "name": r["mLabel"]["value"], "pref": PREFS[int(code[:2]) - 1], "lat": round(lat, 4), "lon": round(lon, 4)})
data = sorted(out.values(), key=lambda x: x["code"])
json.dump(data, open(here / "municipalities.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(data))
