// 统一导出所有设置分组
import { basicTitleGroups } from './basic_title.js';
import { tuiInterfaceTitleGroups } from './tui_interface_title.js';
import { tuiTerminalTitleGroups } from './tui_terminal_title.js';
import { securityGroups } from './security.js';
import { subagentsGroups } from './subagents.js';
import { retryTitleGroups } from './retry_title.js';
import { notificationsGroups } from './notifications.js';
import { featuresTitleGroups } from './features_title.js';
import { searchTitleGroups } from './search_title.js';
import { reasoningGroups } from './reasoning.js';
import { contextGroups } from './context.js';
import { updateGroups } from './update.js';
import { pathsGroups } from './paths.js';
import { capacityGroups } from './capacity.js';

export const groups = [
  ...basicTitleGroups,
  ...tuiInterfaceTitleGroups,
  ...tuiTerminalTitleGroups,
  ...securityGroups,
  ...subagentsGroups,
  ...retryTitleGroups,
  ...notificationsGroups,
  ...featuresTitleGroups,
  ...searchTitleGroups,
  ...reasoningGroups,
  ...contextGroups,
  ...updateGroups,
  ...pathsGroups,
  ...capacityGroups
];
