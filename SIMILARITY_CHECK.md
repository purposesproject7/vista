# Duplicate-Project Check

When a team submits its title and abstract, the server checks whether a similar project already exists. It runs fully on the VM: no API, no cost, and student text never leaves the server.

## How it works

1. One teammate submits the title and abstract for the whole team.
2. A local model, `Snowflake/snowflake-arctic-embed-m-v2.0`, turns the title and abstract into a list of 768 numbers called an **embedding**. Abstracts with similar meaning get similar numbers, even when the wording is different. The model reads up to 8192 tokens, so the whole abstract counts, even at the 500-word limit.
3. The embedding is compared against every **approved** project and against **100 commonly done projects** (see below). The closest match gives the **similarity score**, from 0 to 100. The submission itself is not stored for comparison yet.
4. When the guide accepts the title and abstract, the approved text is embedded and saved on the project (the `abstractEmbedding` field). From then on, later submissions are compared against it. Pending and rejected submissions are never in the comparison set.
5. The score decides what happens next:

| Similarity | Result |
|---|---|
| below 75 | Normal: goes to the guide for review |
| 75–92 | **Flagged**: goes to the guide, with a warning |
| 93 or above | **Auto-rejected**: the team must revise and resubmit |

These thresholds apply to matches with **approved projects**. Matches with a **common project** only ever flag, never reject, at 70 or above: doing a common project is allowed, copying another team's is not.

Guides see the 3 closest matches with their title, year and score; common projects show as "(Common project)". Students only see their own score, never other teams' titles.

## Common projects (the baseline)

Without approved projects there would be nothing to compare against, so the check ships with 100 commonly done student projects in `server/data/referenceProjects.json`: IoT (light-sensing dimmer, smart irrigation, home automation...), computer vision, healthcare AI, NLP, web/app, blockchain, security and robotics. Each has a title and a short abstract. They are stored in their own `referenceprojects` collection, never as real projects, so they don't appear in project lists or reports.

The backfill (which runs on every deploy) adds new entries from the file, updates changed ones and embeds them. To add more, append `{"domain", "title", "abstract"}` objects to the file and redeploy. As guides approve projects, those join the comparison set too, so the baseline matters less over time.

Reference abstracts are short (~80 words) next to full submissions (250–500 words), which lowers scores against them: a full submission of the same common project scores about 72–94, and the same problem done a different way about 51–69. Hence their own flag line of 70 (`SIMILARITY_REFERENCE_FLAG_THRESHOLD`).

Typical scores:

| Pair of abstracts | Score |
|---|---|
| The same abstract with a few words changed | ~97 |
| A heavily reworded copy of an existing project | ~80–88 |
| The same problem solved a different way (e.g. sensor glove vs camera for sign language) | ~55–65 |
| A different project in the same field | ~35–55 |
| A completely unrelated project | ~15–35 |

If the model fails for any reason, the submission still goes through without a similarity score, and the guide reviews it as usual.

## What is the backfill?

The check can only compare against projects that already have an embedding. Projects created before this feature have none, so new submissions would never be matched against them.

**Backfill** goes through existing projects and creates their embeddings from the approved title and abstract (`name` + `abstract`, never the unapproved proposal). It processes only projects that have an abstract but no embedding yet. It also removes embeddings that older versions stored for submissions still in progress (pending, rejected), so only approved work is compared against. Running it again is safe: it skips projects that are already done.

The first run also downloads the model (about 300 MB) to the server's cache. Without it, the first student to submit would wait for that download.

Each embedding records which model made it (`abstractEmbeddingModel`). Embeddings from different models can't be compared, even when they have the same length, so the search only uses embeddings from the current model, and the backfill re-embeds any project whose embedding came from a different one. Changing the model therefore needs nothing more than a re-run of the backfill.

## Running it on the VM

`deploy/provision.sh` does all of this automatically:

```bash
sudo ./deploy/provision.sh
```

It installs the dependency, caches the model in `/var/cache/vista/models` (so redeploys don't re-download it), runs the backfill, and checks the model in its final verify step. A failed backfill doesn't stop the deploy; the script prints the command to re-run it.

To run the backfill by hand, for example after a bulk import:

```bash
sudo -u <app user> bash -c 'cd /path/to/vista/server && node scripts/backfillEmbeddings.js'
```

The backfill reads `MONGO_URI` from `server/.env`, so it runs against whatever database the app uses. Expect roughly 0.1–0.3 seconds per project, which is a few minutes to a quarter of an hour for a few thousand projects.

Example output:

```
Removed 3 embeddings of unapproved submissions.
Embedding 2841 projects with Snowflake/snowflake-arctic-embed-m-v2.0...
  100/2841
  ...
Done: 2841 projects embedded.
```

Run it again whenever projects are bulk-imported with abstracts, for example from Excel. Projects a guide accepts are embedded automatically at acceptance.

## Checking that it works

```bash
cd server
node scripts/similarityCheck.js
```

This needs no database. It embeds a few sample abstracts, prints their scores and checks them. The last line should be `ok`.

```
{ paraphrase: 86, sameDomain: 38, unrelated: 20 }
ok
```

## Settings (optional)

Add these to `/etc/vista/deploy.conf` only if you want to change the defaults, then re-run `provision.sh`. Don't edit `server/.env` directly: `provision.sh` rewrites it on every run.

| Variable | Default | Meaning |
|---|---|---|
| `SIMILARITY_FLAG_THRESHOLD` | `75` | Score at which a submission is flagged for the guide |
| `SIMILARITY_REJECT_THRESHOLD` | `93` | Score at which a submission is auto-rejected |
| `SIMILARITY_REFERENCE_FLAG_THRESHOLD` | `70` | Score against a common project at which a submission is flagged (never rejected) |
| `EMBEDDING_MODEL` | `Snowflake/snowflake-arctic-embed-m-v2.0` | Model used for embeddings |

If too many normal projects get flagged, raise the flag threshold. If copies slip through, lower it.

**If you change `EMBEDDING_MODEL`:** re-run the deploy, which re-runs the backfill; it re-embeds every project with the new model. Until it finishes, projects not yet re-embedded are left out of the comparison. Each model has its own score range, so re-calibrate both thresholds (see below).

## Why this model

It was picked by benchmark on 7 project topics, each with an original abstract, a reworded copy, the same idea done a different way, and a different project in the same field. The models tried were bge-base-en-v1.5 (previous), nomic-embed-text-v1.5, gte-base-en-v1.5, mxbai-embed-large-v1, snowflake-arctic-embed-m-v2.0, and three cross-encoder rerankers.

- Every embedding model ranked all 7 copies above the alternatives. Bigger models did not separate them better.
- The rerankers did worse (3–6 of 7 ranked correctly). They are trained to match a search query to a passage, not to compare two documents.
- The deciding test: two abstracts with the same first ~390 words and completely different second halves. bge-base scored them **99**, because it stops reading at 512 tokens and never sees the second half. That is a false auto-reject. arctic-embed scored them **83**.
- arctic-embed spreads scores more widely (different projects as low as 13), which leaves more room between "same idea" and "copy" for the thresholds.

## Where the code is

| File | What it does |
|---|---|
| `server/services/similarityService.js` | Loads the model, creates embeddings, finds the closest projects |
| `server/services/titleAbstractService.js` | Runs the check on submission and applies the thresholds; embeds the approved text on acceptance |
| `server/models/projectSchema.js` | `abstractEmbedding`, `abstractEmbeddingModel`, `contentCheck.similarityScore`, `contentCheck.similarProjects` |
| `server/scripts/backfillEmbeddings.js` | The backfill (runs on every deploy); also seeds the common projects |
| `server/data/referenceProjects.json` | The 100 common projects |
| `server/models/referenceProjectSchema.js` | Where they are stored |
| `server/scripts/similarityCheck.js` | Self-check |
