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

import { Link, Text } from '@sonarsource/echoes-react';
import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import { Image } from '~adapters/components/common/Image';
import { FlagMessage, SubTitle, ToggleButton, getTabId, getTabPanelId } from '~design-system';
import { searchParamsToQuery } from '~shared/helpers/router';
import withAvailableFeatures, {
  WithAvailableFeaturesProps,
} from '~sq-server-commons/context/available-features/withAvailableFeatures';
import { translate } from '~sq-server-commons/helpers/l10n';
import { AlmKeys } from '~sq-server-commons/types/alm-settings';
import { Feature } from '~sq-server-commons/types/features';
import { ExtendedSettingDefinition } from '~sq-server-commons/types/settings';
import BitbucketAuthenticationTab from './BitbucketAuthenticationTab';
import GitHubAuthenticationTab from './GitHubAuthenticationTab';
import GitLabAuthenticationTab from './GitLabAuthenticationTab';
import SamlAuthenticationTab, { SAML } from './SamlAuthenticationTab';

interface Props {
  definitions: ExtendedSettingDefinition[];
}

export type AuthenticationTabs =
  | typeof SAML
  | AlmKeys.GitHub
  | AlmKeys.GitLab
  | AlmKeys.BitbucketServer;

function renderDevOpsIcon(key: string) {
  return <Image alt={key} className="sw-mr-2" height={16} src={`/images/alm/${key}.svg`} />;
}

export function Authentication(props: Props & WithAvailableFeaturesProps) {
  const { definitions } = props;

  const [query, setSearchParams] = useSearchParams();

  const currentTab = (query.get('tab') ?? SAML) as AuthenticationTabs;

  const tabs = [
    {
      value: SAML,
      label: 'SAML',
    },
    {
      value: AlmKeys.GitHub,
      label: (
        <>
          {renderDevOpsIcon(AlmKeys.GitHub)}
          GitHub
        </>
      ),
    },
    {
      value: AlmKeys.BitbucketServer,
      label: (
        <>
          {renderDevOpsIcon(AlmKeys.BitbucketServer)}
          Bitbucket
        </>
      ),
    },
    {
      value: AlmKeys.GitLab,
      label: (
        <>
          {renderDevOpsIcon(AlmKeys.GitLab)}
          GitLab
        </>
      ),
    },
  ] as const;

  const [samlDefinitions, bitbucketDefinitions] = React.useMemo(
    () => [
      definitions.filter((def) => def.subCategory === SAML),
      definitions.filter((def) => def.subCategory === AlmKeys.BitbucketServer),
    ],
    [definitions],
  );

  return (
    <>
      <SubTitle as="h3">{translate('settings.authentication.title')}</SubTitle>

      {props.hasFeature(Feature.LoginMessage) && (
        <FlagMessage variant="info">
          <div>
            <FormattedMessage
              id="settings.authentication.custom_message_information"
              values={{
                link: (
                  <Link to="/admin/settings?category=general#sonar.login.message">
                    {translate('settings.authentication.custom_message_information.link')}
                  </Link>
                ),
              }}
            />
          </div>
        </FlagMessage>
      )}

      <Text as="p" className="sw-my-6">
        {translate('settings.authentication.description')}
      </Text>

      <ToggleButton
        onChange={(tab: AuthenticationTabs) => {
          setSearchParams({ ...searchParamsToQuery(query), tab });
        }}
        options={tabs}
        role="tablist"
        value={currentTab}
      />
      {tabs.map((tab) => (
        <div
          aria-labelledby={getTabId(tab.value)}
          className={classNames('sw-overflow-y-auto', {
            'sw-hidden': currentTab !== tab.value,
          })}
          id={getTabPanelId(tab.value)}
          key={tab.value}
          role="tabpanel"
        >
          {currentTab === tab.value && (
            <div className="sw-mt-6">
              {tab.value === SAML && <SamlAuthenticationTab definitions={samlDefinitions} />}

              {tab.value === AlmKeys.GitHub && <GitHubAuthenticationTab />}

              {tab.value === AlmKeys.GitLab && <GitLabAuthenticationTab />}

              {tab.value === AlmKeys.BitbucketServer && (
                <BitbucketAuthenticationTab definitions={bitbucketDefinitions} />
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default withAvailableFeatures(Authentication);
