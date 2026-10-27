import { Editor } from './application/Editor.js';
import { CliApplication } from './cli/CliApplication.js';
import { CommandRouter } from './cli/CommandRouter.js';
import { Repl } from './cli/Repl.js';
import { FileSvgStorage } from './io/FileSvgStorage.js';

const repl = new Repl(new CommandRouter(new Editor(new FileSvgStorage())));
process.exitCode = await new CliApplication(repl).run(process.argv.slice(2));
