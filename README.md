# Next Number

## What It Is

Implements a four-digit toy LCG, Java SE 21 java.util.Random’s exact 48-bit recurrence, a 512-bit truncated LCG from Boneh–Shoup v0.6 §3.7.1, and an RFC 8439 ChaCha20 control. The 2-D lattice reduction and Java hidden-bit searches use exact BigInt arithmetic. Not production crypto — a teaching demo. All material is generated in memory; this static site has no account, backend or key storage.

## Exhibits

1. Guess the toy generator’s fourth output from its public recurrence.
2. Recover Java’s internal state from two consecutive nextInt values by checking all 2^16 hidden low bits; optionally search 2^22 low bits after a next(26) pair.
3. Recover a 512-bit LCG state from two truncated outputs with exact 2-D lattice reduction; measure 200 random multipliers.
4. Run the same next-bit predictor interface against toy, Java, lattice, and ChaCha20 and inspect the Wilson interval.
5. Observe simple frequency and run checks pass on a pinned Java seed even while the next outputs are predicted.

## When to Use It

Use this to study the exact mechanism and its failure boundary. Do not use the toy implementation, keys or protocols in a deployed security system.

## Live Demo

[Open Next Number](https://systemslibrarian.github.io/crypto-lab-next-number/) to drive the exhibits. The build uses Vite's `/crypto-lab-next-number/` base for GitHub Pages.

## What Can Go Wrong

Java Random is not a cryptographic generator. Its output can look balanced while the published recurrence lets an adversary derive the next output. A measured half-win rate for this particular predictor against ChaCha20 is not a proof of security against all efficient predictors.

## Real-World Usage

Java documents Random as unsuitable for cryptographic use and recommends SecureRandom. Browser V8’s Math.random uses xorshift128+, not Java’s LCG; neither should supply unpredictable security tokens.

## How to Run Locally

```sh
npm ci
npm run dev
```

## Related Demos

[Good Randomness](https://github.com/systemslibrarian/crypto-lab-good-randomness) · [Entropy Collapse](https://github.com/systemslibrarian/crypto-lab-entropy-collapse) · [DRBG Arena](https://github.com/systemslibrarian/crypto-lab-drbg-arena) · [ChaCha20 Stream](https://github.com/systemslibrarian/crypto-lab-chacha20-stream) · [Lattice Gentle](https://github.com/systemslibrarian/crypto-lab-lattice-gentle)

## Build & Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:a11y
npm run test:mutations
```

5 unit tests with pinned OpenJDK 21 nextInt/nextDouble sequences, a Java state recovery, a 40-bit lattice instance, and RFC 8439 ChaCha20 block output; browser claims rederive the displayed prediction. The replayable mutation harness contains 4 concrete source patches. Each run first passes its named baseline test, requires a non-empty diff, a successful build and changed JavaScript bundle hash, then requires the owning test to fail and restores the original hash. The Playwright suite scans reachable desktop and mobile states for WCAG 2.1 A/AA issues and independently rederives displayed claims. GitHub Actions runs unit tests, production build and browser gate before deploying; it also gates Dependabot pull requests, groups minor/patch npm updates and dispatches a deploy after an automated merge.

## Performance

All runs are local to the browser. Work figures shown in the page are either actual counted operations or explicitly labelled mathematical estimates/extrapolations. Workers keep long searches cancellable where used. No speed number is a claim about a production deployment.

## Sources

- [Boneh–Shoup v0.6 §§3.5–3.7.1](https://toc.cryptobook.us/)
- [Java SE 21 Random API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Random.html)
- [RFC 8439](https://www.rfc-editor.org/rfc/rfc8439)

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*
