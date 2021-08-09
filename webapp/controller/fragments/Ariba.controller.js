/**
 * Ariba Controller.
 *
 * @file This files describes the Ariba's dialog own controller.
 * @author Tomas A. Sanchez
 * @since 07.30.2021
 */

sap.ui.define(
  [
    "../BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
  ],
  function (BaseController, JSONModel, MessageToast, MessageBox) {
    "use strict";
    var oController;
    var aInputs;
    return BaseController.extend(
      "pampa.comunicacionesformales.contratos.controller.fragments.Ariba",
      {
        /* =========================================================== */
        /* lifecycle methods */
        /* =========================================================== */

        /**
         *
         * @param {*} parent
         * @param {*} fragment
         * @param {*} callback
         * @param {*} data
         */
        onBeforeShow: function (parent, fragment, callback, data) {
          oController = this;
          this.parent = parent;
          this.fragment = fragment;
          this.callback = callback;
          this.data = data;
        },

        /**
         * Sets the current data value.
         *
         * @param {object} data information to be used on the fragment
         */
        onUpdateData: function (data) {
          this.data = data;
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        onClose: function () {
          //this._clear();
          this.callback?.call(this.parent);
          this.fragment.close();
        },

        onSave: function () {
          var bValidationError = false,
            bChanges = this._verifyChanges();

          bValidationError = bValidationError || this._verifyInput();

          if (bValidationError) {
            return;
          } else if (bChanges) {
            this.onClose();
          } else {
            this._updateMaterial();
          }

          return;
        },

        onContractSelection(oEvent) {
          var oData = oEvent.getSource().getBindingContext().getObject();

          this.parent.openDialog("AddAriba");
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        _updateMaterial: function () {
          var oEntity = { Bdmng: aInputs[0].getValue() };

          oController = this;

          var oModel = this.parent.getView().getModel();

          this.fragment.setBusy(true);

          oModel.update(this.fragment.sPath, oEntity, {
            success: function (resultado) {
              oController.fragment.setBusy(false);
              oController.onClose();
            },
            error: function (error) {
              MessageToast.show(oController.readFromI18n("Error"));
              oController.fragment.setBusy(false);
            },
          });
        },

        _verifyInput: function () {
          var sValueState = "None",
            sValueStateText = "None";

          var bValidationError = false;

          var sOriginalValue = aInputs[1].getValue(),
            sNewValue = aInputs[0].getValue();

          if (sNewValue.length === 0) {
            bValidationError = true;
            sValueStateText = this.parent.readFromI18n("valueStateTextVoid");
            sValueState = "Error";
          } else if (parseFloat(sNewValue) > parseFloat(sOriginalValue)) {
            bValidationError = true;
            sValueStateText =
              this.parent.readFromI18n("valueStateTextGT") +
              ": " +
              sOriginalValue;
            sValueState = "Error";
          }

          aInputs[0].setValueState(sValueState);
          aInputs[0].setValueStateText(sValueStateText);

          return bValidationError;
        },

        _verifyChanges: function () {
          var sOriginalValue = aInputs[1].getValue(),
            sNewValue = aInputs[0].getValue();

          return parseFloat(sNewValue) === parseFloat(sOriginalValue);
        },

        _clear: function () {
          aInputs[0].setValueState("None");
          return;
        },
      }
    );
  }
);
