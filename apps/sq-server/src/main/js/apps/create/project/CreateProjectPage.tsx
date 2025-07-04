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

import classNames from 'classnames';
import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { LargeCenteredLayout } from '~design-system';
import { withRouter } from '~shared/components/hoc/withRouter';
import { Location, Router } from '~shared/types/router';
import { getDopSettings } from '~sq-server-commons/api/dop-translation';
import withAvailableFeatures, {
  WithAvailableFeaturesProps,
} from '~sq-server-commons/context/available-features/withAvailableFeatures';
import { translate } from '~sq-server-commons/helpers/l10n';
import A11ySkipTarget from '~sq-server-commons/sonar-aligned/components/a11y/A11ySkipTarget';
import { AlmKeys } from '~sq-server-commons/types/alm-settings';
import { CreateProjectModes, ImportProjectParam } from '~sq-server-commons/types/create-project';
import { DopSetting } from '~sq-server-commons/types/dop-translation';
import { Feature } from '~sq-server-commons/types/features';
import AlmBindingDefinitionForm from '../../settings/components/almIntegration/AlmBindingDefinitionForm';
import AzureProjectCreate from './Azure/AzureProjectCreate';
import BitbucketCloudProjectCreate from './BitbucketCloud/BitbucketCloudProjectCreate';
import BitbucketProjectCreate from './BitbucketServer/BitbucketProjectCreate';
import CreateProjectModeSelection from './CreateProjectModeSelection';
import GitHubProjectCreate from './Github/GitHubProjectCreate';
import GitlabProjectCreate from './Gitlab/GitlabProjectCreate';
import NewCodeDefinitionSelection from './components/NewCodeDefinitionSelection';
import ManualProjectCreate from './manual/ManualProjectCreate';

export interface CreateProjectPageProps extends WithAvailableFeaturesProps {
  location: Location;
  router: Router;
}

interface State {
  azureSettings: DopSetting[];
  bitbucketCloudSettings: DopSetting[];
  bitbucketSettings: DopSetting[];
  creatingAlmDefinition?: AlmKeys;
  githubSettings: DopSetting[];
  gitlabSettings: DopSetting[];
  importProjects?: ImportProjectParam;
  loading: boolean;
  redirectTo: string;
}

const PROJECT_MODE_FOR_ALM_KEY = {
  [AlmKeys.Azure]: CreateProjectModes.AzureDevOps,
  [AlmKeys.BitbucketCloud]: CreateProjectModes.BitbucketCloud,
  [AlmKeys.BitbucketServer]: CreateProjectModes.BitbucketServer,
  [AlmKeys.GitHub]: CreateProjectModes.GitHub,
  [AlmKeys.GitLab]: CreateProjectModes.GitLab,
};

export class CreateProjectPage extends React.PureComponent<CreateProjectPageProps, State> {
  mounted = false;

  state: State = {
    azureSettings: [],
    bitbucketSettings: [],
    bitbucketCloudSettings: [],
    githubSettings: [],
    gitlabSettings: [],
    loading: true,
    redirectTo: this.props.location.state?.from || '/projects',
  };

  componentDidMount() {
    this.mounted = true;

    this.cleanQueryParameters();
    this.fetchAlmBindings();
  }

  componentDidUpdate(prevProps: CreateProjectPageProps) {
    const { location } = this.props;

    if (location.query.mono !== prevProps.location.query.mono) {
      this.fetchAlmBindings();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  cleanQueryParameters() {
    const { location, router } = this.props;

    const isMonorepoSupported = this.props.hasFeature(Feature.MonoRepositoryPullRequestDecoration);

    if (location.query?.mono === 'true' && !isMonorepoSupported) {
      // Timeout is required to force the refresh of the URL
      setTimeout(() => {
        location.query.mono = undefined;
        router.replace(location);
      }, 0);
    }
    if (location.query?.setncd === 'true') {
      // Timeout is required to force the refresh of the URL
      setTimeout(() => {
        location.query.setncd = undefined;
        router.replace(location);
      }, 0);
    }
  }

  fetchAlmBindings = () => {
    this.setState({ loading: true });

    return getDopSettings()
      .then(({ dopSettings }) => {
        this.setState({
          azureSettings: dopSettings.filter(({ type }) => type === AlmKeys.Azure),
          bitbucketSettings: dopSettings.filter(({ type }) => type === AlmKeys.BitbucketServer),
          bitbucketCloudSettings: dopSettings.filter(({ type }) => type === AlmKeys.BitbucketCloud),
          githubSettings: dopSettings.filter(({ type }) => type === AlmKeys.GitHub),
          gitlabSettings: dopSettings.filter(({ type }) => type === AlmKeys.GitLab),
          loading: false,
        });
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  };

  handleModeSelect = (mode: CreateProjectModes) => {
    const { router, location } = this.props;
    router.push({
      pathname: location.pathname,
      query: { mode },
    });
  };

  handleModeConfig = (alm: AlmKeys) => {
    this.setState({ creatingAlmDefinition: alm });
  };

  handleProjectSetupDone = (importProjects: ImportProjectParam) => {
    const { location, router } = this.props;

    this.setState({ importProjects });

    location.query.setncd = 'true';
    router.push(location);
  };

  handleOnCancelCreation = () => {
    this.setState({ creatingAlmDefinition: undefined });
  };

  handleAfterSubmit = async () => {
    let { creatingAlmDefinition: createdAlmDefinition } = this.state;

    this.setState({ creatingAlmDefinition: undefined });

    await this.fetchAlmBindings();

    if (this.mounted && createdAlmDefinition) {
      const { bitbucketCloudSettings } = this.state;

      if (createdAlmDefinition === AlmKeys.BitbucketServer && bitbucketCloudSettings.length > 0) {
        createdAlmDefinition = AlmKeys.BitbucketCloud;
      }

      this.handleModeSelect(PROJECT_MODE_FOR_ALM_KEY[createdAlmDefinition]);
    }
  };

  renderProjectCreation(mode?: CreateProjectModes) {
    const {
      azureSettings,
      bitbucketSettings,
      bitbucketCloudSettings,
      githubSettings,
      gitlabSettings,
      loading,
      redirectTo,
    } = this.state;
    const branchSupportEnabled = this.props.hasFeature(Feature.BranchSupport);

    switch (mode) {
      case CreateProjectModes.AzureDevOps: {
        return (
          <AzureProjectCreate
            dopSettings={azureSettings}
            isLoadingBindings={loading}
            onProjectSetupDone={this.handleProjectSetupDone}
          />
        );
      }
      case CreateProjectModes.BitbucketServer: {
        return (
          <BitbucketProjectCreate
            dopSettings={bitbucketSettings}
            isLoadingBindings={loading}
            onProjectSetupDone={this.handleProjectSetupDone}
          />
        );
      }
      case CreateProjectModes.BitbucketCloud: {
        return (
          <BitbucketCloudProjectCreate
            dopSettings={bitbucketCloudSettings}
            isLoadingBindings={loading}
            onProjectSetupDone={this.handleProjectSetupDone}
          />
        );
      }
      case CreateProjectModes.GitHub: {
        return (
          <GitHubProjectCreate
            dopSettings={githubSettings}
            isLoadingBindings={loading}
            onProjectSetupDone={this.handleProjectSetupDone}
          />
        );
      }
      case CreateProjectModes.GitLab: {
        return (
          <GitlabProjectCreate
            dopSettings={gitlabSettings}
            isLoadingBindings={loading}
            onProjectSetupDone={this.handleProjectSetupDone}
          />
        );
      }
      case CreateProjectModes.Manual: {
        return (
          <ManualProjectCreate
            branchesEnabled={branchSupportEnabled}
            onClose={() => {
              this.props.router.push({ pathname: redirectTo });
            }}
            onProjectSetupDone={this.handleProjectSetupDone}
          />
        );
      }
      default: {
        const almCounts = {
          [AlmKeys.Azure]: azureSettings.length,
          [AlmKeys.BitbucketServer]: bitbucketSettings.length,
          [AlmKeys.BitbucketCloud]: bitbucketCloudSettings.length,
          [AlmKeys.GitHub]: githubSettings.length,
          [AlmKeys.GitLab]: gitlabSettings.length,
        };
        return (
          <CreateProjectModeSelection
            almCounts={almCounts}
            loadingBindings={loading}
            onConfigMode={this.handleModeConfig}
          />
        );
      }
    }
  }

  render() {
    const { location } = this.props;
    const { creatingAlmDefinition, importProjects, redirectTo } = this.state;
    const mode: CreateProjectModes | undefined = location.query?.mode;
    const isProjectSetupDone = location.query?.setncd === 'true';
    const gridLayoutStyle = mode ? 'sw-col-start-2 sw-col-span-10' : 'sw-col-span-12';
    const pageTitle = mode
      ? translate(`onboarding.create_project.${mode}.title`)
      : translate('onboarding.create_project.select_method');

    return (
      <LargeCenteredLayout
        className="sw-pt-8 sw-grid sw-gap-x-12 sw-gap-y-6 sw-grid-cols-12"
        id="create-project"
      >
        <div className={gridLayoutStyle}>
          <Helmet title={pageTitle} titleTemplate="%s" />
          <A11ySkipTarget anchor="create_project_main" />

          <div className={classNames({ 'sw-hidden': isProjectSetupDone })}>
            {this.renderProjectCreation(mode)}
          </div>
          {importProjects !== undefined && isProjectSetupDone && (
            <NewCodeDefinitionSelection
              importProjects={importProjects}
              onClose={() => {
                this.props.router.push({ pathname: redirectTo });
              }}
              redirectTo={redirectTo}
            />
          )}

          {creatingAlmDefinition && (
            <AlmBindingDefinitionForm
              afterSubmit={this.handleAfterSubmit}
              alm={creatingAlmDefinition}
              enforceValidation
              onCancel={this.handleOnCancelCreation}
            />
          )}
        </div>
      </LargeCenteredLayout>
    );
  }
}

export default withRouter(withAvailableFeatures(CreateProjectPage));
