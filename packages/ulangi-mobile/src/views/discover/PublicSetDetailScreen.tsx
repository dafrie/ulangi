/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

import { Theme } from '@ulangi/ulangi-common/enums';
import {
  ObservableDarkModeStore,
  ObservablePublicSetDetailScreen,
} from '@ulangi/ulangi-observable';
import { observer } from 'mobx-react';
import * as React from 'react';
import { View } from 'react-native';

import { PublicSetDetailScreenIds } from '../../constants/ids/PublicSetDetailScreenIds';
import { PublicSetDetailScreenDelegate } from '../../delegates/discover/PublicSetDetailScreenDelegate';
import { PublicSetDetailHeader } from './PublicSetDetailHeader';
import {
  PublicSetDetailScreenStyles,
  darkStyles,
  lightStyles,
} from './PublicSetDetailScreen.style';
import { PublicVocabularyList } from './PublicVocabularyList';

export interface PublicSetDetailScreenProps {
  darkModeStore: ObservableDarkModeStore;
  observableScreen: ObservablePublicSetDetailScreen;
  screenDelegate: PublicSetDetailScreenDelegate;
}

@observer
export class PublicSetDetailScreen extends React.Component<
  PublicSetDetailScreenProps
> {
  public get styles(): PublicSetDetailScreenStyles {
    return this.props.darkModeStore.theme === Theme.LIGHT
      ? lightStyles
      : darkStyles;
  }

  public render(): React.ReactElement<any> {
    return (
      <View style={this.styles.screen} testID={PublicSetDetailScreenIds.SCREEN}>
        <PublicSetDetailHeader
          theme={this.props.darkModeStore.theme}
          title={this.props.observableScreen.publicSet.title}
          subtitle={this.props.observableScreen.publicSet.subtitle}
          formattedAuthors={
            this.props.observableScreen.publicSet.formattedAuthors
          }
          openLink={this.props.screenDelegate.openLink}
        />
        <PublicVocabularyList
          testID={PublicSetDetailScreenIds.PUBLIC_VOCABULARY_LIST}
          theme={this.props.darkModeStore.theme}
          vocabularyList={this.props.observableScreen.publicSet.vocabularyList}
          addVocabulary={this.props.screenDelegate.addVocabulary}
          addAllVocabulary={this.props.screenDelegate.showAddAllDialog}
          showPublicVocabularyActionMenu={
            this.props.screenDelegate.showPublicVocabularyActionMenu
          }
          openLink={this.props.screenDelegate.openLink}
        />
      </View>
    );
  }
}
