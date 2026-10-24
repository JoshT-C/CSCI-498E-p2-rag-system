# Ingest report

Written by `uv run p2 ingest`.
It lists every document in this corpus that ingest added, with what the cleaning pass did and anything that looks wrong.
Running ingest again adds to the table and replaces the "last run" section, and `uv run p2 ingest --report` rewrites it for the documents in docs/ now, after you removed some.

## Summary

- Documents: 19 (the final check needs at least 200)
- Words: 47,663
- Estimated tokens (words times 1.4): 66,728 (`p2 check` warns above 800,000 and fails above 1,000,000)
- Flagged documents: 0

## Documents

| docid | words | characters per page | flags | cleaning |
|---|---:|---:|---|---|
| `2405.20947-full__p001-005` | 3,479 | 4628 | - | 2 running line(s) removed |
| `2405.20947-full__p006-010` | 3,557 | 4686 | - | 2 running line(s) removed |
| `2405.20947-full__p011-015` | 2,883 | 3783 | - | 2 running line(s) removed |
| `2405.20947-full__p016-020` | 2,856 | 3479 | - | 2 running line(s) removed |
| `2405.20947-full__p021-025` | 2,377 | 3036 | - | 2 running line(s) removed |
| `2405.20947-full__p026-028` | 1,405 | 3020 | - | 2 running line(s) removed |
| `2508.02997-full` | 3,424 | 4611 | - | reference list dropped, 6,514 characters (heading) |
| `2603.01246-full__p001-005` | 2,046 | 3107 | - | 2 running line(s) removed |
| `2603.01246-full__p006-010` | 1,790 | 2707 | - | 2 running line(s) removed |
| `2603.01246-full__p011-013` | 744 | 2118 | - | 2 running line(s) removed |
| `2603.20976-full__p001-005` | 2,439 | 3614 | - | 2 running line(s) removed |
| `2603.20976-full__p006-010` | 1,814 | 2610 | - | 2 running line(s) removed |
| `2607.05842-full__p001-005` | 3,768 | 5761 | - | reference list dropped, 12,015 characters (heading) |
| `2607.05842-full__p006-010` | 3,834 | 5420 | - | reference list dropped, 12,015 characters (heading) |
| `2609.00051-full__p001-005` | 2,800 | 4031 | - | - |
| `2609.00051-full__p006-010` | 2,655 | 3734 | - | - |
| `2609.00051-full__p011-015` | 1,820 | 2412 | - | - |
| `2609.00051-full__p016-020` | 2,104 | 2342 | - | - |
| `2609.00051-full__p021-024` | 1,628 | 2431 | - | - |

## Not added in the last run

Nothing was left out.

## What to check by eye

Ingest cleans text by rules, and rules miss things.
Take five minutes to open the shortest, a middle one and the longest document next to its original and read one page of each.

- Search the documents for `þ`, `¼`, `(cid:` and the replacement character.
  A hit usually means the PDF's font map is wrong, which no tool can repair, so treat it as a defect and leave that document out.
- Look at the end of a few papers.
  Ingest drops a trailing reference list when it finds a References heading or a run of numbered entries.
  A paper whose list has neither can keep it, and then every author and journal name matches queries it should not.
- Open the first lines of a few documents.
  Author lists, copyright pages and tables of contents are not removed automatically, and you may want to cut them.
- Compare one table with the PDF.
  A PDF prints footnote marks as small raised digits, and the converter glues them onto the word or number next to them: `ALUMINUM1` is the heading ALUMINUM with footnote 1, and `11210,000` can be 210,000 with footnote 11.
  Quotes still match the stored text, but a number read from it can be wrong, so check before you trust a figure in a query, a judgment or an answer.
- Fix the `license` column in the manifest for every document, then run `uv run p2 license`.
  It is `unknown` until you do, and `unknown` does not pass.

## If a document is flagged as scanned

A scan is a picture of a page, so there is no text for ingest to read.
This template does not install an OCR tool, because it is large and most students never need it.
If you do need one, the opt-in route is pymupdf4llm with rapidocr, run on its own outside the template's environment:

```
uv run --no-project --with pymupdf4llm --with rapidocr python -c "import pymupdf4llm, sys, pathlib; pathlib.Path(sys.argv[2]).write_text(pymupdf4llm.to_markdown(sys.argv[1], use_ocr=True, force_ocr=True), encoding='utf-8')" scan.pdf scan.md
```

Put the resulting `.md` file in your folder and ingest the folder again.
It costs about 2 seconds a page, and OCR text needs a second look: it misreads ligatures, hyphens and numbers.
pymupdf4llm is AGPL-3.0 software, so use it only as a tool on your own machine, and do not add it to this repo's dependencies or copy its code into the repo.
