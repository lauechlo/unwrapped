# Archive: Old Synthesis Files

**Date Archived:** 2024-12-24

## Why These Files Were Archived

These files represent the **V2 diagnostic framing** version of the synthesis system, which was replaced by **V3 viral labels**.

### Evolution

1. **V1:** Prose narratives with psychology framework citations
2. **V2 (these files):** Diagnostic framing without citations
3. **V3 (current):** Viral diagnostic labels with artist names + Gen Z slang

### Key Problem with V2

Generic pattern labels that weren't screenshot-worthy:
- ❌ "Obsessive Loyalist"
- ❌ "Memory Curator"
- ❌ "Ritual Maximalist"

### V3 Solution

Viral labels with specificity:
- ✅ "The 'Make It To Christmas' Disorder"
- ✅ "Wicked Hyperfixation Era (6/20 Tracks)"
- ✅ "The Ariana/Taylor/Sabrina Trifecta"

## Archived Files

- `synthesize-old.ts` - V2 synthesis logic (replaced by `synthesize-viral.ts`)

## Migration Notes

All V2 functionality has been preserved and enhanced in V3:
- Hero insight generation → Now with viral language
- Pattern card generation → Now with artist/track names in labels
- Listening DNA → Now with Gen Z slang in dimension labels

## If You Need to Reference This

The old prompts are preserved at:
- `lib/claude/prompts-pre-viral.ts` (for comparison)

Current production prompts:
- `lib/claude/prompts.ts` (V3 viral labels)
