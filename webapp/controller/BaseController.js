/**
 * Base Controller.
 *
 * Common and inheritable methods for all other controllers.
 *
 * @file This files describes the app Base Controller.
 * @author Tomas A. Sanchez
 * @since 07.29.2021
 */

/* eslint-disable block-scoped-var */

/**
 * Global fragment storage.
 * @private
 * @author Tomas A Sanchez
 * @since 01.29.2021
 */
var _fragments = [];

sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History",
    "sap/m/library",
  ],
  /**
   *
   * @param {sap.ui.core.mvc.Controller} Controller the controller class
   * @param {sap.ui.corer.UIComponent} UIComponent the UI component class
   * @param {sap.ui.core.routing.History} History the history router
   * @param {sap.m.library} mobileLibrary the library for mobile devices
   * @returns
   */
  function (Controller, UIComponent, History, mobileLibrary) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return Controller.extend(
      "pampa.comunicacionesformales.contratos.controller.BaseController",
      {
        /* =========================================================== */
        /* Model methods	                                           */
        /* =========================================================== */
        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
          return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
          return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
          return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Convenience method for getting a value from i18n.
         * @public
         * @param {string} sKey the token-key to get the value to read
         * @returns {string} the text value of the key
         * @author Tomas A. Sanchez
         * @since 01.29.2021
         */
        readFromI18n: function (sKey) {
          return this.getResourceBundle().getText(sKey);
        },

        /* =========================================================== */
        /* routing  methods                                            */
        /* =========================================================== */

        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
          return UIComponent.getRouterFor(this);
        },

        /**
         * Method for navigation to specific view
         * @public
         * @param {string} psTarget Parameter containing the string for the target navigation
         * @param {mapping} pmParameters? Parameters for navigation
         * @param {boolean} pbReplace? Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
         */
        navTo: function (psTarget, pmParameters, pbReplace) {
          this.getRouter().navTo(psTarget, pmParameters, pbReplace);
        },

        /**
         * Event handler for navigating back.
         * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the master route.
         * @public
         */
        onNavBack: function () {
          var sPreviousHash = History.getInstance().getPreviousHash();

          if (sPreviousHash !== undefined) {
            window.history.back();
          } else {
            this.getRouter().navTo("worklist", {}, true /*no history*/);
          }
        },

        /**
         * Adds a history entry in the FLP page history
         * @public
         * @param {object} oEntry An entry object to add to the hierachy array as expected from the ShellUIService.setHierarchy method
         * @param {boolean} bReset If true resets the history before the new entry is added
         */
        addHistoryEntry: (function () {
          var aHistoryEntries = [];

          return function (oEntry, bReset) {
            if (bReset) {
              aHistoryEntries = [];
            }

            var bInHistory = aHistoryEntries.some(function (oHistoryEntry) {
              return oHistoryEntry.intent === oEntry.intent;
            });

            if (!bInHistory) {
              aHistoryEntries.push(oEntry);
              this.getOwnerComponent()
                .getService("ShellUIService")
                .then(function (oService) {
                  oService.setHierarchy(aHistoryEntries);
                });
            }
          };
        })(),

        /* =========================================================== */
        /* email methods                                               */
        /* =========================================================== */

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */
        onShareEmailPress: function () {
          var oViewModel =
            this.getModel("objectView") || this.getModel("worklistView");
          URLHelper.triggerEmail(
            null,
            oViewModel.getProperty("/shareSendEmailSubject"),
            oViewModel.getProperty("/shareSendEmailMessage")
          );
        },
      }
    );
  }
);
