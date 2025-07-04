/*
 * SonarQube
 * Copyright (C) 2009-2025 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { isBranch } from '~shared/helpers/branch-like';
import { ComponentQualifier } from '~shared/types/component';
import { BranchLike } from '~sq-server-commons/types/branch-like';
import { Component } from '~sq-server-commons/types/types';
import { HomePage } from '~sq-server-commons/types/users';

export function getCurrentPage(component: Component, branchLike: BranchLike | undefined) {
  let currentPage: HomePage | undefined;

  const branch = isBranch(branchLike) && !branchLike.isMain ? branchLike.name : undefined;

  switch (component.qualifier) {
    case ComponentQualifier.Portfolio:
    case ComponentQualifier.SubPortfolio:
      currentPage = { type: 'PORTFOLIO', component: component.key };
      break;
    case ComponentQualifier.Application:
      currentPage = {
        type: 'APPLICATION',
        component: component.key,
        branch,
      };
      break;
    case ComponentQualifier.Project:
      // when home page is set to the default branch of a project, its name is returned as `undefined`
      currentPage = {
        type: 'PROJECT',
        component: component.key,
        branch,
      };
      break;
  }

  return currentPage;
}
