/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

import { Action, ActionType, InferableAction } from '@ulangi/ulangi-action';
import { ActivityState, ErrorCode } from '@ulangi/ulangi-common/enums';
import { Purchase } from '@ulangi/ulangi-common/interfaces';
import { ObservablePurchaseStore } from '@ulangi/ulangi-observable';
import { boundMethod } from 'autobind-decorator';
import * as _ from 'lodash';

import { Reducer } from './Reducer';

export class PurchaseStoreReducer extends Reducer {
  private purchaseStore: ObservablePurchaseStore;
  private premiumLifetimeProductIds: readonly string[];

  public constructor(
    purchaseStore: ObservablePurchaseStore,
    premiumLifetimeProductIds: readonly string[]
  ) {
    super();
    this.purchaseStore = purchaseStore;
    this.premiumLifetimeProductIds = premiumLifetimeProductIds;
  }

  public perform(action: InferableAction): void {
    if (action.is(ActionType.IAP__PROCESSING_PURCHASE)) {
      this.processingPurchase(action);
    } else if (action.is(ActionType.IAP__PROCESS_PURCHASE_SUCCEEDED)) {
      this.processPurchaseSucceeded(action);
    } else if (action.is(ActionType.IAP__PROCESS_PURCHASE_FAILED)) {
      this.processPurchaseFailed(action);
    }
  }

  private processingPurchase(
    action: Action<ActionType.IAP__PROCESSING_PURCHASE>
  ): void {
    if (_.includes(this.premiumLifetimeProductIds, action.payload.productId)) {
      this.purchaseStore.premiumLifetimeProcessState = ActivityState.ACTIVE;
    }
  }

  private processPurchaseSucceeded(
    action: Action<ActionType.IAP__PROCESS_PURCHASE_SUCCEEDED>
  ): void {
    const {
      purchasesSuccessfullyApplied,
      purchasesAlreadyApplied,
      purchasesAlreadyAppliedToOtherAccounts,
    } = action.payload;
    if (
      purchasesSuccessfullyApplied.filter(this.isPremiumLifetimePurchase)
        .length > 0
    ) {
      this.purchaseStore.premiumLifetimeProcessState = ActivityState.INACTIVE;
      this.purchaseStore.premiumLifetimeProcessResult = {
        success: true,
        errorCode: null,
      };
    } else if (
      purchasesAlreadyApplied.filter(this.isPremiumLifetimePurchase).length > 0
    ) {
      this.purchaseStore.premiumLifetimeProcessState = ActivityState.ERROR;
      this.purchaseStore.premiumLifetimeProcessResult = {
        success: false,
        errorCode: ErrorCode.IAP__PURCHASES_ALREADY_APPLIED,
      };
    } else if (
      purchasesAlreadyAppliedToOtherAccounts.filter(
        this.isPremiumLifetimePurchase
      ).length > 0
    ) {
      this.purchaseStore.premiumLifetimeProcessState = ActivityState.ERROR;
      this.purchaseStore.premiumLifetimeProcessResult = {
        success: false,
        errorCode: ErrorCode.IAP__PURCHASES_ALREADY_APPLIED_TO_OTHER_ACCOUNTS,
      };
    }
  }

  private processPurchaseFailed(
    action: Action<ActionType.IAP__PROCESS_PURCHASE_FAILED>
  ): void {
    this.purchaseStore.premiumLifetimeProcessState = ActivityState.ERROR;
    this.purchaseStore.premiumLifetimeProcessResult = {
      success: false,
      errorCode: action.payload.errorCode,
    };
  }

  @boundMethod
  private isPremiumLifetimePurchase(purchase: Purchase): boolean {
    return _.includes(this.premiumLifetimeProductIds, purchase.productId);
  }
}
