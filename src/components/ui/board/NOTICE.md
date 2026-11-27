BoardUI source attribution

The BoardUI components in this directory are vendored from the public
`BoardUI/boardui` repository at commit
`c87984b6bb7cb691a1cd560e9ae2a75a7ffb6c89`. Most files are licensed under the
MIT License; see `LICENSE`.

The `base/token-input/` implementation is derived from Vercel's assistant-ui
token-input source. The upstream copyright and Apache-2.0 notices are retained
in each source file. The Apache-2.0 license text is included as
`LICENSE-APACHE-2.0`.

`theme-tokens.css` adapts the pinned repository's `styles/theme.css` and
`styles/typography.css`; semantic values are scoped to `.boardui-surface` and
the accent ramp is mapped to Costellar's observatory palette.

Registry references for the existing customized components:

- Button: https://www.boardui.com/r/button.json
- Button Group: https://www.boardui.com/r/button-group.json
- Chip: https://www.boardui.com/r/chip.json
- Table: https://www.boardui.com/r/table.json
- Orders Chart: https://www.boardui.com/r/orders-chart-card.json

Registry aliases were rewritten to local relative imports. BoardUI styles are
scoped to `.boardui-surface`, with portal-safe semantic values also exposed on
`:root`. The active Costellar runtime is light-only: paper `#f3f1e9`, panel
`#fbfaf5`, border `#d8d4c8`, ink `#222b26`, muted `#58655d`, accent `#24584c`,
selected `#e7ede3`, and midnight stage `#121c22`.
