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

import * as React from 'react';
import { getWrappedDisplayName } from '~shared/components/hoc/utils';
import { Languages } from '../../types/languages';
import { LanguagesContext } from './LanguagesContext';

export interface WithLanguagesContextProps {
  languages: Languages;
}

export default function withLanguagesContext<P>(
  WrappedComponent: React.ComponentType<React.PropsWithChildren<P & WithLanguagesContextProps>>,
) {
  return class WithLanguagesContext extends React.PureComponent<
    Omit<P, keyof WithLanguagesContextProps>
  > {
    static displayName = getWrappedDisplayName(WrappedComponent, 'withLanguagesContext');

    render() {
      return (
        <LanguagesContext.Consumer>
          {(languages) => <WrappedComponent languages={languages} {...(this.props as P)} />}
        </LanguagesContext.Consumer>
      );
    }
  };
}
