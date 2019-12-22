/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

import * as _ from 'lodash';
import { StyleSheet, ViewStyle } from 'react-native';

export interface DictionaryPickerContentStyles {
  picker_content: ViewStyle;
}

export const baseStyles: DictionaryPickerContentStyles = {
  picker_content: {},
};

export const lightStyles = StyleSheet.create(_.merge({}, baseStyles, {}));

export const darkStyles = StyleSheet.create(_.merge({}, baseStyles, {}));
