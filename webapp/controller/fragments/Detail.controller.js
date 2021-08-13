/**
 * DetailController.
 *
 * @file This files describes the Contract Detail's dialog own controller.
 * @author Tomas A. Sanchez
 * @since 08.03.2021
 */

sap.ui.define(
  [
    "../BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
  ],
  function (BaseController, JSONModel, History) {
    "use strict";

    /**
     * @private
     */
    var oController;

    return BaseController.extend(
      "pampa.comunicacionesformales.contratos.controller.fragments.Detail",
      {
        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Method Called before the fragment is open
         * @param {sap.ui.core.mvc.Controller} parent the parent view's controller
         * @param {sap.m.Dialog} fragment the dialog fragment
         * @param {() => void} [callback] an optional callback function
         * @param {object} [data] passed information
         * @private
         */
        onBeforeShow: function (parent, fragment, callback, data) {
          /**
           * @private
           */
          this.parent = parent;
          /**
           * @private
           */
          this.fragment = fragment;
          /**
           * @private
           */
          this.callback = callback;
          /**
           * @private
           */
          this.data = data;

          oController = parent;

          this._setFormModel();
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Event handler when an Accept button is pressed
         * @param {sap.ui.base.Event} [oEvent] the button press
         * @private
         */
        onAccept: function (oEvent) {
          sap.m.MessageBox.confirm(
            oController.readFromI18n("confirmAribaMSG"),
            {
              onClose: function (sAction) {
                sAction == sap.m.MessageBox.Action.OK && this._confirmImport();
              }.bind(this),
            }
          );
        },

        /**
         * Event handler when Close button is pressed
         * @param {sap.ui.base.Event} [oEvent] the button press
         * @private
         */
        onClose: function (oEvent) {
          this.callback?.call(this.parent);
          this.fragment.close();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Sets the Form Model
         * @private
         */
        _setFormModel: function () {
          // The Editable Form Model
          oController.setModel(
            new JSONModel({
              Posicion: "",
              CatInterna: "",
              TipologiaContrato: "",
              NivelRiesgo: "",
            }),
            "form"
          );
          // The Details View Model
          oController.setModel(
            new JSONModel({
              ...this.data.oData,
            }),
            "detailsView"
          );
        },

        /**
         * Shortcut for obtainning the Form Model
         * @private
         * @returns {sap.ui.model.json.JSONModel} the form Model
         */
        _getFormModel: function () {
          return oController.getModel("form");
        },

        /**
         * Confirms an Ariba Contract Import.
         * Makes corresponding HTTP Request.
         * @private
         */
        _confirmImport: function () {
          // In order to remove not wanted metadata
          let oData = {
            ...this._getFormModel().getData(),
            EstadoContrato: "A",
          };

          delete oData.__metadata;

          oController.getModel().update(this.data.sPath, oData, {
            success: function (oResponse) {
              sap.m.MessageToast.show("OK");
              this.onClose();
            }.bind(this),
            error: function (oError) {
              sap.m.MessageBox.error(oError);
            },
          });
        },
      }
    );
  }
);
