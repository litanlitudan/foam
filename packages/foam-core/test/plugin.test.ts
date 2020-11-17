import path from 'path';
import { loadPlugins } from '../src/plugins';
import { createMarkdownParser } from '../src/markdown-provider';
import { createGraph } from '../src/note-graph';
import { createTestNote } from './core.test';
import { FoamConfig, createConfigFromObject } from '../src/config';

const config: FoamConfig = createConfigFromObject([], [], [], {
  experimental: {
    localPlugins: {
      enabled: true,
      pluginFolders: [path.join(__dirname, 'test-plugin')],
    },
  },
});

describe('Foam plugins', () => {
  it('will not load if feature is not explicitly enabled', async () => {
    let plugins = await loadPlugins(createConfigFromObject([], [], [], {}));
    expect(plugins.length).toEqual(0);
    plugins = await loadPlugins(
      createConfigFromObject([], [], [], {
        experimental: {
          localPlugins: {},
        },
      })
    );
    expect(plugins.length).toEqual(0);
    plugins = await loadPlugins(
      createConfigFromObject([], [], [], {
        experimental: {
          localPlugins: {
            enabled: false,
          },
        },
      })
    );
    expect(plugins.length).toEqual(0);
  });

  it('can load', async () => {
    const plugins = await loadPlugins(config);
    expect(plugins.length).toEqual(1);
    expect(plugins[0].name).toEqual('Test Plugin');
  });

  it('supports graph middleware', async () => {
    const plugins = await loadPlugins(config);
    const middleware = plugins[0].graphMiddleware;
    expect(middleware).not.toBeUndefined();
    const graph = createGraph([middleware!]);
    const note = graph.setNote(createTestNote({ uri: '/path/to/note.md' }));
    expect(note.properties['injectedByMiddleware']).toBeTruthy();
  });

  it('supports parser extension', async () => {
    const plugins = await loadPlugins(config);
    const parserPlugin = plugins[0].parser;
    expect(parserPlugin).not.toBeUndefined();
    const parser = createMarkdownParser([parserPlugin!]);

    const note = parser.parse(
      '/path/to/a',
      `
# This is a note with header
and some content`
    );
    expect(note.properties.hasHeading).toBeTruthy();
  });
});
