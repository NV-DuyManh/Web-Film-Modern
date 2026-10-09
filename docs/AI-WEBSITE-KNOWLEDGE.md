# MFILM website question batch

Version: `2026-10-09.website.1`.

The active set has 1,600 distinct questions. This batch adds **1,328**: 328 questions for 82 practical website topics, and 1,000 named-film situations (five different actions for each of 200 real movies from the catalog snapshot).

The topics cover Free/Basic/Plus/Premium, Free movies with no rental payment, 30-day rentals, payment failures, accounts, search, genres, countries, cast, episodes, servers, subtitles, favorites, lists, resume, devices and MFILM support. Named-film cases cover choosing episodes, favorites, checking rental options, reporting playback issues and sharing a real movie URL. They never store a current price, personal entitlement, payment outcome or guessed release schedule.

General knowledge from the earlier 1,000-question batch and 125 older broad-topic entries is no longer loaded by the chatbot. The original source files remain for comparison. The knowledge version also prevents old answer-memory records from overriding the new set.

The named-film guides require an exact normalized question or the existing supported conversational wrapper; fuzzy retrieval cannot silently substitute a different movie's link. General FAQ retrieval still uses the existing conservative confidence checks. Unknown or current facts continue through catalog/model handling.

This is a reviewed retrieval dataset, not model weight training. The 4,800 tested examples include normalized and polite variants; those variants are not counted as new questions.

- Review every actual question and answer in `data/ai/bo-cau-hoi-tra-loi.md`.
- `npm run ai:train` validates all active question variants and exports the report and JSONL.
- `node scripts/composeWebsiteKnowledge.mjs` explicitly rebuilds the batch from authored website topics and the deployment catalog snapshot. Review regenerated links before deploying if movies have been renamed or removed.
