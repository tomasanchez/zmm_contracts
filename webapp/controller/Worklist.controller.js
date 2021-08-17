sap.ui.define(
  [
    "pampa/comunicacionesformales/contratos/controller/ValueHelp",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/base/Object",
  ],

  /**
   * Worklist Controller.
   *
   * @param {pampa.comunicacionesformales.contratos.controller.BaseController} BaseController the main controller provider
   * @param {sap.ui.model.json.JSONModel} JSONModel the model class for JSON
   * @param {*} formatter the formatter provider
   * @param {sap.m.MessageToast} MessageToast toast service provider
   * @param {sap.m.MessageBox} MessageBox message box service provider
   * @param {sap.ui.model.Filter} Filter convenience filter manager
   * @param {sap.ui.model.Filter} FilterOperator convenience filter operator handler
   * @returns {pampa.comunicacionesformales.contratos.controller.Worklist} The worklsit controller
   */
  function (
    BaseController,
    JSONModel,
    formatter,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator
  ) {
    "use strict";
    return BaseController.extend(
      "pampa.comunicacionesformales.contratos.controller.Worklist",
      {
        /**
         * Formatter provider
         * @private
         */
        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @memberof pampa.comunicacionesformales.contratos.controller.Worklist
         * @private
         */
        onInit: function () {
          var oViewModel,
            iOriginalBusyDelay,
            oTable = this.byId("table");

          // Put down worklist table's original value for busy indicator delay,
          // so it can be restored later on. Busy handling on the table is
          // taken care of by the table itself.
          iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
          // keeps the search state
          this._aTableSearchState = [];

          // Model used to manipulate control states
          oViewModel = new JSONModel({
            worklistTableTitle:
              this.getResourceBundle().getText("worklistTableTitle"),
            shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
            shareSendEmailSubject: this.getResourceBundle().getText(
              "shareSendEmailWorklistSubject"
            ),
            itemType: "Navigation",
            showClose: true,
            shareSendEmailMessage: this.getResourceBundle().getText(
              "shareSendEmailWorklistMessage",
              [location.href]
            ),
            tableNoDataText:
              this.getResourceBundle().getText("tableNoDataText"),
            tableBusyDelay: 0,
          });
          this.setModel(oViewModel, "worklistView");

          /**
           * Previous selected Key in tab filter.
           * @private
           */
          this.sPreviousKey = this.byId("iconTabBar").getSelectedKey();

          // Make sure, busy indication is showing immediately so there is no
          // break after the busy indication for loading the view's meta data is
          // ended (see promise 'oWhenMetadataIsLoaded' in AppController)
          oTable.attachEventOnce("updateFinished", function () {
            // Restore original busy indicator delay for worklist's table
            oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
          });
        },

        /**
         * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
         * This hook is the same one that SAPUI5 controls get after being rendered.
         * @memberof pampa.comunicacionesformales.contratos.controller.Worklist
         * @private
         */
        onAfterRendering: function () {
          this._applySearch(this._getFilters());
          this.onRefresh();
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished: function (oEvent) {
          // update the worklist's object counter after the table update
          var sTitle,
            oTable = oEvent.getSource(),
            iTotalItems = oEvent.getParameter("total");
          // only update the counter if the length is final and
          // the table is not empty
          if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
            sTitle = this.getResourceBundle().getText(
              "worklistTableTitleCount",
              [iTotalItems]
            );
          } else {
            sTitle = this.getResourceBundle().getText("worklistTableTitle");
          }
          this.getModel("worklistView").setProperty(
            "/worklistTableTitle",
            sTitle
          );
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress: function (oEvent) {
          // The source is the list item that got pressed
          this._showObject(oEvent.getSource());
        },

        /**
         * Event handler when selection of a tab filter
         * @param {sap.ui.base.Event} oEvent the filter selection event
         * @public
         */
        onFilterSelect: function (oEvent) {
          let sKey = oEvent.getSource().getSelectedKey();

          // Cut fast when keys does NOT change, when changes, updates previous key
          if (sKey == this.sPreviousKey) return;
          else this.sPreviousKey = sKey;

          this._handleSelectedKey(sKey);
          this._applySearch(this._getFilters(""));
          this.onRefresh();
        },

        /**
         * Event handler when close action is pressed
         * @param {sap.ui.base.Event} oEvent the button press
         * @public
         */
        onCloseContract: function (oEvent) {
          this._updateObject(
            oEvent.getSource().getParent().getBindingContextPath(),
            oEvent.getSource().getParent().getBindingContext().getObject()
          );
        },

        onLiveChange: function (oEvent) {
          if (oEvent.getParameters().refreshButtonPressed) {
            // Search field's 'refresh' button has been pressed.
            // This is visible if you select any master list item.
            // In this case no new search is triggered, we only
            // refresh the list binding.
            this.onRefresh();
          } else {
            var sQuery = oEvent.getParameter("query");

            this._applySearch(this._getFilters(sQuery));
          }
        },

        /**
         * Event handler for change in Supplier ID
         *
         * @param {sap.ui.base.Event} [oEvent] the change event
         */
        onChangeSupplier: function (oEvent) {
          this._applySearch(this._getFilters());
          this.onRefresh();
        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh: function () {
          var oTable = this.byId("table");
          oTable.getBinding("items").refresh();
        },

        /**
         * Event Handler for detail press on Column List Item
         * @param {sap.ui.base.Event} oEvent the button press
         */
        onDetailPress(oEvent) {
          var oListBinding = oEvent.getSource().getBindingContext();

          this.openDialog(
            "Detail",
            {
              oData: oListBinding.getObject(),
              sPath: oListBinding.getPath(),
            },
            this.onRefresh
          );
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Obtains all current filters.
         *
         * @param {string} [sQuery] the query option
         * @private
         * @returns {sap.ui.model.Filter[]} An array of filters for the search
         */
        _getFilters: function (sQuery) {
          var aTableSearchState = [];

          // Contract Status Filter
          let sStatus = this.byId("iconTabBar")?.getSelectedKey?.();
          sStatus &&
            aTableSearchState.push(
              new Filter("EstadoContrato", FilterOperator.EQ, sStatus)
            );

          // Contract Id Filter
          let sContractId = sQuery ?? this.byId("contractId")?.getValue?.();
          sContractId &&
            aTableSearchState.push(
              new Filter("IdContrato", FilterOperator.Contains, sContractId)
            );

          // Supplier Id Filter
          let sSupplierID = this.byId("supplierId")?.getValue?.();
          sSupplierID &&
            aTableSearchState.push(
              new Filter("IdProveedor", FilterOperator.Contains, sSupplierID)
            );

          return aTableSearchState;
        },

        /**
         * Handles models according to selected key of icon tab filter.
         *
         * @param {string} sKey the selected key
         * @private
         */
        _handleSelectedKey: function (sKey) {
          var oViewModel = this.getModel("worklistView");

          // Hides Close Contract if not Active
          oViewModel.setProperty("/showClose", sKey === "A");

          // Hides Detail if not Pending
          oViewModel.setProperty(
            "/itemType",
            sKey === "P" ? "Detail" : "Navigation"
          );
        },

        /**
         * Shows the selected item on the object page
         * On phones a additional history entry is created
         * @param {sap.m.ColumnListItem} oItem selected Item
         * @private
         */
        _showObject: function (oItem) {
          this.getRouter().navTo("object", {
            objectId: oItem.getBindingContext().getProperty("IdContrato"),
          });
        },

        /**
         * Updates the selected item in BACKEND.
         * @param {string} sPath the entity's path to update
         * @param {object} oData the entity itself
         * @private
         */
        _updateObject: function (sPath, oData) {
          oData.EstadoContrato = "F";
          this.getModel().update(sPath, oData, {
            success: function (oResponse) {
              MessageToast.show(this.readFromI18n("okUpdate"));
            }.bind(this),
            error: function (oError) {
              MessageBox.error(oError);
            },
          });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function (aTableSearchState) {
          var oTable = this.byId("table"),
            oViewModel = this.getModel("worklistView");
          oTable.getBinding("items").filter(aTableSearchState, "Application");
          // changes the noDataText of the list in case there are no filter results
          if (aTableSearchState.length !== 0) {
            oViewModel.setProperty(
              "/tableNoDataText",
              this.getResourceBundle().getText("worklistNoDataWithSearchText")
            );
          }
        },
      }
    );
  }
);
