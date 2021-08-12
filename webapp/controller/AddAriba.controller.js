sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
  ],
  function (BaseController, JSONModel, History, formatter) {
    "use strict";

    return BaseController.extend(
      "pampa.comunicacionesformales.contratos.controller.AddAriba",
      {
        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
          // Model used to manipulate control states. The chosen values make sure,
          // detail page is busy indication immediately so there is no break in
          // between the busy indication for loading the view's meta data
          var iOriginalBusyDelay,
            oViewModel = new JSONModel({
              busy: true,
              delay: 0,
            });

          this.getRouter()
            .getRoute("addAriba")
            .attachPatternMatched(this._onObjectMatched, this);

          // Store original busy indicator delay, so it can be restored later on
          iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
          this.setModel(oViewModel, "addAribaView");
          this.getOwnerComponent()
            .getModel()
            .metadataLoaded()
            .then(function () {
              // Restore original busy indicator delay for the object view
              oViewModel.setProperty("/delay", iOriginalBusyDelay);
            });

          this._setFormModel();
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
        onNavBack: function (oEvent) {
          var sPreviousHash = History.getInstance().getPreviousHash();

          if (sPreviousHash !== undefined) {
            history.go(-1);
          } else {
            this.getRouter().navTo("ariba", {}, true);
          }
        },

        /**
         * Event handler when an Accept button is pressed
         * @param {sap.ui.base.Event} oEvent the button press
         * @public
         */
        onAccept: function (oEvent) {
          sap.m.MessageBox.confirm(this.readFromI18n("confirmAribaMSG"), {
            onClose: function (sAction) {
              sAction == sap.m.MessageBox.Action.OK && this._confirmImport();
            }.bind(this),
          });
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Sets the Form Model
         * @private
         */
        _setFormModel: function () {
          this.setModel(
            new JSONModel({
              Posicion: "",
              CatInterna: "",
              TipologiaContrato: "",
              NivelRiesgo: "",
            }),
            "form"
          );
        },

        /**
         * Shortcut for obtainning the Form Model
         * @private
         * @returns {sap.ui.model.json.JSONModel} the form Model
         */
        _getFormModel: function () {
          return this.getModel("form");
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
            ...this.getView().getBindingContext().getObject(),
          };

          delete oData.__metadata;

          this.getModel().create("/ContratosSet", oData, {
            success: function (oResponse) {
              sap.m.MessageToast.show("OK");
              this.navTo("worklist");
            }.bind(this),
            error: function (oError) {
              sap.m.MessageBox.error(oError);
            },
          });
        },

        /**
         * Binds the view to the object path.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched: function (oEvent) {
          var sObjectId = oEvent.getParameter("arguments").objectId;
          this.getModel()
            .metadataLoaded()
            .then(
              function () {
                var sObjectPath = this.getModel().createKey(
                  "ContratosAribaSet",
                  {
                    IdAriba: sObjectId,
                  }
                );
                this._bindView("/" + sObjectPath);
              }.bind(this)
            );
        },

        /**
         * Binds the view to the object path.
         * @function
         * @param {string} sObjectPath path to the object to be bound
         * @private
         */
        _bindView: function (sObjectPath) {
          var oViewModel = this.getModel("addAribaView"),
            oDataModel = this.getModel();

          this.getView().bindElement({
            path: sObjectPath,
            events: {
              change: this._onBindingChange.bind(this),
              dataRequested: function () {
                oDataModel.metadataLoaded().then(function () {
                  // Busy indicator on view should only be set if metadata is loaded,
                  // otherwise there may be two busy indications next to each other on the
                  // screen. This happens because route matched handler already calls '_bindView'
                  // while metadata is loaded.
                  oViewModel.setProperty("/busy", true);
                });
              },
              dataReceived: function () {
                oViewModel.setProperty("/busy", false);
              },
            },
          });
        },

        _onBindingChange: function () {
          var oView = this.getView(),
            oViewModel = this.getModel("addAribaView"),
            oElementBinding = oView.getElementBinding();

          // No data for the binding
          if (!oElementBinding.getBoundContext()) {
            this.getRouter().getTargets().display("objectNotFound");
            return;
          }

          var oResourceBundle = this.getResourceBundle(),
            oObject = oView.getBindingContext().getObject(),
            sObjectId = oObject.IdAriba,
            sObjectName = oObject.IdTitulo;

          oViewModel.setProperty("/busy", false);

          oViewModel.setProperty(
            "/shareSendEmailSubject",
            oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId])
          );
          oViewModel.setProperty(
            "/shareSendEmailMessage",
            oResourceBundle.getText("shareSendEmailObjectMessage", [
              sObjectName,
              sObjectId,
              location.href,
            ])
          );
        },
      }
    );
  }
);
