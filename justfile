opencode-server:
    cd targetsite && opencode serve --port 4096 --hostname 127.0.0.1 --cors http://127.0.0.1:4321

opencodecms:
    bun run dev

targetsite:
    cd targetsite && bun run dev
