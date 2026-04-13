# tw-plugin-my-plugin

TODO: Describe your tailwind-styled plugin.

## Installation

```bash
tw plugin install tw-plugin-my-plugin
# or
npm install tw-plugin-my-plugin
```

## Usage

```typescript
import myPlugin from "tw-plugin-my-plugin"
import { createEngine } from "@tailwind-styled/engine"

const engine = await createEngine({
  plugins: [myPlugin({ debug: true })],
})
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | string | `""` | TODO: describe |
| `debug` | boolean | `false` | Enable debug logging |

## License

MIT
