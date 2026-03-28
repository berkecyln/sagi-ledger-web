# Sagi

A personal income and expense tracker that runs entirely in the browser. No account, no server, no sync, your data lives in your browser's localStorage.

Built for (myself) people who want a simple monthly ledger without the overhead of a full budgeting app.

## Data

Everything is stored in `localStorage` under the key `sagi-storage`. Nothing leaves your browser. Clearing site data will erase your history.

To nuke your data without clearing site data, press F12 go to console and run `localStorage.removeItem('sagi-storage')`

## License

MIT use it, fork it, change it.
