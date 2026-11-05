import { register } from 'node:module';

register(new URL('./node_alias_loader.mjs', import.meta.url), import.meta.url);
