"""index.html と css/js を1枚にまとめ、claude.ai アーティファクト用の dist/hikari.html を作る。

アーティファクトは公開時に <!doctype>/<html>/<head>/<body> の骨組みが付くため、
ここでは <title>・フォントの <link>・<style>・本文・<script> だけを書き出す。

使い方:  python3 tools/build_artifact.py
"""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")

title = re.search(r"<title>.*?</title>", html, re.S).group(0)
links = "\n".join(re.findall(r'<link [^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>', html))
css = (root / "css" / "style.css").read_text(encoding="utf-8")
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)


def inline_script(m):
    src = m.group(1)
    code = (root / src).read_text(encoding="utf-8")
    assert "</script" not in code.lower(), src
    return f"<script>/* {src} */\n{code}\n</script>"


body = re.sub(r'<script src="([^"]+)"></script>', inline_script, body)
out = f"{title}\n{links}\n<style>\n{css}\n</style>\n{body.strip()}\n"
dist = root / "dist"
dist.mkdir(exist_ok=True)
(dist / "hikari.html").write_text(out, encoding="utf-8")
print("dist/hikari.html", len(out.encode("utf-8")), "bytes")
