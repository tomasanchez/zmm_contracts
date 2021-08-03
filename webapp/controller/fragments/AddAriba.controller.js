/**
 * Add Ariba Controller.
 *
 * @file This files describes the Add Ariba's dialog own controller.
 * @author Tomas A. Sanchez
 * @since 08.03.2021
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
      "pampa.comunicacionesformales.contratos.controller.fragments.AddAriba",
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
        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */
      }
    );
  }
);
