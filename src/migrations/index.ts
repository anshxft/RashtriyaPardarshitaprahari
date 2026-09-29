import * as migration_20260929_042527_initial from './20260929_042527_initial';

export const migrations = [
  {
    up: migration_20260929_042527_initial.up,
    down: migration_20260929_042527_initial.down,
    name: '20260929_042527_initial'
  },
];
