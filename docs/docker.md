# Docker

Local PocketBase for development and live tests. Production is never touched.

| Container | Port | Data | Used by |
|---|---|---|---|
| `sagi-pb-dev` | `127.0.0.1:8090` | kept in the volume `sagi-pb-dev` | `npm run dev`, `npm run seed` |
| `sagi-pb-test` | `127.0.0.1:8091` | none, removed after the run | `npm run test:live` |

Both run the image `sagi-pb`, built from [`pocketbase/`](../pocketbase/).

## 1. Initial setup

Docker needs your user in the `docker` group:

```bash
sudo usermod -aG docker $USER
```

Log out and in once.

Then fill the dev database:

```bash
npm run seed
```

## 2. Usage

| Command | Does |
|---|---|
| `npm run dev` | starts `sagi-pb-dev` if it is not running, then the app at `http://localhost:5173` |
| `npm run seed` | deletes the dev data, starts fresh, creates the demo user |
| `npm run pb:down` | stops `sagi-pb-dev`, the data stays |
| `npm run test:live` | starts `sagi-pb-test`, runs `tests/live`, removes it |

Sign in to the app as `test` / `test1234`.

The PocketBase dashboard is at `http://127.0.0.1:8090/_/`, superuser `test@sagi.local` / `sagi-test-password`. The test invite code is `test-invite-code`.

`sagi-pb-dev` keeps running after Ctrl+C in `npm run dev`, `npm run pb:down` stops it.

## 3. After a schema change

Change the collection or rule in production, test it with a real request, then:

1. Dashboard, Settings, Export collections, save as `dev/server/pb_schema.json`.
2. Copy it to `pocketbase/pb_schema.json` and replace the invite code in the `users` create rule with `test-invite-code`.
3. `npm run seed`, the schema is only imported into a fresh database.
4. `npm run test:live`.

## 4. On the phone

The phone needs both the app and the local PocketBase:

```bash
adb reverse tcp:5173 tcp:5173
adb reverse tcp:8090 tcp:8090
```

Open `http://localhost:5173` on the phone.


---

Useful commands:

```bash
docker ps                   # running containers
docker logs sagi-pb-dev     # PocketBase output
docker images               # built images
docker volume ls            # kept data
```
