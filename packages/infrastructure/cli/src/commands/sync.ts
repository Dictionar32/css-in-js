import { CliUsageError } from "../utils/errors"
import { runCommand, runCommandAsJson } from "../utils/process"
import { buildScriptCommand, resolveScript } from "./helpers"
import type { CommandDefinition } from "./types"

export const syncCommand: CommandDefinition = {
  name: "sync",
  async run(args, context) {
    const syncCmd = args[0]
    if (!syncCmd) {
      throw new CliUsageError("Usage: tw sync <init|pull|push|diff|figma>")
    }

    if (syncCmd === "figma") {
      const figmaAction = args[1]
      if (!figmaAction) {
        throw new CliUsageError(
          "Usage: tw sync figma <pull|push|diff|modes> [--file=KEY1,KEY2] [--mode=dark]"
        )
      }
      const isMulti = args.some(
        (value) =>
          value.startsWith("--file=") ||
          value.startsWith("--mode=") ||
          value.startsWith("--from=") ||
          figmaAction === "modes"
      )
      const script = await resolveScript(
        context,
        isMulti ? "scripts/v45/figma-multi.ts" : "scripts/v45/figma-sync.ts"
      )
      const command = buildScriptCommand(script, [figmaAction, ...args.slice(2)])
      if (context.json) {
        await runCommandAsJson(`sync.figma.${figmaAction}`, command.binary, command.args)
      } else {
        await runCommand(command.binary, command.args)
      }
      return
    }

    const script = await resolveScript(context, "scripts/v45/sync.ts")
    const command = buildScriptCommand(script, [...args])
    if (context.json) {
      await runCommandAsJson(`sync.${syncCmd}`, command.binary, command.args)
    } else {
      await runCommand(command.binary, command.args)
    }
  },
}
