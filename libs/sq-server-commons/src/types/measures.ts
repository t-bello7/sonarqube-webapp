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

import { MeasureEnhanced, Metric, PeriodMeasure } from '~shared/types/measures';
import { ComponentMeasure, Period } from './types';

/**
 * @deprecated Use MeasuresForProjects from `~shared/types/measures` instead.
 */
export interface MeasuresForProjects {
  component: string;
  metric: string;
  period?: PeriodMeasure;
  value?: string;
}

export interface MeasuresAndMetaWithMetrics {
  component: ComponentMeasure;
  metrics: Metric[];
}

export interface MeasuresAndMetaWithPeriod {
  component: ComponentMeasure;
  period: Period;
}

export enum MeasurePageView {
  list = 'list',
  tree = 'tree',
  treemap = 'treemap',
}

export interface Domain {
  measures: MeasureEnhanced[];
  name: string;
}
