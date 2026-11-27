BoardUI free-source snapshot

This directory is a non-compiled source snapshot of the public BoardUI
repository, pinned to commit `c87984b6bb7cb691a1cd560e9ae2a75a7ffb6c89`.
Upstream: https://github.com/BoardUI/boardui
Catalog: https://www.boardui.com/components

The snapshot contains only the public free source needed for inspection and
future selective integration: base components, foundations, free application
blocks, the free chart and the free Chat Starter. It intentionally omits the
Next app shell, docs/preview pages, public media, API routes, credentials,
and all BoardUI Pro blocks, charts and templates. The free Chat Starter's
small `pro-offer-card.tsx` upsell dependency is retained because the public
free source imports it; it is not a Pro catalog component. Nothing under this
directory is imported by the AstroFA build.

Most source is MIT-licensed; see `LICENSE`. Token input includes retained
Apache-2.0 attribution from its assistant-ui source in the source files.

The exact free-catalog audit for this pinned checkout is in
`FREE-CATALOG-MANIFEST.json`. The upstream README says “90 free items”, while
the checked-in catalog data enumerates 62 shipped free entries (2 foundations,
49 base components, 9 blocks, 1 chart and 1 template). The manifest records
the checked-in catalog as authoritative and preserves this discrepancy rather
than inventing coverage.
