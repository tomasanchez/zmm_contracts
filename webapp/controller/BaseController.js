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
        /* fragments methods                                            */
        /* =========================================================== */

        /**
         * Convenince method for openning a Dialog Fragment with a controller.
         * @public
         * @param {string} sName the fragment name
         * @param {object} data passed from the main view to the fragment
         * @param {sap.ui.mvc.Model} model to be set(optional)
         * @param {boolean} updateModelAllways let the function know if it has to update the model every time it opens the dialog or only the first time.
         * @param {function} callbak a function in the controller from where it’s called which can be executed from the fragment controller
         * @author Tomas A Sanchez
         * @since 07.30.2021
         */
        openDialog: function (
          sName,
          data = {},
          model = undefined,
          updateModelAlways = false,
          callback = undefined
        ) {
          /**
           * the View name-space path
           * @type {string}
           */
          var sViewPath = this.getViewPath(sName);

          /**
           * A generated ID
           * @type {string}
           */
          var id = `${this.getView().getId()}-${sName}`;

          if (!_fragments[id]) {
            //create controller
            let sControllerPath = sViewPath.replace("view", "controller");

            _fragments[id] = { fragment: {}, controller: {} };

            Controller.create({ name: sControllerPath + sName })
              .then((oController) => {
                _fragments[id].controller = oController;
                this.createDialogFragment(
                  id,
                  sViewPath + sName,
                  oController,
                  model,
                  updateModelAlways,
                  callback,
                  data
                );
              })
              .catch((reason) => {
                _fragments[id].controller = this;
                this.createDialogFragment(
                  id,
                  sViewPath + sName,
                  this,
                  model,
                  updateModelAlways,
                  callback,
                  data
                );
              });
          } else {
            _fragments[id].controller.onUpdateData(data);
            _fragments[id].fragment.open();
          }
        },

        /**
         * Convenince method for closing all opened Fragments.
         * @function
         * @public
         */
        closeFragments: function () {
          /*
			This makes it easy for a close button in each fragment.
      	     It just calls this function and it will close the open fragments. (In case the fragment contains a dialog.)
		  */
          for (var f in _fragments) {
            if (
              _fragments[f]["fragment"] &&
              _fragments[f].fragment["isOpen"] &&
              _fragments[f].fragment.isOpen()
            ) {
              _fragments[f].fragment.close();
            }
          }
        },

        /**
         * Convenince method for getting an specific fragment
         * @public
         * @param {string} fragment name
         */
        getFragment: function (fragment) {
          return _fragments[`${this.getView().getId()}-${fragment}`];
        },

        /**
         * Convenince method for getting a control from in the fragment
         * @public
         * @param {sap.ui.mvc.Controller}
         * @param {string} id of control
         * Use example:
         *	var oButton = this.fragmentById(this.parent,"button0");
         */
        fragmentById: function (parent, id) {
          var latest = this.getMetadata().getName().split(".")[
            this.getMetadata().getName().split(".").length - 1
          ];
          return sap.ui
            .getCore()
            .byId(`${parent.getView().getId()}-${latest}--${id}`);
        },

        /**
         * Gets the view's namespace-path
         * @param {string} sName
         * @returns {string} the view path
         */
        getViewPath: function (sName) {
          if (sName.indexOf(".") > 0) {
            var aViewName = sName.split(".");
            sName = sName.substr(sName.lastIndexOf(".") + 1);
          } else {
            //current folder
            aViewName = this.getView().getViewName().split("."); // view.login.Login
          }

          aViewName.pop();
          var sViewPath = aViewName.join("."); // view.login

          if (sViewPath.toLowerCase().indexOf("fragments") > 0) {
            sViewPath += ".";
          } else {
            sViewPath += ".fragments.";
          }
          return sViewPath;
        },
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

        /**
         * Creates a new Dialog.
         * @private
         * @param {string} sID the fragment ID
         * @param {string} name the fragment view-name
         * @param {sap.ui.mvc.Controller} oController the controller to be set on the fragment
         * @param {sap.ui.model.Model} model an optional model to be set on the fragment
         * @param {boolean} updateModelAllways an optional flag for updating the model allways
         * @param {() => void} callback an optional callback function
         * @param {object} data an optional object to be passed as data
         */
        createDialogFragment: function (
          sID,
          name,
          oController,
          model,
          updateModelAllways,
          callback,
          data
        ) {
          _fragments[sID] = {
            fragment: sap.ui.require(
              ["sap/ui/core/Fragment"],
              (fragmentClass) => {
                fragmentClass
                  .load({
                    id: sID,
                    name: name,
                    controller: oController,
                  })
                  .then((oFragment) => {
                    // version >= 1.20.x
                    _fragments[sID].fragment = oFragment;
                    this.getView().addDependent(oFragment);
                    var fragment = oFragment;

                    _fragments[sID].controller = oController;

                    if (model && updateModelAllways) {
                      fragment.setModel(model);
                    }
                    if (oController && oController !== this) {
                      _fragments[sID].controller.onBeforeShow(
                        this,
                        fragment,
                        callback,
                        data
                      );
                    }

                    setTimeout(function () {
                      fragment.open();
                    }, 100);
                  });
              }
            ),
          };
        },
      }
    );
  }
);
