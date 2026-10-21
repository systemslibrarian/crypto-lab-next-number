# Build brief — `crypto-lab-next-number`

**2026-10-20. Brief only; no repository exists yet.** Written against
`audits/_MASTER-TEMPLATE.md` (catalog `20cb434d89e4`) — §0 through §6 apply unchanged.
Source of the gap: Boneh–Shoup, *A Graduate Course in Applied Cryptography*, v0.6 (Jan. 2023),
§3.5 (the next bit test), §3.6 (Salsa/ChaCha PRGs), §3.7.1 (cryptanalysis of the linear
congruential generator).

**Verdict: new repository.** Named "Next Number" rather than "Next Bit" so it cannot be confused
with `crypto-lab-hidden-bit`.

```
NEW DEMO BRIEF
- Repo name:         crypto-lab-next-number
- Short name (H1):   Next Number
- Subtitle:          Next-bit unpredictability · LCG prediction · java.util.Random
- One-liner:         Predicts every future output of a linear congruential generator — a toy
                     decimal one, the real java.util.Random from two nextInt values, and a
                     512-bit LCG through a two-dimensional lattice — then runs the same
                     predictor against ChaCha20 and measures it guessing no better than a coin.
- Concept to teach:  A generator is secure exactly when nobody can guess its next bit better
                     than half the time (Boneh–Shoup Theorems 3.4 and 3.6). A generator built
                     for simulations publishes its rule, so each output gives its future away —
                     and its output still looks random.
- Primitives/spec:   java.util.Random (Java SE 21 API specification: setSeed, next(bits),
                     nextInt, nextDouble); Boneh–Shoup §3.7.1 (LCG G_lcg^(n), eq. 3.12–3.13,
                     Lemma 3.7); ChaCha20 (RFC 8439) via @noble/ciphers as the control
- Accent (--accent): [central assignment]
- Favicon emoji:     [central assignment]
- Category:          [central assignment]
- Level (suggested): Beginner opening, Intermediate overall — placement suggestion only
- Section (suggested): foundations  (RNG; cryptanalysis is the alternative)
- In scope:          a full-state toy decimal LCG predicted by applying its published rule;
                     java.util.Random state recovery from two nextInt outputs by trying all
                     2^16 hidden low bits; the book's 2^22 search for the 26-bit next(26)
                     output; the book's lattice predictor for q = 2^512, c = 32 with a
                     brute-force cross-check at q = 2^40; Attack Game 3.2 run as a measured
                     next-bit game against the LCGs and against ChaCha20
- Non-goals:         Mersenne Twister and xorshift128+ state recovery (extension seams);
                     Blum–Blum–Shub (Residue Gate's declared seam); general-dimension LLL;
                     NIST SP 800-22 batteries; DRBG constructions (DRBG Arena); seed-guessing
                     of a sound generator (Good Randomness)
```

## Overlap check — what I read, and what I found

Opened from source at the commits shown. I also ran
`grep -rliE "linear congruential|\bLCG\b|mt19937|untwist|mersenne twister|java\.util\.random|predict"`
across every clone in `/home/claude/labs/` (excluding node_modules/.git/dist) and inspected each hit.

- **DRBG Arena** (`4739c152e1ce`). `src/ui/exhibit5.ts:13–38` builds a deliberately broken
  MINSTD-style LCG over 2^32 and paints its **low byte** as a 64×64 grid to show periodic banding;
  it prints a row correlation and test verdicts. Nothing predicts an output. `src/ui/exhibit1.ts:51–54`
  says Math.random() "output can be predicted from prior values because it uses a linear
  congruential generator or similar construction" — asserted, not shown. Next Number is where that
  prediction is run.
- **Good Randomness** (`0935bc22058c`) recovers a key by guessing a *seed* of a sound generator
  (seeded ChaCha20). Its own brief (`audits/BRIEF-good-randomness.md`) says it chose ChaCha20
  deliberately because "using a toy LCG would let a reader conclude the generator was the problem."
  Next Number is the complement: here the generator **is** the problem, and the seed can be
  unknowable. The two labs should cross-link with exactly that contrast.
- **Entropy Collapse** (`f5abf0dd9b1a`) — a correct HMAC_DRBG with a duplicated or starved seed.
  Different failure (seed provenance), no prediction from outputs.
- **Corrupted Oracle** (`3f6f2f4a2a5a`) — Dual_EC-style state recovery from a *backdoor* (a planted
  point relation). Different mechanism: Next Number's generators hide nothing and are broken by
  their published structure. Link, do not repeat.
- **Token Tell** (`48c0ec13015e`) — its LCG hits (`src/watermark/hash.ts:6`,
  `src/ui/reference.ts:51`) are an LCG used as a *hash* inside a watermark detector. Not
  generator prediction.
- **Residue Gate** (`d1f1c553da40`) lists Blum–Blum–Shub as an extension seam
  (`brief.md:124`, `src/rabin/oracle.ts:17`). Leave BBS to it; name it in Links out.
- **Lattice code to learn from (separate repos — port with attribution, do not import):**
  `crypto-lab-lattice-gentle` (`ae3495ab8846`) has a 2-D Gauss reduction
  `src/lattice/gauss.ts:29 gaussReduce` and Babai rounding `src/lattice/vec2.ts:81 babaiRound`, both
  on `number` — unusable at 512 bits as written, but the right shape. `crypto-lab-nonce-lattice`
  (`6cd0b424d212`) has BigInt `src/lattice/babai.ts:37 babaiNearestPlane` and
  `src/lattice/lll.ts:62 lllReduce` (n-dimensional; more than this lab needs).
  Agent: re-open these at HEAD and record what you ported.

## The seven §1 sections

### SCOPE

1. **Guess the next number (Beginner opener).** A toy decimal generator — "multiply by 21, add 7,
   keep the last four digits" — labelled toy. The rule is printed on the page, because real
   libraries print theirs (show the Java SE constant `0x5DEECE66D`). The learner sees three
   outputs and types the fourth; the page checks it. Plain point: **every output *is* the whole
   state, so the published rule is all you need.** Arithmetic only.
2. **Hide some digits — java.util.Random.** The real generator, implemented to the Java SE 21 API
   text: `setSeed` stores `(seed ^ 0x5DEECE66D) & ((1L<<48)−1)`; `next(bits)` sets
   `seed = (seed * 0x5DEECE66D + 0xB) & ((1L<<48)−1)` and returns `(int)(seed >>> (48−bits))`;
   `nextInt()` is `next(32)`. Each nextInt shows the top 32 of 48 state bits. The learner pastes or
   generates two nextInt values; the page tries all 2^16 hidden low bits, live-counted, keeps the
   candidates whose next state reproduces the second output, then predicts the next ten. Then the
   book's own case: `nextDouble` is `((long)next(26) << 27) + next(27)) / 2^53`, so its first half
   reveals 26 bits and hides 22 — the book's 2^22 (≈4.2 million) search, run in a Worker with a
   measured rate.
   *Self-correction:* Boneh–Shoup §3.7.1 says the JDK 8 Math.random "outputs the top 48−22 = 26
   bits" per iteration. Per the Java SE API, `nextDouble` alternates `next(26)` and `next(27)`, so
   that sentence describes the first of each pair. The page says so in one line.
3. **Too big to guess — the lattice (Advanced disclosure).** Boneh–Shoup's attack: q = 2^512,
   c = 32, w = ⌊√q / c⌋ = 2^251, so each output r_i = ⌊s_i / w⌋ hides 251 bits — no search can
   reach them. From two outputs, eq. (3.12)/(3.13): g = (r_i·w, r_{i+1}·w − b), and the unknown
   u = s·(1,a) + x·(0,q) = g + e with 0 ≤ e < w in each coordinate. Find u as the lattice point of
   L_a nearest g. Show Fig. 3.9's picture at toy size (the book's own example: basis (1,5), (0,29),
   g = (9,7), u = (7,6)), then run 512-bit. Measure the success rate over many random a and set it
   beside Lemma 3.7's bound (at least 1 − 16/c² = 98.4375% of a are good for c = 32). Fail-closed
   fixtures for a = 1 and a = 2, where the book says the lemma fails.
4. **The next-bit game (Attack Game 3.2) — and the control.** Run the book's game literally:
   adversary picks i, receives r[0..i−1], outputs a guess for r[i]; advantage = |Pr[win] − 1/2|.
   Against the LCGs above the predictor wins every trial. Against ChaCha20 (same predictor, same
   index choice) the measured win rate sits at ≈ 1/2, shown with a 95% confidence interval over
   N trials. Theorems 3.4 and 3.6 in a disclosure: security ⇔ unpredictability, and Theorem 3.6's
   factor L (PRGadv = L · Predadv) stated, not dramatised.
5. **Why it matters.** Tokens, session ids and "random" passwords produced by a
   simulation-grade generator are predictable from earlier ones. Name java.util.Random's own API
   warning ("not cryptographically secure… Consider instead using SecureRandom"). For browsers:
   V8's Math.random() is **xorshift128+**, not an LCG (V8 blog, 17 Dec 2015) — the page must not
   say browsers use an LCG; it says only that Math.random() is likewise not cryptographically
   secure and points to `crypto.getRandomValues`.

Non-goal notes (one line each, in-page): Mersenne Twister / xorshift128+ recovery ("same lesson,
different algebra — not shown here"); BBS (→ Residue Gate); DRBG internals (→ DRBG Arena); seed
guessing of a sound generator (→ Good Randomness); statistical batteries (→ DRBG Arena exhibit 5).

### SECURITY / CORRECTNESS INVARIANTS

1. **Exact integer arithmetic only.** The 48-bit and 512-bit LCGs, the lattice and every rounding
   use BigInt (or a split-limb `number` fast path for the 2^16/2^22 searches that is cross-checked
   against the BigInt reference on random inputs in a test). No floating point anywhere a
   prediction depends on it — Babai rounding on doubles is exactly where this attack goes wrong.
2. **A prediction is displayed only after verification.** A recovered state is accepted only if it
   regenerates **both** observed outputs; predictions are then compared, value by value, against the
   generator's real continuation, which the attack module never sees (module isolation, as below).
3. **Uniqueness is checked, not assumed.** The lattice step collects every lattice point u in a
   search window with 0 ≤ u − g < w componentwise. Zero or more than one ⇒ "Lemma 3.7's uniqueness
   does not hold for this a" — fail closed, no prediction shown.
4. **The java.util.Random implementation matches the Java SE text and the pinned JDK vectors**
   (Tests) before any panel renders.
5. **Two-sided brute-force agreement.** At q = 2^40 (w = 2^15) the lattice answer must equal the
   exhaustive answer over all e0 ∈ [0, w) on every test seed.
6. **The control is the same predictor.** Act 4 runs the identical code path against ChaCha20
   output; there is no separate "fails on purpose" branch.
7. **No canned verdicts** — every rendered verdict carries a §4.1c mutation.

### ARCHITECTURE

```
src/gen/toyDecimal.ts     the labelled toy (×21, +7, mod 10^4)
src/gen/javaRandom.ts     setSeed / next(bits) / nextInt / nextDouble — BigInt reference
src/gen/lcg.ts            G_lcg^(n) over (q, a, b, w) per §3.7.1
src/gen/chacha.ts         ChaCha20 keystream via @noble/ciphers (the dependency
                          crypto-lab-chacha20-stream already uses); word stream for the game
src/attack/javaSearch.ts  2^16 (nextInt) and 2^22 (next(26)) hidden-bit search; Worker-driven
src/attack/lattice2d.ts   BigInt Lagrange–Gauss reduction, exact rational Babai rounding,
                          ±2 neighbourhood, uniqueness check (hand-rolled: the teaching subject)
src/attack/predictor.ts   the Attack Game 3.2 adversary (recover → regenerate → guess r[i])
src/game/nextBit.ts       the challenger: picks the generator, runs N trials, Wilson interval
src/verify/verify.ts      regenerates outputs from a candidate state; imports gen/*, never attack/*
src/worker/*.ts           search and game runs off the main thread, cancellable
src/ui/*.ts
```

Implementation note learned while checking this brief: centre the target at **g + (w/2, w/2)**
(e lies in [0, w), not around 0) before Babai rounding in the Gauss-reduced basis, then search
coefficient offsets in {−2,…,2}². A prototype run this way recovered the state in 499 of 500
random 512-bit instances (the one miss had two candidates, which the uniqueness check rejects)
and agreed with exhaustive search on 300 of 300 instances at q = 2^40. That is a
reproduction check, not a figure for the page; the page shows its own measured rate.

### UI

Act 1: three numbers, an input box, "Check". Act 2: "Generate two nextInt values" (or paste);
a live counter to 65,536 with candidates surviving; the next ten values predicted, then revealed
one at a time beside the generator's own. Act 3: Fig. 3.9 at toy size with g, the nearest lattice
point, and e drawn; then "Run at 512 bits" printing r_i, r_{i+1}, the recovered s and five predicted
outputs, each matched. A "Run 200 random a" button prints the measured success rate beside
1 − 16/c². Act 4: one generator selector (toy, Java, 512-bit LCG, ChaCha20), N trials, the win
rate with its interval and the advantage. Every panel stacks below 640px.

### VISUAL SEMANTICS

A successful prediction is **ALARM** (the generator is broken), never green. ChaCha20's ≈ 1/2
result is neutral ("no advantage measured"), not a green tick of security. The uniqueness
failure for a = 1, 2 reads as "attack refused — ambiguous", warning tone. Icon + text + colour
on every verdict. The toy decimal generator carries a persistent "toy" label.

### EDGE CASES

- Pasted nextInt values outside the signed 32-bit range, or not integers → refused with the range.
- Two outputs consistent with **more than one** 48-bit state (possible, rare) → list them and keep
  only those that also reproduce a third output; ask for one more value if needed.
- Outputs that came from different seeds / not consecutive → zero candidates; say exactly that.
- Lattice: a with gcd(a, q) ≠ 1 is outside §3.7.1's setup → refused; a = 1, 2 → fail-closed
  fixture as above.
- Act 4: N below the trial count needed for a meaningful interval → the interval is shown wide
  and labelled; no verdict.
- Worker cancelled mid-search → the partial count is shown; no candidate claimed.

### EXTENSION SEAMS

- `// [extension] point` in `src/gen/` for Mersenne Twister (624-output state recovery) and V8's
  xorshift128+ — both without a Boneh–Shoup anchor; cite their own primary sources if built.
- `// [extension] point` in `src/attack/lattice2d.ts` for the n-dimensional case (fewer bits per
  output, more outputs) — would need LLL; link Nonce Lattice / LLL Break rather than duplicating.
- `// [extension] point` in `src/game/nextBit.ts` for the Theorem 3.6 direction (turn a statistical
  test into a predictor) as a measured demo.

## Tests

KATs (Vitest, `src/**/*.test.ts`; exclude `e2e/`):
- **java.util.Random.** Generated by the brief author on OpenJDK 21.0.12.1 (Ubuntu build
  21.0.12.1+1-1-24.04.4) with `new Random(seed)`, and reproduced independently from the Java SE
  formula. Re-generate with a pinned JDK before committing and record its exact version; if no JDK
  is available, keep these with that provenance line — they are not published test data.
  - seed 0, nextInt ×6: −1155484576, −723955400, 1033096058, −1690734402, −1557280266, 1327362106
  - seed 42, nextInt ×6: −1170105035, 234785527, −1360544799, 205897768, 1325939940, −248792245
  - seed 123456789, nextInt ×6: −1442945365, −1016548095, 1962592967, 1094656688, 1677212580, 930275108
  - seed 0, nextDouble ×3: 0.730967787376657, 0.24053641567148587, 0.6374174253501083
  - seed 42, nextDouble ×3: 0.7275636800328681, 0.6832234717598454, 0.30871945533265976
- **ChaCha20.** RFC 8439 §2.4.2 (114-byte plaintext — two 64-byte blocks, so it exceeds one block)
  and §2.3.2 (one block). Note in-page: RFC 8439 uses a 32-bit counter and 96-bit nonce; the book's
  §3.6 description uses the original 64-bit/64-bit layout (RFC 8439 §2.3 records the change).
- **Book worked example.** Fig. 3.9: basis (1,5), (0,29), g = (9,7) ⇒ nearest u = (7,6).

Independent re-derivations (`e2e/claims.spec.ts`, §4.1b):
- Parse the displayed recovered state and both observed outputs from the page; recompute
  ⌊s/w⌋ and ⌊(a·s + b mod q)/w⌋ in the test with BigInt and compare to what is displayed.
- Parse the predicted values and compare to the generator continuation the test computes itself
  from the seed (re-implemented in the test from the Java SE formula, not imported from src).
- The displayed candidate count after two nextInt values equals the test's own exhaustive count.
- The measured success rate equals successes / trials as printed (parts-sum-to-whole), and the
  bound printed equals 1 − 16/c² for the c on screen.
- Act 4: the printed advantage equals |wins/N − 1/2| from the printed counts, and the printed
  interval contains wins/N.

§4.1c mutations (one per rendered verdict, run from `scripts/mutations.*` with concrete patches):
predictor skips the second-output check; lattice target not centred (drops the w/2 shift);
uniqueness check accepts the first of several candidates; Java `next()` shifts by 48−bits−1;
ChaCha control secretly swapped for the LCG; advantage computed as wins/N instead of
|wins/N − 1/2|; nextDouble halves swapped (27 then 26). Each must turn a NAMED test red, with
baseline-passed, non-empty diff and moved bundle hash asserted first.

§4.1d negative claim — scoped to this page: **"Passing these frequency checks does not make a
generator unpredictable."** Evidence fixture: java.util.Random nextInt output run through the
page's own simple checks (monobit balance and a runs count, computed and shown) — both green —
while Act 2's predictor recovers the state and predicts the next ten values exactly. Pin the
fixture's seed: at a 1% threshold, 4 of 200 random seeds (1,000 nextInt values each) failed one of
the two checks in the brief author's run, which is what chance predicts — so a fixture on a random
seed would be flaky, and that sentence is itself worth one line in the honesty notes. The verdict
reads both at once: `LOOKS RANDOM — AND PREDICTED`. A second honesty assertion (not the §4.1d
claim): Act 4's ≈ 1/2 for ChaCha20 is labelled "evidence about this predictor only" — Theorem 3.6
quantifies over every efficient predictor, which no page can run.

## Honesty notes for the page

- The decimal generator is a toy; java.util.Random and ChaCha20 are the real algorithms; the
  512-bit LCG is the book's parameter choice, not a deployed generator.
- The lattice attack's success is probabilistic over a (Lemma 3.7); the page reports its own
  measured rate and never promises success.
- V8's Math.random is xorshift128+, not an LCG; this lab breaks LCGs and says that much only.
- Not production crypto — a teaching demo.

## Links out

**Good Randomness** (a sound generator with a guessable seed — the opposite failure),
**Entropy Collapse** (seeds duplicated at scale), **Corrupted Oracle** (a generator broken on
purpose), **DRBG Arena** (how approved generators are built), **Residue Gate** (where BBS will
live), **ChaCha20 Stream** (the control's internals), **Lattice Gentle** (2-D lattices and Babai).

## Sources

- D. Boneh, V. Shoup, *A Graduate Course in Applied Cryptography*, v0.6, Jan. 2023 —
  https://toc.cryptobook.us/ (page lists v0.6 as latest). §3.5 Attack Game 3.2, Definition 3.3,
  Theorem 3.4, Lemma 3.5, Theorem 3.6; §3.6 Fig. 3.8; §3.7.1 eq. (3.12)–(3.13), Fig. 3.9, Lemma 3.7.
- Java SE 21 API, `java.util.Random` (setSeed, next, nextInt, nextDouble; "not cryptographically
  secure") — https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Random.html
- Java SE 21 API, `Math.random()` ("exactly as if by the expression new java.util.Random()") —
  https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html
- RFC 8439, ChaCha20 and Poly1305 for IETF Protocols (§2.3, §2.3.2, §2.4.2) —
  https://www.rfc-editor.org/rfc/rfc8439
- V8 blog, "There's Math.random(), and then there's Math.random()", 17 Dec 2015 (xorshift128+,
  V8 4.9.41.0 / Chrome 49; "still not cryptographically secure") — https://v8.dev/blog/math-random
- A. M. Frieze, J. Håstad, R. Kannan, J. C. Lagarias, A. Shamir, "Reconstructing truncated integer
  variables satisfying linear congruences", SIAM J. Comput. 17(2):262–280, 1988 —
  doi:10.1137/0217016 (Crossref-verified; the general truncated-LCG attack)
- L. Babai, "On Lovász' lattice reduction and the nearest lattice point problem", Combinatorica
  6(1):1–13, 1986 — doi:10.1007/BF02579403 (Crossref-verified; rounding method)
