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
         * @param {sap.ui.core.mvc.Controller} parent the parent view's controller
         * @param {sap.m.Dialog} fragment the dialog fragment
         * @param {() => void} callback an optional callback function
         * @param {object} data passed information
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

        /**
         * Event handler when Close button is pressed
         * @param {sap.ui.base.Event} oEvent the button press
         * @public
         */
        onClose: function (oEvent) {
          this.callback?.call(this.parent);
          this.fragment.close();
        },

        /**
         * Event handler when an Accept button is pressed
         * @param {sap.ui.base.Event} oEvent the button press
         * @public
         */
        onAccept: function (oEvent) {
          MessageBox.confirm(this.parent.readFromI18n("confirmAribaMSG"), {
            onClose: function (sAction) {
              sAction == MessageBox.Action.OK && this._confirmImport();
            }.bind(this),
          });
        },
        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */
        /**
         * Confirms an Ariba Contract Import.
         * Makes corresponding HTTP Request.
         * @private
         */
        _confirmImport: function () {
          MessageToast.show("OK");
          this.onClose();
        },
      }
    );
  }
);
