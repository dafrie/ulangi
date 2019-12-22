/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

import { assertExists } from '@ulangi/assert';
import { SQLiteDatabase } from '@ulangi/sqlite-adapter';
import { Action, ActionType, createAction } from '@ulangi/ulangi-action';
import {
  ProcessPurchaseRequest,
  ProcessPurchaseResponse,
} from '@ulangi/ulangi-common/interfaces';
import { SessionModel } from '@ulangi/ulangi-local-database';
import axios, { AxiosResponse } from 'axios';
import * as Iap from 'react-native-iap';
import {
  call,
  cancelled,
  fork,
  put,
  take,
  takeEvery,
} from 'redux-saga/effects';
import { PromiseType } from 'utility-types';

import { CrashlyticsAdapter } from '../adapters/CrashlyticsAdapter';
import { PurchaseEventChannel } from '../channels/PurchaseEventChannel';
import { SagaConfig } from '../interfaces/SagaConfig';
import { createRequest } from '../utils/createRequest';
import { ProtectedSaga } from './ProtectedSaga';

export class IapSaga extends ProtectedSaga {
  private sharedDb: SQLiteDatabase;
  private sessionModel: SessionModel;
  private iap: typeof Iap;
  private crashlytics: CrashlyticsAdapter;

  private initedConnection: boolean = false;

  public constructor(
    sharedDb: SQLiteDatabase,
    sessionModel: SessionModel,
    iap: typeof Iap,
    crashlytics: CrashlyticsAdapter
  ) {
    super();
    this.sharedDb = sharedDb;
    this.sessionModel = sessionModel;
    this.iap = iap;
    this.crashlytics = crashlytics;
  }

  public *run(config: SagaConfig): IterableIterator<any> {
    yield fork(
      [this, this.init],
      config.env.apiUrl,
      config.env.googlePackageName
    );
  }

  public *destroy(): IterableIterator<any> {
    if (this.initedConnection === true) {
      yield call([this.iap, 'endConnectionAndroid']);
    }
  }

  public *init(
    apiUrl: string,
    googlePackageName: string
  ): IterableIterator<any> {
    yield call([this.iap, 'initConnection']);
    yield fork([this, this.observePurchaseUpdates], apiUrl, googlePackageName);
    yield fork([this, this.allowGetProducts]);
    yield fork([this, this.allowRequestPurchase], apiUrl, googlePackageName);
    yield fork([this, this.allowRestorePurchases], apiUrl, googlePackageName);

    this.initedConnection = true;
  }

  public *allowGetProducts(): IterableIterator<any> {
    while (true) {
      const action: Action<ActionType.IAP__GET_PRODUCTS> = yield take(
        ActionType.IAP__GET_PRODUCTS
      );

      try {
        const products: PromiseType<
          ReturnType<typeof Iap.getProducts>
        > = yield call([this.iap, 'getProducts'], action.payload.skus.slice());

        yield put(
          createAction(ActionType.IAP__GET_PRODUCTS_SUCCEEDED, { products })
        );
      } catch (error) {
        yield put(
          createAction(ActionType.IAP__GET_PRODUCTS_FAILED, {
            errorCode: this.crashlytics.getErrorCode(error),
          })
        );
      }
    }
  }

  public *allowRequestPurchase(
    apiUrl: string,
    googlePackageName: string
  ): IterableIterator<any> {
    while (true) {
      const action: Action<ActionType.IAP__REQUEST_PURCHASE> = yield take(
        ActionType.IAP__REQUEST_PURCHASE
      );

      try {
        yield put(createAction(ActionType.IAP__REQUESTING_PURCHASE, null));

        const purchases: PromiseType<
          ReturnType<typeof Iap.getAvailablePurchases>
        > = yield call([this.iap, 'getAvailablePurchases']);

        if (
          purchases.filter(
            (purchase): boolean => purchase.productId === action.payload.sku
          ).length > 0
        ) {
          for (const purchase of purchases) {
            yield call(
              [this, this.processPurchase],
              purchase,
              apiUrl,
              googlePackageName
            );
          }
        } else {
          yield call([this.iap, 'requestPurchase'], action.payload.sku, false);
        }

        yield put(
          createAction(ActionType.IAP__REQUEST_PURCHASE_SUCCEEDED, null)
        );
      } catch (error) {
        yield put(
          createAction(ActionType.IAP__REQUEST_PURCHASE_FAILED, {
            errorCode: this.crashlytics.getErrorCode(error),
          })
        );
      }
    }
  }

  public *allowRestorePurchases(
    apiUrl: string,
    googlePackageName: string
  ): IterableIterator<any> {
    while (true) {
      yield take(ActionType.IAP__RESTORE_PURCHASES);

      try {
        yield put(createAction(ActionType.IAP__RESTORING_PURCHASES, null));

        const purchases: PromiseType<
          ReturnType<typeof Iap.getAvailablePurchases>
        > = yield call([this.iap, 'getAvailablePurchases']);

        for (const purchase of purchases) {
          yield call(
            [this, this.processPurchase],
            purchase,
            apiUrl,
            googlePackageName
          );
        }

        yield put(
          createAction(ActionType.IAP__RESTORE_PURCHASES_SUCCEEDED, null)
        );
      } catch (error) {
        yield put(
          createAction(ActionType.IAP__RESTORE_PURCHASES_FAILED, {
            errorCode: this.crashlytics.getErrorCode(error),
          })
        );
      }
    }
  }

  private *observePurchaseUpdates(
    apiUrl: string,
    googlePackageName: string
  ): IterableIterator<any> {
    const channel = new PurchaseEventChannel(this.iap).createChannel();

    try {
      while (true) {
        yield takeEvery(
          channel,
          (purchase): IterableIterator<any> => {
            return this.processPurchase(purchase, apiUrl, googlePackageName);
          }
        );
      }
    } finally {
      if (yield cancelled()) {
        channel.close();
        console.log('iap channel closed');
      }
    }
  }

  private *processPurchase(
    purchase: Iap.Purchase,
    apiUrl: string,
    googlePackageName: string
  ): IterableIterator<any> {
    try {
      const accessToken: PromiseType<
        ReturnType<SessionModel['getAccessToken']>
      > = yield call([this.sessionModel, 'getAccessToken'], this.sharedDb);

      yield put(
        createAction(ActionType.IAP__PROCESSING_PURCHASE, {
          transactionId: purchase.transactionId,
          productId: purchase.productId,
        })
      );

      const receipt =
        typeof purchase.purchaseToken !== 'undefined'
          ? {
              packageName: googlePackageName,
              productId: purchase.productId,
              purchaseToken: purchase.purchaseToken,
              subscription: false, // Don't support subscription for now
            }
          : purchase.transactionReceipt;

      const response: AxiosResponse<ProcessPurchaseResponse> = yield call(
        [axios, 'request'],
        createRequest<ProcessPurchaseRequest>(
          'post',
          apiUrl,
          '/process-purchase',
          null,
          { receipt },
          { accessToken: assertExists(accessToken) }
        )
      );

      if (typeof purchase.purchaseToken !== 'undefined') {
        this.iap.acknowledgePurchaseAndroid(purchase.purchaseToken);
      } else {
        this.iap.finishTransactionIOS(assertExists(purchase.transactionId));
      }

      yield put(
        createAction(ActionType.IAP__PROCESS_PURCHASE_SUCCEEDED, response.data)
      );
    } catch (error) {
      yield put(
        createAction(ActionType.IAP__PROCESS_PURCHASE_FAILED, {
          errorCode: this.crashlytics.getErrorCode(error),
        })
      );
    }
  }
}
