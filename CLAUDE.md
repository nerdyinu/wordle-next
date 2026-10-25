# wordle-next

## Code review and fix proposals (user rule, 2026-10-25)

Whenever you review code and propose a fix or change, every proposal must contain all three parts below. A prose description alone does not count as a proposed fix.

1. **Root code.** Quote the actual code the problem originates from or relates to, with `path:line`, plus every other place in scope that the problem affects.
2. **Before and After code, with what changed.** Show **Before** (the current code that changes, labelled `path:lines`) and **After** (the whole function or file as it should be after the fix, not diff hunks). Under each After, list briefly and accurately what the fix changed. Never tell the user how to apply it ("paste this", "replace the file"): whether to paste it, retype it or edit only the changed lines is the user's choice. Keep the applicable patch file next to the proposal too. Every proposed fix or change comes with its Before/After code.
3. **Justification.** Explain why the change is valid: how it removes the root cause, with before/after evidence (error output, test result, observed behaviour) wherever you can get it. Compare it against the other possible fixes and present only the one that wins that comparison; mention the alternatives only inside that comparison.
4. **Strict segregation: proposal first, code only with approval.** Every diff you present must come from a specific fix proposal produced by the review. Apply it first to that proposal, doc or plan (its origin), and keep it there. Applying a diff to the actual code is a separate step that needs the user's explicit approval, and the two must never be blurred. Throwaway scratch copies outside the repo may be used to verify a proposal; they are not the user's code.

This applies to code reviews, debugging write-ups, refactor suggestions and fix plans, and to findings that subagents or other agents return to you: ask them for this format, and fill in anything missing before you pass their findings on.
