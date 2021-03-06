/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

import { ScreenName } from '@ulangi/ulangi-common/enums';
import { observable } from 'mobx';

import { ObservableScreen } from '../screen/ObservableScreen';
import { ObservableTitleTopBar } from '../top-bar/ObservableTitleTopBar';

export class ObservableQuizSettingsScreen extends ObservableScreen {
  @observable
  public selectedVocabularyPool: 'learned' | 'active';

  @observable
  public selectedMultipleChoiceQuizLimit: number;

  @observable
  public selectedWritingQuizLimit: number;

  public constructor(
    quizPool: 'learned' | 'active',
    selectedMultipleChoiceQuizLimit: number,
    selectedWritingQuizLimit: number,
    screenName: ScreenName,
    topBar: ObservableTitleTopBar
  ) {
    super(screenName, topBar);
    this.selectedVocabularyPool = quizPool;
    this.selectedMultipleChoiceQuizLimit = selectedMultipleChoiceQuizLimit;
    this.selectedWritingQuizLimit = selectedWritingQuizLimit;
  }
}
