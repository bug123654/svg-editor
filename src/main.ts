import { Editor } from './application/Editor.js';
import { CommandRouter } from './cli/CommandRouter.js';
import { Repl } from './cli/Repl.js';
import { FileSvgStorage } from './io/FileSvgStorage.js';

await new Repl(new CommandRouter(new Editor(new FileSvgStorage()))).run();
