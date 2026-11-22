# v1.5.11 — Preset the imported translation language

The teacher's 國別化輔助語種 field is filled directly from the imported translation meanings. Detection uses local script/word clues for the existing eleven teaching languages, with no external service or new interface. Unknown, blank and tied results preserve the current field. Teachers can type or choose another value. Existing dropdown gains Spanish, Filipino, Khmer and Thai to match the supported suggestions.

The scan remembers the translation fingerprint so preview, validation, tabs and phonetic-only edits preserve a manual choice. New translation content and explicit file imports are detected again. Chinese text, pronunciation, PDF rendering and student layout are not changed.

Validation: tests/teacher-language.cjs covers eleven languages, blank/unknown/tied input, manual choice, rescans, annotation edits, changed translations and explicit reimport. Browser checks: pasted Indonesian data presets 印尼文; manually choosing 英文 persists through PDF/words tabs; pasting Thai data presets 泰文. Detection is a suggestion using script and vocabulary clues; ambiguous short translations may remain unchanged or require teacher correction.
