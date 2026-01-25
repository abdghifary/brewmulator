# Brewmulator - Coffee Extraction Simulator

Physics-based coffee extraction simulator using WebAssembly and Nuxt UI.

## Features

- **Real-time visualization**: See the extraction process as it happens.
- **Brew Parameters**: Fine-tune water temperature, flow rate, and pressure.
- **Dose Parameters**: Adjust coffee mass, grind size, and distribution.

## Setup

Make sure to install the dependencies. This will automatically build the WebAssembly physics engine:

```bash
pnpm install
```

## Development

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

> [!TIP]
> Saving `.ts` files in the `assembly/` directory will automatically recompile the WASM module and trigger a full page reload.

## Production

The production build pipeline first compiles the AssemblyScript source to WebAssembly, then builds the Nuxt application:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```
