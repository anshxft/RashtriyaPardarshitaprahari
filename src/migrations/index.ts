import * as migration_20260929_042527_initial from './20260929_042527_initial';
import * as migration_20260930_053213_round3_stage1 from './20260930_053213_round3_stage1';
import * as migration_20260930_055159_round3_stage2_articles from './20260930_055159_round3_stage2_articles';
import * as migration_20260930_071134_round3_stage5_6 from './20260930_071134_round3_stage5_6';
import * as migration_20261007_063013_round4_stage1_contact from './20261007_063013_round4_stage1_contact';

export const migrations = [
  {
    up: migration_20260929_042527_initial.up,
    down: migration_20260929_042527_initial.down,
    name: '20260929_042527_initial',
  },
  {
    up: migration_20260930_053213_round3_stage1.up,
    down: migration_20260930_053213_round3_stage1.down,
    name: '20260930_053213_round3_stage1',
  },
  {
    up: migration_20260930_055159_round3_stage2_articles.up,
    down: migration_20260930_055159_round3_stage2_articles.down,
    name: '20260930_055159_round3_stage2_articles',
  },
  {
    up: migration_20260930_071134_round3_stage5_6.up,
    down: migration_20260930_071134_round3_stage5_6.down,
    name: '20260930_071134_round3_stage5_6',
  },
  {
    up: migration_20261007_063013_round4_stage1_contact.up,
    down: migration_20261007_063013_round4_stage1_contact.down,
    name: '20261007_063013_round4_stage1_contact'
  },
];
