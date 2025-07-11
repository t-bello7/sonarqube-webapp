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

import { Spinner } from '@sonarsource/echoes-react';
import * as React from 'react';
import { useCurrentBranchQuery } from '~adapters/queries/branch';
import { withRouter } from '~shared/components/hoc/withRouter';
import { getBranchLikeQuery } from '~shared/helpers/branch-like';
import { isDefined } from '~shared/helpers/types';
import { ComponentQualifier } from '~shared/types/component';
import { Metric } from '~shared/types/measures';
import { Location, Router } from '~shared/types/router';
import withComponentContext from '~sq-server-commons/context/componentContext/withComponentContext';
import withMetricsContext from '~sq-server-commons/context/metrics/withMetricsContext';
import { CodeScope, getCodeUrl, getProjectUrl } from '~sq-server-commons/helpers/urls';
import { WithBranchLikesProps } from '~sq-server-commons/queries/branch';
import {
  useComponentBreadcrumbsQuery,
  useComponentQuery,
} from '~sq-server-commons/queries/component';
import { useComponentTreeQuery } from '~sq-server-commons/queries/measures';
import { Component, ComponentMeasure } from '~sq-server-commons/types/types';
import { getCodeMetrics } from '../utils';
import CodeAppRenderer from './CodeAppRenderer';

interface Props {
  component: Component;
  location: Location;
  metrics: Record<string, Metric>;
  router: Router;
}

const PAGE_SIZE = 100;

function CodeApp(props: Readonly<Props>) {
  const { component, metrics, router, location } = props;
  const [highlighted, setHighlighted] = React.useState<ComponentMeasure | undefined>();
  const [newCodeSelected, setNewCodeSelected] = React.useState<boolean>(true);
  const [searchResults, setSearchResults] = React.useState<ComponentMeasure[] | undefined>();

  const { data: branchLike } = useCurrentBranchQuery(component);

  const { data: breadcrumbs, isLoading: isBreadcrumbsLoading } = useComponentBreadcrumbsQuery({
    component: location.query.selected ?? component.key,
    ...getBranchLikeQuery(branchLike),
  });
  const { data: baseComponent, isLoading: isBaseComponentLoading } = useComponentQuery(
    {
      component: location.query.selected ?? component.key,
      metricKeys: getCodeMetrics(component.qualifier, branchLike).join(),
      ...getBranchLikeQuery(branchLike),
    },
    {
      select: (data) => data.component,
    },
  );
  const {
    data: componentWithChildren,
    isLoading: isChildrenLoading,
    fetchNextPage,
  } = useComponentTreeQuery({
    strategy: 'children',
    component: location.query.selected ?? component.key,
    metrics: getCodeMetrics(component.qualifier, branchLike, {
      includeContainsAiCode: true,
      includeQGStatus: true,
    }),
    additionalData: {
      ps: PAGE_SIZE,
      s: 'qualifier,name',
      ...getBranchLikeQuery(branchLike),
    },
  });

  const isFile = baseComponent
    ? [ComponentQualifier.File, ComponentQualifier.TestFile].includes(
        baseComponent.qualifier as ComponentQualifier,
      )
    : false;
  const loading = isBreadcrumbsLoading || isBaseComponentLoading || isChildrenLoading;
  const total = componentWithChildren?.pages[0]?.paging.total ?? 0;
  const components = componentWithChildren?.pages.flatMap((page) => page.components);

  React.useEffect(() => {
    setSearchResults(undefined);
  }, [location.query.selected]);

  const handleLoadMore = () => {
    if (!baseComponent || !components) {
      return;
    }
    fetchNextPage();
  };

  const handleGoToParent = () => {
    if (breadcrumbs && breadcrumbs.length > 1) {
      const parentComponent = breadcrumbs[breadcrumbs.length - 2];
      router.push(getCodeUrl(component.key, branchLike, parentComponent.key));
      setHighlighted(breadcrumbs[breadcrumbs.length - 1]);
    }
  };

  const handleHighlight = (highlighted: ComponentMeasure) => {
    setHighlighted(highlighted);
  };

  const handleSearchClear = () => {
    setSearchResults(undefined);
  };

  const handleSearchResults = (searchResults: ComponentMeasure[] = []) => {
    setSearchResults(searchResults);
  };

  const handleSelect = (selectedComponent: ComponentMeasure) => {
    if (selectedComponent.refKey !== undefined) {
      const codeType = newCodeSelected ? CodeScope.New : CodeScope.Overall;
      const url = getProjectUrl(selectedComponent.refKey, selectedComponent.branch, codeType);
      router.push(url);
    } else {
      router.push(getCodeUrl(component.key, branchLike, selectedComponent.key));
    }

    setHighlighted(undefined);
  };

  const handleSelectNewCode = (newCodeSelected: boolean) => {
    setNewCodeSelected(newCodeSelected);
  };

  return (
    <CodeAppRenderer
      baseComponent={isFile ? undefined : baseComponent}
      branchLike={branchLike}
      breadcrumbs={breadcrumbs ?? []}
      component={component}
      components={components}
      handleGoToParent={handleGoToParent}
      handleHighlight={handleHighlight}
      handleLoadMore={handleLoadMore}
      handleSearchClear={handleSearchClear}
      handleSearchResults={handleSearchResults}
      handleSelect={handleSelect}
      handleSelectNewCode={handleSelectNewCode}
      highlighted={highlighted}
      loading={loading}
      location={location}
      metrics={metrics}
      newCodeSelected={newCodeSelected}
      searchResults={searchResults}
      sourceViewer={isFile ? baseComponent : undefined}
      total={total}
    />
  );
}

function withComponentGuard<P extends { component?: Component }>(
  WrappedComponent: React.ComponentType<React.PropsWithChildren<P & WithBranchLikesProps>>,
): React.ComponentType<React.PropsWithChildren<Omit<P, 'branchLike' | 'branchLikes'>>> {
  return function WithBranchLike(props: P) {
    return (
      <Spinner isLoading={!isDefined(props.component)}>
        <WrappedComponent {...props} />
      </Spinner>
    );
  };
}

export default withRouter(withComponentContext(withMetricsContext(withComponentGuard(CodeApp))));
