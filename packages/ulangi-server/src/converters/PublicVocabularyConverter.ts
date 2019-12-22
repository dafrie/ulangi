/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

import {
  NativeVocabulary,
  PublicVocabulary,
} from '@ulangi/ulangi-common/interfaces';

export class PublicVocabularyConverter {
  public convertToNativeVocabularyList(
    publicVocabularyList: PublicVocabulary[]
  ): NativeVocabulary[] {
    return publicVocabularyList.map(
      (publicVocabulary): NativeVocabulary => {
        return this.convertToNativeVocabulary(publicVocabulary);
      }
    );
  }

  public convertToNativeVocabulary(
    publicVocabulary: PublicVocabulary
  ): NativeVocabulary {
    return {
      nativeVocabularyId: publicVocabulary.publicVocabularyId,
      vocabularyText: publicVocabulary.vocabularyText,
      definitions: publicVocabulary.definitions,
      order: 0,
    };
  }
}
