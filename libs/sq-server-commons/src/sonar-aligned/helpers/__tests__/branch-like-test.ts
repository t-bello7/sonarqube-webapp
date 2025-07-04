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

import { getBranchLikeWithKeyQuery } from '~shared/helpers/branch-like';
import { BranchLike } from '../../../types/branch-like';

it('getBranchLikeWithKeyQuery should work properly', () => {
  const branchLike: BranchLike = {
    isMain: true,
    name: 'main',
    excludedFromPurge: true,
  };
  expect(getBranchLikeWithKeyQuery(branchLike, true)).toEqual({ branchKey: 'main' });

  expect(getBranchLikeWithKeyQuery(branchLike)).toEqual({});
});
