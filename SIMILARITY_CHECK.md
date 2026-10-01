# Duplicate-Project Check

When a team submits its title and abstract, the server checks whether a similar project already exists. It runs fully on the VM: no API, no cost, and student text never leaves the server.

## How it works

1. All teammates submit matching titles and abstracts, and consensus is reached.
2. A local model, `Xenova/bge-base-en-v1.5`, turns the title and abstract into a list of 768 numbers called an **embedding**. Abstracts with similar meaning get similar numbers, even when the wording is different.
3. The embedding is saved on the project (the `abstractEmbedding` field).
4. The new embedding is compared against every other project's embedding. The closest match gives the **similarity score**, from 0 to 100.
5. The score decides what happens next:

| Similarity | Result |
|---|---|
| below 85 | Normal: goes to the guide for review |
| 85–94 | **Flagged**: goes to the guide, with a warning |
| 95 or above | **Auto-rejected**: the team must revise and resubmit |

Guides see the 3 closest projects with their title, year and score. Students only see their own score, never other teams' titles.

Typical scores:

| Pair of abstracts | Score |
|---|---|
| A reworded copy of an existing project | ~90+ |
| A different project in the same field | ~60–70 |
| A completely unrelated project | ~55–60 |

Unrelated abstracts never score near 0. That is normal for this kind of model.

If the model fails for any reason, the submission still goes through without a similarity score, and the guide reviews it as usual.

## What is the backfill?

The check can only compare against projects that already have an embedding. Projects created before this feature have none, so new submissions would never be matched against them.

**Backfill** is a one-time script that goes through those existing projects and creates their embeddings. It processes only projects that have an abstract but no embedding yet. Running it again is safe: it skips projects that are already done.

The first run also downloads the model (about 110 MB) to the server's cache. Without it, the first student to submit would wait for that download.

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

The backfill reads `MONGO_URI` from `server/.env`, so it runs against whatever database the app uses. Expect roughly 0.1–0.2 seconds per project, which is a few minutes for a few thousand projects.

Example output:

```
Embedding 2841 projects...
  100/2841
  ...
Done: 2841 projects embedded.
```

Run it again whenever projects are bulk-imported with abstracts, for example from Excel. Normal student submissions embed themselves automatically.

## Checking that it works

```bash
cd server
node scripts/similarityCheck.js
```

This needs no database. It embeds a few sample abstracts, prints their scores and checks them. The last line should be `ok`.

```
{ paraphrase: 92, sameDomain: 65, unrelated: 60 }
ok
```

## Settings (optional)

Add these to `/etc/vista/deploy.conf` only if you want to change the defaults, then re-run `provision.sh`. Don't edit `server/.env` directly: `provision.sh` rewrites it on every run.

| Variable | Default | Meaning |
|---|---|---|
| `SIMILARITY_FLAG_THRESHOLD` | `85` | Score at which a submission is flagged for the guide |
| `SIMILARITY_REJECT_THRESHOLD` | `95` | Score at which a submission is auto-rejected |
| `EMBEDDING_MODEL` | `Xenova/bge-base-en-v1.5` | Model used for embeddings |

If too many normal projects get flagged, raise the flag threshold. If copies slip through, lower it.

**If you change `EMBEDDING_MODEL`:** old embeddings don't match the new model, and the check silently skips projects whose embedding length differs. Clear them and run the backfill again:

```bash
sudo vdb --eval 'db.projects.updateMany({}, {$unset: {abstractEmbedding: 1}})'
sudo ./deploy/provision.sh    # re-runs the backfill with the new model
```

## Where the code is

| File | What it does |
|---|---|
| `server/services/similarityService.js` | Loads the model, creates embeddings, finds the closest projects |
| `server/services/titleAbstractService.js` | Runs the check on submission and applies the thresholds |
| `server/models/projectSchema.js` | `abstractEmbedding`, `contentCheck.similarityScore`, `contentCheck.similarProjects` |
| `server/scripts/backfillEmbeddings.js` | The one-time backfill |
| `server/scripts/similarityCheck.js` | Self-check |
