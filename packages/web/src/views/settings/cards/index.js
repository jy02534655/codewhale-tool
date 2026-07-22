// 统一导出所有设置分组
import { basicGroups } from './basic.js';
import { tuiInterfaceGroups } from './tuiInterface.js';
import { tuiTerminalGroups } from './tuiTerminal.js';
import { securityGroups } from './security.js';
import { subagentsGroups } from './subagents.js';
import { retryGroups } from './retry.js';
import { notificationsGroups } from './notifications.js';
import { featuresGroups } from './features.js';
import { searchGroups } from './search.js';
import { reasoningGroups } from './reasoning.js';
import { contextGroups } from './context.js';
import { pathsGroups } from './paths.js';
import { capacityGroups } from './capacity.js';

export const groups = [
  ...basicGroups,
  ...tuiInterfaceGroups,
  ...tuiTerminalGroups,
  ...securityGroups,
  ...subagentsGroups,
  ...retryGroups,
  ...notificationsGroups,
  ...featuresGroups,
  ...searchGroups,
  ...reasoningGroups,
  ...contextGroups,
  ...pathsGroups,
  ...capacityGroups
];
