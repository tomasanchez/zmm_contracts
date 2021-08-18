/**
 * Value Help Controller.
 *
 * Methods of Value Help Dialog.
 *
 * @file This files describes Customers View controller.
 * @author Tomas A. Sanchez
 * @since 03.23.2021
 */
/* eslint-disable no-warning-comments */
sap.ui.define(
  [
    "pampa/comunicacionesformales/contratos/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "../model/formatter",
  ],
  function (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    ValueHelpDialog,
    formatter
  ) {
    "use strict";

    // Bind this shortcut
    var oVhController;

    return Controller.extend(
      "pampa.comunicacionesformales.contratos.controller.ValueHelp",
      {
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Event handler called when value help is pressed.
         *
         * Opens corresponding mobile or desktop Value Help.
         * @function
         * @public
         * @param {sap.ui.base.Event} oEvent the press event
         */
        onVhRequest: function (oEvent) {
          oVhController = this;
          // oInput shortcut
          oVhController._oMultiInput = oEvent.getSource();

          // oValueHelp shortcut
          oVhController._oValueHelpDialog = this._createValueHelp(
            "Proveedores",
            "IdProveedor",
            "Nombre",
            oVhController.onSelection
          );

          this._setVhTableColumns();

          this._setVHDKunnrFilterBar();

          this.getView().addDependent(oVhController._oValueHelpDialog);

          this.onFetch();

          this._oValueHelpDialog.open();
        },

        _oValueHelpDialog: {},

        _oMultiInput: {},

        /**
         * Triggered when OK button is pressed on VHD.
         *
         * Handles ValueHelp Close.
         * @function
         * @param {sap.ui.base.Event} [oEvent] the press event
         * @private
         */
        // eslint-disable-next-line no-unused-vars
        onSelection: function (oEvent) {
          oVhController._addTokens(
            oVhController._oMultiInput,
            oEvent.getParameter("tokens")
          );
          oVhController._oValueHelpDialog.close();
        },

        /**
         * Triggered by Change on Bzirk ComboBox.
         *
         * Creates Filters for ValueHelp.
         *
         * @function
         * @public
         * @param {sap.ui.base.Event} [oEvent] the change event
         */
        onFetch: function (oEvent) {
          // The Table Filters
          var aFilters = [];

          this._fetchOdata(aFilters);
        },

        /**
         * Triggered by Live Change on ValueHelp Inputs.
         *
         * Filters ValueHelp Table
         *
         * @function
         * @public
         * @param {sap.ui.base.Event} oEvent the live change event
         */
        // eslint-disable-next-line no-unused-vars
        onVhLiveChange: function (oEvent) {
          var aFilters = oVhController._getAllVHFilters();

          var oTable = oVhController._oValueHelpDialog.getTable();

          var oBinding = oTable.getBinding("rows");
          oBinding.filter(aFilters, "Application");
        },

        /* =========================================================== */
        /* Internal Methods                                            */
        /* =========================================================== */

        /**
         * Gets all Live Filters.
         *
         * Gets all input filters.
         * @function
         * @private
         * @return {array} an array of sap.ui.model.Filter
         */
        _getAllVHFilters: function () {
          var aInputs = oVhController._oValueHelpDialog
            .getFilterBar()
            .getFilterGroupItems()
            .map(function (oFGI) {
              return oFGI.getControl();
            })
            .filter(function (oInput) {
              //Requiriment must be an Input and have a control Name of property filter
              return (
                oInput instanceof sap.m.Input && oInput.getName().length > 0
              );
            });

          var aFilters = [];

          try {
            aInputs.forEach(function (oInput) {
              var sValue = oInput.getValue();

              if (oInput.getName() != "IdProveedor") {
                if (sValue.length > 0)
                  aFilters.push(
                    new Filter(
                      oInput.getName(),
                      FilterOperator.Contains,
                      sValue
                    )
                  );
              } else {
                if (sValue.length > 0) {
                  // If any letter Name else number
                  var sProperty = /[a-z]/i.test(sValue)
                    ? "Nombre"
                    : "IdProveedor";

                  aFilters.push(
                    new Filter(sProperty, FilterOperator.Contains, sValue)
                  );
                }
              }
            });
          } finally {
            return aFilters;
          }
        },

        /**
         * Fetchs Table data.
         *
         * Makes oData Request to ClientesSet.
         *
         * @function
         * @param {array} [aFilters] the filters array
         * @private
         */
        _fetchOdata: function (aFilters = []) {
          var oModel = this.getModel();

          var oValueHelpDialog = oVhController._oValueHelpDialog;

          oValueHelpDialog.getTable().setBusy(true);

          oModel.read("/ProveedoresSet", {
            filters: aFilters,
            success: function (oData) {
              var oRowsModel = new JSONModel(oData.results);
              oValueHelpDialog.getTable().setModel(oRowsModel);
              // When Mobile bind rows
              if (oValueHelpDialog.getTable().bindRows) {
                oValueHelpDialog.getTable().bindRows("/");
              }

              oValueHelpDialog.setTitle(
                `Proveedores (${oData.results.length})`
              );

              // When Mobile bind Items
              if (oValueHelpDialog.getTable().bindItems) {
                var oTable = oValueHelpDialog.getTable();

                // eslint-disable-next-line no-unused-vars
                oTable.bindAggregation("items", "/", function (sId, oContext) {
                  var aCols = oTable.getModel("columns").getData().cols;

                  return new sap.m.ColumnListItem({
                    cells: aCols.map(function (oColumn) {
                      var sColname = oColumn.template;
                      return new sap.m.Label({
                        text: `{${sColname}}`,
                      });
                    }),
                  });
                });
              }

              oValueHelpDialog.getTable().setBusy(false);
            },
          });
        },

        /**
         * Add tokens to multi-input.
         *
         * Verifies if not alredy added and adds a token and fires it changes.
         * @function
         * @private
         * @param {sap.m.MultiInput} oInput the input to add tokens
         * @param {array} aTokens the context items array
         */
        _addTokens: function (oInput, aTokens) {
          var aPreviousTokens = oInput.getTokens?.() ?? [];

          aTokens.forEach((oToken) => {
            if (
              // Verification if alredy exists
              !aPreviousTokens.some(
                (oPreviousToken) => oPreviousToken.getKey() === oToken.getKey()
              )
            ) {
              oInput instanceof sap.m.MultiInput && oInput.addToken(oToken);
              oInput instanceof sap.m.Input && oInput.setValue(oToken.getKey());
            }
          });

          oInput.fireChange?.();
        },

        /**
         * Sets Columns for VHD.
         *
         * Custom Columns for Value Help Dialog.
         * @function
         * @private
         */
        _setVhTableColumns: function () {
          var oColModel = new JSONModel();

          oColModel.setData({
            cols: [
              {
                label: "Nro de Proveedor",
                template: "IdProveedor",
                width: "auto",
                hAlign: "Center",
              },
              {
                label: "Nombre",
                template: "Nombre",
                width: "auto",
                hAlign: "Center",
              },
            ],
          });

          this._oValueHelpDialog
            .getTableAsync()
            .then((oTable) => oTable.setModel(oColModel, "columns"));
        },

        /**
         * Sets FilterBar for VHD.
         *
         * Custom FilterBar for Value Help Kunnr Dialog.
         * @function
         * @private
         */
        _setVHDKunnrFilterBar: function () {
          // The new Filter Bar
          var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
            advancedMode: true,
            filterBarExpanded: true,
            showFilterConfiguration: false,
            showGoOnFB: false,
            useToolbar: false,
            // The Control Items
            filterGroupItems: [
              // Kunnr Item
              new sap.ui.comp.filterbar.FilterGroupItem({
                groupName: "_group1",
                name: "IdProveedor",
                mandatory: false,
                label: oVhController.readFromI18n("filtro_proveedor_label"),
                control: new sap.m.Input({
                  id: "supplierIN",
                  name: "IdProveedor",
                  liveChange: oVhController.onVhLiveChange,
                  placeholder: oVhController.readFromI18n("supplierPH"),
                }),
              }),
            ],
          });

          this._oValueHelpDialog.setFilterBar(oFilterBar);
        },

        /**
         * Creates a new ValueHelp Dialog.
         *
         * Returns a value help corresponding to device system.
         *
         * @function
         * @private
         * @param {string} sTitle the Value Help Title to be displayed
         * @param {string} sKey the Input Key value.
         * @param {string} sDescriptionKey the description text value.
         * @param {(sap.ui.base.Event) => void} onConfirm the confirm function.
         * @param {boolean} [bMultiSelect] if multiselection is enabled
         * @return {sap.ui.comp.valuehelpdialog.ValueHelpDialog} the value help dialog
         */
        _createValueHelp: function (
          sTitle,
          sKey,
          sDescriptionKey,
          onConfirm,
          bMultiSelect = false
        ) {
          return sap.ui.Device.system.phone
            ? new ValueHelpDialog({
                title: sTitle,
                supportMultiselect: bMultiSelect,
                key: sKey,
                descriptionKey: sDescriptionKey,
                ok: onConfirm,
                // eslint-disable-next-line no-unused-vars
                cancel: function (_oCancelEvent) {
                  oVhController._oValueHelpDialog.close();
                },
                afterClose: function () {
                  this.destroy();
                  oVhController._oValueHelpDialog = null;
                },
                // eslint-disable-next-line no-unused-vars
                selectionChange: function (_oSelecionEvent) {},
              })
            : new ValueHelpDialog({
                title: sTitle,
                supportMultiselect: bMultiSelect,
                key: sKey,
                descriptionKey: sDescriptionKey,
                supportRanges: false,
                supportRangesOnly: false,
                stretch: sap.ui.Device.system.phone,
                ok: onConfirm,
                // eslint-disable-next-line no-unused-vars
                cancel: function (_oCancelEvent) {
                  oVhController._oValueHelpDialog.close();
                },
                afterClose: function () {
                  this.destroy();
                  oVhController._oValueHelpDialog = null;
                },
                // eslint-disable-next-line no-unused-vars
                selectionChange: function (_oSelecionEvent) {},
              });
        },

        /* =========================================================== */
        /* End of Internal Methods                                     */
        /* =========================================================== */
      }
    );
  }
);
