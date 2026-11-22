# v1.5.10 — Missing annotations count as unavailable

Fix reproduced from the existing short link https://reurl.cc/qa6ZD3 (material: 我朋友說我的中文說得很好).
The dataset contains zhuyin but no pinyin. Its hidden pinyin button left pinyinVisible=true, preventing the BOTH-off typography rules from matching.

- Track dataset annotation availability separately from the user's toggle preferences.
- Apply effective visibility after both the legacy parser and the data adapter load a dataset, and after either annotation toggle.
- The review card also treats missing annotations as unavailable.
- No annotation font, size, tone position, PDF, speech, or game rules changed.
- Existing short and full links continue to use the shared current runtime.

Validation: node tests/annotation-visibility.cjs (legacy parser and adapter; zhuyin-only, pinyin-only, neither, both; toggles and dataset reload), node tests/student-typography.cjs, JS syntax and git diff checks.
Chrome browser with the exact reported dataset: zhuyin on = Han64px / zhuyin16px; zhuyin off = Han96px, centered with zero horizontal/vertical offset; restored = Han64px / zhuyin16px, visible. Physical Safari/iPad not tested.

Rollback: restore index.html and student-data-adapter.js from 68e6209d1524c3c78aae0289115cb484c955821b.
