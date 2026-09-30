import * as migration_20260929_042527_initial from './20260929_042527_initial';
import * as migration_20260930_053213_round3_stage1 from './20260930_053213_round3_stage1';

export const migrations = [
  {
    up: migration_20260929_042527_initial.up,
    down: migration_20260929_042527_initial.down,
    name: '20260929_042527_initial',
  },
  {
    up: migration_20260930_053213_round3_stage1.up,
    down: migration_20260930_053213_round3_stage1.down,
    name: '20260930_053213_round3_stage1'
  },
];
