# Rollback bookmark (“last working version”)

When you say you want to **rollback to last working version**, this repo’s definition is:

**Git tag:** `last-working-version` (this is the source of truth for the snapshot)

**Verify current hash:** `git rev-parse last-working-version`

**App baseline at bookmark time:** invite flow uses set-password on `/auth/accept-invite` (same-page session); prior feature commit `aa85baa`.

## Restore the tree to match this bookmark

```bash
git fetch origin tag last-working-version 2>nul || true
git checkout main
git reset --hard last-working-version
```

To only inspect without moving `main`:

```bash
git checkout last-working-version
```

To recover on a new branch instead of resetting `main`:

```bash
git checkout -b recovery-from-bookmark last-working-version
```

> `git reset --hard` discards local commits and uncommitted changes on `main` after the bookmark. Stash or branch first if you need to keep anything.

## Refresh this bookmark later

After you confirm a new “golden” state:

```bash
git tag -f -a last-working-version -m "User baseline: last working version"
git push origin last-working-version --force
```

Update this file’s **Commit** line to match `git rev-parse last-working-version`.
