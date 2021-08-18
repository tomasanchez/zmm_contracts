sap.ui.define([], function () {
  "use strict";

  return {
    /**
     * Rounds the number unit value to 2 digits
     * @public
     * @param {string} sValue the number string to be rounded
     * @returns {string} sValue with 2 digits rounded
     */
    numberUnit: function (sValue) {
      if (!sValue) {
        return "";
      }
      return parseFloat(sValue).toFixed(2);
    },

    /**
     * Converts date to string.
     *
     * @param {Date} dDate the sap date
     * @returns {string} the locale date string
     */
    localeDate: function (dDate) {
      return dDate ? dDate.toLocaleDateString?.() : "-";
    },

    /**
     * Traffic Highlights for Table Column List Items.
     *
     * Determines if the expiration date is between a week.
     * @function
     * @param {date} dDate the SAP date
     * @return {string} The value state
     */
    dateHighlights: (dDate) => {
      var dToday = new Date();

      // const iDays = 7,
      //   iHours = 24,
      //   iMinutes = 60,
      //   iSeconds = 60,
      //   iMiliSeconds = 1000;

      // var dExpirationDate = new Date(
      //   dDate.getTime() - iDays * iHours * iMinutes * iSeconds * iMiliSeconds
      // );

      return dToday >= dDate ? "Error" : "None";
    },

    /**
     * Translates flag status to text
     *
     * @param {string} sStatus the contract status flag
     * @returns {string} the status text
     */
    statusText: (sStatus) => {
      const htStatusText = {
        A: "Activo",
        F: "Finalizado",
        P: "Pendiente",
        X: "Desconocido",
      };
      return htStatusText[sStatus ?? "X"];
    },

    /**
     * Highlighst flag status
     *
     * @param {string} sStatus the contract status flag
     * @returns {string} the status text
     */
    statusValueState: (sStatus) => {
      const htStatus = {
        A: "Success",
        F: "None",
        P: "Warning",
      };
    },
  };
});
