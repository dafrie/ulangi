/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

import * as moment from 'moment';

export function backupLocale(): () => void {
  const locale = moment.locale();
  return (): string => {
    return moment.locale(locale);
  };
}
