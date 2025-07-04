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

import { withTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { isEmpty } from 'lodash';
import { Helmet } from 'react-helmet-async';
import {
  LAYOUT_FOOTER_HEIGHT,
  LAYOUT_GLOBAL_NAV_HEIGHT,
  LAYOUT_PROJECT_NAV_HEIGHT,
  LargeCenteredLayout,
  PageContentFontWrapper,
  Spinner,
  themeBorder,
  themeColor,
} from '~design-system';
import { isBranch } from '~shared/helpers/branch-like';
import { ComponentQualifier } from '~shared/types/component';
import { MetricKey } from '~shared/types/metrics';
import { StandardsInformation, StandardsInformationKey } from '~shared/types/security';
import { translate } from '~sq-server-commons/helpers/l10n';
import useFollowScroll from '~sq-server-commons/hooks/useFollowScroll';
import A11ySkipTarget from '~sq-server-commons/sonar-aligned/components/a11y/A11ySkipTarget';
import { BranchLike } from '~sq-server-commons/types/branch-like';
import {
  HotspotFilters,
  HotspotStatusFilter,
  RawHotspot,
} from '~sq-server-commons/types/security-hotspots';
import { Component, StandardSecurityCategories } from '~sq-server-commons/types/types';
import EmptyHotspotsPage from './components/EmptyHotspotsPage';
import HotspotList from './components/HotspotList';
import HotspotListMeta from './components/HotspotListMeta';
import HotspotSidebarHeader from './components/HotspotSidebarHeader';
import HotspotSimpleList from './components/HotspotSimpleList';
import HotspotFilterByStatus from './components/HotspotStatusFilter';
import HotspotViewer from './components/HotspotViewer';

export interface SecurityHotspotsAppRendererProps {
  branchLike?: BranchLike;
  component?: Component;
  filterByCWE?: string;
  filterByCategory?: {
    category: string;
    standard: StandardsInformationKey;
  };
  filterByFile?: string;
  filters: HotspotFilters;
  hotspots: RawHotspot[];
  hotspotsReviewedMeasure?: string;
  hotspotsTotal: number;
  isStaticListOfHotspots: boolean;
  loading: boolean;
  loadingMeasure: boolean;
  loadingMore: boolean;
  onChangeFilters: (filters: Partial<HotspotFilters>) => void;
  onHotspotClick: (hotspot: RawHotspot) => void;
  onLoadMore: () => void;
  onLocationClick: (index?: number) => void;
  onShowAllHotspots: VoidFunction;
  onSwitchStatusFilter: (option: HotspotStatusFilter) => void;
  onUpdateHotspot: (hotspotKey: string) => Promise<void>;
  securityCategories: StandardSecurityCategories;
  selectedHotspot?: RawHotspot;
  selectedHotspotLocation?: number;
  standards: StandardsInformation;
}

const STICKY_HEADER_HEIGHT = 73;

export default function SecurityHotspotsAppRenderer(props: SecurityHotspotsAppRendererProps) {
  const {
    branchLike,
    component,
    filterByCategory,
    filterByCWE,
    filterByFile,
    filters,
    hotspots,
    hotspotsReviewedMeasure,
    hotspotsTotal,
    isStaticListOfHotspots,
    loading,
    loadingMeasure,
    loadingMore,
    onChangeFilters,
    onShowAllHotspots,
    securityCategories,
    selectedHotspot,
    selectedHotspotLocation,
    standards,
  } = props;

  const { top: topScroll } = useFollowScroll();

  if (component === undefined) {
    return null;
  }

  const isProject = component.qualifier === ComponentQualifier.Project;
  const distanceFromBottom = topScroll + window.innerHeight - document.body.clientHeight;

  const footerVisibleHeight =
    distanceFromBottom > -LAYOUT_FOOTER_HEIGHT ? LAYOUT_FOOTER_HEIGHT + distanceFromBottom : 0;

  function getTranslationEmptyRootKey() {
    let translationRoot;

    if (!isEmpty(filterByFile)) {
      translationRoot = 'no_hotspots_for_file';
    } else if (isStaticListOfHotspots) {
      translationRoot = 'no_hotspots_for_keys';
    } else if (
      filters.assignedToMe ||
      (isBranch(branchLike) && filters.inNewCodePeriod) ||
      filters.status !== HotspotStatusFilter.TO_REVIEW
    ) {
      translationRoot = 'no_hotspots_for_filters';
    } else {
      translationRoot = 'no_hotspots';
    }

    return translationRoot;
  }

  return (
    <>
      <Helmet title={translate('hotspots.page')} />

      <A11ySkipTarget anchor="security_hotspots_main" />

      <LargeCenteredLayout id={MetricKey.security_hotspots}>
        <PageContentFontWrapper>
          <div className="sw-grid sw-grid-cols-12 sw-w-full">
            <StyledSidebar
              aria-label={translate('hotspots.list')}
              className="sw-z-filterbar sw-col-span-4"
            >
              {isProject && (
                <StyledSidebarHeader className="sw-w-full sw-px-4 sw-py-2">
                  <HotspotSidebarHeader
                    branchLike={branchLike}
                    filters={filters}
                    hotspotsReviewedMeasure={hotspotsReviewedMeasure}
                    isStaticListOfHotspots={isStaticListOfHotspots}
                    loadingMeasure={loadingMeasure}
                    onChangeFilters={onChangeFilters}
                  />
                </StyledSidebarHeader>
              )}

              <StyledSidebarContent
                className="sw-p-4 it__hotspot-list"
                style={{
                  height: `calc(
                    100vh - ${
                      LAYOUT_GLOBAL_NAV_HEIGHT +
                      LAYOUT_PROJECT_NAV_HEIGHT +
                      STICKY_HEADER_HEIGHT -
                      footerVisibleHeight
                    }px
                  )`,
                  top: `${
                    LAYOUT_GLOBAL_NAV_HEIGHT + LAYOUT_PROJECT_NAV_HEIGHT + STICKY_HEADER_HEIGHT
                  }px`,
                }}
              >
                <HotspotFilterByStatus
                  filters={filters}
                  isStaticListOfHotspots={isStaticListOfHotspots}
                  onChangeFilters={onChangeFilters}
                  onShowAllHotspots={onShowAllHotspots}
                />
                <HotspotListMeta
                  emptyTranslationKey={getTranslationEmptyRootKey()}
                  hasSelectedHotspot={Boolean(selectedHotspot)}
                  hotspotsTotal={hotspotsTotal}
                  isStaticListOfHotspots={isStaticListOfHotspots}
                  loading={loading}
                  statusFilter={filters.status}
                />
                <Spinner className="sw-mt-3" loading={loading}>
                  {hotspots.length > 0 && selectedHotspot && (
                    <>
                      {filterByCategory || filterByCWE || filterByFile ? (
                        <HotspotSimpleList
                          filterByCWE={filterByCWE}
                          filterByCategory={filterByCategory}
                          filterByFile={filterByFile}
                          hotspots={hotspots}
                          hotspotsTotal={hotspotsTotal}
                          loadingMore={loadingMore}
                          onHotspotClick={props.onHotspotClick}
                          onLoadMore={props.onLoadMore}
                          onLocationClick={props.onLocationClick}
                          selectedHotspot={selectedHotspot}
                          selectedHotspotLocation={selectedHotspotLocation}
                          standards={standards}
                        />
                      ) : (
                        <HotspotList
                          hotspots={hotspots}
                          hotspotsTotal={hotspotsTotal}
                          loadingMore={loadingMore}
                          onHotspotClick={props.onHotspotClick}
                          onLoadMore={props.onLoadMore}
                          onLocationClick={props.onLocationClick}
                          securityCategories={securityCategories}
                          selectedHotspot={selectedHotspot}
                          selectedHotspotLocation={selectedHotspotLocation}
                        />
                      )}
                    </>
                  )}
                </Spinner>
              </StyledSidebarContent>
            </StyledSidebar>

            <StyledMain className="sw-col-span-8 sw-relative sw-ml-12">
              {hotspots.length === 0 || !selectedHotspot ? (
                <EmptyHotspotsPage
                  emptyTranslationKey={getTranslationEmptyRootKey()}
                  filterByFile={Boolean(filterByFile)}
                  filtered={
                    filters.assignedToMe ||
                    (isBranch(branchLike) && filters.inNewCodePeriod) ||
                    filters.status !== HotspotStatusFilter.TO_REVIEW
                  }
                  isStaticListOfHotspots={isStaticListOfHotspots}
                />
              ) : (
                <HotspotViewer
                  component={component}
                  hotspotKey={selectedHotspot.key}
                  hotspotsReviewedMeasure={hotspotsReviewedMeasure}
                  onLocationClick={props.onLocationClick}
                  onSwitchStatusFilter={props.onSwitchStatusFilter}
                  onUpdateHotspot={props.onUpdateHotspot}
                  selectedHotspotLocation={selectedHotspotLocation}
                  standards={standards}
                />
              )}
            </StyledMain>
          </div>
        </PageContentFontWrapper>
      </LargeCenteredLayout>
    </>
  );
}

const StyledSidebar = withTheme(styled.section`
  box-sizing: border-box;

  background-color: ${themeColor('filterbar')};
  border-right: ${themeBorder('default', 'filterbarBorder')};
`);

const StyledSidebarContent = styled.div`
  position: sticky;
  overflow-x: hidden;
  box-sizing: border-box;
  width: 100%;
`;

const StyledSidebarHeader = withTheme(styled.div`
  position: sticky;
  box-sizing: border-box;
  background-color: inherit;
  border-bottom: ${themeBorder('default')};
  z-index: 1;
  height: ${STICKY_HEADER_HEIGHT}px;
  top: ${LAYOUT_GLOBAL_NAV_HEIGHT + LAYOUT_PROJECT_NAV_HEIGHT}px;
`);

const StyledMain = styled.main`
  flex-grow: 1;
  background-color: ${themeColor('backgroundSecondary')};
  border-left: ${themeBorder('default')};
  border-right: ${themeBorder('default')};
`;
