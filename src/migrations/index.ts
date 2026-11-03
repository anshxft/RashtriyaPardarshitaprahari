import * as migration_20260929_042527_initial from './20260929_042527_initial';
import * as migration_20260930_053213_round3_stage1 from './20260930_053213_round3_stage1';
import * as migration_20260930_055159_round3_stage2_articles from './20260930_055159_round3_stage2_articles';
import * as migration_20260930_071134_round3_stage5_6 from './20260930_071134_round3_stage5_6';
import * as migration_20261007_063013_round4_stage1_contact from './20261007_063013_round4_stage1_contact';
import * as migration_20261007_070147_round4_stage2_editor_panel from './20261007_070147_round4_stage2_editor_panel';
import * as migration_20261007_072345_round4_stage3_4_video_voice from './20261007_072345_round4_stage3_4_video_voice';
import * as migration_20261007_073526_round4_stage5_6_share_epaper from './20261007_073526_round4_stage5_6_share_epaper';
import * as migration_20261028_073255_round6_breaking_flash from './20261028_073255_round6_breaking_flash';
import * as migration_20261028_121206_round6_element_styles from './20261028_121206_round6_element_styles';
import * as migration_20261028_134851_media_storage_keys from './20261028_134851_media_storage_keys';
import * as migration_20261029_120000_epaper_only from './20261029_120000_epaper_only';
import * as migration_20261029_180000_flash_popup from './20261029_180000_flash_popup';
import * as migration_20261029_200000_video_ads from './20261029_200000_video_ads';
import * as migration_20261031_120000_article_gallery from './20261031_120000_article_gallery';
import * as migration_20261101_120000_epaper_layouts from './20261101_120000_epaper_layouts';
import * as migration_20261101_150000_editor_message from './20261101_150000_editor_message';
import * as migration_20261101_180000_video_tags from './20261101_180000_video_tags';
import * as migration_20261101_200000_video_ticker from './20261101_200000_video_ticker';
import * as migration_20261103_120000_new_sections from './20261103_120000_new_sections';

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
    name: '20261007_063013_round4_stage1_contact',
  },
  {
    up: migration_20261007_070147_round4_stage2_editor_panel.up,
    down: migration_20261007_070147_round4_stage2_editor_panel.down,
    name: '20261007_070147_round4_stage2_editor_panel',
  },
  {
    up: migration_20261007_072345_round4_stage3_4_video_voice.up,
    down: migration_20261007_072345_round4_stage3_4_video_voice.down,
    name: '20261007_072345_round4_stage3_4_video_voice',
  },
  {
    up: migration_20261007_073526_round4_stage5_6_share_epaper.up,
    down: migration_20261007_073526_round4_stage5_6_share_epaper.down,
    name: '20261007_073526_round4_stage5_6_share_epaper',
  },
  {
    up: migration_20261028_073255_round6_breaking_flash.up,
    down: migration_20261028_073255_round6_breaking_flash.down,
    name: '20261028_073255_round6_breaking_flash',
  },
  {
    up: migration_20261028_121206_round6_element_styles.up,
    down: migration_20261028_121206_round6_element_styles.down,
    name: '20261028_121206_round6_element_styles',
  },
  {
    up: migration_20261028_134851_media_storage_keys.up,
    down: migration_20261028_134851_media_storage_keys.down,
    name: '20261028_134851_media_storage_keys'
  },
  {
    up: migration_20261029_120000_epaper_only.up,
    down: migration_20261029_120000_epaper_only.down,
    name: '20261029_120000_epaper_only'
  },
  {
    up: migration_20261029_180000_flash_popup.up,
    down: migration_20261029_180000_flash_popup.down,
    name: '20261029_180000_flash_popup'
  },
  {
    up: migration_20261029_200000_video_ads.up,
    down: migration_20261029_200000_video_ads.down,
    name: '20261029_200000_video_ads'
  },
  {
    up: migration_20261031_120000_article_gallery.up,
    down: migration_20261031_120000_article_gallery.down,
    name: '20261031_120000_article_gallery'
  },
  {
    up: migration_20261101_120000_epaper_layouts.up,
    down: migration_20261101_120000_epaper_layouts.down,
    name: '20261101_120000_epaper_layouts'
  },
  {
    up: migration_20261101_150000_editor_message.up,
    down: migration_20261101_150000_editor_message.down,
    name: '20261101_150000_editor_message'
  },
  {
    up: migration_20261101_180000_video_tags.up,
    down: migration_20261101_180000_video_tags.down,
    name: '20261101_180000_video_tags'
  },
  {
    up: migration_20261101_200000_video_ticker.up,
    down: migration_20261101_200000_video_ticker.down,
    name: '20261101_200000_video_ticker'
  },
  {
    up: migration_20261103_120000_new_sections.up,
    down: migration_20261103_120000_new_sections.down,
    name: '20261103_120000_new_sections'
  },
];
