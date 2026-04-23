# Parser Contract

모든 parser는 아래 구조를 반환한다.

- `html_string`
- `metadata`
  - `source_kind`
  - `slide_count`
  - `warnings`
- `extraction_report`
  - `blocks[]`
  - `tables[]`
  - `confidence`
  - `fallback_used`

`blocks[]` 최소 필드:
- `type`
- `role`
- `order`
- `bbox`

허용 block type:
- `text`
- `image`
- `table`
- `shape`
- `layout-group`
