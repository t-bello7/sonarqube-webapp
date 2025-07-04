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

import { noop } from 'lodash';
import * as React from 'react';
import { withRouter } from '~shared/components/hoc/withRouter';
import { Location, Router } from '~shared/types/router';
import {
  countBoundProjects,
  deleteConfiguration,
  getAlmDefinitions,
  validateAlmSettings,
} from '~sq-server-commons/api/alm-settings';
import withAvailableFeatures, {
  WithAvailableFeaturesProps,
} from '~sq-server-commons/context/available-features/withAvailableFeatures';
import {
  AlmBindingDefinitionBase,
  AlmKeys,
  AlmSettingsBindingDefinitions,
  AlmSettingsBindingStatus,
  AlmSettingsBindingStatusType,
} from '~sq-server-commons/types/alm-settings';
import { Feature } from '~sq-server-commons/types/features';
import AlmIntegrationRenderer from './AlmIntegrationRenderer';

interface Props extends WithAvailableFeaturesProps {
  hasFeature: (feature: Feature) => boolean;
  location: Location;
  router: Router;
}

export type AlmTabs = AlmKeys.Azure | AlmKeys.GitHub | AlmKeys.GitLab | AlmKeys.BitbucketServer;

interface State {
  currentAlmTab: AlmTabs;
  definitionKeyForDeletion?: string;
  definitionStatus: Record<string, AlmSettingsBindingStatus>;
  definitions: AlmSettingsBindingDefinitions;
  loadingAlmDefinitions: boolean;
  loadingProjectCount: boolean;
  projectCount?: number;
}

export class AlmIntegration extends React.PureComponent<Props, State> {
  mounted = false;
  state: State;

  constructor(props: Props) {
    super(props);

    let currentAlmTab = props.location.query.alm || AlmKeys.GitHub;
    if (currentAlmTab === AlmKeys.BitbucketCloud) {
      currentAlmTab = AlmKeys.BitbucketServer;
    }

    this.state = {
      currentAlmTab,
      definitions: {
        [AlmKeys.Azure]: [],
        [AlmKeys.BitbucketServer]: [],
        [AlmKeys.BitbucketCloud]: [],
        [AlmKeys.GitHub]: [],
        [AlmKeys.GitLab]: [],
      },
      definitionStatus: {},
      loadingAlmDefinitions: true,
      loadingProjectCount: false,
    };
  }

  componentDidMount() {
    this.mounted = true;
    return this.fetchPullRequestDecorationSetting().then((definitions) => {
      if (definitions) {
        // Validate all alms on load:
        [
          AlmKeys.Azure,
          AlmKeys.BitbucketCloud,
          AlmKeys.BitbucketServer,
          AlmKeys.GitHub,
          AlmKeys.GitLab,
        ].forEach((alm) => {
          definitions[alm].forEach((def: AlmBindingDefinitionBase) => {
            this.handleCheck(def.key, false);
          });
        });
      }
    });
  }

  componentDidUpdate() {
    const { location } = this.props;
    if (location.query.alm && this.mounted) {
      this.setState({ currentAlmTab: location.query.alm });
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleConfirmDelete = async (definitionKey: string) => {
    try {
      await deleteConfiguration(definitionKey);
      await this.fetchPullRequestDecorationSetting();
    } finally {
      if (this.mounted) {
        this.setState({ definitionKeyForDeletion: undefined, projectCount: undefined });
      }
    }
  };

  fetchPullRequestDecorationSetting = async () => {
    this.setState({ loadingAlmDefinitions: true });
    try {
      const definitions = await getAlmDefinitions();

      if (this.mounted) {
        this.setState({
          definitions,
          loadingAlmDefinitions: false,
        });
      }
      return definitions;
    } catch {
      if (this.mounted) {
        this.setState({ loadingAlmDefinitions: false });
      }
    }
  };

  handleSelectAlm = (currentAlmTab: AlmTabs) => {
    const { location, router } = this.props;
    location.query.alm = currentAlmTab;
    location.hash = '';
    router.push(location);
    this.setState({ currentAlmTab });
  };

  handleCancelDelete = () => {
    this.setState({ definitionKeyForDeletion: undefined, projectCount: undefined });
  };

  handleDelete = (definitionKey: string) => {
    this.setState({ loadingProjectCount: true });
    return countBoundProjects(definitionKey)
      .then((projectCount) => {
        if (this.mounted) {
          this.setState({
            definitionKeyForDeletion: definitionKey,
            loadingProjectCount: false,
            projectCount,
          });
        }
      })
      .catch(() => {
        if (this.mounted) {
          this.setState({ loadingProjectCount: false });
        }
      });
  };

  handleCheck = (definitionKey: string, alertSuccess = true) => {
    this.setState(({ definitionStatus }) => {
      definitionStatus[definitionKey] = {
        ...definitionStatus[definitionKey],
        type: AlmSettingsBindingStatusType.Validating,
      };

      return { definitionStatus: { ...definitionStatus } };
    });

    validateAlmSettings(definitionKey)
      .then(
        (failureMessage) => {
          const type = failureMessage
            ? AlmSettingsBindingStatusType.Failure
            : AlmSettingsBindingStatusType.Success;

          return { type, failureMessage };
        },
        () => ({ type: AlmSettingsBindingStatusType.Warning, failureMessage: '' }),
      )
      .then(({ type, failureMessage }) => {
        if (this.mounted) {
          this.setState(({ definitionStatus }) => {
            definitionStatus[definitionKey] = {
              alertSuccess,
              failureMessage,
              type,
            };

            return { definitionStatus: { ...definitionStatus } };
          });
        }
      })
      .catch(noop);
  };

  render() {
    const {
      currentAlmTab,
      definitionKeyForDeletion,
      definitions,
      definitionStatus,
      loadingAlmDefinitions,
      loadingProjectCount,
      projectCount,
    } = this.state;

    return (
      <AlmIntegrationRenderer
        branchesEnabled={this.props.hasFeature(Feature.BranchSupport)}
        currentAlmTab={currentAlmTab}
        definitionKeyForDeletion={definitionKeyForDeletion}
        definitionStatus={definitionStatus}
        definitions={definitions}
        loadingAlmDefinitions={loadingAlmDefinitions}
        loadingProjectCount={loadingProjectCount}
        multipleAlmEnabled={this.props.hasFeature(Feature.MultipleAlm)}
        onCancelDelete={this.handleCancelDelete}
        onCheckConfiguration={this.handleCheck}
        onConfirmDelete={this.handleConfirmDelete}
        onDelete={this.handleDelete}
        onSelectAlmTab={this.handleSelectAlm}
        onUpdateDefinitions={this.fetchPullRequestDecorationSetting}
        projectCount={projectCount}
      />
    );
  }
}

export default withRouter(withAvailableFeatures(AlmIntegration));
